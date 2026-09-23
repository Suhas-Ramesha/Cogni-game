# CogniGame NER

Offline-first cognitive gaming and memory support for elderly dementia patients in India's North Eastern Region, plus a caregiver dashboard.

This repository is a **90% production** scaffold. The remaining 10% is a proprietary feature — see [`EXTENSION_POINTS.md`](./EXTENSION_POINTS.md). Do not invent it.

## Apps

| Path | Role |
|---|---|
| `apps/mobile` | Patient tablet/phone — Expo, WatermelonDB, NativeWind, TTS |
| `apps/dashboard` | Caregiver web — Next.js App Router, Recharts |
| `apps/api` | NestJS + Prisma + PostgreSQL + Socket.IO |
| `apps/difficulty-service` | FastAPI rules-based adaptive difficulty |
| `packages/game-engine` | Five pluggable games + `GameResult` |
| `packages/shared-types` | Enums, sync protocol, i18n (en / as / kha) |
| `packages/design-tokens` | Forest / turmeric / cream tokens, 64pt tap targets |

Read [`CLAUDE.md`](./CLAUDE.md) before changing architecture.

## Quick start (local demo)

Requires Node 22, pnpm 10, Python 3.12, PostgreSQL 16.

```bash
cp .env.example apps/api/.env   # already matches local postgres defaults
# create role/db once:
#   sudo -u postgres psql -c "CREATE USER cognigame WITH PASSWORD 'cognigame' CREATEDB;"
#   sudo -u postgres psql -c "CREATE DATABASE cognigame OWNER cognigame;"

pnpm install
pnpm --filter @cognigame/api prisma:generate
pnpm --filter @cognigame/api prisma:migrate:deploy   # or prisma db push
pnpm db:seed

# terminals
pnpm --filter @cognigame/difficulty-service install   # pip install -r requirements.txt
pnpm dev:difficulty
pnpm dev:api
pnpm dev:dashboard
pnpm --filter @cognigame/mobile start                 # Expo; use pairing code 482193
```

Dashboard: [http://localhost:3000](http://localhost:3000) → **Demo sign-in**.
API health: [http://localhost:3001/health](http://localhost:3001/health).

Seed caregiver **Anjali Das** (`+916000000001`) with patients:

- Rita Sharma — Assamese — pairing `482193`
- Bah Nongkynrih — Khasi — pairing `719204` (alerts + performance drop for the SIH story)

Full click-path: [`docs/DEMO_SCRIPT.md`](./docs/DEMO_SCRIPT.md).

Docker (optional): `docker compose up --build` (API + dashboard + difficulty + Postgres).

## Environment

See `.env.example`. Important flags:

- `DEMO_AUTH=true` — SIH/local JWT. **Must be false in production.**
- Firebase phone OTP: set `FIREBASE_*` on the API and `NEXT_PUBLIC_FIREBASE_*` / `EXPO_PUBLIC_FIREBASE_*` on clients.
- `INTERNAL_SERVICE_KEY` — NestJS ↔ FastAPI.

## Tests

```bash
pnpm --filter @cognigame/game-engine test
pnpm --filter @cognigame/api test
pnpm --filter @cognigame/mobile test
cd apps/difficulty-service && python3 -m pytest
# dashboard Playwright (dev server):
pnpm --filter @cognigame/dashboard test
```

## Explicit gaps (not silent)

1. **Vosk on-device STT** is a stub (`apps/mobile/src/voice/README.md`). TTS works. Input uses large buttons.
2. **Khasi TTS voice** is not available on most OS engines — Khasi text + English/Assamese voice.
3. **WatermelonDB SQLiteAdapter** needs an EAS dev client. Expo Go uses LokiJSAdapter (same schema + sync protocol).
4. **Firebase OTP** is implemented behind env vars; demo JWT is the SIH path.
5. Field-level LWW is implemented; smarter per-entity conflict resolution is a documented TODO.

## Production builds

- Mobile: `eas build` (configure `apps/mobile/eas.json` project id)
- Dashboard: Vercel, root `apps/dashboard`, env `NEXT_PUBLIC_API_URL`
- API + difficulty + Postgres: any container host; `docker-compose.yml` is the reference
