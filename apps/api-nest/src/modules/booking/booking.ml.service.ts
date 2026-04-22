/** Domain 19 — Booking ML bridge. Refactored to use shared MlClient (FD-12). */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';

const SlotSchema = z.object({
  data: z.object({ items: z.array(z.object({ id: z.string(), startAt: z.string(), score: z.number() })) }),
  meta: z.object({ source: z.string() }).passthrough(),
});
const RiskSchema = z.object({
  data: z.object({ appointmentId: z.string(), risk: z.number(), band: z.string() }),
  meta: z.object({ source: z.string() }).passthrough(),
});

@Injectable()
export class BookingMlService {
  private readonly base = process.env.MLPY_URL ?? process.env.ML_PY_URL ?? 'http://localhost:8001';
  constructor(private readonly ml: MlClient) {}

  async rankSlots(input: { inviteeTimezone?: string; preferMorning?: boolean; slots: { id: string; startAt: string; hourLocal: number }[] }) {
    return this.ml.withFallback(
      { endpoint: 'booking.slot-rank', url: `${this.base}/booking/slot-rank`, body: input, schema: SlotSchema, requestId: undefined },
      () => {
        const ranked = input.slots.map((s) => {
          let score = 50;
          if (input.preferMorning && s.hourLocal >= 8 && s.hourLocal <= 11) score += 25;
          if (s.hourLocal >= 12 && s.hourLocal <= 13) score -= 15;
          if (s.hourLocal < 7 || s.hourLocal > 19) score -= 30;
          return { id: s.id, startAt: s.startAt, score: Math.max(0, Math.min(100, score)) };
        }).sort((a, b) => b.score - a.score);
        return { data: { items: ranked }, meta: { source: 'booking-fallback' } };
      },
    );
  }

  async cancellationRisk(input: { appointmentId: string; rescheduleCount?: number; leadTimeHours?: number; inviteeHistoryCancelRate?: number }) {
    return this.ml.withFallback(
      { endpoint: 'booking.cancellation-risk', url: `${this.base}/booking/cancellation-risk`, body: input, schema: RiskSchema },
      () => {
        let risk = 0.10;
        risk += Math.min(0.30, (input.rescheduleCount ?? 0) * 0.10);
        risk += Math.min(0.40, (input.inviteeHistoryCancelRate ?? 0.1) * 0.6);
        if ((input.leadTimeHours ?? 24) > 168) risk += 0.10;
        if ((input.leadTimeHours ?? 24) < 2) risk += 0.15;
        risk = Math.max(0, Math.min(1, risk));
        const band = risk < 0.3 ? 'low' : risk < 0.6 ? 'medium' : 'high';
        return { data: { appointmentId: input.appointmentId, risk: Number(risk.toFixed(2)), band }, meta: { source: 'booking-fallback' } };
      },
    );
  }
}
