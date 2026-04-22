import { Module } from '@nestjs/common';
import { MapViewsGeoIntelController } from './map-views-geo-intel.controller';
import { MapViewsGeoIntelService } from './map-views-geo-intel.service';
import { MapViewsGeoIntelRepository } from './map-views-geo-intel.repository';

@Module({
  controllers: [MapViewsGeoIntelController],
  providers: [MapViewsGeoIntelService, MapViewsGeoIntelRepository],
  exports: [MapViewsGeoIntelService],
})
export class MapViewsGeoIntelModule {}
