"""FD-12 — Real model registry.

Loads CPU-friendly scikit-learn / onnxruntime artefacts at startup and exposes
them to the routers. Each router degrades gracefully to its deterministic path
when an artefact is missing, so the service is always runnable on a 16 GB VPS
without a GPU.

Layout under ``$ML_MODELS_DIR`` (default ``/models``):
  /models/embeddings.onnx              — optional MiniLM-L6-v2 (~90 MB)
  /models/moderation.joblib            — sklearn LogisticRegression + TF-IDF pipeline
  /models/registry.json                — { name, version, sha256, kind, loaded_at }

The Nest ``ml_pipeline`` module already mirrors the registry table from
``packages/db/migrations/0084_ml_pipeline_and_idverify.sql``. This module
publishes the loaded set via ``GET /registry`` so the bridge can sync it.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import structlog

log = structlog.get_logger("gigvora.ml.registry")

MODELS_DIR = Path(os.environ.get("ML_MODELS_DIR", "/models"))
ENABLE_EMBEDDINGS = os.environ.get("ML_ENABLE_EMBEDDINGS", "0") == "1"


@dataclass
class LoadedModel:
    name: str
    version: str
    kind: str
    sha256: str
    loaded_at: float = field(default_factory=time.time)
    artefact: Any = None


# ---------- Moderation classifier ------------------------------------------

# Tiny seed corpus — enough to bootstrap a real LogisticRegression model when
# no artefact is mounted. The artefact-on-disk path replaces this at runtime.
_SEED_BENIGN = [
    "Just shipped a new release, big shoutout to the team",
    "Looking for a contract React developer in London",
    "Loved this article on system design tradeoffs",
    "Hiring a senior product designer for our SaaS",
    "Great session at the meetup yesterday, thanks all",
    "We open-sourced our internal logger today",
    "My take on hybrid working — it depends on the team",
    "Excited to announce our seed funding round",
    "Posting our Q3 roadmap, would love feedback",
    "Anyone interested in a study group on distributed systems",
]
_SEED_TOXIC = [
    "you are trash and your team is incompetent garbage",
    "scam alert this company is fraud do not apply",
    "buy now click here limited offer dm me on telegram",
    "send your bank account number to verify your account",
    "phishing pattern with attached invoice please pay",
    "earn 5000 a week from home no skills required",
    "this product is a scam they will steal your money",
    "click this link bitly fast cash transfer",
    "free crypto giveaway send eth to this address",
    "avoid this employer they are running a fraud scheme",
]


def _train_seed_moderation() -> Any:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.pipeline import Pipeline
    X = _SEED_BENIGN + _SEED_TOXIC
    y = [0] * len(_SEED_BENIGN) + [1] * len(_SEED_TOXIC)
    pipe = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1, max_features=4096, sublinear_tf=True)),
        ("clf",   LogisticRegression(max_iter=400, class_weight="balanced", C=2.0)),
    ])
    pipe.fit(X, y)
    return pipe


# ---------- Embeddings (optional) ------------------------------------------

class _Embedder:
    """Loads MiniLM-L6-v2 only when ``ML_ENABLE_EMBEDDINGS=1``. CPU only."""
    def __init__(self) -> None:
        self.model = None
        self.dim = 0
        if not ENABLE_EMBEDDINGS:
            return
        try:
            from sentence_transformers import SentenceTransformer
            cache = os.environ.get("ML_ST_CACHE", str(MODELS_DIR / "st-cache"))
            os.makedirs(cache, exist_ok=True)
            self.model = SentenceTransformer(
                os.environ.get("ML_EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2"),
                cache_folder=cache, device="cpu",
            )
            self.dim = int(self.model.get_sentence_embedding_dimension() or 0)
            log.info("registry.embedder.loaded", dim=self.dim)
        except Exception as exc:  # pragma: no cover (optional path)
            log.warning("registry.embedder.failed", error=str(exc))
            self.model = None

    @property
    def available(self) -> bool:
        return self.model is not None

    def encode(self, texts: list[str]) -> np.ndarray:
        if not self.available or not texts:
            return np.zeros((len(texts), self.dim or 1), dtype=np.float32)
        return np.asarray(self.model.encode(texts, normalize_embeddings=True))  # type: ignore[union-attr]


# ---------- Registry singleton ---------------------------------------------

class Registry:
    def __init__(self) -> None:
        self.models: dict[str, LoadedModel] = {}
        self.embedder = _Embedder()
        self._load_all()

    def _hash(self, p: Path) -> str:
        h = hashlib.sha256()
        with open(p, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                h.update(chunk)
        return h.hexdigest()

    def _load_all(self) -> None:
        MODELS_DIR.mkdir(parents=True, exist_ok=True)

        # 1) moderation classifier
        mod_path = MODELS_DIR / "moderation.joblib"
        try:
            if mod_path.exists():
                clf = joblib.load(mod_path)
                self.models["moderation.text"] = LoadedModel(
                    name="moderation.text", version="disk-1",
                    kind="sklearn-tfidf-logreg", sha256=self._hash(mod_path), artefact=clf,
                )
                log.info("registry.moderation.loaded", path=str(mod_path))
            else:
                clf = _train_seed_moderation()
                self.models["moderation.text"] = LoadedModel(
                    name="moderation.text", version="seed-1",
                    kind="sklearn-tfidf-logreg", sha256="seed", artefact=clf,
                )
                log.info("registry.moderation.seeded")
        except Exception as exc:
            log.error("registry.moderation.failed", error=str(exc))

        # 2) embedder is loaded eagerly when enabled
        if self.embedder.available:
            self.models["embeddings.minilm"] = LoadedModel(
                name="embeddings.minilm", version="all-MiniLM-L6-v2",
                kind="sentence-transformers", sha256="cached",
                artefact=self.embedder,
            )

        # Publish manifest
        manifest = {n: {"name": m.name, "version": m.version, "kind": m.kind,
                        "sha256": m.sha256, "loaded_at": m.loaded_at}
                    for n, m in self.models.items()}
        try:
            (MODELS_DIR / "registry.json").write_text(json.dumps(manifest, indent=2))
        except Exception:
            pass

    # --- accessors used by routers -----------------------------------------

    def has(self, name: str) -> bool:
        return name in self.models

    def get(self, name: str) -> Any:
        m = self.models.get(name)
        return m.artefact if m else None

    def manifest(self) -> list[dict[str, Any]]:
        return [{"name": m.name, "version": m.version, "kind": m.kind,
                 "sha256": m.sha256, "loaded_at": m.loaded_at}
                for m in self.models.values()]


_TOXIC_TERMS = {
    "scam", "fraud", "phishing", "garbage", "trash", "incompetent", "thief",
    "liar", "bitly", "buy now", "click here", "limited offer", "dm me",
}
_URL = re.compile(r"https?://\S+")


def deterministic_moderation(text: str) -> dict[str, Any]:
    """Used as a backstop when the classifier is unavailable / unhealthy."""
    lower = (text or "").lower()
    toxic_hits = sum(1 for w in _TOXIC_TERMS if w in lower)
    urls = len(_URL.findall(text or ""))
    raw = min(1.0, 0.30 * min(1.0, toxic_hits / 2) + 0.20 * min(1.0, urls / 2))
    if raw >= 0.65:    action = "reject"
    elif raw >= 0.30:  action = "hold"
    else:              action = "approve"
    return {
        "action": action, "score": round(raw, 3),
        "reasons": [f"toxic_terms:{toxic_hits}", f"urls:{urls}"] if (toxic_hits or urls) else ["clean"],
        "model": "moderation-deterministic", "version": "1.0",
    }


REGISTRY = Registry()


def classify_text(text: str) -> dict[str, Any]:
    """Run the loaded classifier, falling back to the deterministic path."""
    clf = REGISTRY.get("moderation.text")
    if not clf:
        return deterministic_moderation(text)
    try:
        proba = float(clf.predict_proba([text or ""])[0][1])
        if proba >= 0.70:    action = "reject"
        elif proba >= 0.40:  action = "hold"
        else:                action = "approve"
        det = deterministic_moderation(text)
        return {
            "action": action, "score": round(proba, 4),
            "reasons": det["reasons"],
            "model": "moderation.text",
            "version": REGISTRY.models["moderation.text"].version,
        }
    except Exception as exc:
        log.warning("registry.classify.failed", error=str(exc))
        return deterministic_moderation(text)


def embed(texts: list[str]) -> np.ndarray | None:
    if not REGISTRY.embedder.available:
        return None
    return REGISTRY.embedder.encode(texts)
