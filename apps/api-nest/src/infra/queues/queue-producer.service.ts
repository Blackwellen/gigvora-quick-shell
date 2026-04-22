import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue, JobsOptions } from 'bullmq';
import { ALL_QUEUES, DEFAULT_JOB_OPTS, QUEUES, type QueueName } from './queues.constants';

/**
 * FD-14 — single producer used by every Nest service to enqueue jobs.
 * Wraps BullMQ with default retry/backoff, idempotency, and a hook into
 * RealtimeBroker so live "queue depth" counters update on every enqueue.
 */
@Injectable()
export class QueueProducerService implements OnModuleInit {
  private readonly log = new Logger('QueueProducer');
  private readonly queues = new Map<QueueName, Queue>();

  constructor(
    @InjectQueue(QUEUES.notifications) private readonly q1: Queue,
    @InjectQueue(QUEUES.indexing)      private readonly q2: Queue,
    @InjectQueue(QUEUES.media)         private readonly q3: Queue,
    @InjectQueue(QUEUES.billing)       private readonly q4: Queue,
    @InjectQueue(QUEUES.webhooks)      private readonly q5: Queue,
    @InjectQueue(QUEUES.analytics)     private readonly q6: Queue,
    @InjectQueue(QUEUES.mlBatch)       private readonly q7: Queue,
  ) {}

  onModuleInit() {
    this.queues.set(QUEUES.notifications, this.q1);
    this.queues.set(QUEUES.indexing,      this.q2);
    this.queues.set(QUEUES.media,         this.q3);
    this.queues.set(QUEUES.billing,       this.q4);
    this.queues.set(QUEUES.webhooks,      this.q5);
    this.queues.set(QUEUES.analytics,     this.q6);
    this.queues.set(QUEUES.mlBatch,       this.q7);
  }

  async enqueue<T = unknown>(
    queue: QueueName, name: string, data: T,
    opts: JobsOptions & { idempotencyKey?: string } = {},
  ) {
    const q = this.queues.get(queue);
    if (!q) throw new Error(`queue_unknown:${queue}`);
    const jobId = opts.idempotencyKey ?? opts.jobId;
    const job = await q.add(name, data, { ...DEFAULT_JOB_OPTS, ...opts, jobId });
    this.log.debug(`enqueue ${queue}/${name} → ${job.id}`);
    return { jobId: String(job.id), queue, name };
  }

  /** Returns live depth counters for every queue (used by /realtime/counters). */
  async depths(): Promise<Record<string, { waiting: number; active: number; delayed: number; failed: number }>> {
    const out: Record<string, any> = {};
    for (const name of ALL_QUEUES) {
      const q = this.queues.get(name)!;
      const [waiting, active, delayed, failed] = await Promise.all([
        q.getWaitingCount(), q.getActiveCount(), q.getDelayedCount(), q.getFailedCount(),
      ]).catch(() => [0, 0, 0, 0]);
      out[name] = { waiting, active, delayed, failed };
    }
    return out;
  }
}
