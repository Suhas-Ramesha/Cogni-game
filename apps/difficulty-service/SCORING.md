# Rules-v1 scoring (not machine learning)

The HTTP contract is frozen: `POST /v1/recommend` with `RecommendRequest` → `RecommendResponse`.
Swap this file's `recommend()` for a trained model later. Do **not** change field names.

## Inputs

- Last 5 sessions of the **same** `gameType` (older sessions ignored)
- `cognitiveBaselineScore` used only when history is empty

## Targets (mean reaction time, ms)

| Level | Target RT |
| 1 | 8000 |
| 2 | 6000 |
| 3 | 4500 |
| 4 | 3200 |
| 5 | 2200 |

## Rules

1. `emotional_engagement` always returns difficulty `1`.
2. No history → difficulty `2` if baseline ≥ 50, else `1`.
3. If mean accuracy ≥ 0.85 **and** mean RT ≤ target **and** sample ≥ 3 → **+1** (clamp 1–5).
4. If mean accuracy ≤ 0.45 **and** sample ≥ 2 → **−1**.
5. Otherwise hold.

Offline devices use the TypeScript twin in `packages/game-engine/src/difficulty-hooks.ts`.
When online, this service is authoritative.
