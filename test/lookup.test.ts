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

  const notFound = await lookupRenewal("missing123.activehosted.com");
  assert.equal(notFound.status, "not_found");

  assert.throws(() => normalizeAccountHost("example.com"), /activehosted/);

  console.log("lookup tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
