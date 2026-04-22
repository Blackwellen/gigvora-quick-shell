import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { BookingService } from './booking.service';
import {
  CreateAppointmentDto, CreateBookingLinkDto, UpdateBookingLinkDto,
  RescheduleAppointmentDto, CancelAppointmentDto,
} from './dto';

const ACTOR = 'demo_user';

@Controller('api/v1/booking')
export class BookingController {
  constructor(private readonly svc: BookingService) {}

  /* ── Booking links ─── */
  @Get('links') listLinks() { return { items: this.svc.listLinks(ACTOR) }; }
  @Get('links/:id') getLink(@Param('id') id: string) { return this.svc.getLink(id); }
  @Get('public/:slug') publicLink(@Param('slug') slug: string) { return this.svc.publicLink(slug); }
  @Post('links') createLink(@Body() dto: CreateBookingLinkDto) { return this.svc.createLink(ACTOR, dto); }
  @Patch('links/:id') updateLink(@Param('id') id: string, @Body() dto: UpdateBookingLinkDto) { return this.svc.updateLink(ACTOR, id, dto); }
  @Delete('links/:id') archiveLink(@Param('id') id: string) { return this.svc.archiveLink(ACTOR, id); }

  /* ── Availability ─── */
  @Get('availability') availability(@Query() q: any) {
    return { items: this.svc.availability({ linkId: q.linkId, from: q.from, to: q.to, inviteeTimezone: q.inviteeTimezone }) };
  }

  /* ── Appointments ─── */
  @Get('appointments') listAppointments(@Query() q: any) { return this.svc.listAppointments(ACTOR, q); }
  @Get('appointments/:id') detail(@Param('id') id: string) { return this.svc.detail(id); }
  @Post('appointments') book(@Body() dto: CreateAppointmentDto) { return this.svc.book(null, dto); }
  @Post('appointments/:id/approve') approve(@Param('id') id: string) { return this.svc.approve(ACTOR, id); }
  @Post('appointments/:id/reject') reject(@Param('id') id: string, @Body() b: { reason?: string } = {}) { return this.svc.reject(ACTOR, id, b.reason); }
  @Post('appointments/:id/reschedule') reschedule(@Param('id') id: string, @Body() dto: RescheduleAppointmentDto) { return this.svc.reschedule(null, id, dto); }
  @Post('appointments/:id/cancel') cancel(@Param('id') id: string, @Body() dto: CancelAppointmentDto = {}) { return this.svc.cancel(null, id, dto); }
  @Post('appointments/:id/complete') complete(@Param('id') id: string) { return this.svc.markCompleted(ACTOR, id); }
  @Post('appointments/:id/no-show') noShow(@Param('id') id: string) { return this.svc.markNoShow(ACTOR, id); }

  /* ── Insights & ML ─── */
  @Get('insights') insights() { return this.svc.insights(ACTOR); }
  @Post('ml/rank-slots') rankSlots(@Body() b: { inviteeTimezone?: string; preferMorning?: boolean; slots: { id: string; startAt: string; hourLocal: number }[] }) {
    return this.svc.rankSlots(b);
  }
  @Get('appointments/:id/cancellation-risk') cancellationRisk(@Param('id') id: string) {
    return this.svc.cancellationRisk(id);
  }
}
