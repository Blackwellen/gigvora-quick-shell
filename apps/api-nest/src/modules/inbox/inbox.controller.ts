import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InboxService } from './inbox.service';
import {
  CreateThreadDto, EditMessageDto, LinkContextDto, ListMessagesQuery, ListThreadsQuery,
  ParticipantsAddDto, PresenceQuery, ReactToMessageDto, ReadReceiptDto, SearchMessagesQuery,
  SendMessageDto, ThreadPriorityDto, ThreadStateDto, TypingDto,
} from './dto';

@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/inbox')
export class InboxController {
  constructor(private readonly svc: InboxService) {}

  // ---------- threads ----------
  @Get('threads')
  list(@Query() q: any, @Req() req: any) {
    return this.svc.listThreads(req.user.userId, ListThreadsQuery.parse(q));
  }
  @Get('threads/:id')
  get(@Param('id') id: string, @Req() req: any) { return this.svc.getThread(id, req.user.userId); }
  @Post('threads')
  create(@Body() body: any, @Req() req: any) { return this.svc.createThread(req.user.userId, CreateThreadDto.parse(body)); }
  @Patch('threads/:id/state')
  state(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.setThreadState(id, req.user.userId, ThreadStateDto.parse(body).state);
  }
  @Patch('threads/:id/priority')
  priority(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.setThreadPriority(id, req.user.userId, ThreadPriorityDto.parse(body).priority);
  }

  // ---------- participants ----------
  @Post('threads/:id/participants')
  addParticipants(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const dto = ParticipantsAddDto.parse(body);
    return this.svc.addParticipants(id, req.user.userId, dto.participantIds, dto.role);
  }
  @Delete('threads/:id/participants/:userId')
  removeParticipant(@Param('id') id: string, @Param('userId') userId: string, @Req() req: any) {
    return this.svc.removeParticipant(id, req.user.userId, userId);
  }
  @Post('threads/:id/mute')
  mute(@Param('id') id: string, @Body() body: { muted: boolean }, @Req() req: any) {
    return this.svc.setMute(id, req.user.userId, !!body?.muted);
  }

  // ---------- messages ----------
  @Get('threads/:id/messages')
  messages(@Param('id') id: string, @Query() q: any, @Req() req: any) {
    return this.svc.listMessages(id, req.user.userId, ListMessagesQuery.parse(q));
  }
  @Post('threads/:id/messages')
  send(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.sendMessage(id, req.user.userId, SendMessageDto.parse(body));
  }
  @Patch('threads/:id/messages/:messageId')
  edit(@Param('id') id: string, @Param('messageId') messageId: string, @Body() body: any, @Req() req: any) {
    return this.svc.editMessage(id, messageId, req.user.userId, EditMessageDto.parse(body).body);
  }
  @Delete('threads/:id/messages/:messageId')
  del(@Param('id') id: string, @Param('messageId') messageId: string, @Req() req: any) {
    return this.svc.deleteMessage(id, messageId, req.user.userId);
  }
  @Post('threads/:id/messages/:messageId/react')
  react(@Param('id') id: string, @Param('messageId') messageId: string, @Body() body: any, @Req() req: any) {
    return this.svc.react(id, messageId, req.user.userId, ReactToMessageDto.parse(body).emoji);
  }

  // ---------- read receipts ----------
  @Post('threads/:id/read')
  read(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.markRead(id, req.user.userId, ReadReceiptDto.parse(body).uptoMessageId);
  }
  @Get('digest/unread')
  digest(@Req() req: any) { return this.svc.unreadDigest(req.user.userId); }

  // ---------- contexts ----------
  @Post('threads/:id/contexts')
  linkContext(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.linkContext(id, req.user.userId, LinkContextDto.parse(body));
  }
  @Delete('threads/:id/contexts/:kind/:contextId')
  unlinkContext(@Param('id') id: string, @Param('kind') kind: string, @Param('contextId') contextId: string, @Req() req: any) {
    return this.svc.unlinkContext(id, req.user.userId, kind, contextId);
  }

  // ---------- typing + presence ----------
  @Post('threads/:id/typing')
  typing(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.setTyping(id, req.user.userId, TypingDto.parse(body).isTyping);
  }
  @Get('presence')
  presence(@Query() q: any) { return this.svc.getPresence(PresenceQuery.parse(q).userIds); }

  // ---------- search + shared files + insights ----------
  @Get('search/messages')
  search(@Query() q: any, @Req() req: any) { return this.svc.searchMessages(req.user.userId, SearchMessagesQuery.parse(q)); }
  @Get('threads/:id/files')
  sharedFiles(@Param('id') id: string, @Req() req: any) { return this.svc.sharedFiles(id, req.user.userId); }
  @Get('insights')
  insights(@Req() req: any) { return this.svc.insights(req.user.userId); }
}
