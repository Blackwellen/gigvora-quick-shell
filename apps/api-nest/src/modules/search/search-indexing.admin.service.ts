import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { QueueProducerService } from '../../infra/queues/queue-producer.service';
import { QUEUES } from '../../infra/queues/queues.constants';

@Injectable()
export class SearchIndexingAdminService {
  constructor(
    private readonly ds: DataSource,
    private readonly producer: QueueProducerService,
  ) {}

  async bulkIndex(docs: Array<Record<string, any>>) {
    let accepted = 0;
    for (const doc of docs) {
      if (!doc?.id || !doc?.indexName || !doc?.title) continue;
      await this.ds.query(
        `INSERT INTO search_documents (id, index_name, title, body, tags, url, owner_id, org_id, visibility, status, region, meta)
         VALUES ($1,$2,$3,COALESCE($4,''),COALESCE($5,'{}'::text[]),$6,$7,$8,COALESCE($9,'public'),$10,$11,COALESCE($12,'{}'::jsonb))
         ON CONFLICT (index_name, id) DO UPDATE SET
           title=EXCLUDED.title, body=EXCLUDED.body, tags=EXCLUDED.tags, url=EXCLUDED.url,
           owner_id=EXCLUDED.owner_id, org_id=EXCLUDED.org_id, visibility=EXCLUDED.visibility,
           status=EXCLUDED.status, region=EXCLUDED.region, meta=EXCLUDED.meta, updated_at=now()`,
        [
          doc.id,
          doc.indexName,
          doc.title,
          doc.body,
          doc.tags ?? [],
          doc.url ?? null,
          doc.ownerId ?? null,
          doc.orgId ?? null,
          doc.visibility ?? 'public',
          doc.status ?? null,
          doc.region ?? null,
          doc.meta ? JSON.stringify(doc.meta) : null,
        ],
      );
      await this.producer.enqueue(
        QUEUES.indexing,
        'upsert',
        { index: doc.indexName, op: 'upsert', doc: { ...doc, updatedAt: new Date().toISOString() } },
        { idempotencyKey: `${doc.indexName}:${doc.id}:${doc.updatedAt ?? Date.now()}` },
      );
      accepted += 1;
    }
    return { accepted };
  }

  async reconcile(limit = 250) {
    const rows = await this.ds.query(
      `SELECT id, index_name AS "indexName", title, body, tags, url, owner_id AS "ownerId", org_id AS "orgId", visibility, status, region, meta, updated_at AS "updatedAt"
       FROM search_documents
       ORDER BY updated_at DESC
       LIMIT $1`,
      [limit],
    );

    let enqueued = 0;
    for (const row of rows) {
      await this.producer.enqueue(
        QUEUES.indexing,
        'upsert',
        { index: row.indexName, op: 'upsert', doc: { ...row } },
        { idempotencyKey: `${row.indexName}:${row.id}:${row.updatedAt}` },
      );
      enqueued += 1;
    }

    return { scanned: rows.length, enqueued, mode: 'search_documents_mirror' };
  }
}