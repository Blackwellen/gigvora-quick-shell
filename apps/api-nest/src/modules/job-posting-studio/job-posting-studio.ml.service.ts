/** Domain 24 — Job Posting Studio ML bridge. Refactored (FD-12). */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';
import type { JobRow } from './job-posting-studio.repository';

const QualitySchema = z.object({ score: z.number(), tips: z.array(z.string()) }).passthrough();
const ModerateSchema = z.object({ risk: z.number(), flags: z.array(z.string()) }).passthrough();

@Injectable()
export class JobPostingStudioMlService {
  private readonly base = process.env.ML_PY_URL ?? 'http://localhost:8001';
  constructor(private readonly ml: MlClient) {}

  async quality(draft: Pick<JobRow, 'title' | 'summary' | 'description' | 'skills' | 'salaryMinCents' | 'salaryMaxCents'>) {
    const r = await this.ml.withFallback(
      { endpoint: 'jobs-studio.quality', url: `${this.base}/jobs-studio/quality`, body: { draft }, schema: QualitySchema, timeoutMs: 600 },
      () => {
        const tips: string[] = [];
        let score = 50;
        if (draft.title.length >= 12) score += 8; else tips.push('Make the title more specific (12+ chars).');
        if (draft.summary.length >= 80) score += 10; else tips.push('Add a 1-paragraph summary (80+ chars).');
        if (draft.description.length >= 400) score += 15; else tips.push('Expand the description (400+ chars).');
        if ((draft.skills?.length ?? 0) >= 3) score += 8; else tips.push('Add 3+ skills.');
        if (draft.salaryMinCents && draft.salaryMaxCents) score += 9; else tips.push('Add a salary range — listings with salaries get 2× applications.');
        return { score: Math.min(100, score), tips };
      },
    );
    return { ...(r.data as any), mode: r.meta.fallback ? 'fallback' as const : 'ml' as const };
  }

  async moderate(draft: Pick<JobRow, 'title' | 'summary' | 'description'>) {
    const r = await this.ml.withFallback(
      { endpoint: 'jobs-studio.moderate', url: `${this.base}/jobs-studio/moderate`, body: { draft }, schema: ModerateSchema, timeoutMs: 600 },
      () => {
        const text = `${draft.title} ${draft.summary} ${draft.description}`.toLowerCase();
        const flags: string[] = [];
        if (/\b(ssn|passport number|bank account)\b/.test(text)) flags.push('pii_request');
        if (/\b(unpaid|no salary|commission only)\b/.test(text)) flags.push('compensation_concern');
        return { risk: flags.length === 0 ? 5 : Math.min(100, 40 + flags.length * 15), flags };
      },
    );
    return { ...(r.data as any), mode: r.meta.fallback ? 'fallback' as const : 'ml' as const };
  }
}
