/** Domain 25 — Job Application Flow ML bridge. Refactored (FD-12). */
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MlClient } from '../../infra/ml-client';
import type { ApplicationRow } from './job-application-flow.repository';

const ScoreSchema = z.object({ qualityScore: z.number(), matchScore: z.number() }).passthrough();
const ModerateSchema = z.object({ risk: z.number(), flags: z.array(z.string()) }).passthrough();
const SummariseSchema = z.object({ summary: z.string() }).passthrough();

@Injectable()
export class JobApplicationFlowMlService {
  private readonly base = process.env.ML_PY_URL ?? 'http://localhost:8001';
  constructor(private readonly ml: MlClient) {}

  private fallbackScore(app: Pick<ApplicationRow, 'responses' | 'attachments'>) {
    const r = app.responses as Record<string, any>;
    let score = 40;
    if (r.fullName) score += 6;
    if (r.email && /@/.test(String(r.email))) score += 6;
    if (r.coverLetter && String(r.coverLetter).length >= 200) score += 18;
    if (r.linkedin && /linkedin\.com/.test(String(r.linkedin))) score += 8;
    if (app.attachments?.some((a) => a.key === 'cv')) score += 14;
    if (r.salaryExpectation) score += 4;
    return { qualityScore: Math.min(100, score), matchScore: Math.min(100, Math.max(0, score - 6)) };
  }

  async score(app: ApplicationRow, jobContext: { skills?: string[]; title?: string } = {}) {
    const r = await this.ml.withFallback(
      { endpoint: 'job-app.score', url: `${this.base}/job-applications/score`, body: { responses: app.responses, attachments: app.attachments, jobContext }, schema: ScoreSchema, timeoutMs: 600 },
      () => this.fallbackScore(app),
    );
    return { ...(r.data as any), mode: r.meta.fallback ? 'fallback' as const : 'ml' as const };
  }

  async moderate(app: ApplicationRow) {
    const r = await this.ml.withFallback(
      { endpoint: 'job-app.moderate', url: `${this.base}/job-applications/moderate`, body: { responses: app.responses }, schema: ModerateSchema, timeoutMs: 600 },
      () => {
        const text = JSON.stringify(app.responses).toLowerCase();
        const flags: string[] = [];
        if (/\b(\d{9,})\b/.test(text)) flags.push('possible_id_number');
        if (/(bit\.ly|tinyurl)/.test(text)) flags.push('shortened_link');
        if (/\b(hireme|please please)\b/.test(text)) flags.push('low_signal_language');
        return { risk: flags.length === 0 ? 5 : 30 + flags.length * 12, flags };
      },
    );
    return { ...(r.data as any), mode: r.meta.fallback ? 'fallback' as const : 'ml' as const };
  }

  async summarise(app: ApplicationRow) {
    const r = await this.ml.withFallback(
      { endpoint: 'job-app.summarise', url: `${this.base}/job-applications/summarise`, body: { responses: app.responses }, schema: SummariseSchema, timeoutMs: 600 },
      () => {
        const cl = String((app.responses as any).coverLetter ?? '').slice(0, 280);
        return { summary: cl ? cl + (cl.length === 280 ? '…' : '') : 'No cover letter provided.' };
      },
    );
    return { ...(r.data as any), mode: r.meta.fallback ? 'fallback' as const : 'ml' as const };
  }
}
