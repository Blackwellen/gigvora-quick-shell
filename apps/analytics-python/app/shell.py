"""Shell-domain analytics: insight cards, anomaly hints, prioritisation summaries."""
from datetime import datetime
from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/shell", tags=["shell-analytics"])


class ShellSnapshot(BaseModel):
    user_id: str
    org_id: str | None = None
    saved_view_count: int = 0
    recent_count: int = 0
    role_switches_24h: int = 0
    org_switches_24h: int = 0


class InsightCard(BaseModel):
    id: str
    severity: str  # info | warning | anomaly
    title: str
    body: str


class ShellInsightsResponse(BaseModel):
    generated_at: datetime
    cards: list[InsightCard]
    prioritised_routes: list[str]


@router.post("/insights", response_model=ShellInsightsResponse)
def shell_insights(snap: ShellSnapshot) -> ShellInsightsResponse:
    cards: list[InsightCard] = []

    # Anomaly: many role switches → impersonation or confusion signal
    if snap.role_switches_24h >= 5:
        cards.append(InsightCard(
            id="role-thrash",
            severity="anomaly",
            title="High role-switch frequency",
            body=f"{snap.role_switches_24h} role switches in 24h. Review session.",
        ))

    if snap.saved_view_count == 0:
        cards.append(InsightCard(
            id="no-saved-views",
            severity="info",
            title="Pin your most-used views",
            body="You have no saved views yet. Pinning improves task switching.",
        ))

    if snap.recent_count == 0:
        cards.append(InsightCard(
            id="no-recents",
            severity="info",
            title="Get started",
            body="Open a project, gig, or job — recents make it easy to come back.",
        ))

    if snap.org_switches_24h >= 8:
        cards.append(InsightCard(
            id="org-thrash",
            severity="warning",
            title="Frequent org switching",
            body="Consider opening multiple windows or refining default org.",
        ))

    # Deterministic fallback prioritisation when no model is available
    prioritised = ["/dashboard", "/work", "/inbox", "/projects"]

    return ShellInsightsResponse(
        generated_at=datetime.utcnow(),
        cards=cards,
        prioritised_routes=prioritised,
    )


@router.get("/health")
def health() -> dict[str, Any]:
    return {"ok": True, "service": "shell-analytics"}
