"""FD-12 — Moderation classifier tests (real sklearn pipeline, not mocked)."""
from app._registry import REGISTRY, classify_text, deterministic_moderation


def test_seed_classifier_loaded():
    assert REGISTRY.has("moderation.text")
    m = REGISTRY.models["moderation.text"]
    assert m.kind == "sklearn-tfidf-logreg"


def test_classifier_holds_or_rejects_obvious_scam():
    v = classify_text("scam alert this is fraud send your bank account dm me on telegram")
    assert v["action"] in {"hold", "reject"}
    assert v["score"] >= 0.40


def test_classifier_approves_benign_text():
    v = classify_text("Just shipped a new release, big shoutout to the team")
    assert v["action"] == "approve"
    assert v["score"] < 0.40


def test_deterministic_backstop_is_explainable():
    v = deterministic_moderation("buy now click here scam")
    assert v["model"] == "moderation-deterministic"
    assert v["action"] in {"hold", "reject"}
    assert any(r.startswith("toxic_terms") or r.startswith("urls") for r in v["reasons"])
