"""Analytics for Pass 4: Experience Launchpad + Creation Studio + Tasks + Team."""
from __future__ import annotations
from collections import Counter
from datetime import datetime, timezone
from typing import Any, Dict, List
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/launchpad-studio-tasks-team", tags=["launchpad-studio-tasks-team"])


class OverviewIn(BaseModel):
    enrollments: List[Dict[str, Any]] = Field(default_factory=list)
    bookings: List[Dict[str, Any]] = Field(default_factory=list)
    submissions: List[Dict[str, Any]] = Field(default_factory=list)
    drafts: List[Dict[str, Any]] = Field(default_factory=list)
    tasks: List[Dict[str, Any]] = Field(default_factory=list)
    members: List[Dict[str, Any]] = Field(default_factory=list)


@router.post("/overview")
def overview(body: OverviewIn):
    enr_status = Counter([(e.get("status") or "active") for e in body.enrollments])
    completed = enr_status.get("completed", 0)
    active = enr_status.get("active", 0)
    completion_rate = round(completed / max(1, active + completed), 3)

    draft_status = Counter([(d.get("status") or "draft") for d in body.drafts])
    publish_rate = round(draft_status.get("published", 0) / max(1, sum(draft_status.values())), 3)

    task_status = Counter([(t.get("status") or "todo") for t in body.tasks])
    overdue = sum(1 for t in body.tasks if t.get("due_at") and t.get("status") not in ("done", "cancelled"))

    role_dist = Counter([(m.get("role") or "member") for m in body.members])

    insights: List[Dict[str, str]] = []
    if completion_rate < 0.3 and (active + completed) >= 5:
        insights.append({"code": "low_pathway_completion",
                         "message": f"Pathway completion is {int(completion_rate * 100)}% — consider lighter modules or richer mentorship."})
    if publish_rate < 0.2 and sum(draft_status.values()) >= 5:
        insights.append({"code": "studio_draft_backlog",
                         "message": "More than 80% of studio drafts are unpublished — schedule a publish sprint."})
    if overdue >= 5:
        insights.append({"code": "overdue_tasks", "message": f"{overdue} tasks are overdue — review priority and reassignments."})

    return {
        "data": {
            "totals": {
                "enrollments": len(body.enrollments),
                "bookings": len(body.bookings),
                "submissions": len(body.submissions),
                "drafts": len(body.drafts),
                "tasks": len(body.tasks),
                "members": len(body.members),
            },
            "pathways": {"byStatus": dict(enr_status), "completionRate": completion_rate},
            "studio": {"byStatus": dict(draft_status), "publishRate": publish_rate},
            "tasks": {"byStatus": dict(task_status), "overdue": overdue},
            "team": {"byRole": dict(role_dist)},
            "insights": insights,
        },
        "meta": {"computed_at": datetime.now(timezone.utc).isoformat()},
    }
