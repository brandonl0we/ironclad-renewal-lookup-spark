export type LookupStatus = "idle" | "found" | "not_found" | "ambiguous" | "error";

export type RenewalRecord = {
  id: string;
  name: string;
  ironcladUrl?: string;
  counterparty?: string;
  agreementType?: string;
  contractStatus?: string;
  effectiveDate?: string;
  renewalDate?: string;
  expirationDate?: string;
  autoRenew?: boolean | string;
  noticePeriodDays?: number;
  noticeDeadline?: string;
  noticeDeadlineCalculated?: boolean;
  term?: string;
  owner?: string;
  metadata: Array<{
    key: string;
    label: string;
    value: string;
  }>;
  clauses: Array<{
    name: string;
    text: string;
  }>;
};

export type ContractSummary = {
  status: "ai" | "fallback";
  overview: string;
  facts: Array<{
    label: string;
    value: string;
    sources: string[];
  }>;
  watchouts: Array<{
    text: string;
    sources: string[];
  }>;
  generatedAt: string;
};

export type Candidate = {
  id: string;
  name: string;
  contractStatus?: string;
  renewalDate?: string;
  expirationDate?: string;
  confidenceScore: number;
};

export type LookupResult = {
  input: string;
  normalizedHost?: string;
  accountSlug?: string;
  status: LookupStatus;
  confidence?: "high" | "medium" | "low";
  record?: RenewalRecord;
  summary?: ContractSummary;
  candidates?: Candidate[];
  warnings: string[];
  source?: {
    recordId?: string;
    matchedFields: string[];
    retrievedAt: string;
    mode: "mock" | "acos-data";
  };
  message?: string;
};
