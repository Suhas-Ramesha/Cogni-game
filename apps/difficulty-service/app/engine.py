"""Rules-v1 adaptive difficulty.

This module is the only place the scoring logic lives. A future trained model
must implement the same `recommend()` signature and JSON contract.
"""

from __future__ import annotations

from .schemas import GameResult, RecommendRequest, RecommendResponse, Signals

TARGET_RT_MS = {1: 8000, 2: 6000, 3: 4500, 4: 3200, 5: 2200}
WINDOW = 5


def _clamp(level: int) -> int:
    return max(1, min(5, level))


def recommend(req: RecommendRequest) -> RecommendResponse:
    sessions = [s for s in req.recentSessions if s.gameType == req.gameType][-WINDOW:]
    previous = sessions[-1].difficultyLevel if sessions else None

    if req.gameType == "emotional_engagement":
        return RecommendResponse(
            recommendedDifficulty=1,
            previousDifficulty=previous,
            reason="Emotional check-ins are not competitive; difficulty stays at 1.",
            signals=Signals(
                meanAccuracy=1.0 if sessions else None,
                meanReactionTimeMs=_mean([s.reactionTimeMs for s in sessions]),
                completionRate=1.0 if sessions else None,
                sampleSize=len(sessions),
            ),
        )

    if not sessions:
        baseline = 2 if req.cognitiveBaselineScore >= 50 else 1
        return RecommendResponse(
            recommendedDifficulty=baseline,
            previousDifficulty=None,
            reason="No history; starting from cognitive baseline.",
            signals=Signals(
                meanAccuracy=None,
                meanReactionTimeMs=None,
                completionRate=None,
                sampleSize=0,
            ),
        )

    mean_acc = sum(s.accuracy for s in sessions) / len(sessions)
    mean_rt = sum(s.reactionTimeMs for s in sessions) / len(sessions)
    current = previous or 2
    target = TARGET_RT_MS[current]
    next_level = current
    reason = "Holding difficulty; performance is within the expected band."

    if mean_acc >= 0.85 and mean_rt <= target and len(sessions) >= 3:
        next_level = _clamp(current + 1)
        reason = (
            f"Accuracy {mean_acc:.0%} and reaction {mean_rt:.0f}ms beat the "
            f"level {current} target ({target}ms) across {len(sessions)} sessions."
        )
    elif mean_acc <= 0.45 and len(sessions) >= 2:
        next_level = _clamp(current - 1)
        reason = (
            f"Accuracy {mean_acc:.0%} over {len(sessions)} sessions — stepping down "
            "to reduce frustration."
        )

    return RecommendResponse(
        recommendedDifficulty=next_level,
        previousDifficulty=current,
        reason=reason,
        signals=Signals(
            meanAccuracy=round(mean_acc, 3),
            meanReactionTimeMs=round(mean_rt, 1),
            completionRate=1.0,
            sampleSize=len(sessions),
        ),
    )


def _mean(values: list[float]) -> float | None:
    if not values:
        return None
    return round(sum(values) / len(values), 1)
