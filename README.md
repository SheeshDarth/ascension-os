# AscensionOS

Proof over potential.

AscensionOS is a private, mobile-first growth operating system for daily proof, performance memory, weekly review, and personal telemetry. It is built for one core loop:

1. Open on phone or laptop.
2. See today's state immediately.
3. Log proof in under 60 seconds.
4. Understand why the score changed.
5. Get one next action.
6. Return tomorrow with momentum.

The app is optimized for private self-use. It keeps a local cache, queues sync when offline, and uses Supabase only when configured.

## Current Capabilities

- Futuristic app-style landing page and cockpit UI.
- Google OAuth primary login with email magic-link fallback.
- Daily proof check-in with autosave and score preview.
- Execution, discipline, career, dopamine, physique, and self-respect scoring.
- Dashboard command center with daily state, score contributors, next action, and S23 intelligence.
- Memory Graph with 7, 30, and 90 day windows.
- Weekly review export and deterministic AI analysis.
- Optional Gemini weekly analysis through a server-side API route.
- Local backup export/import.
- PWA install support.
- Capacitor Android bridge for Samsung S23 Health Connect and Usage Access telemetry.

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth and Postgres
- Vitest
- Capacitor Android
- Vercel deployment target

## Quick Start

Install dependencies:

```bash
npm install
```

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
```

For local-only development, leave the Supabase values empty or omit `.env.local`. The app will use local storage and IndexedDB fallbacks.

Start the dev server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

For phone testing on the same Wi-Fi, bind the dev server to all interfaces:

```bash
npm run dev -- --hostname 0.0.0.0 --port 3001
```

Then open the laptop LAN URL on the phone, for example:

```text
http://192.168.1.20:3001
```

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
```

Rules:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be present together.
- If only one Supabase value is present, AscensionOS treats it as a configuration error.
- `GEMINI_API_KEY` is server-side only. Never expose it in client code.
- Gemini is optional. Deterministic analysis works without it.

## Supabase Setup

Fresh database:

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `supabase/schema.sql`.
4. Enable Google OAuth in Supabase Auth.
5. Enable email magic links as the fallback auth path.
6. Add local and deployed URLs to Auth redirect URLs.
7. Add the project URL and anon key to `.env.local`.
8. Restart the dev server.

Existing prototype database:

1. Read the comments at the top of `supabase/migrations/001_private_hardening.sql`.
2. Backfill old anonymous rows with your Supabase Auth `user_id`.
3. Run migrations in order:

```text
supabase/migrations/001_private_hardening.sql
supabase/migrations/002_onboarding_completed.sql
supabase/migrations/003_device_metric_snapshots.sql
```

Protected tables:

- `daily_logs`
- `goals`
- `settings`
- `weekly_reviews`
- `ai_analyses`
- `memory_items`
- `device_metric_snapshots`

Every protected table should have RLS enabled and owner-only policies using `auth.uid() = user_id`.

## Main Routes

- `/` - app launch surface.
- `/login` - Google OAuth and magic-link login.
- `/onboarding` - first-run calibration.
- `/dashboard` - daily command center.
- `/checkin` - daily proof protocol.
- `/memory-graph` - performance memory graph.
- `/weekly-review` - weekly review and AI analysis.
- `/history` - daily proof ledger and memory creation.
- `/goals` - goal tracker.
- `/settings` - AI provider, backup, memory, sync, and account settings.
- `/settings/integrations` - Android phone telemetry bridge.

## Daily Proof Loop

Use `/checkin` once per day. Track only what happened:

- Sleep, wake time, water, weight, steps, gym, diet, workout quality.
- DSA, NIRMIQ, academics, deep work.
- Porn relapse, masturbation count, reels, YouTube, smoking.
- Money earned and spent.
- Grooming, skincare, social action.
- Hardest task, biggest distraction, mood, self-respect, notes.

The app calculates:

- Execution Score
- Discipline Score
- Career Score
- Dopamine Control Score
- Physique Score
- Self-Respect Score

## S23 Health And Screen-Time Bridge

The browser/PWA cannot directly read private Samsung Health or Android usage history. For those signals, use the Android APK.

The native Capacitor plugin reads daily aggregates from:

- Android Health Connect: steps, sleep, exercise, weight.
- Android Usage Access: total screen time, YouTube, Instagram/TikTok style short-form usage, social usage.

Where the data appears:

- `/settings/integrations` grants permissions, syncs, reviews recent snapshots, and deletes imported telemetry.
- `/checkin` has `Sync from S23` and fills blank fields only.
- `/dashboard` shows S23 readiness, recovery, body signal, focus risk, source, and next action.
- `/memory-graph` shows telemetry coverage and 7/30/90 day averages.

