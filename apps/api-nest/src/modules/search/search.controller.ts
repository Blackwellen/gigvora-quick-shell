import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import {
  AutocompleteDto, BulkIndexDto, CrossLinkDto, SaveSearchDto, SearchQueryDto, TrackClickDto,
  UpsertDocumentDto, UpsertShortcutDto,
} from './dto';
import { SearchService } from './search.service';

const uid = (req: Request) => (req as any).user?.userId as string | undefined;

@Controller('search')
export class SearchController {
  constructor(private readonly svc: SearchService) {}

  @Get()
  async search(@Query() q: SearchQueryDto, @Req() req: Request) {
    return this.svc.search({
      q: q.q, scope: q.scope, tags: q.tags, filters: q.filters,
      limit: q.limit ? Number(q.limit) : undefined,
      offset: q.offset ? Number(q.offset) : undefined,
    }, uid(req) ?? null);
  }
  @Get('facets')
  facets(@Query('q') q: string, @Req() req: Request) { return this.svc.facets(q ?? '', uid(req) ?? null); }
  @Get('autocomplete')
  autocomplete(@Query() q: AutocompleteDto) { return this.svc.autocomplete({ ...q, limit: q.limit ? Number(q.limit) : undefined }); }
  @Post('track')
  track(@Body() dto: TrackClickDto, @Req() req: Request) { return this.svc.trackClick(dto, uid(req) ?? null); }
  @Get('trending')
  trending() { return this.svc.trending(); }

  @UseGuards(AuthGuard('jwt')) @Get('recent')
  recent(@Req() req: Request) { return this.svc.recent(uid(req)!); }

  @UseGuards(AuthGuard('jwt')) @Get('saved')
  saved(@Req() req: Request) { return this.svc.listSaved(uid(req)!); }
  @UseGuards(AuthGuard('jwt')) @Post('saved')
  createSaved(@Body() dto: SaveSearchDto, @Req() req: Request) { return this.svc.createSaved(uid(req)!, dto); }
  @UseGuards(AuthGuard('jwt')) @Delete('saved/:id')
  archiveSaved(@Param('id') id: string, @Req() req: Request) { return this.svc.archiveSaved(uid(req)!, id); }

  @Get('palette/actions')
  actions(@Query('roles') roles?: string, @Query('entitlements') ents?: string) {
    return this.svc.listActions((roles ?? 'user').split(','), (ents ?? '').split(',').filter(Boolean));
  }

  @UseGuards(AuthGuard('jwt')) @Get('shortcuts')
  shortcuts(@Req() req: Request) { return this.svc.listShortcuts(uid(req)!); }
  @UseGuards(AuthGuard('jwt')) @Post('shortcuts')
  upsertShortcut(@Body() dto: UpsertShortcutDto, @Req() req: Request) {
    return this.svc.upsertShortcut(uid(req)!, dto.actionId, dto.keybind, dto.disabled);
  }

  @Get('links/:indexName/:id')
  links(@Param('indexName') indexName: string, @Param('id') id: string) {
    return this.svc.linksFor(indexName, id);
  }
  @UseGuards(AuthGuard('jwt')) @Post('links')
  createLink(@Body() dto: CrossLinkDto, @Req() req: Request) { return this.svc.createLink(dto, uid(req) ?? null); }

  @UseGuards(AuthGuard('jwt')) @Post('admin/index')
  index(@Body() dto: UpsertDocumentDto) { return this.svc.upsertDocument(dto); }
  @UseGuards(AuthGuard('jwt')) @Post('admin/bulk-index')
  bulkIndex(@Body() dto: BulkIndexDto) { return this.svc.bulkIndex(dto.docs); }
  @UseGuards(AuthGuard('jwt')) @Post('admin/reconcile')
  reconcile(@Body() dto: { limit?: number }) { return this.svc.reconcile(dto?.limit); }
  @Get('parse/boolean')
  parseBoolean(@Query('q') q: string) { return this.svc.parseBoolean(q ?? ''); }
}