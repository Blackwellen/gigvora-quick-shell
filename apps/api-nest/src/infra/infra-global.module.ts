import { Global, Module } from '@nestjs/common';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { WriteThrottlerGuard } from './write-throttler.guard';
import { SearchIndexClient } from './search-index-client';
import { SearchRouter } from './search-router';

/**
 * Cross-cutting infrastructure made global so any Nest module can inject
 * without re-importing. Includes (FD-11) the canonical SearchIndexClient
 * + SearchRouter, so every write surface fans out through one path and
 * every read surface routes through the same primary/fallback contract.
 */
@Global()
@Module({
  providers: [IdempotencyInterceptor, WriteThrottlerGuard, SearchIndexClient, SearchRouter],
  exports:   [IdempotencyInterceptor, WriteThrottlerGuard, SearchIndexClient, SearchRouter],
})
export class InfraGlobalModule {}
