import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RealtimeBrokerService } from './realtime-broker.service';
import { QueueProducerService } from './queue-producer.service';

/**
 * FD-14 — REST snapshot for the realtime broker. Clients fetch this on
 * mount, then subscribe to Socket.IO `counter.update` events for deltas.
 */
@Controller('api/v1/realtime')
@UseGuards(AuthGuard('jwt'))
export class RealtimeCountersController {
  constructor(
    private readonly broker: RealtimeBrokerService,
    private readonly producer: QueueProducerService,
  ) {}

  @Get('counters')
  async counters(@Req() req: any, @Query('scope') scope: 'global'|'user'|'org' = 'user') {
    const scopeId = scope === 'user'
      ? (req.user?.sub ?? 'anon')
      : scope === 'org'
        ? (req.user?.orgId ?? 'global')
        : 'global';
    const counters = await this.broker.snapshot(scope, scopeId);
    return { scope, scopeId, counters, ts: Date.now() };
  }

  @Get('queues')
  async queues() {
    const depths = await this.producer.depths();
    return { depths, ts: Date.now() };
  }
}
