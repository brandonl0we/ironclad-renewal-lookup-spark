"use client";

import { FormEvent, useState } from "react";
import type { Candidate, LookupResult, RenewalRecord } from "@/lib/types";

const DEFAULT_ACCOUNT = "silvaris94143.activehosted.com";

export default function Home() {
  const [account, setAccount] = useState(DEFAULT_ACCOUNT);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await lookup();
  }

  async function lookup(selectedRecordId?: string) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ account, selectedRecordId }),
      });
      const payload = (await response.json()) as LookupResult;
      setResult(payload);
      if (!response.ok) setError(payload.message ?? "Lookup failed.");
    } catch {
      setError("Lookup failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <div className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Ironclad Renewal Lookup</p>
            <h1>Find contract details by AC account host</h1>
            <p className="subtitle">
              Search read-only Ironclad workflows and competitive intelligence to surface the renewal context a CSM or
              Support Rep needs.
            </p>
          </div>
          <div className="status-pill">Read-only</div>
        </header>

        <section className="lookup-panel">
          <form className="search-row" onSubmit={submit}>
            <input
              className="search-input"
              value={account}
              onChange={(event) => setAccount(event.target.value)}
              placeholder="xxxx.activehosted.com"
              aria-label="ActiveCampaign account host"
            />
            <button className="primary-button" disabled={loading}>
              {loading ? "Looking..." : "Lookup"}
            </button>
          </form>
          {error ? <div className="error">{error}</div> : null}
        </section>

        <div className="content-grid">
          {result?.status === "found" && result.record ? (
            <div className="result-stack">
              <ResultPanel record={result.record} result={result} />
              <CompetitiveIntelPanel intel={result.competitiveIntel} />
            </div>
          ) : result?.status === "ambiguous" && result.candidates ? (
            <CandidatePanel candidates={result.candidates} onSelect={(id) => lookup(id)} />
          ) : result?.status === "not_found" ? (
            <section className="empty-panel">
              <h2>No matching contract found</h2>
              <p>{result.message}</p>
            </section>
          ) : (
            <section className="empty-panel">
              <h2>Ready when you are</h2>
              <p>Enter an ActiveCampaign account host to pull renewal metadata from Ironclad.</p>
            </section>
          )}

          <aside className="side-panel">
            <h2>Lookup source</h2>
            <dl>
              <div>
                <dt>Account host</dt>
                <dd>{result?.normalizedHost ?? "Not searched yet"}</dd>
              </div>
              <div>
                <dt>Account slug</dt>
                <dd>{result?.accountSlug ?? "Not searched yet"}</dd>
              </div>
              <div>
                <dt>Mode</dt>
                <dd>{result?.source?.mode ?? "Pending"}</dd>
              </div>
              <div>
                <dt>Matched fields</dt>
                <dd>{result?.source?.matchedFields.join(", ") || "None yet"}</dd>
              </div>
              <div>
                <dt>Competitive intel</dt>
                <dd>{formatIntelStatus(result?.competitiveIntel)}</dd>
              </div>
              <div>
                <dt>Retrieved</dt>
                <dd>{result?.source?.retrievedAt ?? "Not searched yet"}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </main>
  );
}

function CompetitiveIntelPanel({ intel }: { intel: LookupResult["competitiveIntel"] }) {
  if (!intel) return null;
  return (
    <section className="intel-panel">
      <div className="intel-header">
        <div>
          <p className="label">Additional source</p>
          <h2>Competitive intelligence</h2>
        </div>
        <a href={intel.channelUrl} target="_blank" rel="noreferrer">Open Slack ↗</a>
      </div>
      {intel.matches.length ? (
        <div className="intel-list">
          {intel.matches.map((match) => (
            <article className="intel-card" key={`${match.timestamp}-${match.excerpt}`}>
              <p>{match.excerpt}</p>
              <small>{formatSlackTimestamp(match.timestamp)}{match.author ? ` · ${match.author}` : ""}</small>
            </article>
          ))}
        </div>
      ) : (
        <p className="intel-empty">{intel.message ?? "No matching posts found."}</p>
      )}
    </section>
  );
}

function formatIntelStatus(intel: LookupResult["competitiveIntel"]) {
  if (!intel) return "Not searched yet";
  if (intel.status === "found") return `${intel.matches.length} Slack match${intel.matches.length === 1 ? "" : "es"}`;
  if (intel.status === "no_matches") return "Slack searched · no matches";
  if (intel.status === "mock") return "Disabled in mock mode";
  return "Slack unavailable";
}

function formatSlackTimestamp(value: string) {
  const seconds = Number(value.split(".")[0]);
  if (!Number.isFinite(seconds)) return "Slack message";
  return new Date(seconds * 1000).toLocaleString();
}

function ResultPanel({ record, result }: { record: RenewalRecord; result: LookupResult }) {
  const fields = [
    ["Counterparty", record.counterparty],
    ["Agreement type", record.agreementType],
    ["Status", record.contractStatus],
    ["Effective date", record.effectiveDate],
    ["Renewal date", record.renewalDate],
    ["Expiration date", record.expirationDate],
    ["Auto-renew", formatBoolean(record.autoRenew)],
    ["Notice period", record.noticePeriodDays ? `${record.noticePeriodDays} days` : undefined],
    ["Notice deadline", record.noticeDeadline],
    ["Term", record.term],
    ["Owner", record.owner],
    ["Ironclad workflow", record.ironcladUrl],
  ];

  return (
    <section className="result-panel">
      <div className="result-header">
        <div>
          <h2 className="result-title">{record.name}</h2>
          <p className="result-meta">Workflow ID: {record.id}</p>
        </div>
        <div className="confidence">{result.confidence ?? "medium"} confidence</div>
      </div>

      <div className="field-grid">
        {fields.map(([label, value]) => (
          <div className="field" key={label}>
            <p className="label">{label}</p>
            <p className="value">
              {label === "Ironclad workflow" && value ? (
                <a href={value} target="_blank" rel="noreferrer">
                  Open in Ironclad ↗
                </a>
              ) : (
                value || "Unknown"
              )}
            </p>
          </div>
        ))}
      </div>

      {result.warnings.length ? (
        <ul className="warning-list">
          {result.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function CandidatePanel({ candidates, onSelect }: { candidates: Candidate[]; onSelect: (id: string) => void }) {
  return (
    <section className="result-panel">
      <div className="result-header">
        <div>
          <h2 className="result-title">Choose the matching contract</h2>
          <p className="result-meta">More than one Ironclad workflow may belong to this account.</p>
        </div>
      </div>
      <div className="candidate-list">
        {candidates.map((candidate) => (
          <button className="candidate-button" key={candidate.id} onClick={() => onSelect(candidate.id)}>
            <p className="candidate-title">{candidate.name}</p>
            <p className="candidate-meta">
              {candidate.contractStatus ?? "Unknown status"} · Renewal {candidate.renewalDate ?? candidate.expirationDate ?? "unknown"} ·{" "}
              {candidate.confidenceScore}% match
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}

function formatBoolean(value: RenewalRecord["autoRenew"]) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return value;
}
