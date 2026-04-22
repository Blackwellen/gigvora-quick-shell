import { Module } from '@nestjs/common';
import { EnterpriseDashboardController } from './enterprise-dashboard.controller';
import { EnterpriseDashboardService } from './enterprise-dashboard.service';
import { EnterpriseDashboardRepository } from './enterprise-dashboard.repository';

@Module({
  controllers: [EnterpriseDashboardController],
  providers: [EnterpriseDashboardService, EnterpriseDashboardRepository],
  exports: [EnterpriseDashboardService],
})
export class EnterpriseDashboardModule {}
