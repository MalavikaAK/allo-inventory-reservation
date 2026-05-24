# Allo Inventory Reservation

Next.js (App Router) take-home implementing race-safe inventory reservations across warehouses.

## Tech
- Next.js + TypeScript
- Prisma + Hosted Postgres (Supabase)
- Upstash Redis (idempotency cache)

## Setup
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
3. Sync schema and seed:
```bash
npm run db:push
npm run db:seed
```
4. Run app:
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

## Concurrency strategy
Reservation creation uses an atomic SQL update inside a serializable transaction:
- `UPDATE Inventory SET reservedUnits = reservedUnits + quantity`
- guarded by `WHERE (totalUnits - reservedUnits) >= quantity`

If zero rows are updated, request returns `409`.
This ensures two concurrent requests competing for the last unit cannot both succeed.

## Expiry strategy
Currently implemented as lazy cleanup:
- On read/critical mutations, expired `PENDING` reservations are transitioned to `RELEASED`.
- Reserved units are decremented back to availability.

Production recommendation:
- Add a scheduled job (Vercel Cron hitting a secured endpoint) every minute to execute cleanup proactively.

## Idempotency (bonus)
- `POST /api/reservations` and `POST /api/reservations/:id/confirm`
- Uses `Idempotency-Key` header + Upstash Redis cache.
- Same key returns original response without repeating side effects.

## Trade-offs
- UI is intentionally minimal.
- No auth/tenant model included.
- Cleanup is lazy-first for simplicity; cron worker should be added for production-grade timeliness.
