# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Toucan is a personal flight price tracking and notification tool. It polls flight prices for configured routes/dates via API providers and sends email alerts when meaningful price changes occur. Single-user, no frontend, no scraping.

**Initial scope:** Canadian domestic flights, Toronto (YYZ/YTZ) to Halifax, Porter Airlines and Air Canada.

## Tech Stack

- **Runtime:** Node 20
- **Language:** TypeScript
- **Execution:** Scheduled background job (GitHub Actions cron, ~4x/day)
- **Flight data provider:** Duffel API (initial), with provider abstraction for future alternatives (Amadeus, etc.)
- **Notifications:** Email
- **Storage:** Minimal (local file or lightweight DB) — tracks best price seen, last check/notification timestamps, and current best offer summary per route/date

## Architecture

All core logic (price comparison, notification decisions) must depend only on the `FlightSearchProvider` interface, never on a specific API client:

```ts
interface FlightSearchProvider {
  searchOffers(input: SearchInput): Promise<FlightOffer[]>;
}
```

Concrete providers (Duffel, Amadeus) implement this interface. Switching providers must not require changes to core logic.

## Key Design Decisions

- **Duffel over Amadeus** as initial provider due to better Porter Airlines coverage.
- **Polling over webhooks** because airlines/aggregators don't emit price-change events.
- **Minimal persistence** — no database unless clearly needed. Historical price perfection is a non-goal.
- **API-only** — no scraping of airline sites or Google Flights.

## Notification Rules

- Alert when price <= configured target threshold, or price drops by >= configured delta (e.g., $20).
- Cooldown: no more than one alert per 12 hours unless price drops again.

## Spec Documents

- `001-flight-tracker-mvp.md` — Full MVP specification with acceptance criteria and scope boundaries.
