# Gigvora Platform Architecture

## Service map

```
┌───────────┐    ┌──────────┐    ┌─────────────┐
│ web (TSS) │───▶│          │───▶│ api-nest    │──┬──▶ Postgres
└───────────┘    │          │    │ (REST + WS) │  ├──▶ Redis
┌───────────┐    │  SDK     │───▶│             │  ├──▶ OpenSearch
│ mobile    │───▶│          │    └─────┬───────┘  └──▶ S3
└───────────┘    └──────────┘          │
                                       ├──▶ ml-python (FastAPI)
                                       ├──▶ analytics-python (FastAPI)
                                       ├──▶ workers (BullMQ)
                                       ├──▶ search-indexer
                                       ├──▶ media-pipeline
                                       ├──▶ webhook-gateway
                                       ├──▶ integrations (Stripe, SendGrid, …)
                                       └──▶ connectors (HubSpot, SF, Notion, …)
```

## Data flow

- **Writes** → api-nest → Postgres → emit event to Redis/BullMQ → indexer/notifier/analytics workers
- **Reads** → web/mobile → SDK → api-nest (with cache) → Postgres or OpenSearch
- **Realtime** → Socket.IO gateway in api-nest, backed by Redis pub/sub
- **Files** → web/mobile → request signed URL from api-nest → upload to S3 directly → media-pipeline post-process

## Observability

- Pino logs (api-nest, workers, gateway)
- Prometheus metrics (`/metrics` on every service)
- Sentry / OTLP (configurable per service)

## Failure semantics

- Idempotent webhook ingestion (Redis SETNX dedupe)
- BullMQ exponential retries + dead-letter queues
- ML/analytics calls are non-blocking with deterministic fallbacks
