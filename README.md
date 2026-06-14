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
4. Copy the project URL and anon key into `.env.local`.
5. Restart the dev server.

The app creates seed goals automatically when the `goals` table is empty.

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

Use `/checkin` once per day. Log only what happened:

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

- A weekly node graph connecting Execution to Physique, Career, Discipline, Dopamine Control, and Self-Respect
- A recent execution timeline
- A score table for accessibility and quick scanning

## Weekly Review Export

Open `/weekly-review` and press `Export Weekly Review for ChatGPT`. The app copies a markdown report with scores, totals, best/worst days, patterns, and next-week commitments.

Paste it into ChatGPT and ask for:

```text
Brutal review / plan adjustment / discipline reset
```

## Security Note

This app stores personal data. Do not make the database public.

For the MVP, Row Level Security is disabled in the provided schema to keep setup simple. Before public use:

- Add Supabase Auth.
- Enable Row Level Security on all tables.
- Add policies scoped to `auth.uid()`.
- Make `user_id` required and tie every row to the authenticated user.

## Core Rule

No reset fantasy. Only proof.
