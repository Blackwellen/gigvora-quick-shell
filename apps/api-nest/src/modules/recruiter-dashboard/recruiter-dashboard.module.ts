import { Module } from '@nestjs/common';
import { RecruiterDashboardController } from './recruiter-dashboard.controller';
import { RecruiterDashboardService } from './recruiter-dashboard.service';
import { RecruiterDashboardRepository } from './recruiter-dashboard.repository';

@Module({
  controllers: [RecruiterDashboardController],
  providers: [RecruiterDashboardService, RecruiterDashboardRepository],
  exports: [RecruiterDashboardService],
})
export class RecruiterDashboardModule {}
