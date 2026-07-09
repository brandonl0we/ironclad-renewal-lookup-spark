import { mockGetRecord, mockListRecords, type IroncladRecord } from "./mockIronclad";
import { normalizeAccountHost } from "./normalize";
import type { Candidate, LookupResult, RenewalRecord } from "./types";

type AcosCallPayload = Record<string, unknown>;

const ACTIVE_STATUSES = new Set(["active", "executed", "current", "signed"]);
const INACTIVE_STATUSES = new Set(["expired", "terminated", "cancelled", "canceled", "superseded"]);

const FIELD_ALIASES = {
  counterparty: ["Counterparty Name", "Counterparty", "Customer", "Customer Name", "Account Name"],
  agreementType: ["Agreement Type", "Contract Type", "Record Type", "Type"],
  contractStatus: ["Contract Status", "Status", "Lifecycle Status"],
  effectiveDate: ["Effective Date", "Start Date", "Contract Start Date"],
  renewalDate: ["Renewal Date", "Next Renewal Date", "Auto Renewal Date"],
  expirationDate: ["Expiration Date", "End Date", "Contract End Date"],
  autoRenew: ["Auto Renew", "Auto-Renew", "Auto Renewal", "Automatic Renewal"],
  noticePeriodDays: ["Notice Period Days", "Renewal Notice Days", "Notice Days"],
  noticeDeadline: ["Notice Deadline", "Renewal Notice Deadline", "Cancellation Deadline"],
  term: ["Term", "Initial Term", "Current Term"],
  owner: ["Internal Owner", "Owner", "Customer Owner", "CSM", "Account Owner"],
  accountHost: ["Account Host", "Activehosted Host", "ActiveCampaign Host", "AC Account Host"],
  accountSlug: ["Account Slug", "Account", "AC Account", "ActiveCampaign Account"],
};

export async function lookupRenewal(input: string, selectedRecordId?: string): Promise<LookupResult> {
  const normalized = normalizeAccountHost(input);
  const mode = shouldUseMock() ? "mock" : "acos-data";

  try {
    if (selectedRecordId) {
      const selected = await getRecord(selectedRecordId);
      if (!selected) {
        return notFound(input, normalized.normalizedHost, normalized.accountSlug, mode);
      }
      return foundResult(input, normalized.normalizedHost, normalized.accountSlug, selected, ["selectedRecordId"], mode);
    }

    const matches = await searchRecords(normalized.normalizedHost, normalized.accountSlug);
    if (matches.length === 0) {
      return notFound(input, normalized.normalizedHost, normalized.accountSlug, mode);
    }

    const ranked = rankRecords(matches, normalized.normalizedHost, normalized.accountSlug);
    const top = ranked[0];
    const second = ranked[1];

    if (second && top.score - second.score < 20) {
      return {
        input,
        normalizedHost: normalized.normalizedHost,
        accountSlug: normalized.accountSlug,
        status: "ambiguous",
        confidence: "medium",
        candidates: ranked.slice(0, 6).map(({ record, score }) => toCandidate(record, score)),
        warnings: ["Multiple Ironclad records could match this account. Choose the contract to inspect."],
        source: {
          matchedFields: ["Account Host", "Account Slug"],
          retrievedAt: new Date().toISOString(),
          mode,
        },
        message: "I found more than one possible contract. Choose the record to inspect.",
      };
    }

    const canonical = await getRecord(top.record.id);
    return foundResult(
      input,
      normalized.normalizedHost,
      normalized.accountSlug,
      canonical ?? top.record,
      top.matchedFields,
      mode,
    );
  } catch (error) {
    return {
      input,
      normalizedHost: normalized.normalizedHost,
      accountSlug: normalized.accountSlug,
      status: "error",
      warnings: [],
      message: error instanceof Error ? error.message : "Lookup failed.",
    };
  }
}

function shouldUseMock(): boolean {
  return process.env.ACOS_DATA_MOCK === "true" || !process.env.ACOS_DATA_URL;
}

async function searchRecords(normalizedHost: string, accountSlug: string): Promise<IroncladRecord[]> {
  if (shouldUseMock()) {
    const byHost = mockListRecords(normalizedHost);
    const bySlug = mockListRecords(accountSlug);
    return dedupeRecords([...byHost, ...bySlug]);
  }

  const queries: AcosCallPayload[] = [
    { query: normalizedHost, pageSize: 25, limit: 25 },
    { search: normalizedHost, pageSize: 25, limit: 25 },
    { query: accountSlug, pageSize: 25, limit: 25 },
    { search: accountSlug, pageSize: 25, limit: 25 },
  ];

  const records: IroncladRecord[] = [];
  for (const payload of queries) {
    const result = await callAcosData("ironclad", "list-records", payload);
    records.push(...extractRecords(result));
  }
  return dedupeRecords(records);
}

