import assert from "node:assert/strict";
import { lookupRenewal } from "../src/lib/ironclad";
import { normalizeAccountHost } from "../src/lib/normalize";

process.env.ACOS_DATA_MOCK = "true";

const normalized = normalizeAccountHost("https://silvaris94143.activehosted.com/admin/main.php");
assert.equal(normalized.normalizedHost, "silvaris94143.activehosted.com");
assert.equal(normalized.accountSlug, "silvaris94143");

async function main() {
  const result = await lookupRenewal("silvaris94143.activehosted.com");
  assert.equal(result.status, "found");
  assert.equal(result.normalizedHost, "silvaris94143.activehosted.com");
  assert.equal(result.record?.counterparty, "Silvaris");
  assert.equal(result.record?.renewalDate, "2026-08-01");
  assert.equal(result.record?.noticeDeadline, "2026-06-02");
  assert.equal(result.record?.noticeDeadlineCalculated, true);
  assert.equal(result.record?.autoRenew, true);

  const sindibor = await lookupRenewal("sindibor.activehosted.com");
  assert.equal(sindibor.status, "found");
  assert.equal(sindibor.record?.name, "Customer Contract with Sindibor");
  assert.equal(sindibor.record?.counterparty, "Sindibor");
  assert.equal(sindibor.record?.effectiveDate, "2026-07-17");
  assert.equal(sindibor.record?.renewalDate, "2027-07-17");
  assert.equal(sindibor.record?.expirationDate, "2027-07-17");
  assert.equal(sindibor.record?.term, "1 year");
  assert.equal(sindibor.record?.owner, "owner@activecampaign.com");
  assert.equal(sindibor.record?.metadata.find((field) => field.key === "counterpartyName")?.label, "Counterparty Name");
  assert.equal(sindibor.record?.metadata.find((field) => field.key === "contractStartDate")?.value, "2026-07-17");
  assert.equal(sindibor.record?.metadata.find((field) => field.key === "isComplete")?.value, "Yes");
  assert.equal(sindibor.record?.metadata.find((field) => field.key === "recordType")?.value, "Customer Contract");
  assert.equal(sindibor.record?.clauses.find((clause) => clause.name === "Renewals")?.text.includes("automatically renew"), true);

  const notFound = await lookupRenewal("missing123.activehosted.com");
  assert.equal(notFound.status, "not_found");

  assert.throws(() => normalizeAccountHost("example.com"), /activehosted/);

  console.log("lookup tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
