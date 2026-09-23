# CogniGame NER

Offline-first cognitive games and memory support for elderly dementia patients in India’s North Eastern Region, plus a caregiver dashboard for families and health workers.

This repository is a **90% production** scaffold. The remaining 10% is a proprietary feature — see [`EXTENSION_POINTS.md`](./EXTENSION_POINTS.md). Do not invent it.

Visual source of truth: [`DESIGN.md`](./DESIGN.md) (forest / turmeric / cream, Atkinson Hyperlegible + Fraunces, 64pt patient tap targets).

## Apps

| Path | Role | Local URL |
|---|---|---|
| `apps/mobile` | Patient tablet/phone — Expo, WatermelonDB, NativeWind, TTS | Expo Go / emulator |
| `apps/dashboard` | Caregiver web — Next.js App Router, Recharts | http://localhost:3000 |
| `apps/api` | NestJS + Prisma + PostgreSQL + Socket.IO | http://localhost:3001 |
| `apps/difficulty-service` | FastAPI rules-based adaptive difficulty | http://127.0.0.1:8001 |
| `packages/game-engine` | Five pluggable games + `GameResult` | — |
| `packages/shared-types` | Enums, sync protocol, i18n (en / as / kha) | — |
| `packages/design-tokens` | Forest / turmeric / cream tokens | — |

Read [`CLAUDE.md`](./CLAUDE.md) before changing architecture.

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 22 or newer |
| pnpm | 10 (`corepack enable && corepack prepare pnpm@10.6.5 --activate`) |
| Python | 3.12 (for the difficulty service) |
| PostgreSQL | 16 (or Docker) |

Optional: Expo Go on a phone or tablet, Docker Engine.

## Run everything locally

### 1. Clone and install

```bash
git clone https://github.com/Suhas-Ramesha/Cogni-game.git
cd Cogni-game
corepack enable
pnpm install
```

`pnpm install` also creates `apps/difficulty-service/.venv` and installs Python deps.

### 2. Environment files

```bash
cp .env.example apps/api/.env
cp .env.example apps/dashboard/.env.local
cp .env.example apps/mobile/.env
```

The example file matches local Postgres (`cognigame` / `cognigame`). Sign in on the dashboard with a **seeded caregiver phone**. Add Firebase keys to turn that into SMS OTP.

### 3. Database

**Option A — Docker Postgres only**

```bash
docker compose up -d postgres
```

**Option B — local Postgres**

```bash
sudo -u postgres psql -c "CREATE USER cognigame WITH PASSWORD 'cognigame' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE cognigame OWNER cognigame;"
```

Then migrate and seed:

```bash
pnpm db:generate
pnpm --filter @cognigame/api prisma:migrate:deploy
pnpm db:seed
```

If migrate complains on a fresh DB, `pnpm --filter @cognigame/api prisma:push` then `pnpm db:seed` is equivalent for local demo.

### 4. Start the three servers

Use three terminals from the repo root:

```bash
pnpm dev:difficulty    # FastAPI  → http://127.0.0.1:8001/health
pnpm dev:api           # NestJS   → http://localhost:3001/health
pnpm dev:dashboard     # Next.js  → http://localhost:3000
```

Open the dashboard at [http://localhost:3000](http://localhost:3000). Sign in with phone **`+916000000001`** (Anjali Das).

If the dashboard is opened as `http://127.0.0.1:3000`, that origin is already on the API CORS list.

### 5. Patient app (Expo)

```bash
pnpm --filter @cognigame/mobile start
```

Scan the QR code with Expo Go (same LAN). Pairing codes:

| Patient | Language | Pairing code |
|---|---|---|
| Rita Sharma | Assamese | `482193` |
| Bah Nongkynrih | Khasi | `719204` |

On a physical device, set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` to your machine’s LAN IP, not `localhost` (for example `http://192.168.1.10:3001`).

Expo web (patient UI in a browser): `pnpm --filter @cognigame/mobile web` → http://localhost:8081. Use pairing code `482193`.

Full click-path for a live demo: [`docs/DEMO_SCRIPT.md`](./docs/DEMO_SCRIPT.md).

## Seeded caregiver

Caregiver **Anjali Das** · phone `+916000000001`

- Rita — engaged, reminders mostly completed
- Bah — missed medicine, performance-drop alert, stale last-sync (the SIH story)

## Docker (all services)

```bash
docker compose up --build
```

Brings up Postgres, API, difficulty service, and dashboard. Seed still needs a one-shot:

```bash
docker compose exec api pnpm prisma:seed
```

(If the API image does not expose that script, run seed from the host against `DATABASE_URL` pointing at `localhost:5432`.)

## Tests

```bash
pnpm --filter @cognigame/game-engine test
pnpm --filter @cognigame/api test
pnpm --filter @cognigame/mobile test
cd apps/difficulty-service && .venv/bin/pytest
```

Dashboard Playwright (API + dashboard already running on 3000/3001):

```bash
cd apps/dashboard
npx playwright install chromium   # first time only
PW_NO_SERVER=1 pnpm test          # or omit PW_NO_SERVER to let Playwright start Next.js
```

## Environment flags

See [`.env.example`](./.env.example).

| Flag | Meaning |
|---|---|
| `JWT_SECRET` | Signs session tokens for API routes |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth URL (`<project>.firebaseapp.com`) |
| `FIREBASE_*` / `NEXT_PUBLIC_FIREBASE_*` / `EXPO_PUBLIC_FIREBASE_*` | SMS OTP when all three web keys + Admin SDK are set |
| `INTERNAL_SERVICE_KEY` | NestJS ↔ FastAPI |
| `NEXT_PUBLIC_API_URL` | Dashboard → API |
| `EXPO_PUBLIC_API_URL` | Mobile → API |

## Troubleshooting

| Symptom | Fix |
|---|---|
| Dashboard sign-in fails | API not running, DB not seeded, or CORS origin mismatch (`localhost` vs `127.0.0.1`) |
| `UndefinedDependencyException` in Nest | Already patched: constructors use `@Inject`. Pull latest. |
| Python “externally managed” | Use the venv created by `pnpm --filter @cognigame/difficulty-service install` |
| Expo cannot reach API | Replace `localhost` with your computer’s LAN IP in `EXPO_PUBLIC_API_URL` |
| Prisma client missing | `pnpm db:generate` |
| Port 3000/3001/8001 in use | Stop the old process or change `DASHBOARD_PORT` / `API_PORT` / `DIFFICULTY_PORT` |

## Explicit gaps (not silent)

1. **Vosk on-device STT** is a stub (`apps/mobile/src/voice/README.md`). TTS works. Input uses large buttons.
2. **Khasi TTS voice** is not available on most OS engines — Khasi text + English/Assamese voice.
3. **WatermelonDB SQLiteAdapter** needs an EAS dev client. Expo Go uses LokiJSAdapter (same schema + sync protocol).
4. **Firebase OTP** is wired behind env vars (`NEXT_PUBLIC_FIREBASE_*` + Admin SDK). Without keys, caregivers use registered-phone `POST /auth/phone`. There is no demo login.
5. Field-level LWW is implemented; smarter per-entity conflict resolution is a documented TODO.

## Production builds

- Mobile: `eas build` (set `apps/mobile/eas.json` / `app.json` project id)
- Dashboard: Vercel, root `apps/dashboard`, env `NEXT_PUBLIC_API_URL` and Firebase web keys
- API + difficulty + Postgres: any container host; `docker-compose.yml` is the reference
