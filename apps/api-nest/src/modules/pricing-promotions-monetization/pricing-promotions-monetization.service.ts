import { Injectable, BadRequestException, NotFoundException, ForbiddenException, ConflictException, Logger } from '@nestjs/common';
import { PricingPromotionsMonetizationRepository } from './pricing-promotions-monetization.repository';
import {
  PRICEBOOK_TRANSITIONS, PACKAGE_TRANSITIONS, PROMO_TRANSITIONS, QUOTE_TRANSITIONS,
  applyPromoMath,
} from './dto';

const ANALYTICS_BASE = process.env.ANALYTICS_PYTHON_URL ?? 'http://localhost:8089';

@Injectable()
export class PricingPromotionsMonetizationService {
  private readonly logger = new Logger(PricingPromotionsMonetizationService.name);
  constructor(private readonly repo: PricingPromotionsMonetizationRepository) {}

  // ─── Overview ───────────────────────────────────────
  async overview(ownerId: string) {
    const [books, packages, promos] = await Promise.all([
      this.repo.listBooks(ownerId),
      this.repo.listPackages(ownerId),
      this.repo.listPromos(ownerId),
    ]);
    const activePromos = promos.filter((p: any) => p.status === 'active');
    const activePackages = packages.filter((p: any) => p.status === 'active');
    const totalRedeemed = promos.reduce((s: number, p: any) => s + (p.redeemedCount ?? 0), 0);
    const insights = await this.fetchInsights(ownerId, {
      packages: packages.length, activePackages: activePackages.length,
      promos: promos.length, activePromos: activePromos.length, totalRedeemed,
    }).catch(() => this.fallbackInsights({ activePackages: activePackages.length, activePromos: activePromos.length }));
    return {
      kpis: {
        priceBooks: books.length,
        packages: packages.length, activePackages: activePackages.length,
        promotions: promos.length, activePromotions: activePromos.length,
        totalRedeemed,
      },
      insights, computedAt: new Date().toISOString(),
    };
  }
  private async fetchInsights(ownerId: string, signals: any) {
    try {
      const r = await fetch(`${ANALYTICS_BASE}/pricing-promotions-monetization/insights`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ owner_id: ownerId, signals }),
        signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return (await r.json()).insights ?? [];
    } catch (e) { this.logger.warn(`analytics down: ${(e as Error).message}`); }
    return this.fallbackInsights(signals);
  }
  private fallbackInsights(signals: any) {
    const out: any[] = [];
    if (signals.activePackages === 0) out.push({ id: 'no_packages', severity: 'warn', title: 'Publish at least one offer package to start selling.' });
    if (signals.activePromos === 0) out.push({ id: 'no_promos', severity: 'info', title: 'Launch a promo code to drive first conversions.' });
    if (!out.length) out.push({ id: 'healthy', severity: 'success', title: 'Monetisation healthy.' });
    return out;
  }

  // ─── Price books ────────────────────────────────────
  listBooks(ownerId: string) { return this.repo.listBooks(ownerId); }
  async createBook(ownerId: string, dto: any, actorId: string, req?: any) {
    const r = await this.repo.createBook({ ownerIdentityId: ownerId, status: 'draft', ...dto });
    if (dto.isDefault) await this.repo.clearDefaultsExcept(ownerId, r.id);
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'pricebook.created', { type: 'pricebook', id: r.id }, dto, req);
    return r;
  }
  async updateBook(ownerId: string, id: string, dto: any, actorId: string, req?: any) {
    const cur = await this.repo.getBook(id);
    if (!cur || cur.ownerIdentityId !== ownerId) throw new NotFoundException('price book not found');
    const r = await this.repo.updateBook(id, dto);
    if (dto.isDefault) await this.repo.clearDefaultsExcept(ownerId, id);
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'pricebook.updated', { type: 'pricebook', id }, dto, req);
    return r;
  }
  async transitionBook(ownerId: string, id: string, status: string, actorId: string, req?: any) {
    const cur = await this.repo.getBook(id);
    if (!cur || cur.ownerIdentityId !== ownerId) throw new NotFoundException('price book not found');
    const allowed = PRICEBOOK_TRANSITIONS[cur.status] ?? [];
    if (!allowed.includes(status)) throw new BadRequestException(`invalid transition ${cur.status} → ${status}`);
    const r = await this.repo.updateBook(id, { status });
    await this.repo.recordAudit(ownerId, actorId, 'owner', `pricebook.${status}`, { type: 'pricebook', id }, { from: cur.status, to: status }, req);
    return r;
  }

  // ─── Price entries ──────────────────────────────────
  async listEntries(ownerId: string, bookId: string) {
    const book = await this.repo.getBook(bookId);
    if (!book || book.ownerIdentityId !== ownerId) throw new NotFoundException('price book not found');
    return this.repo.listEntries(bookId);
  }
  async createEntry(ownerId: string, dto: any, actorId: string, req?: any) {
    const book = await this.repo.getBook(dto.priceBookId);
    if (!book || book.ownerIdentityId !== ownerId) throw new NotFoundException('price book not found');
    const r = await this.repo.createEntry({ ownerIdentityId: ownerId, ...dto });
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'priceentry.created', { type: 'priceentry', id: r.id }, dto, req);
    return r;
  }
  async deleteEntry(ownerId: string, id: string, actorId: string, req?: any) {
    const cur = await this.repo.getEntry(id);
    if (!cur || cur.ownerIdentityId !== ownerId) throw new NotFoundException('entry not found');
    await this.repo.deleteEntry(id);
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'priceentry.deleted', { type: 'priceentry', id }, { sku: cur.sku, tier: cur.tier }, req);
    return { ok: true };
  }

  // ─── Packages ───────────────────────────────────────
  listPackages(ownerId: string, status?: string) { return this.repo.listPackages(ownerId, status); }
  async createPackage(ownerId: string, dto: any, actorId: string, req?: any) {
    const clash = await this.repo.getPackageBySlug(ownerId, dto.slug);
    if (clash) throw new ConflictException('slug already used');
    const r = await this.repo.createPackage({ ownerIdentityId: ownerId, status: 'draft', ...dto });
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'package.created', { type: 'package', id: r.id }, dto, req);
    return r;
  }
  async updatePackage(ownerId: string, id: string, dto: any, actorId: string, req?: any) {
    const cur = await this.repo.getPackage(id);
    if (!cur || cur.ownerIdentityId !== ownerId) throw new NotFoundException('package not found');
    if (dto.slug && dto.slug !== cur.slug) {
      const clash = await this.repo.getPackageBySlug(ownerId, dto.slug);
      if (clash) throw new ConflictException('slug already used');
    }
    const r = await this.repo.updatePackage(id, dto);
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'package.updated', { type: 'package', id }, dto, req);
    return r;
  }
  async transitionPackage(ownerId: string, id: string, status: string, actorId: string, req?: any) {
    const cur = await this.repo.getPackage(id);
    if (!cur || cur.ownerIdentityId !== ownerId) throw new NotFoundException('package not found');
    const allowed = PACKAGE_TRANSITIONS[cur.status] ?? [];
    if (!allowed.includes(status)) throw new BadRequestException(`invalid transition ${cur.status} → ${status}`);
    const r = await this.repo.updatePackage(id, { status });
    await this.repo.recordAudit(ownerId, actorId, 'owner', `package.${status}`, { type: 'package', id }, { from: cur.status, to: status }, req);
    return r;
  }

  // ─── Promotions ─────────────────────────────────────
  listPromos(ownerId: string, status?: string) { return this.repo.listPromos(ownerId, status); }
  async createPromo(ownerId: string, dto: any, actorId: string, req?: any) {
    const clash = await this.repo.getPromoByCode(ownerId, dto.code);
    if (clash) throw new ConflictException('promo code already exists');
    const r = await this.repo.createPromo({ ownerIdentityId: ownerId, status: 'draft', ...dto });
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'promo.created', { type: 'promo', id: r.id }, dto, req);
    return r;
  }
  async updatePromo(ownerId: string, id: string, dto: any, actorId: string, req?: any) {
    const cur = await this.repo.getPromo(id);
    if (!cur || cur.ownerIdentityId !== ownerId) throw new NotFoundException('promo not found');
    const r = await this.repo.updatePromo(id, dto);
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'promo.updated', { type: 'promo', id }, dto, req);
    return r;
  }
  async transitionPromo(ownerId: string, id: string, status: string, actorId: string, req?: any) {
    const cur = await this.repo.getPromo(id);
    if (!cur || cur.ownerIdentityId !== ownerId) throw new NotFoundException('promo not found');
    const allowed = PROMO_TRANSITIONS[cur.status] ?? [];
    if (!allowed.includes(status)) throw new BadRequestException(`invalid transition ${cur.status} → ${status}`);
    const r = await this.repo.updatePromo(id, { status });
    await this.repo.recordAudit(ownerId, actorId, 'owner', `promo.${status}`, { type: 'promo', id }, { from: cur.status, to: status }, req);
    return r;
  }
  listRedemptions(ownerId: string, promoId: string) {
    return this.repo.getPromo(promoId).then(async (p: any) => {
      if (!p || p.ownerIdentityId !== ownerId) throw new NotFoundException('promo not found');
      return this.repo.listRedemptions(promoId);
    });
  }

  // ─── Promo evaluation (the heart of the domain) ─────
  async evaluatePromo(opts: {
    ownerIdentityId: string; redeemedByIdentityId?: string;
    code: string; subtotalMinor: number; currency: string;
    packageId?: string; sku?: string;
  }): Promise<{ valid: boolean; reason?: string; discountMinor: number; promo?: any }> {
    const promo = await this.repo.getPromoByCode(opts.ownerIdentityId, opts.code);
    if (!promo) return { valid: false, reason: 'not_found', discountMinor: 0 };
    if (promo.status !== 'active') return { valid: false, reason: 'inactive', discountMinor: 0, promo };
    const now = new Date();
    if (promo.startsAt && new Date(promo.startsAt) > now) return { valid: false, reason: 'not_started', discountMinor: 0, promo };
    if (promo.endsAt && new Date(promo.endsAt) < now) return { valid: false, reason: 'expired', discountMinor: 0, promo };
    if (promo.currency !== opts.currency) return { valid: false, reason: 'currency_mismatch', discountMinor: 0, promo };
    if (promo.maxRedemptions != null && promo.redeemedCount >= promo.maxRedemptions)
      return { valid: false, reason: 'cap_reached', discountMinor: 0, promo };
    if (opts.subtotalMinor < (promo.minSubtotalMinor ?? 0))
      return { valid: false, reason: 'min_subtotal_not_met', discountMinor: 0, promo };
    if (promo.appliesTo === 'package' && (!opts.packageId || !(promo.appliesToRefs ?? []).includes(opts.packageId)))
      return { valid: false, reason: 'not_applicable', discountMinor: 0, promo };
    if (promo.appliesTo === 'sku' && (!opts.sku || !(promo.appliesToRefs ?? []).includes(opts.sku)))
      return { valid: false, reason: 'not_applicable', discountMinor: 0, promo };
    if (opts.redeemedByIdentityId) {
      const used = await this.repo.countRedemptionsByUser(promo.id, opts.redeemedByIdentityId);
      if (used >= (promo.perUserLimit ?? 1))
        return { valid: false, reason: 'per_user_limit', discountMinor: 0, promo };
    }
    return { valid: true, discountMinor: applyPromoMath(opts.subtotalMinor, promo), promo };
  }

  /** Public preview surface — no persistence, callable by buyers at checkout. */
  async previewPrice(dto: any) {
    const subtotal = Math.max(0, Number(dto.subtotalMinor || 0));
    let discount = 0;
    let promoState: any = null;
    if (dto.promoCode) {
      const ev = await this.evaluatePromo({
        ownerIdentityId: dto.ownerIdentityId, redeemedByIdentityId: dto.redeemedByIdentityId,
        code: dto.promoCode, subtotalMinor: subtotal, currency: dto.currency,
        packageId: dto.packageId, sku: dto.sku,
      });
      promoState = { valid: ev.valid, reason: ev.reason ?? null, code: dto.promoCode };
      discount = ev.discountMinor;
    }
    const taxableBase = Math.max(0, subtotal - discount);
    const tax = Math.round((taxableBase * (dto.taxRateBps ?? 0)) / 10_000);
    return {
      subtotalMinor: subtotal, discountMinor: discount, taxMinor: tax,
      totalMinor: taxableBase + tax, currency: dto.currency, promo: promoState,
    };
  }

  // ─── Quotes ─────────────────────────────────────────
  listQuotesByOwner(ownerId: string, status?: string) { return this.repo.listQuotesByOwner(ownerId, status); }
  listQuotesByCustomer(customerId: string, status?: string) { return this.repo.listQuotesByCustomer(customerId, status); }
  async getQuote(actorId: string, id: string) {
    const q = await this.repo.getQuote(id);
    if (!q) throw new NotFoundException('quote not found');
    if (q.ownerIdentityId !== actorId && q.customerIdentityId !== actorId)
      throw new ForbiddenException('not your quote');
    return q;
  }
  async createQuote(ownerId: string, dto: any, actorId: string, req?: any) {
    const subtotal = dto.items.reduce((s: number, i: any) => s + i.unitMinor * i.quantity, 0);
    const currency = 'GBP';
    let discount = 0;
    if (dto.promoCode) {
      const ev = await this.evaluatePromo({
        ownerIdentityId: ownerId, redeemedByIdentityId: dto.customerIdentityId,
        code: dto.promoCode, subtotalMinor: subtotal, currency,
      });
      if (!ev.valid) throw new BadRequestException(`promo invalid: ${ev.reason}`);
      discount = ev.discountMinor;
    }
    const tax = Math.round((Math.max(0, subtotal - discount) * (dto.taxRateBps ?? 0)) / 10_000);
    const total = Math.max(0, subtotal - discount) + tax;
    const validUntil = new Date(); validUntil.setDate(validUntil.getDate() + (dto.validForDays ?? 30));
    const r = await this.repo.createQuote({
      ownerIdentityId: ownerId, customerIdentityId: dto.customerIdentityId ?? null,
      status: 'draft', subtotalMinor: subtotal, discountMinor: discount, taxMinor: tax, totalMinor: total,
      currency, promoCode: dto.promoCode ?? null, lineItems: dto.items, validUntil, meta: dto.meta ?? {},
    });
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'quote.created', { type: 'quote', id: r.id }, { totalMinor: total }, req);
    return r;
  }
  async transitionQuote(actorId: string, id: string, status: string, req?: any) {
    const cur = await this.repo.getQuote(id);
    if (!cur) throw new NotFoundException('quote not found');
    const isOwner = cur.ownerIdentityId === actorId;
    const isCustomer = cur.customerIdentityId === actorId;
    if (!isOwner && !isCustomer) throw new ForbiddenException('not your quote');
    if (status === 'accepted' && !isCustomer) throw new ForbiddenException('only the customer can accept');
    if (['sent', 'cancelled'].includes(status) && !isOwner) throw new ForbiddenException('only the owner can send/cancel');
    const allowed = QUOTE_TRANSITIONS[cur.status] ?? [];
    if (!allowed.includes(status)) throw new BadRequestException(`invalid transition ${cur.status} → ${status}`);
    if (status === 'accepted' && cur.validUntil && new Date(cur.validUntil) < new Date())
      throw new BadRequestException('quote has expired');
    const patch: any = { status };
    if (status === 'accepted') {
      patch.acceptedAt = new Date();
      // If a promo was used, append redemption + bump count atomically (best-effort)
      if (cur.promoCode) {
        const promo = await this.repo.getPromoByCode(cur.ownerIdentityId, cur.promoCode);
        if (promo && cur.discountMinor > 0) {
          try {
            await this.repo.appendRedemption({
              promotionId: promo.id, ownerIdentityId: cur.ownerIdentityId,
              redeemedByIdentityId: cur.customerIdentityId ?? actorId,
              orderRef: `quote:${cur.id}`, discountMinor: cur.discountMinor, currency: cur.currency,
            });
            await this.repo.incrementRedeemed(promo.id);
          } catch (e) {
            // Unique constraint = already redeemed for this quote (idempotent replay).
            this.logger.warn(`redemption replay on quote=${cur.id}: ${(e as Error).message}`);
          }
        }
      }
    }
    const r = await this.repo.updateQuote(id, patch);
    await this.repo.recordAudit(cur.ownerIdentityId, actorId, isOwner ? 'owner' : 'customer',
      `quote.${status}`, { type: 'quote', id }, { from: cur.status, to: status }, req);
    return r;
  }
}
