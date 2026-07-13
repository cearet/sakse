# Sakse — Washing Machine Reservation App

A mobile-first web app to find partner laundromats on a map, reserve a washing
machine, pay from an in-app wallet, scan a QR to start/collect your wash, and get
notified when it's nearly done. If every machine is busy, users join a **waitlist**.

## Features

- 🗺️ **Map** of nearby laundromats, sorted by distance from your location, with in-app turn-by-turn **navigation** (no Google Maps API)
- 💳 **Wallet** with PromptPay top-up (confirm-to-pay) — money tracked as a ledger in satang
- 🧺 **Reserve → confirm & pay → scan QR to start → timer → scan QR to collect**
- 🔴 **Cancel & refund** before you start, or **auto-cancel + refund** if you don't show up within 10 minutes
- ⏰ Background **timers**: "almost done" notice, auto-complete, and a late-pickup fine
- 🧍 **Waitlist** when all machines are busy — the next person is notified when one frees up

## Stack

- **Frontend:** React + Vite + Tailwind + react-leaflet (map) — mobile-first
- **Backend:** Node.js + Express + Prisma ORM
- **Database:** PostgreSQL + PostGIS
- **Cache/jobs:** Redis + BullMQ (wash timers, notifications, fines)
- **Auth:** JWT

---

## Run it — everything in Docker (recommended)

The **only** thing you need installed is **Docker Desktop** (started). No Node, no
Postgres, no Redis — Docker runs all five pieces (db, redis, backend, worker,
frontend).

```bash
git clone git@github.com:cearet/sakse.git
cd sakse
docker compose up --build
```

That builds the images and starts the whole stack. The backend automatically
applies database migrations and seeds demo data on first run. When it's up, open:

- **App:** http://localhost:5173
- **API health:** http://localhost:4000/api/health → `{"ok":true,"db":"connected"}`

Everyday commands:

```bash
docker compose up --build     # start everything (rebuild after code changes)
docker compose up -d          # start in the background
docker compose logs -f        # follow logs
docker compose down           # stop everything (data is kept in volumes)
docker compose down -v        # stop and wipe the database too
```

> Because these are built images, re-run with `--build` after changing code so the
> new code is baked in.

## Local development (hot reload, optional)

If you're actively editing code and want live reload instead of rebuilding images,
run the database + Redis in Docker and the Node apps on your host. Requires
**Node.js 20+**:

```bash
./run.sh
```

`run.sh` starts Postgres + Redis in Docker, installs dependencies, migrates, seeds
(only if empty), then launches backend + worker + frontend together with labeled
logs. Open **http://localhost:5173**; press **Ctrl+C** to stop.

---

## Running without Docker

You don't need Docker — you just need Postgres (with PostGIS) and Redis from
*somewhere*. Point `backend/.env` at them and skip `./run.sh`, running the
[manual steps](#manual-setup) below.

**Option A — free cloud, nothing to install:**

1. **Database:** create a free Postgres at [neon.tech](https://neon.tech) or
   [supabase.com](https://supabase.com) (both support PostGIS) → put its
   connection string in `DATABASE_URL`.
2. **Redis:** create a free Redis at [upstash.com](https://upstash.com) → put its
   URL in `REDIS_URL`.

**Option B — install locally (macOS):**

```bash
brew install postgresql postgis redis
brew services start postgresql && brew services start redis
createdb sakse && psql sakse -c "CREATE EXTENSION postgis;"
# leave DATABASE_URL / REDIS_URL at their localhost defaults
```

---

## Manual setup

If you'd rather run the steps yourself (with Docker or one of the options above):

```bash
# 1. (Docker users) start the database + Redis
docker compose up -d

# 2. Backend API + worker
cd backend
cp .env.example .env            # defaults match docker-compose
npm install
npx prisma migrate deploy       # create the tables
node prisma/seed.js             # add demo laundromats + machines
npm run dev                     # terminal 1 — API on :4000
npm run worker                  # terminal 2 — timers/notifications/fines

# 3. Frontend
cd ../frontend
cp .env.example .env
npm install
npm run dev                     # terminal 3 — app on :5173
```

Health check: open http://localhost:4000/api/health → `{"ok":true,"db":"connected"}`.

---

## Demo mode & timing

`backend/.env` ships with `TIME_UNIT_MS=1000`, so a "20-minute" wash finishes in
**20 seconds** — you can watch the whole notify → done → late-fine flow in under a
minute. Set `TIME_UNIT_MS=60000` for real minutes.

The no-show auto-cancel uses **real** minutes (`RESERVE_EXPIRE_MINUTES=10`), not
the sped-up clock. Lower it (e.g. `1`) to demo the auto-cancel quickly.

## Testing the QR flow

Machine QR codes are stable slugs, so they don't change between reseeds. Reserve a
machine, tap **Scan QR to start**, and either point the camera at that machine's
QR (open `▦ Machine QR` on the laundromat page / `/machine/<id>/qr`) or paste the
code into the fallback box:

- CleanWash Siam → `SAKSE-MACHINE:clean-1` … `clean-4`
- BubbleLaundry Asok → `SAKSE-MACHINE:bubble-1` … `bubble-3`
- SpinCity Ari → `SAKSE-MACHINE:spin-1` … `spin-5`

The code must match the machine you reserved.

## Everyday commands

```bash
./run.sh                    # start everything
docker compose up -d        # just the db + redis
docker compose down         # stop them (data is kept)
npm --prefix backend run prisma:studio   # visual database browser at :5555
```

## Project structure

```
sakse/
├── run.sh                      # one-command dev startup
├── docker-compose.yml          # Postgres + PostGIS + Redis
├── backend/                    # Express API
│   ├── prisma/schema.prisma    # the data model
│   ├── prisma/seed.js          # demo data
│   └── src/                     # routes, worker, lib
└── frontend/                   # React + Vite app
    └── src/pages/               # Home (map), Wallet, Reservation, etc.
```
