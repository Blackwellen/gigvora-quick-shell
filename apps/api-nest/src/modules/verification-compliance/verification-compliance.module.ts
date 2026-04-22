import { Module } from '@nestjs/common';
import { VerificationComplianceController } from './verification-compliance.controller';
import { VerificationComplianceService } from './verification-compliance.service';
import { VerificationComplianceRepository } from './verification-compliance.repository';

@Module({
  controllers: [VerificationComplianceController],
  providers: [VerificationComplianceService, VerificationComplianceRepository],
  exports: [VerificationComplianceService],
})
export class VerificationComplianceModule {}
