# Ironclad Renewal Lookup

A small Spark app for CSMs and Support Reps to look up Ironclad renewal metadata from an ActiveCampaign account host such as `silvaris94143.activehosted.com`.

## What it does

- Normalizes an ActiveCampaign account host.
- Searches completed Ironclad workflows through ACOS-Data using the workflow
  attribute ID `activehostedId` (shown in Ironclad as `Activehosted ID`).
- Returns renewal-focused contract metadata.
- Avoids all Ironclad write endpoints.
- Falls back to deterministic mock data when `ACOS_DATA_MOCK=true`.

## Local development

```bash
npm install
npm run dev
```

For offline testing:

```bash
ACOS_DATA_MOCK=true npm run dev
```

Then search for:

```text
silvaris94143.activehosted.com
```

For real local data, paste Spark local development credentials into `.env.local`.

## Spark deployment

Spark auto-detects this as a Next.js app. The `spark.json` requests the
grant-gated read endpoints `ironclad:list-workflows` and
`ironclad:get-workflow`. The app uses no Ironclad write endpoints.
