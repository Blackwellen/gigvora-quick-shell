import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MarketingRepository } from './marketing.repository';
import { AuditService } from '../workspace/audit.service';
import { D12Emit } from '../domain-bus/domain-emissions';
import type { CreateLeadDto, CtaEventDto, ListPagesQuery, NewsletterSubscribeDto, UpsertPageDto } from './dto';

@Injectable()
export class MarketingService {
  constructor(
    private readonly repo: MarketingRepository,
    private readonly audit: AuditService,
  ) {}

  // ----- Pages -----
  async listPages(q: ListPagesQuery) {
    const items = await this.repo.listPages(q);
    const limit = (q as any).limit ?? items.length;
    return { items, total: items.length, limit, hasMore: items.length >= limit };
  }

  async getPage(slug: string) {
    const page = await this.repo.getPageBySlug(slug);
    if (!page) throw new NotFoundException('marketing_page_not_found');
    return page;
  }

  async upsertPage(dto: UpsertPageDto, actorId: string | null) {
    const page = await this.repo.upsertPage(dto, actorId);
    await this.audit.record({
      actorId: actorId ?? 'system', domain: 'marketing', action: 'marketing.page.upsert',
      targetType: 'page', targetId: page.id, meta: { slug: page.slug, status: page.status },
    });
    if (page.status === 'published') {
      void D12Emit.assetPublished(actorId ?? 'system', page.id, { slug: page.slug, status: page.status });
    }
    return page;
  }

  // ----- Leads -----
  async createLead(dto: CreateLeadDto, ip: string | null, ua: string | null) {
    if (!dto.consent || (dto.consent as any).marketing !== true) {
      // Soft-required: we still capture sales leads, but consent must be explicit for marketing follow-up.
    }
    const lead = await this.repo.createLead(dto, ip, ua);
    await this.audit.record({
      actorId: 'system', domain: 'marketing', action: 'marketing.lead.created',
      targetType: 'lead', targetId: lead.id, ip: ip ?? undefined, ua: ua ?? undefined,
      meta: { sourcePage: dto.sourcePage, sourceCta: dto.sourceCta },
    });
    void D12Emit.leadCaptured('system', lead.id, { sourcePage: dto.sourcePage, sourceCta: dto.sourceCta });
    return lead;
  }

  async listLeads(limit?: number, offset?: number, status?: string) {
    const items = await this.repo.listLeads(limit, offset, status);
    const lim = limit ?? items.length;
    return { items, total: items.length, limit: lim, offset: offset ?? 0, hasMore: items.length >= lim };
  }

  // ----- Newsletter -----
  async subscribe(dto: NewsletterSubscribeDto, ip: string | null, ua: string | null) {
    const sub = await this.repo.subscribe(dto, ip, ua);
    await this.audit.record({
      actorId: 'system', domain: 'marketing', action: 'marketing.newsletter.subscribe',
      targetType: 'subscriber', targetId: sub.id ?? sub.email,
      ip: ip ?? undefined, ua: ua ?? undefined,
      meta: { source: dto.source ?? null },
    });
    // In production, enqueue a confirmation email job here (workers).
    return { email: sub.email, status: sub.status, confirmToken: sub.confirmToken };
  }

  async confirm(token: string) {
    const r = await this.repo.confirmSubscriber(token);
    if (!r) throw new NotFoundException('invalid_or_expired_token');
    return r;
  }

  async unsubscribe(token: string) {
    const r = await this.repo.unsubscribe(token);
    if (!r) throw new NotFoundException('invalid_token');
    return r;
  }

  // ----- CTA experiments -----
  async getExperiment(key: string) {
    const exp = await this.repo.getExperimentByKey(key);
    if (!exp) throw new NotFoundException('experiment_not_found');
    return exp;
  }

  async recordCtaEvent(dto: CtaEventDto) {
    const exp = await this.repo.getExperimentByKey(dto.experimentKey);
    if (!exp) throw new BadRequestException('unknown_experiment');
    const variants: any[] = exp.variants ?? [];
    const variant = dto.variantLabel ? variants.find(v => v.label === dto.variantLabel) : variants[0];
    if (!variant) throw new BadRequestException('unknown_variant');
    await this.repo.recordCtaEvent(exp.id, variant.id, dto.eventType, dto.visitorId ?? null, dto.page ?? null, dto.meta ?? null);
    void D12Emit.utmTracked('system', exp.id, { experimentKey: dto.experimentKey, variant: variant.label, eventType: dto.eventType, page: dto.page ?? null });
    return { ok: true };
  }

  ctaSummary(experimentId: string) { return this.repo.ctaSummary(experimentId); }
}
