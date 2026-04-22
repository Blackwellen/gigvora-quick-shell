import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { GigsBrowseService } from './gigs-browse.service';
import { GigBrowseFiltersSchema, GigSavedSearchSchema } from './dto';

/**
 * Domain 41 — public REST surface for Gigs Browse, Search, Marketplace Discovery.
 *
 *  GET    /api/v1/gigs-browse/search        — primary discovery endpoint
 *  GET    /api/v1/gigs-browse/insights      — analytics card
 *  GET    /api/v1/gigs-browse/:idOrSlug     — gig detail with packages/addons
 *  GET    /api/v1/gigs-browse/saved         — saved-searches for current identity
 *  POST   /api/v1/gigs-browse/saved         — create/update saved search (idempotent on label)
 *  PUT    /api/v1/gigs-browse/saved/:id     — update
 *  DELETE /api/v1/gigs-browse/saved/:id     — remove
 *  POST   /api/v1/gigs-browse/:id/bookmark  — toggle bookmark
 *  GET    /api/v1/gigs-browse/bookmarks     — list bookmarked gig ids
 */
@Controller('api/v1/gigs-browse')
export class GigsBrowseController {
  constructor(private readonly svc: GigsBrowseService) {}

  private identityId(req: any): string | undefined { return req?.identityId ?? req?.user?.id; }

  @Get('search')
  search(@Query() raw: any, @Req() req: any) {
    const f = GigBrowseFiltersSchema.parse({
      ...raw,
      page: raw.page ? Number(raw.page) : undefined,
      pageSize: raw.pageSize ? Number(raw.pageSize) : undefined,
      priceMin: raw.priceMin ? Number(raw.priceMin) : undefined,
      priceMax: raw.priceMax ? Number(raw.priceMax) : undefined,
      ratingMin: raw.ratingMin ? Number(raw.ratingMin) : undefined,
      deliveryDaysMax: raw.deliveryDaysMax ? Number(raw.deliveryDaysMax) : undefined,
      proSellerOnly: raw.proSellerOnly === 'true' || raw.proSellerOnly === true,
      fastDeliveryOnly: raw.fastDeliveryOnly === 'true' || raw.fastDeliveryOnly === true,
      acceptsRevisionsOnly: raw.acceptsRevisionsOnly === 'true' || raw.acceptsRevisionsOnly === true,
      skills: raw.skills ? (Array.isArray(raw.skills) ? raw.skills : [raw.skills]) : undefined,
      languages: raw.languages ? (Array.isArray(raw.languages) ? raw.languages : [raw.languages]) : undefined,
      industries: raw.industries ? (Array.isArray(raw.industries) ? raw.industries : [raw.industries]) : undefined,
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
    return this.svc.upsertSaved(id, GigSavedSearchSchema.parse(body));
  }

  @Put('saved/:id')
  updateSaved(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const owner = this.identityId(req) ?? 'anonymous';
    return this.svc.upsertSaved(owner, GigSavedSearchSchema.parse({ ...body, id }));
  }

  @Delete('saved/:id')
  removeSaved(@Param('id') id: string, @Req() req: any) {
    const owner = this.identityId(req) ?? 'anonymous';
    return { removed: this.svc.removeSaved(owner, id) };
  }

  @Post(':idOrSlug/bookmark')
  toggleBookmark(@Param('idOrSlug') idOrSlug: string, @Req() req: any) {
    return this.svc.toggleBookmark(this.identityId(req) ?? 'anonymous', idOrSlug);
  }

  @Get('bookmarks')
  bookmarks(@Req() req: any) {
    const id = this.identityId(req); if (!id) return [];
    return this.svc.bookmarkIds(id);
  }

  // Detail comes last so /search /saved /insights /bookmarks aren't shadowed.
  @Get(':idOrSlug')
  detail(@Param('idOrSlug') idOrSlug: string, @Req() req: any) {
    return this.svc.detail(idOrSlug, this.identityId(req));
  }
}
