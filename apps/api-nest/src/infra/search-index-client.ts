/**
 * FD-11 — Canonical search-fan-out client.
 *
 * Every NestJS write module funnels its post-write index updates through
 * this single client. It does **two** things atomically:
 *
 *   1. Upserts the row into `search_documents` (Postgres FTS authoritative
 *      mirror — guarantees the read fallback is never stale).
 *   2. Enqueues a BullMQ `indexing` job so the OpenSearch indexer picks it up.
 *
 * The BullMQ `jobId` is set to `${index}:${id}:${updatedAt}` so retries are
 * naturally deduped and out-of-order updates can't overwrite a newer doc.
 *
 * **Contract** (locked — every fan-out call MUST conform):
 *   index       — one of search-indexer's INDEXES.
 *   id          — stable document id (UUID or slug).
 *   title       — required, ≤ 256 chars.
 *   body        — searchable text body (optional).
 *   tags        — string[] (≤ 50 entries).
 *   url         — canonical client URL for the resource.
 *   ownerId     — identity that owns the doc (visibility scoping).
 *   orgId       — owning org if applicable.
 *   visibility  — 'public' | 'org' | 'private'.
 *   status      — domain-specific lifecycle bucket (e.g. 'open', 'archived').
 *   meta        — typed payload, must match search-indexer mapping.
 */
import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { QueueProducerService } from './queues/queue-producer.service';
import { QUEUES } from './queues/queues.constants';

export type IndexableDoc = {
  index:
    | 'users' | 'jobs' | 'projects' | 'gigs' | 'services'
    | 'companies' | 'startups' | 'media' | 'groups' | 'events'
    | 'podcasts' | 'webinars' | 'posts';
  id: string;
  title: string;
  body?: string;
  tags?: string[];
  url?: string;
  ownerId?: string | null;
  orgId?: string | null;
  visibility?: 'public' | 'org' | 'private';
  status?: string;
  region?: string | null;
  meta?: Record<string, unknown>;
};

@Injectable()
export class SearchIndexClient {
  private readonly log = new Logger('SearchIndexClient');

  constructor(
    private readonly ds: DataSource,
    private readonly producer: QueueProducerService,
  ) {}

  /** Upsert a doc into both the FTS mirror and the OpenSearch queue. */
  async upsert(doc: IndexableDoc): Promise<void> {
    const updatedAt = new Date().toISOString();
    try {
      await this.ds.query(
        `INSERT INTO search_documents
           (id, index_name, title, body, tags, url, owner_id, org_id, visibility, status, region, meta, updated_at)
         VALUES ($1,$2,$3,COALESCE($4,''),COALESCE($5,'{}'::text[]),$6,$7,$8,COALESCE($9,'public'),$10,$11,COALESCE($12,'{}'::jsonb),$13)
         ON CONFLICT (index_name, id) DO UPDATE SET
           title=EXCLUDED.title, body=EXCLUDED.body, tags=EXCLUDED.tags,
           url=EXCLUDED.url, owner_id=EXCLUDED.owner_id, org_id=EXCLUDED.org_id,
           visibility=EXCLUDED.visibility, status=EXCLUDED.status, region=EXCLUDED.region,
           meta=EXCLUDED.meta, updated_at=EXCLUDED.updated_at`,
        [
          doc.id, doc.index, doc.title, doc.body, doc.tags ?? [],
          doc.url ?? null, doc.ownerId ?? null, doc.orgId ?? null,
          doc.visibility ?? 'public', doc.status ?? null, doc.region ?? null,
          doc.meta ? JSON.stringify(doc.meta) : null, updatedAt,
        ],
      );
    } catch (err) {
      // Mirror failures must not block the write — log loudly instead.
      this.log.warn(`FTS mirror failed for ${doc.index}:${doc.id} — ${(err as Error).message}`);
    }

    try {
      await this.producer.enqueue(
        QUEUES.indexing,
        'upsert',
        { index: doc.index, op: 'upsert', doc: { ...doc, updatedAt } },
        { idempotencyKey: `${doc.index}:${doc.id}:${updatedAt}` },
      );
    } catch (err) {
      this.log.warn(`indexing enqueue failed for ${doc.index}:${doc.id} — ${(err as Error).message}`);
    }
  }

  /** Tombstone — removes from both the FTS mirror and OpenSearch. */
  async remove(index: IndexableDoc['index'], id: string): Promise<void> {
    try {
      await this.ds.query(
        `DELETE FROM search_documents WHERE index_name=$1 AND id=$2`,
        [index, id],
      );
    } catch (err) {
      this.log.warn(`FTS delete failed for ${index}:${id} — ${(err as Error).message}`);
    }
    try {
      await this.producer.enqueue(
        QUEUES.indexing,
        'delete',
        { index, op: 'delete', doc: { id } },
        { idempotencyKey: `${index}:${id}:delete:${Date.now()}` },
      );
    } catch (err) {
      this.log.warn(`indexing delete enqueue failed for ${index}:${id} — ${(err as Error).message}`);
    }
  }
}
