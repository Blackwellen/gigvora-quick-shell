# Local Development

```bash
# 1. start infra
cd infrastructure/compose && docker compose up -d postgres redis opensearch minio

# 2. apply migrations
psql "$DATABASE_URL" -f ../../database/migrations/0001_init.sql
psql "$DATABASE_URL" -f ../../database/migrations/0002_commerce.sql
psql "$DATABASE_URL" -f ../../database/seeders/0001_seed_dev.sql

# 3. install + run services
( cd apps/api-nest        && npm i && npm run start:dev )
( cd apps/workers         && npm i && npm start )
( cd apps/webhook-gateway && npm i && npm start )
( cd apps/search-indexer  && npm i && npm start )
( cd apps/media-pipeline  && npm i && npm start )

# 4. python services
( cd apps/ml-python        && pip install -e . && uvicorn app.main:app --port 8001 )
( cd apps/analytics-python && pip install -e . && uvicorn app.main:app --port 8002 )

# 5. mobile
( cd apps/mobile && npm i && npm start )
```
