# Deployment Status

## Completed

- Built a Next.js Spark app for read-only Ironclad renewal lookup.
- Verified `npm test`, `npm run build`, and local mock lookup for `silvaris94143.activehosted.com`.
- Spark app created and deployed: `https://ironclad-renewal-lookup.ac-spark.com` (deployed Jul 14, 2026).
- Ironclad ACOS-Data vendor is ACTIVE with a central credential configured.
- Removed the incorrect `"write": ["ironclad:list-records"]` declaration from
  `spark.json` — `list-records` is a **read** endpoint (`requiresGrant: true` in
  the acos-data vendor definition), not a write. Declaring it as a write filed a
  write-access request at deploy.

## Current Blocker (Jul 15, 2026)

Live lookups fail with:

> App is denied access to endpoint 'list-records' on vendor 'ironclad'

In acos-data this exact error is only thrown when the app's per-endpoint grant is
`DENIED` or `REVOKED` (`src/lib/vendor-authz.ts`), and `GET /v1/me/access` shows no
revocations — so the `ironclad:list-records` grant for this app was **denied**,
most likely because the request was mis-filed as a *write* (see above). Since
2026-07-09, **all** Ironclad endpoints (reads included) require a per-app,
admin-approved grant; vendor access alone unlocks nothing.

A denied grant is not re-requested automatically — the auto-file backstop only
fires when no grant row exists.

## Needed from an ACOS-Data admin

For app `ironclad-renewal-lookup` (appId `74e93566-fd92-4e07-9696-34d519c072f7`):

1. Reopen + approve `ironclad:list-records` (read; the original "write" framing
   came from our old spark.json and is now fixed).
2. Also approve `ironclad:get-record` — the app calls it after `list-records`;
   otherwise the first successful search will just auto-file another pending
   request and stall again.

Both are read-only endpoints; the app touches no Ironclad write endpoints.

## After approval

No redeploy needed — grants take effect immediately. Test at
`https://ironclad-renewal-lookup.ac-spark.com` with `silvaris94143.activehosted.com`.
