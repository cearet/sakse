#!/bin/sh
# Runs once when the backend container starts: apply DB migrations, then seed
# demo data only if the database is empty (so data survives restarts).
set -e

echo "▶ Applying database migrations…"
npx prisma migrate deploy

echo "▶ Seeding demo data if the database is empty…"
if node -e 'const{PrismaClient}=require("@prisma/client");const p=new PrismaClient();p.laundromat.count().then(c=>{p.$disconnect();process.exit(c>0?0:1)}).catch(()=>process.exit(1))'; then
  echo "  data already present — skipping seed."
else
  node prisma/seed.js
fi

# Hand off to the container's command (node src/index.js).
exec "$@"
