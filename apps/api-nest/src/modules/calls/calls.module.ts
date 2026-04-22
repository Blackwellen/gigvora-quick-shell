import { Module } from '@nestjs/common';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';
import { CallsRepository } from './calls.repository';
import { CallsAnalyticsService } from './calls.analytics.service';
import { CallsMlService } from './calls.ml.service';
import { WorkspaceModule } from '../workspace/workspace.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [WorkspaceModule, NotificationsModule],
  controllers: [CallsController],
  providers: [CallsService, CallsRepository, CallsAnalyticsService, CallsMlService],
  exports: [CallsService],
})
export class CallsModule {}
