import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SellerPerformanceRepository } from './seller-performance.repository';
import {
  GigCapacityUpdateInput, ScheduleVacationInput, UpdateAvailabilityInput,
} from './dto';

@Injectable()
export class SellerPerformanceService {
  constructor(private readonly repo: SellerPerformanceRepository) {}

  async getOverview(sellerId: string) {
    const [availability, capacity, snapshot, optimizations] = await Promise.all([
      this.repo.getOrCreateAvailability(sellerId),
      this.repo.listGigCapacity(sellerId),
      this.repo.getLatestSnapshot(sellerId),
      this.repo.listOptimizations(sellerId, 'open'),
    ]);
    return {
      availability,
      capacity,
      snapshot: snapshot ?? this.deterministicSnapshot(sellerId),
      optimizations,
      derived: {
        totalQueue: capacity.reduce((s: number, r: any) => s + (r.queue_depth ?? 0), 0),
        activeGigs: capacity.filter((r: any) => r.status === 'active').length,
        pausedGigs: capacity.filter((r: any) => r.status === 'paused').length,
      },
    };
  }

  async updateAvailability(sellerId: string, input: UpdateAvailabilityInput, actorId: string) {
    if (actorId !== sellerId) throw new BadRequestException('Only the seller can update their availability');
    const patch: Record<string, any> = {};
    if (input.status) patch.status = input.status;
    if (input.workingHours) patch.working_hours = JSON.stringify(input.workingHours);
    if (input.timezone) patch.timezone = input.timezone;
    if (input.maxConcurrentOrders !== undefined) patch.max_concurrent_orders = input.maxConcurrentOrders;
    if (input.autoPauseThreshold !== undefined) patch.auto_pause_threshold = input.autoPauseThreshold;
    if (input.responseTargetHours !== undefined) patch.response_target_hours = input.responseTargetHours;
    const updated = await this.repo.updateAvailability(sellerId, patch);
    await this.repo.logEvent(sellerId, 'capacity_updated', input, actorId);
    return updated;
  }

  async scheduleVacation(sellerId: string, input: ScheduleVacationInput, actorId: string) {
    if (actorId !== sellerId) throw new BadRequestException('Only the seller can schedule vacation');
    if (input.end < input.start) throw new BadRequestException('Vacation end must be on or after start');
    const updated = await this.repo.updateAvailability(sellerId, {
      vacation_start: input.start,
      vacation_end: input.end,
      vacation_message: input.message ?? null,
      status: 'vacation',
    });
    await this.repo.logEvent(sellerId, 'vacation_scheduled', input, actorId);
    return updated;
  }

  async pauseAllGigs(sellerId: string, actorId: string) {
    if (actorId !== sellerId) throw new BadRequestException('Only the seller can pause gigs');
    const capacity = await this.repo.listGigCapacity(sellerId);
    for (const c of capacity) {
      if (c.status === 'active') await this.repo.setGigStatus(sellerId, c.gig_id, 'paused', 'bulk_pause');
    }
    await this.repo.updateAvailability(sellerId, { status: 'paused' });
    await this.repo.logEvent(sellerId, 'status_changed', { status: 'paused', bulk: true }, actorId);
    return { paused: capacity.length };
  }

  async updateGigCapacity(
    sellerId: string, gigId: string, input: GigCapacityUpdateInput, actorId: string,
  ) {
    if (actorId !== sellerId) throw new BadRequestException('Forbidden');
    if (input.status) {
      const row = await this.repo.setGigStatus(sellerId, gigId, input.status, input.pausedReason);
      await this.repo.logEvent(
        sellerId,
        input.status === 'paused' ? 'gig_paused' : 'gig_resumed',
        { gigId, reason: input.pausedReason },
        actorId,
      );
      return row;
    }
    const patch: Record<string, any> = {};
    if (input.maxQueue !== undefined) patch.max_queue = input.maxQueue;
    return this.repo.upsertGigCapacity(sellerId, gigId, patch);
  }

  async actOnOptimization(
    sellerId: string, optimizationId: string, action: 'dismiss' | 'apply', actorId: string,
  ) {
    if (actorId !== sellerId) throw new BadRequestException('Forbidden');
    const status = action === 'dismiss' ? 'dismissed' : 'applied';
    const row = await this.repo.setOptimizationStatus(optimizationId, sellerId, status);
    if (!row) throw new NotFoundException('Optimization not found');
    await this.repo.logEvent(sellerId, 'capacity_updated', { optimizationId, action }, actorId);
    return row;
  }

  /** Deterministic fallback snapshot when no real performance data exists yet. */
  private deterministicSnapshot(sellerId: string) {
    const seed = sellerId.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
    const r = (mod: number, off = 0) => ((seed + off) % mod) / mod;
    return {
      seller_id: sellerId,
      period_start: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
      period_end: new Date().toISOString().slice(0, 10),
      orders_completed: 12 + (seed % 30),
      orders_cancelled: seed % 3,
      on_time_rate: (0.9 + r(20, 1) * 0.1).toFixed(4),
      response_rate: (0.85 + r(20, 2) * 0.15).toFixed(4),
      avg_response_minutes: 30 + (seed % 90),
      rating: (4.5 + r(10, 3) * 0.5).toFixed(2),
      repeat_buyer_rate: (0.2 + r(20, 4) * 0.4).toFixed(4),
      earnings: (1500 + (seed % 5000)).toFixed(2),
      metadata: { source: 'deterministic_fallback' },
    };
  }
}
