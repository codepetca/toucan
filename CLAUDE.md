# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Toucan is a personal flight price tracking web app. Users manage tracked routes via a Next.js web UI, and a GitHub Actions cron job polls the Duffel API for price updates and writes results to a Postgres database. Single-user, no scraping.

**Initial scope:** Canadian domestic flights, Toronto (YYZ/YTZ) to Halifax, Porter Airlines and Air Canada.

## Tech Stack

- **Runtime:** Node 20
- **Language:** TypeScript
- **Framework:** Next.js 15 (App Router) on Vercel
- **Styling:** Tailwind CSS
- **Database:** Vercel Postgres (Neon) + Drizzle ORM + Postgres.js driver
- **Auth:** iron-session + bcryptjs (single user, seeded via script)
- **Flight data provider:** Duffel API (initial), with provider abstraction for future alternatives (Amadeus, etc.)
- **Notifications (MVP):** Console log only
- **Notifications (post-MVP):** Pushover
- **Background jobs:** GitHub Actions cron (~4x/day)
- **Package manager:** pnpm
- **Testing:** Vitest
- **Lint/format:** Biome

## Architecture

All core logic (price comparison, notification decisions) must depend only on the `FlightSearchProvider` interface, never on a specific API client:

```ts
interface FlightSearchProvider {
  searchOffers(input: SearchInput): Promise<FlightOffer[]>;
}
```

Concrete providers (Duffel, Amadeus) implement this interface. Switching providers must not require changes to core logic. Entry points (API routes, cron scripts) are allowed to instantiate concrete providers.

### Database

Four tables: `users`, `routes`, `price_checks`, `alerts`. Schema defined in `src/lib/db/schema.ts`. Migrations via `drizzle-kit generate` and `drizzle-kit migrate`.

- **Pooled URL** (`POSTGRES_URL`): used by the web app at runtime
- **Direct URL** (`POSTGRES_URL_NON_POOLING`): used for migrations and cron scripts

### Auth

Single user, seeded via `pnpm seed` (reads `SEED_USER_EMAIL` and `SEED_USER_PASSWORD` from env). iron-session cookie-based auth with `SESSION_SECRET` env var (must be 32+ chars). Middleware at `src/middleware.ts` protects all routes except `/login` and `/api/auth/login`.

## Key Design Decisions

- **Duffel over Amadeus** as initial provider due to better Porter Airlines coverage.
- **Polling over webhooks** because airlines/aggregators don't emit price-change events.
- **API-only** — no scraping of airline sites or Google Flights.
- **Postgres over file storage** — needed for Vercel serverless (no persistent filesystem) and shared access between web app and cron job.

## Notification Rules

- Alert when price <= configured target threshold, or price drops by >= configured delta (e.g., $20).
- Cooldown: no more than one alert per 12 hours unless new all-time low (bypasses cooldown).
- Currency filtering: offers must match expected currency (prevents CAD/USD confusion).

## Commands

- `pnpm dev` — start Next.js dev server
- `pnpm build` — production build
- `pnpm test` — run all tests (Vitest)
- `pnpm lint` — check with Biome
- `pnpm lint:fix` — auto-fix lint issues
- `pnpm seed` — seed the single user into the database
- `pnpm check-prices` — run the price check cron script manually
- `pnpm db:generate` — generate Drizzle migration files
- `pnpm db:migrate` — apply migrations to database

## Troubleshooting

### Database connection timeout (`CONNECT_TIMEOUT`)

If the app hangs on the loading spinner or DB queries fail with `CONNECT_TIMEOUT` to `*.neon.tech:5432`, the VPN is likely not connected. The Neon Postgres database requires VPN access.

**Fix:** Turn on your VPN, then restart the dev server.

You can verify connectivity with:
```sh
source .env.local && node -e "const p=require('postgres');const s=p(process.env.POSTGRES_URL,{connect_timeout:5});s\`SELECT 1\`.then(()=>{console.log('DB OK');s.end()}).catch(e=>{console.error('DB unreachable:',e.code);s.end()})"
```

## Environment Variables

- `POSTGRES_URL` — pooled Postgres connection string (web app)
- `POSTGRES_URL_NON_POOLING` — direct Postgres connection string (migrations, cron)
- `SESSION_SECRET` — 32+ char secret for iron-session
- `DUFFEL_API_TOKEN` — Duffel API token (use `duffel_test_*` for dev)
- `SEED_USER_EMAIL` / `SEED_USER_PASSWORD` — credentials for the seeded user
