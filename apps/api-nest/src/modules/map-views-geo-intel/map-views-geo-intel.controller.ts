import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MapViewsGeoIntelService } from './map-views-geo-intel.service';
import {
  PlaceSchema, GeofenceSchema, AudienceSchema, PlaceMediaSchema, SignalSchema, StatusBody, HeatmapQuery,
} from './dto';

@Controller('api/v1/map-views-geo-intel')
@UseGuards(AuthGuard('jwt'))
export class MapViewsGeoIntelController {
  constructor(private readonly svc: MapViewsGeoIntelService) {}
  private reqMeta(req: any) { return { ip: req.ip ?? req.headers?.['x-forwarded-for'], userAgent: req.headers?.['user-agent'] }; }
  private ownerOf(req: any): string { return req.user.orgId ?? req.user.sub; }
  private actorOf(req: any): string { return req.user.sub; }
  private roleOf(req: any): string { return req.user.role ?? 'owner'; }

  @Get('overview') overview(@Req() req: any) { return this.svc.overview(this.ownerOf(req)); }

  // Places
  @Get('places') listPlaces(@Req() req: any, @Query('status') s?: string) { return this.svc.listPlaces(this.ownerOf(req), s); }
  @Get('places/:id') getPlace(@Req() req: any, @Param('id') id: string) { return this.svc.getPlace(this.ownerOf(req), id); }
  @Post('places') createPlace(@Req() req: any, @Body() body: any) {
    return this.svc.createPlace(this.ownerOf(req), PlaceSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('places/:id') updatePlace(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updatePlace(this.ownerOf(req), id, PlaceSchema.partial().parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('places/:id/status') transitionPlace(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.transitionPlace(this.ownerOf(req), id, StatusBody.parse(body).status, this.actorOf(req), this.reqMeta(req));
  }

  // Geofences
  @Get('geofences') listGeofences(@Req() req: any, @Query('status') s?: string) { return this.svc.listGeofences(this.ownerOf(req), s); }
  @Get('geofences/:id') getGeofence(@Req() req: any, @Param('id') id: string) { return this.svc.getGeofence(this.ownerOf(req), id); }
  @Post('geofences') createGeofence(@Req() req: any, @Body() body: any) {
    return this.svc.createGeofence(this.ownerOf(req), GeofenceSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('geofences/:id') updateGeofence(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateGeofence(this.ownerOf(req), id, GeofenceSchema.partial().parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('geofences/:id/status') transitionGeofence(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.transitionGeofence(this.ownerOf(req), id, StatusBody.parse(body).status, this.actorOf(req), this.reqMeta(req));
  }
  @Post('geofences/:id/test') testGeofence(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const { lat, lng } = body ?? {};
    if (typeof lat !== 'number' || typeof lng !== 'number') throw new Error('lat/lng required');
    return this.svc.testGeofence(this.ownerOf(req), id, lat, lng);
  }

  // Audiences
  @Get('audiences') listAudiences(@Req() req: any, @Query('status') s?: string) { return this.svc.listAudiences(this.ownerOf(req), s); }
  @Get('audiences/:id') getAudience(@Req() req: any, @Param('id') id: string) { return this.svc.getAudience(this.ownerOf(req), id); }
  @Post('audiences') createAudience(@Req() req: any, @Body() body: any) {
    return this.svc.createAudience(this.ownerOf(req), AudienceSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('audiences/:id') updateAudience(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateAudience(this.ownerOf(req), id, AudienceSchema.partial().parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('audiences/:id/status') transitionAudience(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.transitionAudience(this.ownerOf(req), id, StatusBody.parse(body).status, this.actorOf(req), this.reqMeta(req));
  }

  // Place media
  @Get('places/:id/media') listPlaceMedia(@Req() req: any, @Param('id') id: string) {
    return this.svc.listPlaceMedia(this.ownerOf(req), id);
  }
  @Post('places/:id/media') createPlaceMedia(@Req() req: any, @Param('id') placeId: string, @Body() body: any) {
    return this.svc.createMedia(this.ownerOf(req), PlaceMediaSchema.parse({ ...body, placeId }), this.actorOf(req), this.reqMeta(req));
  }
  @Patch('media/:id/status') transitionMedia(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.transitionMedia(this.ownerOf(req), id, StatusBody.parse(body).status, this.actorOf(req), this.roleOf(req), this.reqMeta(req));
  }

  // Signals + heatmap
  @Post('signals') ingestSignal(@Req() req: any, @Body() body: any) {
    return this.svc.ingestSignal(this.ownerOf(req), SignalSchema.parse(body), this.actorOf(req), this.reqMeta(req));
  }
  @Get('heatmap') heatmap(@Req() req: any, @Query() q: any) {
    return this.svc.heatmap(this.ownerOf(req), HeatmapQuery.parse(q));
  }
  @Post('heatmap/recompute') recomputeHeatmap(@Req() req: any, @Body() body: any) {
    const resolution = Number(body?.resolution ?? 7);
    if (!(resolution >= 4 && resolution <= 10)) throw new Error('resolution must be 4..10');
    return this.svc.recomputeHeatmap(this.ownerOf(req), resolution);
  }

  @Get('audit') audit(@Req() req: any, @Query('limit') limit?: string) {
    return this.svc.audit(this.ownerOf(req), Math.min(500, Math.max(1, Number(limit) || 200)));
  }
}
