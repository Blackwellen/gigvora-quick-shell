import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NetworkService } from './network.service';
import { CreateRequestDto, ListQueryDto, RespondRequestDto, SuggestionsQueryDto } from './dto';

interface AuthedReq { user: { sub: string } }

/** /api/v1/network — connection requests, connections, degree, mutuals, suggestions, blocks. */
@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/network')
export class NetworkController {
  constructor(private readonly svc: NetworkService) {}

  // requests
  @Post('requests')                  send(@Req() r: AuthedReq, @Body() dto: CreateRequestDto)            { return this.svc.send(r.user.sub, dto); }
  @Get('requests/incoming')          incoming(@Req() r: AuthedReq, @Query() q: ListQueryDto)             { return this.svc.incoming(r.user.sub, q.status, q.limit); }
  @Get('requests/outgoing')          outgoing(@Req() r: AuthedReq, @Query() q: ListQueryDto)             { return this.svc.outgoing(r.user.sub, q.status, q.limit); }
  @Post('requests/:id/respond')      respond(@Req() r: AuthedReq, @Param('id') id: string, @Body() dto: RespondRequestDto) { return this.svc.respond(r.user.sub, id, dto); }
  @Delete('requests/:id')            withdraw(@Req() r: AuthedReq, @Param('id') id: string)              { return this.svc.withdraw(r.user.sub, id); }

  // connections
  @Get('connections')                list(@Req() r: AuthedReq, @Query('limit') l?: string)               { return this.svc.list(r.user.sub, l ? +l : 100); }
  @Get('connections/count')          count(@Req() r: AuthedReq)                                          { return this.svc.count(r.user.sub).then(n => ({ count: n })); }
  @Delete('connections/:id')         remove(@Req() r: AuthedReq, @Param('id') id: string)                { return this.svc.remove(r.user.sub, id); }

  // degree / mutuals / suggestions
  @Get('degree/:id')                 degree(@Req() r: AuthedReq, @Param('id') id: string)                { return this.svc.degree(r.user.sub, id); }
  @Get('mutuals/:id')                mutuals(@Req() r: AuthedReq, @Param('id') id: string, @Query('limit') l?: string) { return this.svc.mutuals(r.user.sub, id, l ? +l : 20); }
  @Get('suggestions')                suggestions(@Req() r: AuthedReq, @Query() q: SuggestionsQueryDto)   { return this.svc.suggestions(r.user.sub, q); }

  // blocks
  @Post('blocks/:id')                block(@Req() r: AuthedReq, @Param('id') id: string, @Body() body?: { reason?: string }) { return this.svc.block(r.user.sub, id, body?.reason); }
  @Delete('blocks/:id')              unblock(@Req() r: AuthedReq, @Param('id') id: string)               { return this.svc.unblock(r.user.sub, id); }
  @Get('blocks')                     blocks(@Req() r: AuthedReq)                                         { return this.svc.blocks(r.user.sub); }

  // operator override
  @Post('recompute')                 recompute(@Req() r: AuthedReq)                                      { return this.svc.recompute(r.user.sub).then(() => ({ ok: true })); }
}
