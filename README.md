# QuickFix Monorepo

QuickFix is a 3-app Next.js demo platform:
- Customer app (port 3003)
- Provider app (port 3004)
- Admin app (port 3002)

## 1. Prerequisites

- Node.js 20+
- npm 10+
- Supabase project (required for all apps)
- Firebase project (required for customer phone OTP login)

## 2. Install dependencies

```bash
npm install
```

## 3. Environment setup

Copy environment templates and fill real values:

```bash
copy apps\admin\.env.example apps\admin\.env.local
copy apps\provider\.env.example apps\provider\.env.local
copy apps\customer\.env.example apps\customer\.env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Customer app only: `NEXT_PUBLIC_FIREBASE_*`

## 4. Run locally

```bash
npm run dev:customer
npm run dev:provider
npm run dev:admin
```

Note:
- The apps are configured to use `--webpack` in dev/build scripts.
- This is required in environments where native Next SWC bindings are blocked by policy.

## 5. Run production locally

Build each app, then use the workspace start command:

```bash
npm run build:all
npm run start:customer
npm run start:provider
npm run start:admin
```

Or start all apps together from the monorepo root:

```bash
npm run start:all
```

Each app will serve on its configured port:
- Customer: `3003`
- Provider: `3004`
- Admin: `3002`

## 6. Production checks

```bash
npm run lint:all
npm run build:all
```

Or run both:

```bash
npm run check:all
```

Smoke checks (boots each app and verifies key routes):

```bash
npm run smoke:all
```

Full release gate (lint + build + smoke):

```bash
npm run release:check
```

## 6. Database setup

Use SQL files in `packages/data/`:
- `supabase_schema.sql`
- `migration.sql`

Run them in Supabase SQL editor before using the apps in production.

## 7. Publish checklist

- Add production env values for each app
- Configure allowed domains in Firebase Auth
- Verify Supabase RLS policies for `users`, `shops`, `bookings`, `services`
- Deploy apps separately (Vercel/Netlify/static host)
- Run `npm run check:all` in CI before deploy

CI workflow:
- `.github/workflows/ci.yml` runs install, lint, build, and smoke checks for all workspaces on pushes and PRs.

## Current status

- `npm run check:all` passes for all apps
- Lint is clean (no warnings or errors)
- Build is green for customer, provider, and admin
- Next.js has been migrated to `16.2.4`

## Security notes

- Dependency vulnerabilities were reduced from 10 to 2 (both moderate)
- Remaining advisories are reported through Next.js internal `postcss` dependency pathing in `npm audit`
- `npm audit fix --force` currently suggests an incorrect downgrade path (`next@9.3.3`), so do not apply it
- For production hardening, monitor upcoming Next.js releases and re-run `npm audit` on each patch update

## Additional docs

- Deployment runbook: `DEPLOYMENT_CHECKLIST.md`
