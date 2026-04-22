import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { JobsBrowseService } from './jobs-browse.service';
import { JobBrowseFiltersSchema, SavedSearchSchema } from './dto';

/**
 * Domain 23 — public REST surface.
 * GET  /api/v1/jobs-browse/search       — primary discovery endpoint
 * GET  /api/v1/jobs-browse/insights     — analytics card
 * GET  /api/v1/jobs-browse/saved        — saved-searches for current identity
 * POST /api/v1/jobs-browse/saved        — create/update saved search
 * PUT  /api/v1/jobs-browse/saved/:id    — update
 * DEL  /api/v1/jobs-browse/saved/:id    — remove
 * POST /api/v1/jobs-browse/jobs/:id/save — toggle bookmark
 * GET  /api/v1/jobs-browse/bookmarks    — list bookmarked job ids
 */
@Controller('api/v1/jobs-browse')
export class JobsBrowseController {
  constructor(private readonly svc: JobsBrowseService) {}

  private identityId(req: any): string | undefined { return req?.identityId ?? req?.user?.id; }

  @Get('search')
  async search(@Query() raw: any, @Req() req: any) {
    const f = JobBrowseFiltersSchema.parse({
      ...raw,
      page: raw.page ? Number(raw.page) : undefined,
      pageSize: raw.pageSize ? Number(raw.pageSize) : undefined,
      salaryMin: raw.salaryMin ? Number(raw.salaryMin) : undefined,
      salaryMax: raw.salaryMax ? Number(raw.salaryMax) : undefined,
      type: raw.type ? (Array.isArray(raw.type) ? raw.type : [raw.type]) : undefined,
      skills: raw.skills ? (Array.isArray(raw.skills) ? raw.skills : [raw.skills]) : undefined,
    });
    return this.svc.search(f, this.identityId(req));
  }

  @Get('insights')
  insights(@Req() req: any) { return this.svc.insights(this.identityId(req)); }

  @Get('saved')
  listSaved(@Req() req: any) {
    const id = this.identityId(req); if (!id) return [];
    return this.svc.listSaved(id);
  }

  @Post('saved')
  upsertSaved(@Body() body: any, @Req() req: any) {
    const id = this.identityId(req) ?? 'anonymous';
    return this.svc.upsertSaved(id, SavedSearchSchema.parse(body));
  }

  @Put('saved/:id')
  updateSaved(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const owner = this.identityId(req) ?? 'anonymous';
    return this.svc.upsertSaved(owner, SavedSearchSchema.parse({ ...body, id }));
  }

  @Delete('saved/:id')
  removeSaved(@Param('id') id: string, @Req() req: any) {
    const owner = this.identityId(req) ?? 'anonymous';
    return { removed: this.svc.removeSaved(owner, id) };
  }

  @Post('jobs/:id/save')
  toggleBookmark(@Param('id') id: string, @Req() req: any) {
    return this.svc.toggleSaveJob(this.identityId(req) ?? 'anonymous', id);
  }

  @Get('bookmarks')
  bookmarks(@Req() req: any) {
    const id = this.identityId(req); if (!id) return [];
    return this.svc.savedJobIds(id);
  }
}
