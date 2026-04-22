/**
 * Internal Prometheus scrape endpoint for ML bridge metrics.
 * Exposed at GET /internal/ml-metrics. Network ACL must restrict to the
 * Prometheus scraper — there is no PII in the payload but the data is
 * operational and not for end users.
 */
import { Controller, Get, Header } from '@nestjs/common';
import { MlMetricsService } from './ml-metrics.service';

@Controller('internal/ml-metrics')
export class MlMetricsController {
  constructor(private readonly metrics: MlMetricsService) {}

  @Get()
  @Header('content-type', 'text/plain; version=0.0.4')
  scrape(): string {
    return this.metrics.scrape();
  }
}
