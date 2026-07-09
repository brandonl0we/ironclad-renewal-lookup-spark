# Deployment Status

## Completed

- Built a Next.js Spark app for read-only Ironclad renewal lookup.
- Requested `ironclad` ACOS-Data vendor access in `spark.json`.
- Added local mock data for `silvaris94143.activehosted.com`.
- Verified `npm test`.
- Verified `npm run build`.
- Verified local API lookup for `silvaris94143.activehosted.com`.
- Created Spark app and GitLab repo through AC Spark:
  - Repo: `gitlab.devops.app-us1.com/ac-spark/ironclad-renewal-lookup`
  - Live URL after deploy: `https://ironclad-renewal-lookup.ac-spark.com`
- Created and pushed an alternate GitHub source repo because GitLab was unreachable from this environment:
  - Repo: `https://github.com/brandonl0we/ironclad-renewal-lookup-spark`

## Remaining

- Point Spark at the GitHub source repo.
- Let Spark build/deploy from the GitHub repo.
- Test the deployed app at `https://ironclad-renewal-lookup.ac-spark.com` with `silvaris94143.activehosted.com`.

## Current Blocker

From this execution environment, GitLab is not reachable:

- SSH to `gitlab.devops.app-us1.com:22` times out.
- HTTPS to `https://gitlab.devops.app-us1.com/...` times out.

Spark itself is reachable in Chrome and the app/repo creation succeeded there.
