from app.engine import recommend
from app.schemas import GameResult, RecommendRequest


def _session(**kwargs) -> GameResult:
    base = dict(
        gameType="memory_match",
        difficultyLevel=2,
        score=90,
        accuracy=0.95,
        reactionTimeMs=2000,
        completedAt="2026-09-01T00:00:00Z",
    )
    base.update(kwargs)
    return GameResult(**base)


def test_raises_after_strong_streak():
    req = RecommendRequest(
        patientId="p1",
        gameType="memory_match",
        cognitiveBaselineScore=60,
        recentSessions=[_session() for _ in range(5)],
    )
    out = recommend(req)
    assert out.recommendedDifficulty == 3
    assert out.model == "rules-v1"


def test_lowers_after_poor_accuracy():
    req = RecommendRequest(
        patientId="p1",
        gameType="attention",
        recentSessions=[
            _session(gameType="attention", difficultyLevel=3, accuracy=0.2, score=20)
            for _ in range(3)
        ],
    )
    out = recommend(req)
    assert out.recommendedDifficulty == 2


def test_mood_never_changes_level():
    req = RecommendRequest(
        patientId="p1",
        gameType="emotional_engagement",
        recentSessions=[
            _session(
                gameType="emotional_engagement",
                difficultyLevel=1,
                accuracy=1,
                score=35,
            )
        ],
    )
    out = recommend(req)
    assert out.recommendedDifficulty == 1


def test_empty_history_uses_baseline():
    low = recommend(
        RecommendRequest(patientId="p1", gameType="daily_routine", cognitiveBaselineScore=40)
    )
    high = recommend(
        RecommendRequest(patientId="p1", gameType="daily_routine", cognitiveBaselineScore=70)
    )
    assert low.recommendedDifficulty == 1
    assert high.recommendedDifficulty == 2
