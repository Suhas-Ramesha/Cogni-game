from typing import Literal

from pydantic import BaseModel, Field

GameType = Literal[
    "memory_match",
    "attention",
    "daily_routine",
    "pattern_recognition",
    "emotional_engagement",
]


class GameResult(BaseModel):
    gameType: GameType
    difficultyLevel: int = Field(ge=1, le=5)
    score: float
    accuracy: float = Field(ge=0, le=1)
    reactionTimeMs: int
    completedAt: str
    metadata: dict | None = None


class RecommendRequest(BaseModel):
    patientId: str
    gameType: GameType
    cognitiveBaselineScore: float = 50
    recentSessions: list[GameResult] = Field(default_factory=list)


class Signals(BaseModel):
    meanAccuracy: float | None
    meanReactionTimeMs: float | None
    completionRate: float | None
    sampleSize: int


class RecommendResponse(BaseModel):
    recommendedDifficulty: int
    previousDifficulty: int | None
    reason: str
    signals: Signals
    model: Literal["rules-v1"] = "rules-v1"
