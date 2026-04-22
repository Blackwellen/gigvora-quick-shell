/**
 * Shared Postgres / Drizzle entry. Used by NestJS API and any future
 * Node service. Never imported by browser code.
 *
 * Connection strategy:
 *   - DATABASE_URL is required in non-test environments.
 *   - In test (NODE_ENV=test) we expose a tiny pg-mem-friendly stub so unit
 *     tests can run without a real Postgres.
 */
import { Pool, type PoolConfig } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export * from './schema';
export { sql, eq, and, or, asc, desc, gt, gte, lt, lte, inArray, isNull, isNotNull } from 'drizzle-orm';
export type Schema = typeof schema;
export type Db = NodePgDatabase<Schema>;

let _pool: Pool | null = null;
let _db: Db | null = null;

export function getPool(cfg?: PoolConfig): Pool {
  if (_pool) return _pool;
  const url = process.env.DATABASE_URL;
  if (!url && process.env.NODE_ENV !== 'test') {
    throw new Error('DATABASE_URL is required outside of test environments');
  }
  _pool = new Pool({
    connectionString: url ?? 'postgres://gigvora:gigvora@localhost:5432/gigvora_test',
    max: Number(process.env.PGPOOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    statement_timeout: 15_000,
    ...cfg,
  });
  return _pool;
}

export function getDb(): Db {
  if (_db) return _db;
  _db = drizzle(getPool(), { schema, logger: process.env.SQL_LOG === '1' });
  return _db;
}

/** For tests: inject a different db handle (e.g. a transactional rollback wrapper). */
export function __setTestDb(db: Db | null) {
  _db = db;
}
