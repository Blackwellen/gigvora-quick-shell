import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EventsService } from './events.service';
import {
  CheckInDto, CreateEventDto, FeedbackDto, ListEventsQuery, MessageDto, ModerationDto,
  RsvpDto, SessionDto, SpeakerDto, TransitionDto, UpdateEventDto,
} from './dto';

@Controller('api/v1/events')
export class EventsController {
  constructor(private readonly svc: EventsService) {}

  // discovery
  @Get()
  list(@Query() q: any, @Req() req: any) { return this.svc.list(req.user?.userId ?? null, ListEventsQuery.parse(q)); }
  @Get(':idOrSlug')
  detail(@Param('idOrSlug') id: string, @Req() req: any) { return this.svc.detail(id, req.user?.userId ?? null); }

  // host CRUD + lifecycle
  @UseGuards(AuthGuard('jwt')) @Post()
  create(@Body() body: any, @Req() req: any) { return this.svc.create(req.user.userId, CreateEventDto.parse(body)); }
  @UseGuards(AuthGuard('jwt')) @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @Req() req: any) { return this.svc.update(id, req.user.userId, UpdateEventDto.parse(body)); }
  @UseGuards(AuthGuard('jwt')) @Post(':id/transition')
  transition(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const t = TransitionDto.parse(body);
    return this.svc.transition(id, req.user.userId, t.to, t.reason);
  }
  @UseGuards(AuthGuard('jwt')) @Delete(':id')
  archive(@Param('id') id: string, @Req() req: any) { return this.svc.archive(id, req.user.userId); }

  // rsvp
  @UseGuards(AuthGuard('jwt')) @Post(':id/rsvp')
  rsvp(@Param('id') id: string, @Body() body: any, @Req() req: any) { return this.svc.rsvp(id, req.user.userId, RsvpDto.parse(body)); }
  @UseGuards(AuthGuard('jwt')) @Delete(':id/rsvp')
  cancelRsvp(@Param('id') id: string, @Req() req: any) { return this.svc.cancelRsvp(id, req.user.userId); }
  @UseGuards(AuthGuard('jwt')) @Get(':id/rsvps')
  rsvps(@Param('id') id: string, @Req() req: any) { return this.svc.listRsvps(id, req.user.userId); }

  // speakers / sessions
  @Get(':id/speakers')
  speakers(@Param('id') id: string) { return this.svc.listSpeakers(id); }
  @UseGuards(AuthGuard('jwt')) @Post(':id/speakers')
  addSpeaker(@Param('id') id: string, @Body() body: any, @Req() req: any) { return this.svc.addSpeaker(id, req.user.userId, SpeakerDto.parse(body)); }
  @Get(':id/sessions')
  sessions(@Param('id') id: string) { return this.svc.listSessions(id); }
  @UseGuards(AuthGuard('jwt')) @Post(':id/sessions')
  addSession(@Param('id') id: string, @Body() body: any, @Req() req: any) { return this.svc.addSession(id, req.user.userId, SessionDto.parse(body)); }

  // live room / chat
  @Get(':id/messages')
  messages(@Param('id') id: string, @Query('channel') channel: string|undefined) { return this.svc.listMessages(id, channel); }
  @UseGuards(AuthGuard('jwt')) @Post(':id/messages')
  postMessage(@Param('id') id: string, @Body() body: any, @Req() req: any) { return this.svc.postMessage(id, req.user.userId, MessageDto.parse(body)); }
  @UseGuards(AuthGuard('jwt')) @Post(':id/moderate')
  moderate(@Param('id') id: string, @Body() body: any, @Req() req: any) { return this.svc.moderate(id, req.user.userId, ModerationDto.parse(body)); }

  // check-in / feedback
  @UseGuards(AuthGuard('jwt')) @Post(':id/checkin')
  checkIn(@Param('id') id: string, @Body() body: any, @Req() req: any) { return this.svc.checkIn(id, req.user.userId, CheckInDto.parse(body)); }
  @UseGuards(AuthGuard('jwt')) @Get(':id/checkins')
  checkins(@Param('id') id: string, @Req() req: any) { return this.svc.listCheckins(id, req.user.userId); }
  @UseGuards(AuthGuard('jwt')) @Post(':id/feedback')
  feedback(@Param('id') id: string, @Body() body: any, @Req() req: any) { return this.svc.submitFeedback(id, req.user.userId, FeedbackDto.parse(body)); }
  @UseGuards(AuthGuard('jwt')) @Get(':id/feedback')
  listFeedback(@Param('id') id: string, @Req() req: any) { return this.svc.listFeedback(id, req.user.userId); }

  // analytics
  @UseGuards(AuthGuard('jwt')) @Get(':id/summary')
  summary(@Param('id') id: string, @Req() req: any) { return this.svc.summary(id, req.user.userId); }
}
