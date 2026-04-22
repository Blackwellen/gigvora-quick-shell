import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AuditService } from './audit.service';
import { IdempotencyService } from './idempotency.service';
import { ErrorEnvelopeFilter } from './error-envelope.filter';
import { DbProvider } from './db.provider';

/**
 * Cross-cutting infrastructure used by every domain module:
 *  - Db (Drizzle handle)
 *  - AuditService (append-only audit_events writer)
 *  - IdempotencyService (replay-safe POSTs)
 *  - ErrorEnvelopeFilter (consistent { error: { code, message } } envelope)
 *
 * Marked @Global so domain modules can simply inject these without re-importing.
 */
@Global()
@Module({
  providers: [
    DbProvider,
    AuditService,
    IdempotencyService,
    { provide: APP_FILTER, useClass: ErrorEnvelopeFilter },
  ],
  exports: [DbProvider, AuditService, IdempotencyService],
})
export class InfraModule {}
