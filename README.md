<p align="center">
  <a aria-label="Live Demo" href="http://allo-inventory-reservation-tau.vercel.app/"><img src="https://img.shields.io/badge/LIVE%20DEMO-allo--inventory--reservation--tau.vercel.app-0ea5e9?style=for-the-badge&labelColor=0f172a" /></a>
  <a aria-label="Made with Next.js" href="https://nextjs.org/"><img src="https://img.shields.io/badge/MADE%20WITH-Next.js-000000.svg?style=for-the-badge&logo=next.js&labelColor=000" /></a>
  <a aria-label="Database" href="https://www.prisma.io/"><img src="https://img.shields.io/badge/ORM-Prisma-2D3748.svg?style=for-the-badge&logo=prisma&labelColor=000" /></a>
  <a aria-label="Cache" href="https://upstash.com/"><img src="https://img.shields.io/badge/CACHE-Upstash%20Redis-22c55e.svg?style=for-the-badge&labelColor=052e16" /></a>
</p>

# Allo Inventory Reservation

Next.js (App Router) take-home implementing race-safe inventory reservations across warehouses.

## Tech
- Next.js + TypeScript
- Prisma + Hosted Postgres (Supabase)
- Upstash Redis (idempotency cache)

## Setup (Local)
1. Install deps
```bash
npm install
```
2. Create `.env` with:
```bash
DATABASE_URL=...
DIRECT_URL=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```
3. Sync schema + seed data:
```bash
npm run db:generate
npm run db:push
npm run db:seed
```
4. Start:
```bash
npm run dev
```

## API
- `GET /api/products`
- `GET /api/warehouses`
- `POST /api/reservations`
- `GET /api/reservations/:id`
- `POST /api/reservations/:id/confirm`
- `POST /api/reservations/:id/release`

## Concurrency correctness
Reservation creation uses an atomic guarded SQL update inside a serializable transaction:
- increment `reservedUnits` only when `(totalUnits - reservedUnits) >= quantity`
- if update count is `0`, return `409`

This guarantees exactly one winner when concurrent requests compete for the last unit.

## Expiry mechanism (production)
Two layers:
1. Lazy cleanup on product/reservation reads and mutations (`releaseExpiredReservations()`)
2. Proactive cleanup via Vercel Cron daily to `GET /api/cron/release-expired` (Hobby plan compatible)

Cron config is in [vercel.json](D:/GetPlaced/Malavika/allo-inventory-reservation/vercel.json).

## Idempotency (bonus)
Implemented for:
- `POST /api/reservations`
- `POST /api/reservations/:id/confirm`

Uses `Idempotency-Key` header with Upstash Redis cache to return original response safely on retries.

## Deployment
- Deploy app to Vercel
- Configure env vars in Vercel project:
  - `DATABASE_URL`
  - `DIRECT_URL`
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
- Ensure cron is enabled (Vercel reads `vercel.json`)
- Seed once from local or CI by running:
```bash
npm run db:push
npm run db:seed
```

## Trade-offs
- UI is intentionally minimal and functional-first.
- No authentication/tenant isolation layer added.
- No webhook-driven payment simulation, only reservation lifecycle API.
