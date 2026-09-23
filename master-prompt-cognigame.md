# MASTER PROMPT — CogniGame NER
## AI-Based Cognitive Gaming & Memory Assistance Platform for Elderly Dementia Patients (North Eastern Region)

Paste this whole file as your first message to Claude Code CLI, run from an empty project directory.

---

## 0. HOW TO USE THIS PROMPT

- Run `claude` in an empty folder, paste this entire document as the first message.
- Let Claude Code create a `CLAUDE.md` from the "Project Memory" section below FIRST, before writing any app code — this is what keeps context consistent across the whole build.
- Use `/todowrite` (TodoWrite) to track the phases below as a checklist; work through them in order, phase by phase, not all at once.
- After each phase, ask Claude Code to run tests / typecheck / lint before moving to the next phase.
- Use subagents (`Task` tool) for the parallelizable pieces called out below (e.g. games module + reminders module + caregiver dashboard can be built in parallel once the schema is fixed).

---

## 1. PROJECT SUMMARY

Build **CogniGame NER**, a production-grade, offline-first, AI-assisted cognitive gaming and memory support platform for elderly dementia patients in India's North Eastern Region, plus a caregiver monitoring web dashboard. Target: 90% production-complete. The remaining 10% is a proprietary feature to be added later — leave clean extension points but do not attempt to guess or build it.

**Primary users:**
1. Elderly patients (low digital literacy, may have limited vision/hearing, tremors) — mobile/tablet app.
2. Caregivers / healthcare workers — web dashboard.

**Non-negotiable constraints:**
- Must work fully offline for all core patient-facing features (games, reminders, voice prompts).
- Must sync cleanly when connectivity returns, with conflict resolution.
- Must support at least 2 regional NER languages + English (default: **Assamese** and **Khasi** — replace these with your actual target languages before building if different).
- UI must be elderly-accessible: large touch targets, high contrast, minimal text density, voice-first where possible.

---

## 2. FIXED TECH STACK (do not deviate without asking)

**Mobile app (patient-facing):**
- React Native + Expo (managed workflow, EAS Build for production)
- NativeWind (Tailwind for RN) for styling
- WatermelonDB (SQLite-backed) for local-first data + sync
- expo-notifications for offline local reminders
- expo-speech for offline multilingual TTS
- Vosk (offline, on-device STT) — integrate via a native module wrapper; if a maintained Expo-compatible Vosk binding isn't viable, fall back to a clearly marked TODO with a stub interface, and tell me — do not silently skip voice input.
- react-navigation
- Zustand for local UI state (not sync state — that's WatermelonDB's job)

**Caregiver dashboard (web):**
- Next.js (App Router) + Tailwind CSS
- Same design system/tokens as the mobile app where feasible

**Backend:**
- NestJS + TypeScript
- PostgreSQL + Prisma ORM
- Socket.IO for live caregiver monitoring when both ends are online
- Firebase Auth (phone/OTP) for login on both patient and caregiver sides
- Firebase Storage (or S3-compatible) for game asset hosting — but **all game assets must also ship bundled inside the app binary** for true offline play; the cloud copy is only for updates/new content packs.

**Adaptive difficulty microservice:**
- Python + FastAPI, separate deployable service
- Consumes performance data (accuracy, reaction time, completion rate) from the NestJS API via an internal endpoint, returns a difficulty adjustment recommendation
- Start with a rules-based model (not deep learning) — clearly document the scoring logic so it can be swapped for a trained model later without changing the API contract

**Sync layer:**
- WatermelonDB client-side sync protocol (`synchronize()`) talking to a dedicated `/sync` pull/push endpoint pair on the NestJS API
- Server is the source of truth; last-write-wins at the field level for MVP, with a documented TODO for smarter per-entity conflict resolution later

---

## 3. DATA MODEL (build this first, as a Prisma schema + matching WatermelonDB schema)

Core entities — extend as needed but keep these as the backbone:

