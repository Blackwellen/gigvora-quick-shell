import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { ALL_QUEUES } from './queues.constants';
import { QueueProducerService } from './queue-producer.service';
import { RealtimeBrokerService } from './realtime-broker.service';
import { CronRegistryService } from './cron-registry.service';
import { RealtimeCountersController } from './realtime-counters.controller';
import { NotificationsModule } from '../../modules/notifications/notifications.module';

/**
 * FD-14 — Global queues + cron + realtime broker.
 * Registered once in AppModule; every other Nest service injects
 * QueueProducerService / RealtimeBrokerService.
 */
@Global()
@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue(...ALL_QUEUES.map((name) => ({ name }))),
    NotificationsModule, // re-export gateway access
  ],
  providers: [QueueProducerService, RealtimeBrokerService, CronRegistryService],
  controllers: [RealtimeCountersController],
  exports: [QueueProducerService, RealtimeBrokerService, BullModule],
})
export class QueuesModule {}
