# Initial setup: Flight price tracker & notifier (pluggable providers)

## Goal
Build the MVP of a **personal flight price tracking and notification tool** that periodically checks flight prices for configured routes and dates and notifies when meaningful price changes occur.

The system should be intentionally small, reliable, and API-driven (no scraping).

---

## Initial scope (MVP)
- Track **Canadian domestic flights**
- Start with **Toronto → Halifax**
  - Airports: YYZ (primary), YTZ (optional)
- Airlines:
  - Porter Airlines
  - Air Canada
- Configurable outbound and return dates
- Configurable alert thresholds
- Poll prices on a fixed schedule (e.g., **4× per day**)
- Send notifications via **email**
- Single-user (personal automation)

---

## Design principles
- API-based only (no scraping of airline sites or Google Flights)
- Optimize for:
  - low operational overhead
  - correctness
  - predictability
- Defer complexity unless clearly needed
- Structure code so new routes, airlines, or providers can be added later

---

## Architecture decisions
- **Runtime:** Node 20
- **Language:** TypeScript
- **Execution model:** scheduled background job (e.g., GitHub Actions cron)
- **Flight data provider:** start with Duffel API
- **Provider abstraction:** required (to allow Amadeus or others later)
- **No frontend for v1**

---

## Decision notes (important context for future changes)
- Node + TypeScript chosen to minimize friction with AI-generated code and third-party SDKs.
- Duffel chosen as the initial provider due to stronger Porter Airlines coverage compared to Amadeus.
- Provider abstraction is required so switching between Duffel and Amadeus does not require refactoring core logic.
- Polling is used instead of webhooks because airlines and aggregators do not emit price-change events.
- Storage is intentionally minimal to avoid database and quota overhead; historical perfection is not a goal.
- This is a personal automation tool, not a commercial product; simplicity > extensibility.

---

## Required abstractions
Define a provider interface so core logic is independent of the underlying flight API:

```ts
interface FlightSearchProvider {
  searchOffers(input: SearchInput): Promise<FlightOffer[]>;
}
```

All price comparison, signal logic, and notifications must depend only on this interface.

---

## Data to persist (minimal)
- `lastCheckedAt`
- `bestPriceSeen` (per route/date)
- `lastNotifiedAt`
- Summary of the current best offer:
  - airline
  - departure/return times
  - total price

Storage may be a local file or lightweight database; prioritize simplicity.

---

## Notification rules (initial)
- Notify if:
  - price ≤ target threshold, **or**
  - price drops by a meaningful delta (e.g., ≥ $20)
- Apply a cooldown (e.g., no more than one alert per 12 hours unless price drops again)

---

## Out of scope (for MVP)
- Booking flights
- Promo code ingestion or automation
- Web UI or dashboard
- Multiple users
- SMS or push notifications

---

## Acceptance criteria
- Project builds and runs locally
- Scheduled job executes successfully
- Provider abstraction exists and is clean
- Core logic does not depend on a specific flight API
- Email notification triggers correctly in a simulated price-drop scenario

---

## Labels
- automation
- backend
- api-integration

## Assignee
- Repo owner
