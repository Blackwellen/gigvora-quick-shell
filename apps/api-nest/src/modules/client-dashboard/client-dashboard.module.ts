import { Module } from '@nestjs/common';
import { ClientDashboardController } from './client-dashboard.controller';
import { ClientDashboardService } from './client-dashboard.service';
import { ClientDashboardRepository } from './client-dashboard.repository';

@Module({
  controllers: [ClientDashboardController],
  providers: [ClientDashboardService, ClientDashboardRepository],
  exports: [ClientDashboardService],
})
export class ClientDashboardModule {}
