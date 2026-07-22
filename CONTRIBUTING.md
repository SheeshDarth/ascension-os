# Contributing

AscensionOS is a private self-use app. Keep changes focused on the daily loop:

1. Open the app.
2. See today's state.
3. Log proof quickly.
4. Understand the score.
5. Get one next action.
6. Return tomorrow.

## Local Workflow

```bash
npm install
npm run dev
```

Before committing:

```bash
npm run check
```

## Change Guidelines

- Keep Supabase and Gemini secrets out of client code.
- Keep local-only mode working when Supabase env vars are missing.
- Keep Gemini optional; deterministic analysis must remain useful.
- Preserve manual check-in values over imported S23 telemetry.
- Add or update tests for scoring, analysis, telemetry, memory, or sync logic.
- For UI changes, check small phone widths: 360px, 390px, and 430px.

## Commit Style

Use concise imperative commit messages:

```text
Add weekly analysis rating controls
Fix offline check-in sync status
Polish memory graph telemetry cards
```
