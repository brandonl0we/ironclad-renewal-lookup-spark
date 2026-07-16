# Deployment Status

## Current state

- The Next.js app is deployed at `https://ironclad-renewal-lookup.ac-spark.com`.
- ACOS-Data vendor access and Ironclad OAuth authentication are working.
- The lookup now targets completed workflows because `Activehosted ID` is a
  workflow attribute, not a free-text record search field.
- The app requests only the grant-gated read endpoints `list-workflows` and
  `get-workflow`.

## After deployment

1. Approve `ironclad:list-workflows` and `ironclad:get-workflow` for this app.
2. Test a known host such as `sindibor.activehosted.com`.
