/** Domain 26 — Recruiter Job Management ML bridge. Refactored (FD-12). */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';
import type { RequisitionRow } from './recruiter-job-management.repository';

const PrioritySchema = z.object({ priorityScore: z.number() }).passthrough();
const ForecastSchema = z.object({ forecastDaysToFill: z.number(), riskFlags: z.array(z.string()) }).passthrough();

@Injectable()
export class RecruiterJobManagementMlService {
  private readonly base = process.env.ML_PY_URL ?? 'http://localhost:8001';
  constructor(private readonly ml: MlClient) {}

  async priority(r: RequisitionRow) {
    const out = await this.ml.withFallback(
      { endpoint: 'recruiter-jobs.priority', url: `${this.base}/recruiter-jobs/priority`, body: { seniority: r.seniority, headcount: r.headcount, targetStartDate: r.targetStartDate, budget: r.budgetAnnualGbp, mustHaves: r.mustHaves }, schema: PrioritySchema, timeoutMs: 600 },
      () => {
        let s = 40;
        if (r.seniority === 'senior' || r.seniority === 'lead') s += 12;
        if (r.seniority === 'principal' || r.seniority === 'executive') s += 20;
        if (r.headcount > 1) s += Math.min(15, r.headcount * 4);
        if (r.targetStartDate) {
          const days = Math.max(0, (+new Date(r.targetStartDate) - Date.now()) / 86_400_000);
          if (days < 30) s += 12; else if (days < 60) s += 6;
        }
        if ((r.budgetAnnualGbp ?? 0) > 120_000) s += 5;
        return { priorityScore: Math.min(100, s) };
      },
    );
    return { ...(out.data as any), mode: out.meta.fallback ? 'fallback' as const : 'ml' as const };
  }

  async forecast(r: RequisitionRow) {
    const out = await this.ml.withFallback(
      { endpoint: 'recruiter-jobs.forecast', url: `${this.base}/recruiter-jobs/forecast`, body: { seniority: r.seniority, location: r.location, mustHaves: r.mustHaves, budget: r.budgetAnnualGbp }, schema: ForecastSchema, timeoutMs: 600 },
      () => {
        let days = 25;
        if (r.seniority === 'senior' || r.seniority === 'lead') days += 14;
        if (r.seniority === 'principal' || r.seniority === 'executive') days += 30;
        if (r.location.toLowerCase().includes('remote')) days -= 4;
        const flags: string[] = [];
        if ((r.mustHaves?.length ?? 0) > 6) flags.push('must_haves_too_strict');
        if ((r.budgetAnnualGbp ?? 0) < 50_000 && (r.seniority === 'senior' || r.seniority === 'lead')) flags.push('budget_below_market');
        return { forecastDaysToFill: Math.max(7, days), riskFlags: flags };
      },
    );
    return { ...(out.data as any), mode: out.meta.fallback ? 'fallback' as const : 'ml' as const };
  }
}
