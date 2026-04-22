import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { SellerPerformanceService } from './seller-performance.service';
import {
  GigCapacityUpdateDto, OptimizationActionDto, ScheduleVacationDto, UpdateAvailabilityDto,
} from './dto';

@Controller('seller-performance')
export class SellerPerformanceController {
  constructor(private readonly svc: SellerPerformanceService) {}

  private actor(req: any): string {
    return req.user?.id ?? req.headers['x-user-id'] ?? 'demo-seller';
  }

  @Get(':sellerId/overview')
  overview(@Param('sellerId') sellerId: string) {
    return this.svc.getOverview(sellerId);
  }

  @Put(':sellerId/availability')
  updateAvailability(@Param('sellerId') sellerId: string, @Body() body: unknown, @Req() req: any) {
    const input = UpdateAvailabilityDto.parse(body);
    return this.svc.updateAvailability(sellerId, input, this.actor(req));
  }

  @Post(':sellerId/vacation')
  vacation(@Param('sellerId') sellerId: string, @Body() body: unknown, @Req() req: any) {
    const input = ScheduleVacationDto.parse(body);
    return this.svc.scheduleVacation(sellerId, input, this.actor(req));
  }

  @Post(':sellerId/pause-all')
  pauseAll(@Param('sellerId') sellerId: string, @Req() req: any) {
    return this.svc.pauseAllGigs(sellerId, this.actor(req));
  }

  @Put(':sellerId/gigs/:gigId/capacity')
  gigCapacity(
    @Param('sellerId') sellerId: string,
    @Param('gigId') gigId: string,
    @Body() body: unknown,
    @Req() req: any,
  ) {
    const input = GigCapacityUpdateDto.parse(body);
    return this.svc.updateGigCapacity(sellerId, gigId, input, this.actor(req));
  }

  @Post(':sellerId/optimizations/:id')
  optimization(
    @Param('sellerId') sellerId: string,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: any,
  ) {
    const input = OptimizationActionDto.parse(body);
    return this.svc.actOnOptimization(sellerId, id, input.action, this.actor(req));
  }
}
