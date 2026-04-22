# FD-12 — Gigvora ML service. CPU-only, runnable on a 16 GB-RAM VPS.
# Multi-stage to keep the runtime image lean (~700 MB with sklearn + onnxruntime).
FROM python:3.11-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    OMP_NUM_THREADS=2 \
    TOKENIZERS_PARALLELISM=false

RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates libgomp1 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps first for cache reuse
COPY pyproject.toml ./
RUN pip install --upgrade pip \
 && pip install \
      "fastapi>=0.115" "uvicorn[standard]>=0.30" "pydantic>=2.8" \
      "numpy>=2.0" "scikit-learn>=1.5" \
      "onnxruntime>=1.18" "joblib>=1.4" \
      "redis>=5.0" "httpx>=0.27" "structlog>=24.4" "prometheus-client>=0.20" \
      "asyncpg>=0.29"

# Optional: sentence-transformers — installed at build time but only loaded
# when ML_ENABLE_EMBEDDINGS=1 to keep cold-start small.
RUN pip install "sentence-transformers>=3.0" "torch>=2.2" --extra-index-url https://download.pytorch.org/whl/cpu

COPY app ./app
COPY tests ./tests

# Pre-create the models directory so volume mounts in dev compose succeed
RUN mkdir -p /models && chown -R 1000:1000 /models /app

EXPOSE 8001
USER 1000

HEALTHCHECK --interval=30s --timeout=4s --start-period=15s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8001/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "2", "--loop", "uvloop"]
