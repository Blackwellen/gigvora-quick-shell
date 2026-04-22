import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NetworkingEventsGroupsService } from './networking-events-groups.service';
import {
  RoomCreateSchema, RoomStatusBody, RoomJoinBody, SpeedRoundBody, ShareCardBody,
  BusinessCardSchema, EventSchema, EventStatusBody, RsvpBody,
  GroupSchema, GroupPostSchema,
} from './dto';

@Controller('api/v1/networking-events-groups')
@UseGuards(AuthGuard('jwt'))
export class NetworkingEventsGroupsController {
  constructor(private readonly svc: NetworkingEventsGroupsService) {}
  private meta(req: any) { return { ip: req.ip ?? req.headers?.['x-forwarded-for'], userAgent: req.headers?.['user-agent'] }; }
  private actor(req: any): string { return req.user.sub; }
  private role(req: any): string { return req.user.role ?? 'user'; }

  // Rooms
  @Get('rooms') rooms(@Query('kind') kind?: string, @Query('status') status?: string) {
    return this.svc.listRooms({ kind, status });
  }
  @Get('rooms/mine') myRooms(@Req() req: any) { return this.svc.listRooms({ ownerId: this.actor(req) }); }
  @Post('rooms') createRoom(@Req() req: any, @Body() body: any) {
    return this.svc.createRoom(this.actor(req), RoomCreateSchema.parse(body), this.role(req), this.meta(req));
  }
  @Patch('rooms/:id/status') transitionRoom(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.transitionRoom(this.actor(req), id, RoomStatusBody.parse(body).status, this.role(req), this.meta(req));
  }
  @Post('rooms/:id/join') joinRoom(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.joinRoom(this.actor(req), id, RoomJoinBody.parse(body).asRole, this.role(req), this.meta(req));
  }

  // Speed networking
  @Post('rooms/:id/speed-round') speedRound(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.runSpeedRound(this.actor(req), id, SpeedRoundBody.parse(body).roundIndex, this.role(req), this.meta(req));
  }
  @Get('rooms/:id/speed-matches') speedMatches(@Param('id') id: string, @Query('round') r?: string) {
    return this.svc.listSpeedMatches(id, r != null ? Number(r) : undefined);
  }

  // Cards
  @Get('cards/me') myCard(@Req() req: any) { return this.svc.getMyCard(this.actor(req)); }
  @Post('cards') upsertCard(@Req() req: any, @Body() body: any) {
    return this.svc.upsertMyCard(this.actor(req), BusinessCardSchema.parse(body), this.role(req), this.meta(req));
  }
  @Post('cards/share') shareCard(@Req() req: any, @Body() body: any) {
    return this.svc.shareMyCard(this.actor(req), ShareCardBody.parse(body), this.role(req), this.meta(req));
  }
  @Get('cards/received') received(@Req() req: any) { return this.svc.receivedCards(this.actor(req)); }

  // Events
  @Get('events/public') publicEvents(@Req() req: any, @Query('status') s?: string) { return this.svc.listEvents(this.actor(req), 'public', s); }
  @Get('events/mine') myEvents(@Req() req: any, @Query('status') s?: string) { return this.svc.listEvents(this.actor(req), 'mine', s); }
  @Get('events/:id') getEvent(@Param('id') id: string) { return this.svc.getEvent(id); }
  @Post('events') createEvent(@Req() req: any, @Body() body: any) {
    return this.svc.createEvent(this.actor(req), EventSchema.parse(body), this.role(req), this.meta(req));
  }
  @Patch('events/:id/status') transitionEvent(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.transitionEvent(this.actor(req), id, EventStatusBody.parse(body).status, this.role(req), this.meta(req));
  }
  @Post('events/:id/rsvp') rsvp(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.rsvp(this.actor(req), id, RsvpBody.parse(body).status, this.role(req), this.meta(req));
  }

  // Groups
  @Get('groups') groups(@Req() req: any, @Query('q') q?: string, @Query('mine') mine?: string) {
    return this.svc.listGroups(this.actor(req), { q, mineOnly: mine === '1' || mine === 'true' });
  }
  @Get('groups/:id') getGroup(@Param('id') id: string) { return this.svc.getGroup(id); }
  @Post('groups') createGroup(@Req() req: any, @Body() body: any) {
    return this.svc.createGroup(this.actor(req), GroupSchema.parse(body), this.role(req), this.meta(req));
  }
  @Post('groups/:id/join') joinGroup(@Req() req: any, @Param('id') id: string) {
    return this.svc.joinGroup(this.actor(req), id, this.role(req), this.meta(req));
  }
  @Get('groups/:id/members') members(@Param('id') id: string) { return this.svc.listMembers(id); }
  @Get('groups/:id/posts') posts(@Param('id') id: string) { return this.svc.listPosts(id); }
  @Post('groups/:id/posts') createPost(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.createPost(this.actor(req), id, GroupPostSchema.parse(body), this.role(req), this.meta(req));
  }
}
