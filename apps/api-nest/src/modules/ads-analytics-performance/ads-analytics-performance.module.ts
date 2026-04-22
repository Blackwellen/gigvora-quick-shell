import { Module } from '@nestjs/common';
import { AdsAnalyticsPerformanceController } from './ads-analytics-performance.controller';
import { AdsAnalyticsPerformanceService } from './ads-analytics-performance.service';
import { AdsAnalyticsPerformanceRepository } from './ads-analytics-performance.repository';

@Module({
  controllers: [AdsAnalyticsPerformanceController],
  providers: [AdsAnalyticsPerformanceService, AdsAnalyticsPerformanceRepository],
  exports: [AdsAnalyticsPerformanceService],
})
export class AdsAnalyticsPerformanceModule {}
