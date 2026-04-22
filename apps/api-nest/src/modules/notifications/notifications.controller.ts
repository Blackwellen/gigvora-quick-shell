import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import {
  CreateNotificationDto, ListNotificationsDto, MarkReadDto,
  UpsertPreferenceDto, RegisterDeviceDto, CreateWebhookDto, EmitActivityDto,
} from './dto';

interface AuthedReq { user: { sub: string } }

/** /api/v1/notifications — bell-icon, badges, prefs, devices, activity, webhooks. */
@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get()                          list(@Req() r: AuthedReq, @Query() q: ListNotificationsDto)         { return this.svc.list(r.user.sub, q); }
  @Get('unread-count')            unread(@Req() r: AuthedReq)                                          { return this.svc.unreadCount(r.user.sub).then(c => ({ count: c })); }
  @Post()                         create(@Body() dto: CreateNotificationDto)                           { return this.svc.create(dto); }
  @Post('mark-read')              markRead(@Req() r: AuthedReq, @Body() dto: MarkReadDto)              { return this.svc.markRead(r.user.sub, dto); }
  @Post('mark-all-read')          markAllRead(@Req() r: AuthedReq)                                     { return this.svc.markAllRead(r.user.sub); }
  @Post(':id/dismiss')            dismiss(@Req() r: AuthedReq, @Param('id') id: string)                { return this.svc.dismiss(r.user.sub, id); }
  @Get(':id/deliveries')          deliveries(@Param('id') id: string)                                  { return this.svc.listDeliveries(id); }

  @Get('prefs')                   prefs(@Req() r: AuthedReq)                                           { return this.svc.listPreferences(r.user.sub); }
  @Post('prefs')                  upsertPref(@Req() r: AuthedReq, @Body() dto: UpsertPreferenceDto)    { return this.svc.upsertPreference(r.user.sub, dto); }

  @Get('devices')                 devices(@Req() r: AuthedReq)                                         { return this.svc.listDevices(r.user.sub); }
  @Post('devices')                registerDevice(@Req() r: AuthedReq, @Body() dto: RegisterDeviceDto)  { return this.svc.registerDevice(r.user.sub, dto); }
  @Delete('devices/:token')       revokeDevice(@Req() r: AuthedReq, @Param('token') t: string)         { return this.svc.revokeDevice(r.user.sub, t); }

  @Get('badges')                  badges(@Req() r: AuthedReq)                                          { return this.svc.listBadges(r.user.sub); }

  @Get('activity')                activity(@Req() r: AuthedReq, @Query('limit') limit?: string)        { return this.svc.listActivity(r.user.sub, limit ? +limit : 50); }
  @Post('activity')               emitActivity(@Req() r: AuthedReq, @Body() dto: EmitActivityDto)      { return this.svc.emitActivity(r.user.sub, dto); }

  @Get('webhooks')                listWebhooks(@Req() r: AuthedReq)                                    { return this.svc.listWebhooks(r.user.sub); }
  @Post('webhooks')               createWebhook(@Req() r: AuthedReq, @Body() dto: CreateWebhookDto)    { return this.svc.createWebhook(r.user.sub, dto); }
  @Delete('webhooks/:id')         revokeWebhook(@Req() r: AuthedReq, @Param('id') id: string)          { return this.svc.revokeWebhook(r.user.sub, id); }
}
