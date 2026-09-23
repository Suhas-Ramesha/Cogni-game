# SIH live walkthrough (≈ 6 minutes)

Seed first: `pnpm db:seed`.

## 0. Story

Anjali Das (health worker, Guwahati) monitors two patients:

- **Rita Sharma** (78, Assamese) — engaged, reminders on track
- **Bah Nongkynrih** (81, Khasi) — missed medicine, score drop, device last synced 2 days ago

## 1. Caregiver dashboard (2 min)

1. Open `http://localhost:3000`
2. Sign in with phone **`+916000000001`** (Anjali Das)
3. Two patient cards. Bah shows open alerts.
4. Open Rita — 14-day score chart, play heatmap, reminder table (mostly completed)
5. Open Bah — critical performance-drop banner, missed Donepezil, stale last-synced
6. Open **Alerts** and acknowledge one row

## 2. Patient app (2 min)

1. `pnpm --filter @cognigame/mobile start` on a tablet / Expo
2. Pairing code **482193** (Rita)
3. Toggle language EN / অসমীয়া / Khasi — listen to TTS
4. Play **Memory Match** (regional labels: pitha, Bihu, Kaziranga…)
5. Play **How I feel** — not a score game
6. Open reminders, tap **Done** on medicine (works airplane-mode)

## 3. Sync + difficulty (1 min)

1. Toggle airplane mode off
2. API `SyncLog` + `Device.lastSyncedAt` update; dashboard “last synced” refreshes
3. `POST /difficulty/:patientId/memory_match` returns `rules-v1` recommendation (see `SCORING.md`)

## 4. What you say about the last 10%

“Extension points are documented. We did not guess the unique feature. Games, difficulty, and sync are interfaces, not hard-wired.”
