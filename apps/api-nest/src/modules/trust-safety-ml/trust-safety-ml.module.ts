import { Module } from '@nestjs/common';
import { TrustSafetyMlController } from './trust-safety-ml.controller';
import { TrustSafetyMlService } from './trust-safety-ml.service';
import { TrustSafetyMlRepository } from './trust-safety-ml.repository';

@Module({
  controllers: [TrustSafetyMlController],
  providers: [TrustSafetyMlService, TrustSafetyMlRepository],
  exports: [TrustSafetyMlService],
})
export class TrustSafetyMlModule {}
