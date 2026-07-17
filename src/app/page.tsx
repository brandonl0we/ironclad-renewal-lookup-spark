"use client";

import { FormEvent, useState } from "react";
import type { Candidate, ContractSummary, LookupResult, RenewalRecord } from "@/lib/types";

export default function Home() {
  const [account, setAccount] = useState("");
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
              Search read-only Ironclad workflows and surface the renewal dates, notice window, auto-renew status, owner,
              and contract link a CSM or Support Rep needs.
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
            <ResultPanel record={result.record} result={result} />
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

      {result.summary ? <ContractBrief summary={result.summary} /> : null}

      <details className="raw-contract-panel">
        <summary>
          <span>View raw contract data</span>
          <small>{record.metadata.length} fields · {record.clauses.length} clauses</small>
        </summary>
        <div className="raw-contract-content">
          <div className="field-grid">
            {fields.map(([label, value]) => (
              <div className="field" key={label}>
                <p className="label">{label}</p>
                <p className="value">
                  {label === "Ironclad workflow" && value ? (
                    <a href={value} target="_blank" rel="noreferrer">Open in Ironclad ↗</a>
                  ) : value || "Unknown"}
                </p>
              </div>
            ))}
          </div>

          {result.warnings.length ? <ul className="warning-list">{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : null}

          <details className="metadata-panel">
            <summary><span>All Ironclad metadata</span><small>{record.metadata.length} populated fields</small></summary>
            <div className="metadata-grid">{record.metadata.map((field) => (
              <div className="metadata-field" key={`${field.key}-${field.label}`}>
                <p className="label">{field.label}</p>
                <p className="metadata-value">{/^https?:\/\//i.test(field.value) ? <a href={field.value} target="_blank" rel="noreferrer">{field.value}</a> : field.value}</p>
              </div>
            ))}</div>
          </details>

          {record.clauses.length ? <section className="clauses-panel">
            <div className="clauses-header"><p className="label">Archived record</p><h3>Clauses</h3></div>
            <div className="clause-list">{record.clauses.map((clause) => <article className="clause" key={clause.name}><h4>{clause.name}</h4><p>{clause.text}</p></article>)}</div>
          </section> : null}
        </div>
      </details>
    </section>
  );
}

function ContractBrief({ summary }: { summary: ContractSummary }) {
  return <section className="contract-brief">
    <div className="brief-heading">
      <div><p className="label">AI contract brief</p><h3>What matters for renewal</h3></div>
      <span className="evidence-pill">{summary.status === "ai" ? "AI · Evidence-linked" : "Evidence-linked fallback"}</span>
    </div>
    <p className="brief-overview">{summary.overview}</p>
    <div className="brief-facts">{summary.facts.map((fact) => <article className="brief-fact" key={`${fact.label}-${fact.value}`}>
      <p className="label">{fact.label}</p><p>{fact.value}</p>
      <div className="source-list">{fact.sources.map((source) => <span key={source}>{source}</span>)}</div>
    </article>)}</div>
    {summary.watchouts.length ? <div className="brief-watchouts"><p className="label">Watchouts</p><ul>{summary.watchouts.map((item) => <li key={item.text}>{item.text}<small>{item.sources.join(" · ")}</small></li>)}</ul></div> : null}
    <p className="brief-disclaimer">AI-generated from retrieved Ironclad fields and clauses. Verify source data before making contractual decisions.</p>
  </section>;
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
