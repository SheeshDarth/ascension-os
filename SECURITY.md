# Security Policy

AscensionOS stores private personal data. Treat every log, review, memory item, AI analysis, and S23 telemetry snapshot as sensitive.

## Supported Version

Only the latest `master` branch is maintained.

## Required Security Rules

- Keep the repository private unless the privacy model is redesigned.
- Keep Supabase Row Level Security enabled on all user-owned tables.
- Never expose Supabase service-role keys.
- Never expose `GEMINI_API_KEY` in browser/client code.
- Keep Google OAuth redirect URLs limited to trusted local, preview, and production URLs.
- Keep Android telemetry import explicit and user-triggered.
- Do not add social sharing, public profiles, or public exports without a new threat model.

## Reporting

For private self-use, open a private GitHub issue or fix directly on a short-lived branch. Include:

- affected route or table
- reproduction steps
- data exposure risk
- proposed fix
- verification commands
