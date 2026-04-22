import { Module } from '@nestjs/common';
import { ModeratorDashboardController } from './moderator-dashboard.controller';
import { ModeratorDashboardService } from './moderator-dashboard.service';
import { ModeratorDashboardRepository } from './moderator-dashboard.repository';

@Module({
  controllers: [ModeratorDashboardController],
  providers: [ModeratorDashboardService, ModeratorDashboardRepository],
  exports: [ModeratorDashboardService],
})
export class ModeratorDashboardModule {}
