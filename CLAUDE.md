# CogniGame NER — Project Memory

AI-based cognitive gaming and memory assistance platform for elderly dementia patients in India's North Eastern Region, plus a caregiver monitoring web dashboard.

**Target completeness:** 90% production-ready. The remaining 10% is a proprietary feature that must **not** be invented here. See `EXTENSION_POINTS.md` for the seams.

This file is the source of truth for stack, conventions, and locked decisions. Update it when a decision is made. Do not silently change the stack.

## Users

1. **Patients (elderly)** — mobile/tablet (Expo). Low digital literacy; possible limited vision/hearing/tremors. Voice-first, huge tap targets, high contrast, offline-first.
2. **Caregivers / health workers** — Next.js dashboard. Monitoring, alerts, reminder compliance, cognitive trends.

## Locked stack (do not deviate)

| Surface | Stack |
|---|---|
| Patient app | React Native + Expo (managed), NativeWind, WatermelonDB, expo-notifications, expo-speech, react-navigation, Zustand (UI state only) |
| Caregiver dashboard | Next.js App Router + Tailwind CSS + Recharts |
| API | NestJS + TypeScript, Prisma, PostgreSQL, Socket.IO, Firebase Auth (phone/OTP) |
| Assets | Bundled in the app binary for offline play; Firebase Storage / S3 is **update-only** |
| Difficulty | Python FastAPI microservice, **rules-based** (swap-ready API contract) |
| Sync | WatermelonDB `synchronize()` ↔ `POST /sync/pull` + `POST /sync/push`. Server is source of truth. |

## Monorepo

```
apps/mobile                 Expo patient app
apps/dashboard              Next.js caregiver dashboard
apps/api                    NestJS API + Prisma
apps/difficulty-service     FastAPI adaptive difficulty
packages/shared-types       Cross-app TypeScript contracts
packages/design-tokens      Color, type, spacing, tap-target tokens
packages/game-engine        Pure-TS pluggable games + GameResult
```

Package manager: **pnpm workspaces**. Node 22. Python 3.12 for the difficulty service.

## Languages (locked)

Default triad — do not replace without an explicit product decision:

| Code | Language | BCP-47 / TTS |
|---|---|---|
| `en` | English (default) | `en-IN` |
| `as` | Assamese | `as-IN` |
| `kha` | Khasi | no OS TTS voice on most devices → English voice + Khasi text overlay, documented |

Copy lives in `packages/shared-types` (`strings`) and is imported by mobile + dashboard.

## Data model backbone

Prisma (`apps/api/prisma/schema.prisma`) is canonical. WatermelonDB schema in `apps/mobile/src/db/schema.ts` **must mirror** syncable tables.

Core: `Caregiver`, `Patient`, `GameSession`, `Reminder`, `CognitiveMetric`, `GameContentPack`, `SyncLog`.

Additive (needed for product, not speculative 10%):

- `Device` — patient device registration + last-seen for the live “last synced” indicator
- `MoodCheckIn` — emotional-engagement module output
- `Alert` — missed reminder / performance drop / inactivity
- `DifficultyRecommendation` — audit log of the rules engine
- `fieldClocks Json` on every syncable row — **field-level last-write-wins**
- `deletedAt` — soft delete so WatermelonDB can pull deletions

## Auth decision

Firebase phone OTP is the production path (`firebase-admin` verifies ID tokens on the API).

Caregivers sign in with their registered phone (`POST /auth/phone`). When Firebase web + Admin keys are set, the dashboard uses SMS OTP and `POST /auth/firebase`. Patients never manage accounts: they redeem a 6-digit pairing code (`POST /auth/pair`).

Patient device binding: caregiver dashboard shows a 6-digit `pairingCode`; the patient app redeems it (elderly users should not manage accounts alone).

## Sync decision

- `POST /sync/pull` `{ lastPulledAt, patientId }` → `{ changes, timestamp }`
- `POST /sync/push` `{ changes, lastPulledAt, deviceId, patientId }` → `{ timestamp, conflicts }`
- Server wins when `fieldClocks[field]` is missing or older.
- **TODO (not MVP):** smarter per-entity conflict resolution (e.g. reminder status state-machine instead of LWW). Tracked in `EXTENSION_POINTS.md`.

## Offline / voice decisions

