import { Module } from '@nestjs/common';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';
import { ReportingRepository } from './reporting.repository';

@Module({
  controllers: [ReportingController],
  providers: [ReportingService, ReportingRepository],
  exports: [ReportingService, ReportingRepository],
})
export class ReportingModule {}