Manual values always win. Imported phone values only fill blank numeric fields.

Android build details are in `android/README.md`.

## Build Android APK

For production-style APK testing, point Capacitor at the deployed app:

```powershell
$env:CAPACITOR_SERVER_URL = "https://your-ascensionos-domain.vercel.app"
npx.cmd cap sync android
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
Push-Location android
.\gradlew.bat assembleDebug --no-daemon
Pop-Location
```

The debug APK is created at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

For local Wi-Fi APK testing, set `CAPACITOR_SERVER_URL` to the laptop LAN URL, not `localhost`.

## AI Performance Analysis

Open `/settings` to choose the provider:

- `Off`: no AI analysis.
- `Deterministic offline`: local rule-based weekly analysis.
- `Gemini cloud`: server-side Gemini analysis when `GEMINI_API_KEY` exists and cloud consent is enabled.

Gemini is never called from browser code. The weekly analysis endpoint requires authentication when cloud analysis is requested. If Gemini is missing, offline, fails, or returns invalid output, AscensionOS falls back to deterministic analysis.

AI analysis results can be exported, deleted, rated useful/not useful, and corrected with notes.

## Memory System

AscensionOS currently uses a lightweight memory layer:

- Daily logs form the performance graph.
- Weekly reviews can be saved as memory.
- History items can be saved as memory.
- Memory items support tags such as `win`, `failure`, `relapse`, `breakthrough`, `warning`, `goal`, and `identity`.

Embeddings, vector search, and local phone LLM inference are intentionally deferred until the rule-based memory layer proves useful.

## Local Backup

Open `/settings` to export or import the local cache as JSON. Backups include:

- daily logs
- goals
- settings
- weekly reviews
- AI analyses
- memory items
- device metric snapshots

This is the zero-cost escape hatch if a provider fails, pauses, or needs to be replaced.

## PWA And Offline Notes

- `public/manifest.webmanifest` defines app name, install behavior, icons, and shortcuts.
- `public/sw.js` provides the offline shell.
- `lib/deployment.ts` contains the app build version.

Release rule:

- Update `APP_BUILD_VERSION` in `lib/deployment.ts` and `CACHE_VERSION` in `public/sw.js` together when cached shell behavior changes.

## Vercel Deployment

1. Push the private GitHub repo.
2. Import the repo into Vercel.
3. Add environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
```

4. Deploy from `master`.
5. Add the production URL to Supabase Auth redirect URLs.
6. Test login, sync, weekly analysis, PWA install, and offline shell.

## Production Checklist

Before deploy:

```bash
npm run check
```

Smoke test:

- `/`
- `/login`
- `/dashboard`
- `/checkin`
- `/memory-graph`
- `/weekly-review`
- `/history`
- `/goals`
- `/settings`
- `/settings/integrations`
- `/offline.html`
- `/sw.js`
- `/manifest.webmanifest`

Manual acceptance:

- Google login works.
- Magic link still works.
- Log proof on laptop and confirm it appears on phone.
- Change settings on phone and confirm laptop reflects them.
- Save a check-in offline and confirm it syncs later.
- Run deterministic weekly analysis without Gemini.
- Run Gemini analysis only after consent.
- Install PWA on phone.
- Build APK with `CAPACITOR_SERVER_URL`.
- Sync S23 telemetry from the APK.
- Confirm RLS blocks cross-user data access.

## Troubleshooting

Blank localhost:

- Confirm the dev server is running.
- Try `http://localhost:3000`.
- If testing on phone, use the laptop LAN IP and bind Next to `0.0.0.0`.

Supabase login loops:

- Confirm both Supabase environment variables are present.
- Confirm redirect URLs include local and deployed app URLs.
- Restart the dev server after changing `.env.local`.

Phone telemetry missing:

- Use the APK, not the browser-only PWA.
- Grant Health Connect permissions.
- Enable Android Usage Access for AscensionOS.
- Press `Sync now` in `/settings/integrations`.

Gemini not running:

- Confirm `GEMINI_API_KEY` is set server-side.
- Enable cloud consent in settings.
- Sign in before requesting cloud analysis.
- Check the visible fallback reason in the weekly review result.

## Quality Commands

```bash
npm run lint
npm run test
npm run build
npm run check
```

## Security Rules

- Keep the repo private.
- Keep the Supabase project private.
- Keep RLS enabled.
- Never expose Supabase service-role keys.
- Never expose `GEMINI_API_KEY` in client-side code.
- Do not add social sharing or public profiles unless the privacy model is redesigned.

## Core Rule

No reset fantasy. Only proof.