- `Patient` (id, name, preferredLanguage, dateOfBirth, cognitiveBaselineScore, caregiverId, createdAt)
- `Caregiver` (id, name, phone, role [family/health-worker], patients[])
- `GameSession` (id, patientId, gameType, difficultyLevel, score, accuracy, reactionTimeMs, completedAt, syncedAt)
- `Reminder` (id, patientId, type [medicine/hydration/activity/appointment], scheduledTime, recurrenceRule, status, localNotificationId)
- `CognitiveMetric` (id, patientId, metricType, value, recordedAt) — aggregated for the dashboard's trend charts
- `GameContentPack` (id, language, theme, assetBundleVersion, offlineAvailable)
- `SyncLog` (id, deviceId, lastPulledAt, lastPushedAt, conflictCount)

---

## 4. GAME MODULES (build as independently pluggable modules, each with its own difficulty curve hooks)

1. **Memory Match** — culturally familiar objects/faces (regional food, festivals, local landmarks — actual images to be swapped in later; use placeholder illustrations for now).
2. **Attention & Concentration** — timed pattern-spotting / odd-one-out.
3. **Daily Routine Recall** — sequencing everyday tasks (brushing, eating, medicine) in order, with voice narration.
4. **Pattern & Object Recognition** — shape/sound matching.
5. **Emotional Engagement** — simple mood check-in with voice + emoji, feeds into caregiver dashboard's wellbeing trend, not a "game" to win/lose.

Each module must:
- Expose a common `GameResult` interface (score, accuracy, reactionTime, difficultyLevel) consumed identically by the adaptive difficulty service and the dashboard.
- Work with zero network calls once assets are bundled.
- Support voice narration of instructions in the selected language.

---

## 5. CAREGIVER DASHBOARD REQUIREMENTS

- Patient list → individual patient detail view with cognitive trend charts (use Recharts).
- Activity/engagement heatmap (daily play frequency).
- Reminder compliance tracking (medicine taken / missed).
- Alert system: flag missed reminders, sudden performance drop, or prolonged inactivity.
- Live "last synced" indicator per patient device.

---

## 6. BUILD PHASES (track each as a TodoWrite item; do not skip ahead)

**Phase 0 — Foundation**
- Monorepo structure (`apps/mobile`, `apps/dashboard`, `apps/api`, `apps/difficulty-service`, `packages/shared-types`)
- CLAUDE.md written with conventions, folder structure, and this stack locked in
- Prisma schema + migrations from Section 3
- Auth flow (Firebase OTP) end-to-end on both apps

**Phase 1 — Core sync + offline plumbing**
- WatermelonDB schema mirroring Prisma schema
- `/sync` pull/push endpoints, tested with airplane-mode round trips
- Local notification scheduling via expo-notifications, verified fully offline

**Phase 2 — Games (parallelizable across subagents)**
- Build all 5 modules against the shared `GameResult` interface
- Bundle placeholder regional-theme assets

**Phase 3 — Adaptive difficulty service**
- FastAPI rules engine, internal API contract with NestJS, integration test with real GameSession data

**Phase 4 — Multilingual + voice**
- TTS in English + the 2 target NER languages
- Vosk offline STT integration (or documented fallback stub — flag to me explicitly if this needs to be descoped)

**Phase 5 — Caregiver dashboard**
- Full dashboard per Section 5, wired to real API data

**Phase 6 — Hardening for "90% production"**
- Error boundaries, offline/online state indicators throughout the UI
- Accessibility pass (font scaling, contrast, tap target sizes) for elderly users
- Seed data + demo script for a live SIH walkthrough
- README with setup, env vars, and a clearly marked `EXTENSION_POINTS.md` documenting where the final 10% unique feature will plug in

---

## 7. EXPLICIT INSTRUCTIONS TO CLAUDE CODE

- Write `CLAUDE.md` before any app code, and keep it updated as decisions get made.
- Use TodoWrite to track the 6 phases above and their sub-tasks; mark items complete only after they run/build/pass tests.
- Where a design decision in this prompt is ambiguous, make a reasonable choice, document it in `CLAUDE.md`, and keep moving — don't stall on it.
- Do not invent the "final 10%" feature. Leave clean seams (documented interfaces, no hardcoded assumptions that would block extension) but build nothing speculative there.
- Flag anything you cannot fully implement offline (especially Vosk STT) rather than silently stubbing it out without telling me.