async function getRecord(id: string): Promise<IroncladRecord | undefined> {
  if (shouldUseMock()) {
    return mockGetRecord(id);
  }

  const result = await callAcosData("ironclad", "get-record", { id });
  return extractRecord(result);
}

async function callAcosData(vendor: string, endpoint: string, params: AcosCallPayload): Promise<unknown> {
  const baseUrl = process.env.ACOS_DATA_URL;
  const appId = process.env.ACOS_APP_ID;
  const apiKey = process.env.ACOS_API_KEY;

  if (!baseUrl || !appId || !apiKey) {
    throw new Error("ACOS-Data credentials are not configured. Use ACOS_DATA_MOCK=true locally or add Spark local development credentials.");
  }

  const url = `${baseUrl.replace(/\/$/, "")}/call/${vendor}/${endpoint}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-acos-app-id": appId,
      "x-acos-api-key": apiKey,
      ...(process.env.CF_ACCESS_CLIENT_ID
        ? {
            "cf-access-client-id": process.env.CF_ACCESS_CLIENT_ID,
            "cf-access-client-secret": process.env.CF_ACCESS_CLIENT_SECRET ?? "",
          }
        : {}),
    },
    body: JSON.stringify(params),
    cache: "no-store",
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const message = typeof body?.error?.message === "string" ? body.error.message : `ACOS-Data call failed with ${response.status}`;
    throw new Error(message);
  }

  return body;
}

function extractRecords(body: unknown): IroncladRecord[] {
  const value = unwrapData(body);
  if (Array.isArray(value)) return value as IroncladRecord[];
  if (isObject(value) && Array.isArray(value.records)) return value.records as IroncladRecord[];
  if (isObject(value) && Array.isArray(value.items)) return value.items as IroncladRecord[];
  if (isObject(value) && Array.isArray(value.results)) return value.results as IroncladRecord[];
  return [];
}

function extractRecord(body: unknown): IroncladRecord | undefined {
  const value = unwrapData(body);
  if (isObject(value) && isObject(value.record)) return value.record as IroncladRecord;
  if (isObject(value) && typeof value.id === "string") return value as IroncladRecord;
  return undefined;
}

function unwrapData(body: unknown): unknown {
  if (isObject(body) && "data" in body) return body.data;
  return body;
}

function rankRecords(records: IroncladRecord[], normalizedHost: string, accountSlug: string) {
  return records
    .map((record) => {
      const haystack = JSON.stringify(record).toLowerCase();
      const status = String(readField(record, FIELD_ALIASES.contractStatus) ?? record.status ?? "").toLowerCase();
      const renewalDate = parseDate(readField(record, FIELD_ALIASES.renewalDate) ?? readField(record, FIELD_ALIASES.expirationDate));
      const matchedFields: string[] = [];
      let score = 0;

      if (haystack.includes(normalizedHost)) {
        score += 70;
        matchedFields.push("Account Host");
      }
      if (haystack.includes(accountSlug)) {
        score += 25;
        matchedFields.push("Account Slug");
      }
      if (ACTIVE_STATUSES.has(status)) score += 25;
      if (INACTIVE_STATUSES.has(status)) score -= 30;
      if (renewalDate) {
        const daysAway = Math.abs((renewalDate.getTime() - Date.now()) / 86400000);
        score += Math.max(0, 15 - Math.min(15, daysAway / 60));
      }

      return { record, score, matchedFields };
    })
    .sort((a, b) => b.score - a.score);
}

function foundResult(
  input: string,
  normalizedHost: string,
  accountSlug: string,
  record: IroncladRecord,
  matchedFields: string[],
  mode: "mock" | "acos-data",
): LookupResult {
  const renewal = toRenewalRecord(record);
  const warnings = buildWarnings(renewal);

  return {
    input,
    normalizedHost,
    accountSlug,
    status: "found",
    confidence: matchedFields.includes("Account Host") ? "high" : "medium",
    record: renewal,
    warnings,
    source: {
      recordId: record.id,
      matchedFields,
      retrievedAt: new Date().toISOString(),
      mode,
    },
  };
}

function notFound(input: string, normalizedHost: string, accountSlug: string, mode: "mock" | "acos-data"): LookupResult {
  return {
    input,
    normalizedHost,
    accountSlug,
    status: "not_found",
    warnings: [],
    message: `No Ironclad records matched ${normalizedHost}.`,
    source: {
      matchedFields: [],
      retrievedAt: new Date().toISOString(),
      mode,
    },
  };
}

function toRenewalRecord(record: IroncladRecord): RenewalRecord {
  const noticePeriodDays = toNumber(readField(record, FIELD_ALIASES.noticePeriodDays));
  const renewalDate = toIsoDate(readField(record, FIELD_ALIASES.renewalDate));
  const expirationDate = toIsoDate(readField(record, FIELD_ALIASES.expirationDate));
  const sourcedNoticeDeadline = toIsoDate(readField(record, FIELD_ALIASES.noticeDeadline));
  const noticeDeadline = sourcedNoticeDeadline ?? calculateNoticeDeadline(renewalDate ?? expirationDate, noticePeriodDays);

  return {
    id: record.id,
    name: String(record.name ?? readField(record, ["Name", "Contract Name"]) ?? record.id),
    ironcladUrl: record.url ?? `https://na1.ironcladapp.com/records/${record.id}`,
    counterparty: toStringValue(readField(record, FIELD_ALIASES.counterparty)),
    agreementType: toStringValue(readField(record, FIELD_ALIASES.agreementType) ?? record.type),
    contractStatus: toStringValue(readField(record, FIELD_ALIASES.contractStatus) ?? record.status),
    effectiveDate: toIsoDate(readField(record, FIELD_ALIASES.effectiveDate)),
    renewalDate,
    expirationDate,
    autoRenew: toBooleanOrString(readField(record, FIELD_ALIASES.autoRenew)),
    noticePeriodDays,
    noticeDeadline,
    noticeDeadlineCalculated: !sourcedNoticeDeadline && Boolean(noticeDeadline),
    term: toStringValue(readField(record, FIELD_ALIASES.term)),
    owner: toStringValue(readField(record, FIELD_ALIASES.owner)),
  };
}

