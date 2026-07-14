# Sakse

```bash
git clone https://github.com/cearet/sakse.git
cd sakse
```

Open the app at **http://localhost:5173** once it's running.

## Run with Docker

Needs [Docker Desktop](https://www.docker.com/products/docker-desktop/) running.

```bash
docker compose up --build      # start everything
docker compose up -d           # start in the background
docker compose logs -f         # watch logs
docker compose down            # stop (keeps data)
docker compose down -v         # stop and wipe the database
```

Re-run with `--build` after changing code.

## Dev (hot reload)

Runs Postgres + Redis in Docker and the app on your machine with live reload.
Needs [Node.js 20+](https://nodejs.org) and Docker Desktop.

```bash
./run.sh
```

Starts the backend, worker, and frontend together. Ctrl+C to stop.

<details>
<summary>By hand</summary>

```bash
docker compose up -d db redis

cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
node prisma/seed.js
npm run dev        # API on :4000
npm run worker     # timers/notifications (2nd terminal)

cd ../frontend
cp .env.example .env
npm install
npm run dev        # app on :5173
```
</details>

## QR test codes

Reserve a machine, tap **Scan QR to start**, and paste the matching code:

- CleanWash Siam → `SAKSE-MACHINE:clean-1` … `clean-4`
- BubbleLaundry Asok → `SAKSE-MACHINE:bubble-1` … `bubble-3`
- SpinCity Ari → `SAKSE-MACHINE:spin-1` … `spin-5`
