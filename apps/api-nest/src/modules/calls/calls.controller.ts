import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CallsService } from './calls.service';
import {
  CreateCallDto, UpdateCallDto, RescheduleDto,
  PresenceUpdateDto, ContactWindowUpsertDto,
} from './dto';

const ACTOR = 'demo_user'; // replaced by AuthGuard in production

@Controller('api/v1/calls')
export class CallsController {
  constructor(private readonly svc: CallsService) {}

  @Get() list(@Query() q: any) { return this.svc.list(ACTOR, q); }
  @Get('insights') insights() { return this.svc.insights(ACTOR); }
  @Get(':id') detail(@Param('id') id: string) { return this.svc.detail(id); }

  @Post() create(@Body() dto: CreateCallDto) { return this.svc.create(ACTOR, dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateCallDto) { return this.svc.update(ACTOR, id, dto); }
  @Post(':id/reschedule') reschedule(@Param('id') id: string, @Body() dto: RescheduleDto) { return this.svc.reschedule(ACTOR, id, dto); }
  @Post(':id/cancel') cancel(@Param('id') id: string) { return this.svc.cancel(ACTOR, id); }
  @Post(':id/end') end(@Param('id') id: string, @Body() b: { durationSeconds: number; recordingUrl?: string }) {
    return this.svc.end(ACTOR, id, b.durationSeconds, b.recordingUrl);
  }

  /* ── Presence ─── */
  @Get('presence/snapshot') presence(@Query('userIds') userIds: string) {
    return this.svc.presence((userIds ?? '').split(',').filter(Boolean));
  }
  @Post('presence') setPresence(@Body() dto: PresenceUpdateDto) { return this.svc.setPresence(ACTOR, dto); }

  /* ── Contact Windows ─── */
  @Get('windows/list') listWindows() { return this.svc.windows(ACTOR); }
  @Post('windows') createWindow(@Body() dto: ContactWindowUpsertDto) { return this.svc.upsertWindow(ACTOR, null, dto); }
  @Patch('windows/:id') updateWindow(@Param('id') id: string, @Body() dto: ContactWindowUpsertDto) { return this.svc.upsertWindow(ACTOR, id, dto); }
  @Delete('windows/:id') deleteWindow(@Param('id') id: string) { return this.svc.deleteWindow(ACTOR, id); }

  /* ── ML ─── */
  @Post('ml/score-quality') scoreQuality(@Body() b: { callId: string; bitrateKbps?: number; packetLossPct?: number; jitterMs?: number; rttMs?: number; durationSec?: number }) {
    return this.svc.scoreQuality(b);
  }
  @Post('ml/no-show-risk') noShowRisk(@Body() b: { appointmentId: string; minutesUntil: number; rescheduleCount?: number; inviteeConfirmed?: boolean; pastNoShows?: number }) {
    return this.svc.noShowRisk(b);
  }
}
