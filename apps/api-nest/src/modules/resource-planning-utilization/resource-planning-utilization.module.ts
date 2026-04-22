import { Module } from '@nestjs/common';
import { ResourcePlanningUtilizationController } from './resource-planning-utilization.controller';
import { ResourcePlanningUtilizationService } from './resource-planning-utilization.service';
import { ResourcePlanningUtilizationRepository } from './resource-planning-utilization.repository';

@Module({
  controllers: [ResourcePlanningUtilizationController],
  providers: [ResourcePlanningUtilizationService, ResourcePlanningUtilizationRepository],
  exports: [ResourcePlanningUtilizationService],
})
export class ResourcePlanningUtilizationModule {}
