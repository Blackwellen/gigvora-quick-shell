import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GroupsService } from './groups.service';
import {
  ChannelDto, CommentDto, CreateGroupDto, EventDto, InviteDto, JoinRequestDecisionDto,
  ListGroupsQuery, ModerationActionDto, PostDto, ReportDto, SetRoleDto, UpdateGroupDto, UpdatePostDto,
} from './dto';

@Controller('api/v1/groups')
export class GroupsController {
  constructor(private readonly svc: GroupsService) {}

  // ---------- discovery ----------
  @Get()
  list(@Query() q: any, @Req() req: any) {
    return this.svc.list(req.user?.userId ?? null, ListGroupsQuery.parse(q));
  }
  @Get(':idOrSlug')
  detail(@Param('idOrSlug') id: string, @Req() req: any) {
    return this.svc.detail(id, req.user?.userId ?? null);
  }

  // ---------- owner CRUD ----------
  @UseGuards(AuthGuard('jwt')) @Post()
  create(@Body() body: any, @Req() req: any) { return this.svc.create(req.user.userId, CreateGroupDto.parse(body)); }
  @UseGuards(AuthGuard('jwt')) @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.update(id, req.user.userId, UpdateGroupDto.parse(body));
  }
  @UseGuards(AuthGuard('jwt')) @Post(':id/pause')
  pause(@Param('id') id: string, @Req() req: any)   { return this.svc.pause(id, req.user.userId); }
  @UseGuards(AuthGuard('jwt')) @Delete(':id')
  archive(@Param('id') id: string, @Req() req: any) { return this.svc.archive(id, req.user.userId); }
  @UseGuards(AuthGuard('jwt')) @Post(':id/restore')
  restore(@Param('id') id: string, @Req() req: any) { return this.svc.restore(id, req.user.userId); }

  // ---------- membership ----------
  @Get(':id/members')
  members(@Param('id') id: string, @Req() req: any) { return this.svc.listMembers(id, req.user?.userId ?? null); }
  @UseGuards(AuthGuard('jwt')) @Post(':id/join')
  join(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.join(id, req.user.userId, body?.message);
  }
  @UseGuards(AuthGuard('jwt')) @Post(':id/leave')
  leave(@Param('id') id: string, @Req() req: any) { return this.svc.leave(id, req.user.userId); }
  @UseGuards(AuthGuard('jwt')) @Patch(':id/members/:identityId')
  setRole(@Param('id') id: string, @Param('identityId') identityId: string, @Body() body: any, @Req() req: any) {
    const { role } = SetRoleDto.parse(body);
    return this.svc.setRole(id, req.user.userId, identityId, role);
  }
  @UseGuards(AuthGuard('jwt')) @Delete(':id/members/:identityId')
  removeMember(@Param('id') id: string, @Param('identityId') identityId: string, @Req() req: any) {
    return this.svc.removeMember(id, req.user.userId, identityId);
  }

  // ---------- join requests ----------
  @UseGuards(AuthGuard('jwt')) @Get(':id/requests')
  listRequests(@Param('id') id: string, @Req() req: any) { return this.svc.listJoinRequests(id, req.user.userId); }
  @UseGuards(AuthGuard('jwt')) @Post(':id/requests/:requestId/decide')
  decideRequest(@Param('id') id: string, @Param('requestId') requestId: string, @Body() body: any, @Req() req: any) {
    const d = JoinRequestDecisionDto.parse(body);
    return this.svc.decideJoinRequest(id, req.user.userId, requestId, d.decision, d.reason);
  }

  // ---------- channels ----------
  @Get(':id/channels')
  channels(@Param('id') id: string, @Req() req: any) { return this.svc.listChannels(id, req.user?.userId ?? null); }
  @UseGuards(AuthGuard('jwt')) @Post(':id/channels')
  addChannel(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.addChannel(id, req.user.userId, ChannelDto.parse(body));
  }

  // ---------- posts ----------
  @Get(':id/posts')
  posts(@Param('id') id: string, @Query('channelId') channelId: string|undefined, @Query('limit') limit: string|undefined, @Query('cursor') cursor: string|undefined, @Req() req: any) {
    return this.svc.listPosts(id, req.user?.userId ?? null, {
      channelId: channelId ?? null,
      limit: limit ? Math.min(100, parseInt(limit, 10)) : 20,
      cursor: cursor ?? null,
    });
  }
  @UseGuards(AuthGuard('jwt')) @Post(':id/posts')
  addPost(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.addPost(id, req.user.userId, PostDto.parse(body));
  }
  @UseGuards(AuthGuard('jwt')) @Patch(':id/posts/:postId')
  updatePost(@Param('id') id: string, @Param('postId') postId: string, @Body() body: any, @Req() req: any) {
    return this.svc.updatePost(id, req.user.userId, postId, UpdatePostDto.parse(body));
  }
  @UseGuards(AuthGuard('jwt')) @Post(':id/posts/:postId/moderate')
  moderate(@Param('id') id: string, @Param('postId') postId: string, @Body() body: any, @Req() req: any) {
    const a = ModerationActionDto.parse(body);
    return this.svc.moderatePost(id, req.user.userId, postId, a.action, a.reason);
  }

  // ---------- reactions / comments ----------
  @UseGuards(AuthGuard('jwt')) @Post(':id/posts/:postId/reactions')
  react(@Param('postId') postId: string, @Body() body: any, @Req() req: any) {
    return this.svc.toggleReaction(postId, req.user.userId, String(body?.emoji ?? '👍').slice(0, 4));
  }
  @Get(':id/posts/:postId/comments')
  comments(@Param('postId') postId: string) { return this.svc.listComments(postId); }
  @UseGuards(AuthGuard('jwt')) @Post(':id/posts/:postId/comments')
  addComment(@Param('id') id: string, @Param('postId') postId: string, @Body() body: any, @Req() req: any) {
    return this.svc.addComment(id, req.user.userId, postId, CommentDto.parse(body));
  }

  // ---------- events ----------
  @Get(':id/events')
  events(@Param('id') id: string, @Req() req: any) { return this.svc.listEvents(id, req.user?.userId ?? null); }
  @UseGuards(AuthGuard('jwt')) @Post(':id/events')
  addEvent(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.addEvent(id, req.user.userId, EventDto.parse(body));
  }
  @UseGuards(AuthGuard('jwt')) @Post(':id/events/:eventId/rsvp')
  rsvp(@Param('id') id: string, @Param('eventId') eventId: string, @Body() body: any, @Req() req: any) {
    return this.svc.rsvp(id, req.user.userId, eventId, (body?.status ?? 'going'));
  }

  // ---------- invites ----------
  @UseGuards(AuthGuard('jwt')) @Post(':id/invites')
  invite(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.createInvites(id, req.user.userId, InviteDto.parse(body));
  }
  @UseGuards(AuthGuard('jwt')) @Get(':id/invites')
  invites(@Param('id') id: string, @Req() req: any) { return this.svc.listInvites(id, req.user.userId); }

  // ---------- reports ----------
  @UseGuards(AuthGuard('jwt')) @Post(':id/reports')
  report(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const targetType = (body?.targetType ?? 'post') as 'post'|'comment'|'member';
    const targetId   = String(body?.targetId ?? '');
    return this.svc.createReport(id, req.user.userId, targetType, targetId, ReportDto.parse(body));
  }
  @UseGuards(AuthGuard('jwt')) @Get(':id/reports')
  listReports(@Param('id') id: string, @Query('status') status: string|undefined, @Req() req: any) {
    return this.svc.listReports(id, req.user.userId, (status === 'all' ? 'all' : 'open'));
  }
  @UseGuards(AuthGuard('jwt')) @Post(':id/reports/:reportId/resolve')
  resolveReport(@Param('id') id: string, @Param('reportId') reportId: string, @Body() body: any, @Req() req: any) {
    return this.svc.resolveReport(id, req.user.userId, reportId, (body?.status === 'dismissed' ? 'dismissed' : 'resolved'));
  }

  // ---------- analytics ----------
  @UseGuards(AuthGuard('jwt')) @Get(':id/summary')
  summary(@Param('id') id: string, @Req() req: any) { return this.svc.summary(id, req.user.userId); }
}
