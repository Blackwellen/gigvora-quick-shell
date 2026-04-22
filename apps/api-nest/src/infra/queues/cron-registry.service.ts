import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { QueueProducerService } from './queue-producer.service';
import { QUEUES } from './queues.constants';

/**
 * FD-14 — declarative cron registry. Every @Cron handler enqueues onto the
 * matching BullMQ queue and updates `cron_jobs.last_run_at` for visibility
 * in the admin shell.
 */
@Injectable()
export class CronRegistryService implements OnModuleInit {
  private readonly log = new Logger('CronRegistry');
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly producer: QueueProducerService,
  ) {}

  onModuleInit() { this.log.log('cron registry online'); }

  private async stamp(name: string, status: 'running'|'completed'|'failed') {
    await this.ds.query(
      `UPDATE cron_jobs SET last_run_at=now(), last_status=$2, updated_at=now() WHERE name=$1`,
      [name, status],
    ).catch(() => null);
  }

  @Cron('0 * * * *', { name: 'analytics.rollup.hourly' })
  async hourlyRollup() {
    await this.stamp('analytics.rollup.hourly', 'running');
    await this.producer.enqueue(QUEUES.analytics, 'rollup.hour', { bucket: 'hour' });
    await this.stamp('analytics.rollup.hourly', 'completed');
  }

  @Cron('5 0 * * *', { name: 'analytics.rollup.daily' })
  async dailyRollup() {
    await this.stamp('analytics.rollup.daily', 'running');
    await this.producer.enqueue(QUEUES.analytics, 'rollup.day', { bucket: 'day' });
    await this.stamp('analytics.rollup.daily', 'completed');
  }

  @Cron('15 2 * * *', { name: 'billing.reconcile.nightly' })
  async nightlyReconcile() {
    await this.stamp('billing.reconcile.nightly', 'running');
    await this.producer.enqueue(QUEUES.billing, 'reconcile', { source: 'cron' });
    await this.stamp('billing.reconcile.nightly', 'completed');
  }

  @Cron('*/5 * * * *', { name: 'webhooks.retry.sweep' })
  async webhookRetry() {
    await this.producer.enqueue(QUEUES.webhooks, 'retry.sweep', { ts: Date.now() });
    await this.stamp('webhooks.retry.sweep', 'completed');
  }

  @Cron('*/15 * * * *', { name: 'ml.batch.embeddings' })
  async mlEmbeddings() {
    await this.producer.enqueue(QUEUES.mlBatch, 'embeddings.refresh', { ts: Date.now() });
    await this.stamp('ml.batch.embeddings', 'completed');
  }

  @Cron('*/2 * * * *', { name: 'counters.recompute' })
  async countersRecompute() {
    await this.producer.enqueue(QUEUES.analytics, 'counters.recompute', { ts: Date.now() });
    await this.stamp('counters.recompute', 'completed');
  }

  /**
   * FD-11 — saved-search digest. Every 30 minutes the worker re-runs every
   * saved search with notify=true, audits results into saved_search_runs,
   * and notifies the owner when there are new hits.
   */
  @Cron('*/30 * * * *', { name: 'search.saved.digest' })
  async savedSearchDigest() {
    await this.stamp('search.saved.digest', 'running');
    await this.producer.enqueue(QUEUES.notifications, 'search.saved.digest', {
      sinceHours: 24, ts: Date.now(),
    });
    await this.stamp('search.saved.digest', 'completed');
  }
}
