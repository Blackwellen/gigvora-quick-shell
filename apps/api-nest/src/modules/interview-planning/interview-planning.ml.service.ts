/** Domain 29 — Interview Planning ML bridge. Refactored (FD-12). */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';
import type { InterviewRow, ScorecardRow } from './interview-planning.repository';

const SlotSchema = z.object({ score: z.number() }).passthrough();
const SummariseSchema = z.object({
  headline: z.string(), avgScore: z.number().nullable(),
  recommendation: z.string().nullable(), themes: z.array(z.string()),
}).passthrough();

@Injectable()
export class InterviewPlanningMlService {
  private readonly base = process.env.ML_PY_URL ?? 'http://localhost:8001';
  constructor(private readonly ml: MlClient) {}

  async scoreSlot(slot: { startAt: string; conflictFlags: string[]; interviewerCount: number }) {
    const r = await this.ml.withFallback(
      { endpoint: 'interview.slot-score', url: `${this.base}/interview-planning/slot-score`, body: slot, schema: SlotSchema, timeoutMs: 600 },
      () => {
        let s = 80;
        s -= slot.conflictFlags.length * 25;
        const hour = new Date(slot.startAt).getUTCHours();
        if (hour < 8 || hour > 18) s -= 15;
        if (slot.interviewerCount > 3) s -= 5;
        return { score: Math.max(0, Math.min(100, s)) };
      },
    );
    return { ...(r.data as any), mode: r.meta.fallback ? 'fallback' as const : 'ml' as const };
  }

  async summariseInterview(interview: InterviewRow, scorecards: ScorecardRow[]) {
    const fallback = () => {
      const submitted = scorecards.filter((s) => s.status === 'submitted' || s.status === 'calibrated');
      if (!submitted.length) return { headline: 'No submitted scorecards yet', avgScore: null, recommendation: null, themes: [] };
      const avgScore = Math.round((submitted.reduce((a, s) => a + (s.averageScore ?? 0), 0) / submitted.length) * 100) / 100;
      const recCounts = submitted.reduce<Record<string, number>>((acc, s) => {
        if (s.recommendation) acc[s.recommendation] = (acc[s.recommendation] ?? 0) + 1;
        return acc;
      }, {});
      const top = Object.entries(recCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      const themes: string[] = [];
      if (avgScore >= 4.2) themes.push('Strong technical signal');
      if (avgScore < 3) themes.push('Below bar overall');
      const concerns = submitted.flatMap((s) => s.concerns ? [s.concerns] : []);
      if (concerns.length >= 2) themes.push('Repeated concerns surfaced');
      const headline = top === 'strong_hire' ? 'Strong hire signal across panel'
                     : top === 'hire' ? 'Lean hire'
                     : top === 'no_hire' ? 'Lean no-hire'
                     : 'Mixed signal';
      return { headline, avgScore, recommendation: top, themes };
    };
    const r = await this.ml.withFallback(
      {
        endpoint: 'interview.summarise',
        url: `${this.base}/interview-planning/summarise`,
        body: {
          candidateName: interview.candidateName, jobTitle: interview.jobTitle,
          scorecards: scorecards.map((s) => ({ interviewer: s.interviewerName, recommendation: s.recommendation, averageScore: s.averageScore, strengths: s.strengths, concerns: s.concerns })),
        },
        schema: SummariseSchema,
        timeoutMs: 600,
      },
      fallback,
    );
    return { ...(r.data as any), mode: r.meta.fallback ? 'fallback' as const : 'ml' as const };
  }
}
