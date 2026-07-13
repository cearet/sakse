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

# Setup

Pick one of the three methods below. **Docker method** is the easiest and what we
recommend.

Once it's running, open the app at **http://localhost:5173**.

---

## 1. Docker method (recommended)

**You only need [Docker Desktop](https://www.docker.com/products/docker-desktop/)
installed and open.** No Node, Postgres, or Redis — Docker runs everything (db,
redis, backend, worker, frontend).

```bash
git clone git@github.com:cearet/sakse.git
cd sakse
docker compose up --build
```

That's it. The backend applies database migrations and loads demo data
automatically on first run. When the logs settle, open **http://localhost:5173**.

**Common commands:**

```bash
docker compose up --build     # start everything (use --build after code changes)
docker compose up -d          # start in the background
docker compose logs -f        # watch the logs
docker compose down           # stop everything (your data is kept)
docker compose down -v        # stop AND wipe the database
```

> ℹ️ These are built images, so re-run with `--build` whenever you change code.

---

## 2. Dev method (hot reload)

For coding with live reload instead of rebuilding Docker images each time. Runs the
database + Redis in Docker and the app on your machine.

**Needs:** [Node.js 20+](https://nodejs.org) and Docker Desktop.

```bash
./run.sh
```

`run.sh` starts Postgres + Redis, installs dependencies, sets up the database, and
launches the backend, worker, and frontend together. Open
**http://localhost:5173**; press **Ctrl+C** to stop.

<details>
<summary>Prefer to run the steps by hand?</summary>

```bash
docker compose up -d db redis   # just the database + redis

# Backend (2 terminals)
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy       # create the tables
node prisma/seed.js             # load demo data
npm run dev                     # terminal 1 — API on :4000
npm run worker                  # terminal 2 — timers, notifications, fines

# Frontend (3rd terminal)
cd ../frontend
cp .env.example .env
npm install
npm run dev                     # app on :5173
```
</details>

---

## 3. No-Docker method

If you can't use Docker at all, you just need Postgres (with PostGIS) and Redis
from somewhere, then run the **Dev method** steps above with `backend/.env`
pointing at them.

**Option A — free cloud (nothing to install):**

1. **Database** → [neon.tech](https://neon.tech) or [supabase.com](https://supabase.com)
   (both include PostGIS) → paste the connection string into `DATABASE_URL`.
2. **Redis** → [upstash.com](https://upstash.com) → paste the URL into `REDIS_URL`.

**Option B — install locally (macOS):**

```bash
brew install postgresql postgis redis
brew services start postgresql && brew services start redis
createdb sakse && psql sakse -c "CREATE EXTENSION postgis;"
# leave DATABASE_URL / REDIS_URL at their defaults
```

---

# Extras

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

## Browsing the database

```bash
npm --prefix backend run prisma:studio   # visual database browser at localhost:5555
```

Or connect any Postgres GUI to `localhost:5432` (user `sakse`, password `sakse`,
database `sakse`).

## Project structure

```
sakse/
├── docker-compose.yml          # the whole stack: db, redis, backend, worker, frontend
├── run.sh                      # dev-method one-command startup
├── backend/                    # Express API + worker
│   ├── Dockerfile
│   ├── prisma/schema.prisma    # the data model
│   ├── prisma/seed.js          # demo data
│   └── src/                    # routes, worker, lib
└── frontend/                   # React + Vite app
    ├── Dockerfile              # build → served by nginx
    └── src/pages/              # Home (map), Wallet, Reservation, etc.
```
