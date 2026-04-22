import { Module } from '@nestjs/common';
import { SellerPerformanceController } from './seller-performance.controller';
import { SellerPerformanceService } from './seller-performance.service';
import { SellerPerformanceRepository } from './seller-performance.repository';

@Module({
  controllers: [SellerPerformanceController],
  providers: [SellerPerformanceService, SellerPerformanceRepository],
  exports: [SellerPerformanceService],
})
export class SellerPerformanceAvailabilityModule {}
