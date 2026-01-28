# Booking API (Tours • Pricing • Availability • Bookings)

A production-style **Booking API** built with **TypeScript + Express + Prisma + PostgreSQL** and designed for a travel/tour booking workflow:

- **JWT Authentication** + **Role-based access (ADMIN / USER)**
- **Tour CRUD** (admin-protected)
- **Tour Pricing rules** (joiner/private, group-size ranges, group vs per-person pricing)
- **Booking logic**
  - **Private** bookings are **exclusive** (block the date/range)
  - **Joiner** bookings share **capacity per day**
- **Availability endpoint** for Calendar UI (ex: shadcn DatePicker)
- Uses **date-fns** for reliable date range computations

---

## Tech Stack

- **Node.js / Express**
- **TypeScript**
- **Prisma ORM**
- **PostgreSQL** (external hosted DB supported, e.g. Prisma Postgres/Accelerate)
- **Zod** (request validation)
- **JWT** (authentication)
- **date-fns** (date math)

---

## Core Concepts

### Pricing Types

- `joiner` → shared tour capacity (multiple bookings/day until capacity is full)
- `private` → exclusive booking (blocks the date/range)

### Price Calculation

Pricing matches:

- `pricingType`
- `participants` within `[minGroupSize, maxGroupSize]`

Total:

- `isGroupPrice = true` → `total = price`
- `isGroupPrice = false` → `total = price * participants`

### Availability (for UI)

Availability is **derived** from `Booking` + `Tour.joinerCapacity`, so **no Availability table/model** is needed.

---

## Environment Variables

Create an `.env` (local) or `.env.production` (VPS):

```env
PORT=4000
NODE_ENV=development

# PostgreSQL connection string (can be external hosted DB)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB"

# If using Prisma Postgres / Prisma Accelerate, your DATABASE_URL may look like:
# DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=..."

JWT_SECRET="change-this-to-a-long-random-string"

# Recommended for consistent booking date logic
TZ=UTC


## Demo Accounts

Admin:

- Email: admin@example.com
- Password: password123

User:

- Email: user@example.com
- Password: password123

## Authentication

- JWT-based authentication
- Role-based access control (USER / ADMIN)
- Protected routes using middleware
```
