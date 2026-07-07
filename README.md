# AscensionOS

Proof over potential.

AscensionOS is a dark, mobile-first personal transformation dashboard for Siddharth. It is built to log daily proof in under two minutes, calculate execution scores, track weekly patterns, and export a brutal weekly review for ChatGPT.

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase database
- Vercel-ready deployment

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template:

```bash
cp .env.example .env.local
```

3. Add Supabase keys to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

4. Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000/dashboard`.

If Supabase keys are missing, the app uses localStorage as a development fallback. For real phone access and persistence across devices, configure Supabase.

## Supabase Setup

1. Create a new Supabase project.
2. Open the SQL editor.
3. Run `supabase/schema.sql`.
4. Enable email magic-link auth in Supabase Auth settings.
5. Add your local and deployed URLs to Supabase Auth redirect URLs.
6. Copy the project URL and anon key into `.env.local`.
7. Restart the dev server.

The app creates seed goals automatically when the `goals` table is empty.
All Supabase tables are protected with Row Level Security and scoped to the signed-in user.

For an existing prototype database, use `supabase/migrations/001_private_hardening.sql` instead. Read the comments at the top first; old anonymous rows need a one-time `user_id` backfill before `not null` constraints can be applied.

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Vercel Deployment

1. Push this project to GitHub.
2. Import it in Vercel.
3. Add the two Supabase environment variables in Vercel project settings.
4. Deploy.
5. Open `/dashboard` from your phone.

## Daily Use

Use `/login` to send yourself a Supabase magic link, then use `/checkin` once per day. Log only what happened:

- Gym, diet, sleep, physique basics
- DSA, NIRMIQ, academics, deep work
- Dopamine control, reels, YouTube, smoking
- Money earned/spent
- Hardest task, biggest distraction, notes

The app calculates:

- Execution Score
- Discipline Score
- Career Score
- Dopamine Control Score
- Physique Score
- Self-Respect Score

## Memory Graph

Open `/memory-graph` to visualize performance from both phone and laptop. It includes:

- 7, 30, and 90 day performance windows
- A node graph connecting Execution to Physique, Career, Discipline, Dopamine Control, and Self-Respect
- A recent execution timeline
- Trend cards for average execution, current streak, best streak, and weakest domain
- A score table for accessibility and quick scanning

## Weekly Review Export

Open `/weekly-review` and press `Export Weekly Review for ChatGPT`. The app saves the weekly export to Supabase when configured, then copies a markdown report with scores, totals, best/worst days, patterns, and next-week commitments.

Paste it into ChatGPT and ask for:

```text
Brutal review / plan adjustment / discipline reset
```

## Security Note

This app stores personal data. Do not make the database public.

The provided schema enables Row Level Security and owner-only policies. Before sharing the app more broadly:

- Keep the repo and Supabase project private.
- Confirm Supabase Auth redirect URLs only include trusted domains.
- Never expose service-role keys in the browser.

## Quality Checks

```bash
npm run lint
npm run test
npm run build
npm run check
```

## Core Rule

No reset fantasy. Only proof.
