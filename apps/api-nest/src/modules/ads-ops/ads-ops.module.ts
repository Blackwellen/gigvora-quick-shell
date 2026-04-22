import { Module } from '@nestjs/common';
import { AdsOpsController } from './ads-ops.controller';
import { AdsOpsService } from './ads-ops.service';
import { AdsOpsRepository } from './ads-ops.repository';

@Module({
  controllers: [AdsOpsController],
  providers: [AdsOpsService, AdsOpsRepository],
  exports: [AdsOpsService],
})
export class AdsOpsModule {}
