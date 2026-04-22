"""FD-12 — Public read of the model registry. Bridge syncs from this."""
from fastapi import APIRouter
from ._registry import REGISTRY

router = APIRouter(prefix="/registry", tags=["registry"])


@router.get("")
def list_models():
    return {"data": REGISTRY.manifest(),
            "meta": {"model": "registry", "version": "1.0", "latency_ms": 0}}


@router.post("/refresh")
def refresh():
    """Used by the ml-batch worker to trigger an in-process reload after a
    new artefact lands on the shared volume. Cheap because models are small."""
    # Re-init in place (singleton replacement is intentionally avoided so
    # other modules that captured REGISTRY via import keep their reference)
    REGISTRY.__init__()  # type: ignore[misc]
    return {"data": {"reloaded": True, "count": len(REGISTRY.models)},
            "meta": {"model": "registry", "version": "1.0", "latency_ms": 0}}
