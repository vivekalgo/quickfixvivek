# Deployment Checklist

## Pre-deploy

- Confirm `npm ci` succeeds.
- Confirm `npm run check:all` succeeds.
- Confirm `npm run smoke:all` succeeds.
- Confirm `npm run release:check` succeeds.
- Verify `.env.local` values are present for each app.
- Verify Supabase schema and migrations are applied.
- Verify Firebase phone auth is configured for customer app.

## Environment variables

### Admin app

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Provider app

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Customer app

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## Platform notes

- This repository is on Next.js 16 and uses `--webpack` in dev/build scripts.
- On locked-down Windows environments where native SWC is blocked, Webpack mode is required.

## Deploy targets

- Admin app: deploy independently.
- Provider app: deploy independently.
- Customer app: deploy independently.

## Post-deploy smoke tests

- Admin dashboard loads and fetches users/shops/orders.
- Provider dashboard loads and shows shop profile.
- Customer login opens and handles OTP flow.
- Customer shop list and orders pages load.

## Security follow-up

- Current `npm audit` reports 2 moderate advisories related to Next internal `postcss` pathing.
- Track upstream Next.js advisory/resolution updates and retest after patch releases.
