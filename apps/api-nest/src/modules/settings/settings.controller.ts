import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SettingsService } from './settings.service';
import {
  BulkUpsertSettingsDto, CreateConnectedAccountDto, CreateDataRequestDto,
  ResetNamespaceDto, SettingNamespace, UpsertSettingDto,
} from './dto';

interface AuthedReq { user: { sub: string } }

/** /api/v1/settings — preferences, locale catalogue, connections, GDPR requests. */
@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/settings')
export class SettingsController {
  constructor(private readonly svc: SettingsService) {}

  // settings
  @Get()                           list(@Req() r: AuthedReq, @Query('namespace') ns?: SettingNamespace)   { return this.svc.list(r.user.sub, ns); }
  @Get(':namespace/:key')          one(@Req() r: AuthedReq, @Param('namespace') ns: string, @Param('key') k: string) { return this.svc.getOne(r.user.sub, ns, k); }
  @Post()                          upsert(@Req() r: AuthedReq, @Body() dto: UpsertSettingDto)             { return this.svc.upsert(r.user.sub, dto); }
  @Post('bulk')                    bulk(@Req() r: AuthedReq, @Body() dto: BulkUpsertSettingsDto)          { return this.svc.bulkUpsert(r.user.sub, dto); }
  @Post('reset')                   reset(@Req() r: AuthedReq, @Body() dto: ResetNamespaceDto)             { return this.svc.resetNamespace(r.user.sub, dto); }
  @Get('audit/log')                audit(@Req() r: AuthedReq, @Query('limit') l?: string)                  { return this.svc.audit(r.user.sub, l ? +l : 50); }

  // catalogue
  @Get('catalogue/locales')        locales()    { return this.svc.listLocales(); }
  @Get('catalogue/timezones')      timezones()  { return this.svc.listTimezones(); }

  // connected accounts
  @Get('connections')              listConn(@Req() r: AuthedReq)                                          { return this.svc.listConnectedAccounts(r.user.sub); }
  @Post('connections')             createConn(@Req() r: AuthedReq, @Body() dto: CreateConnectedAccountDto){ return this.svc.createConnectedAccount(r.user.sub, dto); }
  @Delete('connections/:id')       revokeConn(@Req() r: AuthedReq, @Param('id') id: string)                { return this.svc.revokeConnectedAccount(r.user.sub, id); }

  // data requests (GDPR)
  @Get('data-requests')            listData(@Req() r: AuthedReq)                                          { return this.svc.listDataRequests(r.user.sub); }
  @Post('data-requests')           createData(@Req() r: AuthedReq, @Body() dto: CreateDataRequestDto)     { return this.svc.createDataRequest(r.user.sub, dto); }
}
