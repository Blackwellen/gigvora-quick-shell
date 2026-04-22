import { Module } from '@nestjs/common';
import { KpiRegistryController } from './kpi-registry.controller';
import { KpiRegistryRepository } from './kpi-registry.repository';
import { KpiEvaluatorService } from './kpi-evaluator.service';

@Module({
  controllers: [KpiRegistryController],
  providers: [KpiRegistryRepository, KpiEvaluatorService],
  exports: [KpiRegistryRepository, KpiEvaluatorService],
})
export class KpiRegistryModule {}
