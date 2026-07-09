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

## Remaining

- Push this local repo to the Spark-created GitLab repo.
- Let Spark build/deploy from the pushed repo.
- Test the deployed app at `https://ironclad-renewal-lookup.ac-spark.com` with `silvaris94143.activehosted.com`.

## Current Blocker

From this execution environment, GitLab is not reachable:

- SSH to `gitlab.devops.app-us1.com:22` times out.
- HTTPS to `https://gitlab.devops.app-us1.com/...` times out.

Spark itself is reachable in Chrome and the app/repo creation succeeded there.
