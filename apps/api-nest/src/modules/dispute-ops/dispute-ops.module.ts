import { Module } from '@nestjs/common';
import { DisputeOpsController } from './dispute-ops.controller';
import { DisputeOpsService } from './dispute-ops.service';
import { DisputeOpsRepository } from './dispute-ops.repository';

@Module({
  controllers: [DisputeOpsController],
  providers: [DisputeOpsService, DisputeOpsRepository],
  exports: [DisputeOpsService],
})
export class DisputeOpsModule {}
