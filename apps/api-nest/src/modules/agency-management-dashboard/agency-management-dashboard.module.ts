import { Module } from '@nestjs/common';
import { AgencyManagementDashboardController } from './agency-management-dashboard.controller';
import { AgencyManagementDashboardService } from './agency-management-dashboard.service';
import { AgencyManagementDashboardRepository } from './agency-management-dashboard.repository';

@Module({
  controllers: [AgencyManagementDashboardController],
  providers: [AgencyManagementDashboardService, AgencyManagementDashboardRepository],
  exports: [AgencyManagementDashboardService],
})
export class AgencyManagementDashboardModule {}
