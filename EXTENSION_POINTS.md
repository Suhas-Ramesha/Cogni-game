# Extension points — do not fill the last 10%

The product must stay at **90%**. A later proprietary capability will plug in here. Build nothing speculative on these seams.

## 1. `GameModule` registry

`packages/game-engine/src/index.ts` → `GAME_MODULES`.

A new game is a file that implements `GameModule` and is added to the registry. Difficulty service and dashboard already consume only `GameResult`. **Do not** special-case game types in NestJS or FastAPI.

## 2. Difficulty model swap

`apps/difficulty-service/app/engine.py` · contract in `SCORING.md`.

Replace `recommend()` with a trained model. Keep `RecommendRequest` / `RecommendResponse` JSON identical (`model` field may become `ml-v1`). NestJS proxy (`apps/api/src/difficulty`) must not change.

## 3. Conflict resolution

`apps/api/src/sync/sync.service.ts` → `mergeFields()`.

Today: field-level last-write-wins via `fieldClocks`. TODO: reminder status should be a state machine (`scheduled → due → completed|missed`) instead of LWW. Mood check-ins should be append-only (never overwritten).

## 4. Content packs / asset updates

`GameContentPack` + Firebase Storage / S3.

Games ship **bundled placeholders** (`packages/game-engine/src/assets.ts`). Cloud packs are for *updates only*. Hook: if `offlineAvailable && assetBundleVersion > local`, download when online; never block play.

## 5. Voice input

`apps/mobile/src/voice/stt.ts` · `SpeechToTextEngine`.

Vosk native module lands here. Do not change game screens to assume a cloud STT vendor.

## 6. Auth providers

`apps/api/src/auth/auth.service.ts` verifies Firebase ID tokens **or** demo JWT.

A later IdP should implement the same `AuthPrincipal` (`role`, `caregiverId`, `patientId`).

## 7. Realtime

Socket.IO namespace `/live`, rooms `caregiver:{id}`. Events: `alert`, `sync`. Extra telemetry can be emitted without schema changes.

## 8. Forbidden

- Do not add a cloud-only game
- Do not train / ship a neural difficulty model in this repo
- Do not invent a sixth “secret” patient-facing feature
- Do not hardcode assumptions that a future module cannot register itself
