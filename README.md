# Sakse — Washing Machine Reservation App

A web app to find partner laundromats on a map, reserve an empty washing machine,
pay from an in-app wallet (topped up via PromptPay), and get notified when the wash
is nearly done. If all machines are busy, users join a **waitlist**.

## Stack

- **Frontend:** React + Vite + Tailwind + react-leaflet (map) — mobile-first
- **Backend:** Node.js + Express
- **Database:** PostgreSQL + PostGIS, via Prisma ORM
- **Auth:** JWT
- **Background jobs:** BullMQ + Redis (5-min "almost done" notify + late-fine check)
- **Payments:** PromptPay at wallet top-up (test mode)

## Prerequisites

- Node.js 20+ and npm
- Docker Desktop (for Postgres + Redis) — **start it before running the commands below**

## First-time setup

```bash
# 1. Start the database + Redis (run from the project root)
docker compose up -d

# 2. Backend API
cd backend
cp .env.example .env          # defaults already match docker-compose
npm install
npm run prisma:migrate        # creates the database tables
npm run db:seed               # adds demo laundromats + machines
npm run dev                   # backend on http://localhost:4000

# 3. Background worker (in its own terminal, from backend/)
npm run worker                # runs the wash timers, notifications, late fines

# 4. Frontend (in a second/third terminal)
cd frontend
npm install
npm run dev                   # frontend on http://localhost:5173
```

### Demo mode (watch the timers quickly)

The `.env` ships with `TIME_UNIT_MS=1000`, so a "20-minute" wash finishes in
20 seconds — you can watch the whole notify → done → late-fine flow in under a
minute. Set `TIME_UNIT_MS=60000` for real minutes.

Check it works: open http://localhost:4000/api/health — you should see
`{"ok":true,"db":"connected"}`.

## Everyday commands

```bash
docker compose up -d      # start db + redis
docker compose down       # stop them (data is kept)
npm run dev               # (in backend/ or frontend/) start dev server
npm run prisma:studio     # (in backend/) visual database browser
```

## Project structure

```
sakse/
├── docker-compose.yml     # Postgres + PostGIS + Redis
├── backend/               # Express API
│   ├── prisma/schema.prisma   # the data model
│   └── src/index.js           # server entry
└── frontend/              # React + Vite app
```