- Games, reminders, and TTS **must work with zero network**.
- Local notifications: `expo-notifications` scheduled on device; status syncs when online.
- TTS: `expo-speech` for English + Assamese. Khasi uses Assamese/English voice with on-screen Khasi script (no reliable offline Khasi voice).
- **Vosk STT: DESCOPED TO A STUB (flagged).** There is no maintained Expo-compatible Vosk binding that works in managed workflow without a custom native module + on-device model pack (~50–90 MB). See `apps/mobile/src/voice/README.md`. Interface: `SpeechToTextEngine`. Production hook is a config plugin + `VoskModule`. Until then, patients use **large on-screen choices** (yes/no, emoji, numbers) and optional `expo-av` recording that queues audio for later (not transcribed offline). This is **not** silent — it is an explicit gap.

## Games (pluggable)

Every module lives in `packages/game-engine` and implements:

```ts
export interface GameModule {
  type: GameType;
  buildRound(difficulty: number, language: LanguageCode): GameRound;
  score(input: PlayerInput, round: GameRound, timing: Timing): GameResult;
}
```

`GameResult` (`score`, `accuracy`, `reactionTimeMs`, `difficultyLevel`, `gameType`) is the **only** contract consumed by the difficulty service and the dashboard. Do not special-case a game in those layers.

1. Memory Match — regional food / festival / landmark placeholders
2. Attention — odd-one-out / pattern spotting
3. Daily Routine Recall — sequence everyday tasks with narration keys
4. Pattern & Object Recognition — shape/sound matching
5. Emotional Engagement — mood check-in (not win/lose; still emits `GameResult` for trends)

Difficulty curve hooks: `recommendedDifficulty(history: GameResult[]): number` per module; the FastAPI service is authoritative when online, on-device hook is the offline fallback.

## Adaptive difficulty (rules, not ML)

`apps/difficulty-service` — documented in `apps/difficulty-service/SCORING.md`.

- Window: last 5 sessions of the **same** `gameType`
- Accuracy ≥ 0.85 and mean reaction faster than target → +1
- Accuracy ≤ 0.45 → −1
- Clamp 1–5
- Emotional engagement never changes difficulty
- Contract: `POST /v1/recommend` (internal `x-internal-key`). NestJS proxies; swapping to a trained model later must not change this JSON.

## Caregiver dashboard

- Patient list → detail with Recharts cognitive trends
- Daily play heatmap
- Reminder compliance
- Alerts: missed reminder, sudden performance drop, prolonged inactivity
- Live last-synced per device (Socket.IO when both ends online; otherwise `Device.lastSyncedAt`)

## Accessibility (patient app, non-negotiable)

- Minimum tap target **64×64 pt**
- Body text ≥ 22 sp; headings ≥ 32 sp
- WCAG AAA contrast on primary actions (see `packages/design-tokens`)
- No color-only meaning; every state has text + icon + optional voice
- Respect OS font scale (cap at 1.5 so layouts don't collapse)
- Reduce motion: skip non-essential animation
- One primary action per screen; no hamburger menus

## Design tokens (NER-inspired, not generic purple-AI)

- `forest` `#0F3D2E` / `canopy` `#1F6F4A` — primary
- `turmeric` `#E0A100` — attention / CTAs
- `cream` `#F6EFE4` — patient background
- `ink` `#14110F` — text
- `alert` `#9B1D20` — missed / critical
- Dashboard may be denser but uses the same tokens

## Conventions

- TypeScript `strict`. No `any` unless interfacing a stub (Vosk).
- Prisma in `apps/api`; generate client as part of `pnpm --filter @cognigame/api prisma:generate`
- UI state: Zustand. **Never** put sync documents in Zustand.
- Dates: ISO-8601 UTC on the wire; display in Asia/Kolkata on the dashboard.
- IDs: UUID v4, generated client-side for offline creates so push is idempotent.
- Tests: Vitest (game-engine, shared-types), Jest/Supertest (API), pytest (difficulty), Playwright (dashboard).
- Commits: conventional, scoped (`feat(api):`, `feat(mobile):`, …)

## Demo / SIH

Seed (`apps/api/prisma/seed.ts`):

- Caregiver **Anjali Das** (health worker, +91 60000 00001)
- Patient **Rita Sharma** (Assamese, 78) pairing `482193`
- Patient **Bah Nongkynrih** (Khasi, 81) pairing `719204`
- 14 days of sessions, reminders, metrics, mood, alerts

Walkthrough: `docs/DEMO_SCRIPT.md`.

## What we will not build

- The proprietary final 10% feature
- Cloud-only games
- Deep-learning difficulty
- Replacing Firebase Auth with a different IdP
- Inventing extra NER languages beyond en/as/kha