function buildWarnings(record: RenewalRecord): string[] {
  const warnings: string[] = [];
  if (!record.renewalDate && record.expirationDate) {
    warnings.push("Renewal date is not populated. Expiration date is available and may be the renewal planning date.");
  }
  if (!record.renewalDate && !record.expirationDate) {
    warnings.push("No renewal or expiration date was found in Ironclad.");
  }
  if (record.autoRenew === undefined) {
    warnings.push("Auto-renew status is not populated in Ironclad. Confirm before advising the customer.");
  }
  if (!record.noticeDeadline && !record.noticePeriodDays) {
    warnings.push("Notice deadline and notice period are not populated.");
  }
  if (record.noticeDeadlineCalculated) {
    warnings.push("Notice deadline was calculated from the renewal or expiration date and notice period.");
  }
  return warnings;
}

function toCandidate(record: IroncladRecord, score: number): Candidate {
  const renewal = toRenewalRecord(record);
  return {
    id: renewal.id,
    name: renewal.name,
    contractStatus: renewal.contractStatus,
    renewalDate: renewal.renewalDate,
    expirationDate: renewal.expirationDate,
    confidenceScore: Math.round(Math.max(0, Math.min(100, score))),
  };
}

function readField(record: IroncladRecord, aliases: string[]): unknown {
  const props = record.properties ?? {};
  for (const alias of aliases) {
    if (alias in props) return props[alias];
  }

  const lowerMap = new Map(Object.entries(props).map(([key, value]) => [key.toLowerCase(), value]));
  for (const alias of aliases) {
    const value = lowerMap.get(alias.toLowerCase());
    if (value !== undefined) return value;
  }

  return undefined;
}

function calculateNoticeDeadline(dateValue: string | undefined, days: number | undefined): string | undefined {
  if (!dateValue || !days) return undefined;
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return undefined;
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function toStringValue(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return String(value);
}

function toBooleanOrString(value: unknown): boolean | string | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "y"].includes(normalized)) return true;
    if (["false", "no", "n"].includes(normalized)) return false;
    return value;
  }
  return undefined;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function toIsoDate(value: unknown): string | undefined {
  const parsed = parseDate(value);
  return parsed ? parsed.toISOString().slice(0, 10) : undefined;
}

function parseDate(value: unknown): Date | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function dedupeRecords(records: IroncladRecord[]): IroncladRecord[] {
  return Array.from(new Map(records.filter((record) => record.id).map((record) => [record.id, record])).values());
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
