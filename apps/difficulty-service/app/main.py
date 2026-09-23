import os

from fastapi import FastAPI, Header, HTTPException

from .engine import recommend
from .schemas import RecommendRequest, RecommendResponse

app = FastAPI(title="CogniGame NER difficulty service", version="0.9.0")
INTERNAL_KEY = os.environ.get("INTERNAL_SERVICE_KEY", "dev-internal-key")


@app.get("/health")
def health() -> dict[str, str]:
    return {"ok": "true", "model": "rules-v1"}


@app.post("/v1/recommend", response_model=RecommendResponse)
def recommend_route(
    body: RecommendRequest,
    x_internal_key: str | None = Header(default=None),
) -> RecommendResponse:
    if x_internal_key != INTERNAL_KEY:
        raise HTTPException(status_code=401, detail="invalid internal key")
    return recommend(body)
