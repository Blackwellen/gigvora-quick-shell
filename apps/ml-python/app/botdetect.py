"""BotDetect v3.x — deterministic automated-actor detector.

Inputs are behavioural signals already collected by the event bus:
  - actions_per_minute, identical_payload_ratio, time_to_first_action_ms
  - ua_entropy (0..1), headless_browser_flag, mouse_event_count_per_session
  - ip_reputation (0..1), accounts_per_device_30d
"""
from __future__ import annotations
from time import perf_counter
from typing import Any, Dict, List
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/botdetect", tags=["botdetect"])
MODEL = "BotDetect"
VERSION = "3.0.0"


class BotFeatures(BaseModel):
    subject_id: str
    actions_per_minute: float = 0.0
    identical_payload_ratio: float = 0.0  # 0..1
    time_to_first_action_ms: int = 1000
    ua_entropy: float = 0.5  # low entropy → suspicious
    headless_browser_flag: bool = False
    mouse_event_count_per_session: int = 50
    ip_reputation: float = 0.0  # 0 (clean) .. 1 (bad)
    accounts_per_device_30d: int = 1


def _band(score: float) -> str:
    if score >= 0.85: return "critical"
    if score >= 0.65: return "high"
    if score >= 0.4: return "medium"
    return "low"


@router.post("/score")
def score(body: BotFeatures) -> Dict[str, Any]:
    t0 = perf_counter()
    components: List[Dict[str, Any]] = []
    s = 0.0

    apm = min(1.0, body.actions_per_minute / 60.0); s += 0.20 * apm
    components.append({"k": "actions_per_minute", "raw": body.actions_per_minute, "weighted": round(0.20 * apm, 3)})

    s += 0.20 * body.identical_payload_ratio
    components.append({"k": "identical_payload_ratio", "raw": body.identical_payload_ratio, "weighted": round(0.20 * body.identical_payload_ratio, 3)})

    fast = 1.0 if body.time_to_first_action_ms < 200 else 0.0
    s += 0.10 * fast
    components.append({"k": "time_to_first_action_ms", "raw": body.time_to_first_action_ms, "weighted": round(0.10 * fast, 3)})

    ua = max(0.0, 1.0 - body.ua_entropy); s += 0.10 * ua
    components.append({"k": "ua_entropy", "raw": body.ua_entropy, "weighted": round(0.10 * ua, 3)})

    headless = 1.0 if body.headless_browser_flag else 0.0
    s += 0.15 * headless
    components.append({"k": "headless_browser_flag", "raw": body.headless_browser_flag, "weighted": round(0.15 * headless, 3)})

    mouse = 1.0 if body.mouse_event_count_per_session < 5 else 0.0
    s += 0.10 * mouse
    components.append({"k": "mouse_event_count_per_session", "raw": body.mouse_event_count_per_session, "weighted": round(0.10 * mouse, 3)})

    s += 0.10 * max(0.0, min(1.0, body.ip_reputation))
    components.append({"k": "ip_reputation", "raw": body.ip_reputation, "weighted": round(0.10 * body.ip_reputation, 3)})

    apd = min(1.0, body.accounts_per_device_30d / 5.0); s += 0.05 * apd
    components.append({"k": "accounts_per_device_30d", "raw": body.accounts_per_device_30d, "weighted": round(0.05 * apd, 3)})

    score_v = round(min(1.0, s), 4)
    return {
        "data": {
            "subject_id": body.subject_id,
            "score": score_v,
            "band": _band(score_v),
            "flag": "BOT_DETECTED" if score_v >= 0.85 else ("LIKELY_BOT" if score_v >= 0.65 else "HUMAN"),
            "components": components,
            "reason": [c["k"] for c in sorted(components, key=lambda c: -c["weighted"])[:3]],
        },
        "meta": {"model": f"{MODEL}-deterministic", "version": VERSION,
                 "latency_ms": round((perf_counter() - t0) * 1000, 2)},
    }
