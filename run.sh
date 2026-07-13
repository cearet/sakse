#!/usr/bin/env bash
# Sakse — start the whole app with one command.
# Brings up Postgres + Redis (Docker), installs deps, runs migrations, seeds
# demo data if the DB is empty, then launches backend + worker + frontend.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

info() { printf "\033[1;36m▶ %s\033[0m\n" "$1"; }
die()  { printf "\033[1;31m❌ %s\033[0m\n" "$1"; exit 1; }

# --- 0. Prerequisites -------------------------------------------------------
command -v docker >/dev/null || die "Docker isn't installed. Install Docker Desktop first (docker.com)."
docker info >/dev/null 2>&1  || die "Docker isn't running. Open Docker Desktop, wait for it to start, then re-run."
command -v node >/dev/null   || die "Node.js isn't installed. Get it from nodejs.org (v18+)."

# --- 1. Postgres + Redis ----------------------------------------------------
# Only the db + redis services — the backend/worker/frontend run on the host
# below (for hot reload). Starting the full stack here would collide on ports.
info "Starting Postgres + Redis (Docker)…"
docker compose up -d db redis

info "Waiting for the database to accept connections…"
until docker exec sakse-db pg_isready -U sakse >/dev/null 2>&1; do sleep 1; done

# --- 2. Install dependencies (first run only) -------------------------------
[ -d node_modules ]          || { info "Installing runner (concurrently)…"; npm install; }
[ -d backend/node_modules ]  || { info "Installing backend dependencies…";  npm --prefix backend install; }
[ -d frontend/node_modules ] || { info "Installing frontend dependencies…"; npm --prefix frontend install; }

# --- 3. Environment files ---------------------------------------------------
[ -f backend/.env ]  || { info "Creating backend/.env from example…";  cp backend/.env.example backend/.env; }
[ -f frontend/.env ] || { info "Creating frontend/.env from example…"; cp frontend/.env.example frontend/.env; }

# --- 4. Database schema -----------------------------------------------------
info "Applying database migrations…"
( cd backend && npx prisma generate >/dev/null && npx prisma migrate deploy )

# --- 5. Seed demo data only if the DB is empty (keeps data across restarts) --
if ( cd backend && node -e 'const{PrismaClient}=require("@prisma/client");const p=new PrismaClient();p.laundromat.count().then(c=>{p.$disconnect();process.exit(c>0?0:1)}).catch(()=>process.exit(1))' ); then
  info "Demo data already present — skipping seed."
else
  info "Seeding demo laundromats & machines…"
  ( cd backend && node prisma/seed.js )
fi

# --- 6. Run everything ------------------------------------------------------
echo
info "Starting backend + worker + frontend…"
printf "   Open the app at \033[1;32mhttp://localhost:5173\033[0m   (press Ctrl+C to stop)\n\n"
npm run dev
