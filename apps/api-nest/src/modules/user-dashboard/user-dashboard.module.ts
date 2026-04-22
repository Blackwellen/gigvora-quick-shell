import { Module } from '@nestjs/common';
import { UserDashboardController } from './user-dashboard.controller';
import { UserDashboardService } from './user-dashboard.service';
import { UserDashboardRepository } from './user-dashboard.repository';

@Module({
  controllers: [UserDashboardController],
  providers: [UserDashboardService, UserDashboardRepository],
  exports: [UserDashboardService],
})
export class UserDashboardModule {}
