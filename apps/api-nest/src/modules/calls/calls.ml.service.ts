/** Domain 18 — Calls ML bridge. Refactored to use shared MlClient (FD-12). */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';

const QualitySchema = z.object({
  data: z.object({ callId: z.string(), score: z.number(), band: z.string(), reasons: z.array(z.string()).optional() }),
  meta: z.object({ source: z.string() }).passthrough(),
});
const NoShowSchema = z.object({
  data: z.object({ appointmentId: z.string(), risk: z.number(), band: z.string() }),
  meta: z.object({ source: z.string() }).passthrough(),
});

@Injectable()
export class CallsMlService {
  private readonly base = process.env.MLPY_URL ?? process.env.ML_PY_URL ?? 'http://localhost:8001';
  constructor(private readonly ml: MlClient) {}

  async scoreQuality(input: { callId: string; bitrateKbps?: number; packetLossPct?: number; jitterMs?: number; rttMs?: number; durationSec?: number }) {
    return this.ml.withFallback(
      { endpoint: 'calls.score-quality', url: `${this.base}/calls/score-quality`, body: input, schema: QualitySchema },
      () => {
        const loss = input.packetLossPct ?? 0;
        const jitter = input.jitterMs ?? 0;
        const rtt = input.rttMs ?? 0;
        let s = 100 - Math.min(40, loss * 4) - Math.min(20, jitter / 10) - Math.min(20, rtt / 25);
        s = Math.max(0, Math.min(100, s));
        const band = s >= 85 ? 'excellent' : s >= 70 ? 'good' : s >= 50 ? 'fair' : 'poor';
        return { data: { callId: input.callId, score: Math.round(s), band, reasons: ['fallback'] }, meta: { source: 'calls-fallback' } };
      },
    );
  }

  async noShowRisk(input: { appointmentId: string; minutesUntil: number; rescheduleCount?: number; inviteeConfirmed?: boolean; pastNoShows?: number }) {
    return this.ml.withFallback(
      { endpoint: 'calls.no-show-risk', url: `${this.base}/calls/no-show-risk`, body: input, schema: NoShowSchema },
      () => {
        let risk = 0.15;
        if (!input.inviteeConfirmed) risk += 0.25;
        risk += Math.min(0.35, (input.pastNoShows ?? 0) * 0.12);
        risk += Math.min(0.15, (input.rescheduleCount ?? 0) * 0.05);
        risk = Math.max(0, Math.min(1, risk));
        const band = risk < 0.3 ? 'low' : risk < 0.6 ? 'medium' : 'high';
        return { data: { appointmentId: input.appointmentId, risk: Number(risk.toFixed(2)), band }, meta: { source: 'calls-fallback' } };
      },
    );
  }
}
