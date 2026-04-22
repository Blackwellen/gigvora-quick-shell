import { Injectable, BadRequestException, NotFoundException, ForbiddenException, ConflictException, Logger } from '@nestjs/common';
import { DonationsPurchasesCommerceRepository } from './donations-purchases-commerce.repository';
import {
  DONATION_TRANSITIONS, ORDER_TRANSITIONS, PLEDGE_TRANSITIONS, PRODUCT_TRANSITIONS,
  STOREFRONT_TRANSITIONS, TIER_TRANSITIONS, computeDonationFee, computeOrderTotals,
} from './dto';

const ANALYTICS_BASE = process.env.ANALYTICS_PYTHON_URL ?? 'http://localhost:8089';

@Injectable()
export class DonationsPurchasesCommerceService {
  private readonly logger = new Logger(DonationsPurchasesCommerceService.name);
  constructor(private readonly repo: DonationsPurchasesCommerceRepository) {}

  // ─── Overview ───────────────────────────────────────
  async overview(ownerId: string) {
    const store = await this.repo.getStorefrontByOwner(ownerId);
    if (!store) {
      return {
        kpis: { storefrontStatus: 'none', products: 0, activePledges: 0, mrrMinor: 0, lifetimeMinor: 0, orders: 0, donations: 0 },
        insights: [{ id: 'no_store', severity: 'info', title: 'Open your storefront to begin selling.' }],
        computedAt: new Date().toISOString(),
      };
    }
    const [products, tiers, pledges, orders, donations, ledgerSum] = await Promise.all([
      this.repo.listProducts(store.id),
      this.repo.listTiers(store.id, 'active'),
      this.repo.listPledgesByCreator(ownerId, 'active'),
      this.repo.listOrdersByCreator(ownerId),
      this.repo.listDonationsByCreator(ownerId, 'paid'),
      this.repo.sumLedger(ownerId),
    ]);
    const mrrMinor = pledges.reduce((s: number, p: any) => s + (p.monthlyPriceMinor ?? 0), 0);
    const credits = ledgerSum.find((r: any) => r.entryType === 'credit')?.total ?? 0;
    const lifetimeMinor = Number(credits);
    const insights = await this.fetchInsights(ownerId, { mrrMinor, products: products.length, pledges: pledges.length, donations: donations.length })
      .catch(() => this.fallbackInsights({ store, mrrMinor, products: products.length }));
    return {
      kpis: {
        storefrontStatus: store.status, products: products.length, activeTiers: tiers.length,
        activePledges: pledges.length, mrrMinor, lifetimeMinor,
        orders: orders.length, donations: donations.length, currency: store.currency,
      },
      insights, computedAt: new Date().toISOString(),
    };
  }
  private async fetchInsights(ownerId: string, signals: any) {
    try {
      const r = await fetch(`${ANALYTICS_BASE}/donations-purchases-commerce/insights`, {
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
    if (signals.store?.status !== 'active') out.push({ id: 'store_inactive', severity: 'warn', title: 'Activate your storefront to start accepting payments.' });
    if (signals.products === 0) out.push({ id: 'no_products', severity: 'info', title: 'Add a product or tip jar to begin earning.' });
    if (signals.mrrMinor === 0) out.push({ id: 'no_mrr', severity: 'info', title: 'No active patrons yet — share your tier link to recruit your first 10.' });
    if (!out.length) out.push({ id: 'healthy', severity: 'success', title: 'Commerce surfaces healthy.' });
    return out;
  }

  // ─── Storefront ─────────────────────────────────────
  myStorefront(ownerId: string) { return this.repo.getStorefrontByOwner(ownerId); }
  publicStorefront(handle: string) { return this.repo.getStorefrontByHandle(handle); }
  async createStorefront(ownerId: string, dto: any, actorId: string, req?: any) {
    const existing = await this.repo.getStorefrontByOwner(ownerId);
    if (existing) throw new ConflictException('storefront already exists');
    const handleClash = await this.repo.getStorefrontByHandle(dto.handle);
    if (handleClash) throw new ConflictException('handle taken');
    const r = await this.repo.createStorefront({ ownerIdentityId: ownerId, status: 'draft', ...dto });
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'storefront.created', { type: 'storefront', id: r.id }, dto, req);
    return r;
  }
  async updateStorefront(ownerId: string, dto: any, actorId: string, req?: any) {
    const cur = await this.repo.getStorefrontByOwner(ownerId);
    if (!cur) throw new NotFoundException('storefront not found');
    if (dto.handle && dto.handle !== cur.handle) {
      const clash = await this.repo.getStorefrontByHandle(dto.handle);
      if (clash) throw new ConflictException('handle taken');
    }
    const r = await this.repo.updateStorefront(cur.id, dto);
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'storefront.updated', { type: 'storefront', id: cur.id }, dto, req);
    return r;
  }
  async transitionStorefront(ownerId: string, status: string, actorId: string, req?: any) {
    const cur = await this.repo.getStorefrontByOwner(ownerId);
    if (!cur) throw new NotFoundException('storefront not found');
    const allowed = STOREFRONT_TRANSITIONS[cur.status] ?? [];
    if (!allowed.includes(status)) throw new BadRequestException(`invalid transition ${cur.status} → ${status}`);
    const r = await this.repo.updateStorefront(cur.id, { status });
    await this.repo.recordAudit(ownerId, actorId, 'owner', `storefront.${status}`, { type: 'storefront', id: cur.id }, { from: cur.status, to: status }, req);
    return r;
  }

  // ─── Products ───────────────────────────────────────
  async listProducts(ownerId: string, status?: string) {
    const store = await this.repo.getStorefrontByOwner(ownerId);
    if (!store) return [];
    return this.repo.listProducts(store.id, status);
  }
  async createProduct(ownerId: string, dto: any, actorId: string, req?: any) {
    const store = await this.repo.getStorefrontByOwner(ownerId);
    if (!store) throw new BadRequestException('open a storefront first');
    const r = await this.repo.createProduct({ storefrontId: store.id, ownerIdentityId: ownerId, status: 'draft', ...dto });
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'product.created', { type: 'product', id: r.id }, dto, req);
    return r;
  }
  async updateProduct(ownerId: string, id: string, dto: any, actorId: string, req?: any) {
    const cur = await this.repo.getProduct(id);
    if (!cur || cur.ownerIdentityId !== ownerId) throw new NotFoundException('product not found');
    const r = await this.repo.updateProduct(id, dto);
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'product.updated', { type: 'product', id }, dto, req);
    return r;
  }
  async transitionProduct(ownerId: string, id: string, status: string, actorId: string, req?: any) {
    const cur = await this.repo.getProduct(id);
    if (!cur || cur.ownerIdentityId !== ownerId) throw new NotFoundException('product not found');
    const allowed = PRODUCT_TRANSITIONS[cur.status] ?? [];
    if (!allowed.includes(status)) throw new BadRequestException(`invalid transition ${cur.status} → ${status}`);
    const r = await this.repo.updateProduct(id, { status });
    await this.repo.recordAudit(ownerId, actorId, 'owner', `product.${status}`, { type: 'product', id }, { from: cur.status, to: status }, req);
    return r;
  }

  // ─── Tiers ──────────────────────────────────────────
  async listTiers(ownerId: string, status?: string) {
    const store = await this.repo.getStorefrontByOwner(ownerId);
    if (!store) return [];
    return this.repo.listTiers(store.id, status);
  }
  async createTier(ownerId: string, dto: any, actorId: string, req?: any) {
    const store = await this.repo.getStorefrontByOwner(ownerId);
    if (!store) throw new BadRequestException('open a storefront first');
    const r = await this.repo.createTier({ storefrontId: store.id, ownerIdentityId: ownerId, status: 'active', ...dto });
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'tier.created', { type: 'tier', id: r.id }, dto, req);
    return r;
  }
  async updateTier(ownerId: string, id: string, dto: any, actorId: string, req?: any) {
    const cur = await this.repo.getTier(id);
    if (!cur || cur.ownerIdentityId !== ownerId) throw new NotFoundException('tier not found');
    const r = await this.repo.updateTier(id, dto);
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'tier.updated', { type: 'tier', id }, dto, req);
    return r;
  }
  async transitionTier(ownerId: string, id: string, status: string, actorId: string, req?: any) {
    const cur = await this.repo.getTier(id);
    if (!cur || cur.ownerIdentityId !== ownerId) throw new NotFoundException('tier not found');
    const allowed = TIER_TRANSITIONS[cur.status] ?? [];
    if (!allowed.includes(status)) throw new BadRequestException(`invalid transition ${cur.status} → ${status}`);
    const r = await this.repo.updateTier(id, { status });
    await this.repo.recordAudit(ownerId, actorId, 'owner', `tier.${status}`, { type: 'tier', id }, { from: cur.status, to: status }, req);
    return r;
  }

  // ─── Pledges (patron-side) ──────────────────────────
  myPledges(patronId: string, status?: string) { return this.repo.listPledgesByPatron(patronId, status); }
  creatorPledges(creatorId: string, status?: string) { return this.repo.listPledgesByCreator(creatorId, status); }
  async createPledge(patronId: string, dto: any, req?: any) {
    const tier = await this.repo.getTier(dto.tierId);
    if (!tier || tier.status !== 'active') throw new NotFoundException('tier not available');
    const store = await this.repo.getStorefront(tier.storefrontId);
    if (!store || !store.acceptPatronage || store.status !== 'active') throw new BadRequestException('storefront not accepting patronage');
    if (patronId === tier.ownerIdentityId) throw new BadRequestException('cannot pledge to yourself');
    const next = new Date(); next.setMonth(next.getMonth() + 1);
    const p = await this.repo.createPledge({
      storefrontId: store.id, ownerIdentityId: tier.ownerIdentityId, patronIdentityId: patronId,
      tierId: tier.id, status: 'active', monthlyPriceMinor: tier.monthlyPriceMinor, currency: tier.currency,
      nextChargeAt: next, meta: dto.meta ?? {},
    });
    await this.repo.appendLedger({
      storefrontId: store.id, ownerIdentityId: tier.ownerIdentityId,
      entryType: 'credit', amountMinor: tier.monthlyPriceMinor, currency: tier.currency,
      description: `Patronage start (${tier.name})`, sourceType: 'pledge', sourceId: p.id,
    });
    await this.repo.recordAudit(tier.ownerIdentityId, patronId, 'patron', 'pledge.created', { type: 'pledge', id: p.id }, { tierId: tier.id }, req);
    return p;
  }
  async transitionPledge(actorId: string, id: string, status: string, req?: any) {
    const cur = await this.repo.getPledge(id);
    if (!cur) throw new NotFoundException('pledge not found');
    if (cur.patronIdentityId !== actorId && cur.ownerIdentityId !== actorId)
      throw new ForbiddenException('not your pledge');
    const allowed = PLEDGE_TRANSITIONS[cur.status] ?? [];
    if (!allowed.includes(status)) throw new BadRequestException(`invalid transition ${cur.status} → ${status}`);
    const patch: any = { status };
    if (status === 'cancelled') patch.cancelledAt = new Date();
    const r = await this.repo.updatePledge(id, patch);
    await this.repo.recordAudit(cur.ownerIdentityId, actorId, actorId === cur.ownerIdentityId ? 'creator' : 'patron',
      `pledge.${status}`, { type: 'pledge', id }, { from: cur.status, to: status }, req);
    return r;
  }

  // ─── Orders ─────────────────────────────────────────
  myOrders(buyerId: string, status?: string) { return this.repo.listOrdersByBuyer(buyerId, status); }
  creatorOrders(creatorId: string, status?: string) { return this.repo.listOrdersByCreator(creatorId, status); }
  async getOrder(actorId: string, id: string) {
    const r = await this.repo.getOrder(id);
    if (!r) throw new NotFoundException('order not found');
    if (r.buyerIdentityId !== actorId && r.ownerIdentityId !== actorId) throw new ForbiddenException('not your order');
    return r;
  }
  async createOrder(buyerId: string, dto: any, req?: any) {
    const existing = await this.repo.getOrderByIdempotency(dto.idempotencyKey);
    if (existing) return existing; // idempotent replay
    const store = await this.repo.getStorefront(dto.storefrontId);
    if (!store || store.status !== 'active') throw new BadRequestException('storefront not active');
    if (buyerId === store.ownerIdentityId) throw new BadRequestException('cannot purchase from your own storefront');
    let subtotal = 0;
    const lineItems: any[] = [];
    let needsShipping = false;
    for (const item of dto.items) {
      const product = await this.repo.getProduct(item.productId);
      if (!product || product.storefrontId !== store.id) throw new NotFoundException(`product ${item.productId} not found`);
      if (product.status !== 'active') throw new BadRequestException(`product ${product.title} not available`);
      if (product.inventoryRemaining != null && product.inventoryRemaining < item.quantity)
        throw new ConflictException(`insufficient inventory for ${product.title}`);
      subtotal += product.priceMinor * item.quantity;
      if (product.kind === 'physical') needsShipping = true;
      lineItems.push({
        productId: product.id, title: product.title, kind: product.kind,
        quantity: item.quantity, unitMinor: product.priceMinor, currency: product.currency,
        taxCategory: product.taxCategory,
      });
    }
    // VAT (UK posture): 20% standard for digital/services to GB, 0% otherwise (simplified).
    const vatBps = (dto.taxRegion === 'GB') ? 2000 : 0;
    const totals = computeOrderTotals(subtotal, { vatBps });
    const order = await this.repo.createOrder({
      storefrontId: store.id, ownerIdentityId: store.ownerIdentityId, buyerIdentityId: buyerId,
      status: 'pending', subtotalMinor: subtotal, ...totals, currency: store.currency,
      taxRegion: dto.taxRegion ?? null, vatRateBps: vatBps, lineItems,
      idempotencyKey: dto.idempotencyKey, meta: { ...(dto.meta ?? {}), needsShipping },
    });
    await this.repo.recordAudit(store.ownerIdentityId, buyerId, 'buyer', 'order.created', { type: 'order', id: order.id }, { totalMinor: order.totalMinor }, req);
    return order;
  }
  async confirmOrder(actorId: string, id: string, providerRef: string, req?: any) {
    const cur = await this.getOrder(actorId, id);
    if (!ORDER_TRANSITIONS[cur.status].includes('paid')) throw new BadRequestException(`cannot confirm from ${cur.status}`);
    const r = await this.repo.updateOrder(id, { status: 'paid', providerRef, paidAt: new Date(), providerStatus: 'succeeded' });
    // Decrement inventory only on confirmation
    for (const li of cur.lineItems ?? []) {
      if (li.productId && li.quantity) await this.repo.decrementInventory(li.productId, li.quantity);
    }
    await this.repo.appendLedger({
      storefrontId: cur.storefrontId, ownerIdentityId: cur.ownerIdentityId,
      entryType: 'credit', amountMinor: cur.netToCreatorMinor, currency: cur.currency,
      description: `Order #${cur.id.slice(0, 8)} captured`, sourceType: 'order', sourceId: cur.id,
      providerRef,
    });
    if (cur.feeMinor > 0) {
      await this.repo.appendLedger({
        storefrontId: cur.storefrontId, ownerIdentityId: cur.ownerIdentityId,
        entryType: 'fee', amountMinor: cur.feeMinor, currency: cur.currency,
        description: `Platform fee for order #${cur.id.slice(0, 8)}`, sourceType: 'order', sourceId: cur.id,
      });
    }
    await this.repo.recordAudit(cur.ownerIdentityId, actorId, 'system', 'order.paid', { type: 'order', id }, { providerRef }, req);
    return r;
  }
  async fulfillOrder(actorId: string, id: string, req?: any) {
    const cur = await this.getOrder(actorId, id);
    if (cur.ownerIdentityId !== actorId) throw new ForbiddenException('only the seller can fulfill');
    if (!ORDER_TRANSITIONS[cur.status].includes('fulfilled')) throw new BadRequestException(`cannot fulfill from ${cur.status}`);
    const r = await this.repo.updateOrder(id, { status: 'fulfilled', fulfilledAt: new Date() });
    await this.repo.recordAudit(cur.ownerIdentityId, actorId, 'creator', 'order.fulfilled', { type: 'order', id }, {}, req);
    return r;
  }
  async cancelOrder(actorId: string, id: string, reason: string, req?: any) {
    const cur = await this.getOrder(actorId, id);
    if (!ORDER_TRANSITIONS[cur.status].includes('cancelled')) throw new BadRequestException(`cannot cancel from ${cur.status}`);
    const r = await this.repo.updateOrder(id, { status: 'cancelled', cancelReason: reason });
    await this.repo.recordAudit(cur.ownerIdentityId, actorId, 'system', 'order.cancelled', { type: 'order', id }, { reason }, req);
    return r;
  }
  async refundOrder(actorId: string, id: string, dto: { amountMinor: number; reason: string }, actorRole: string, req?: any) {
    const cur = await this.getOrder(actorId, id);
    if (!['admin','moderator'].includes(actorRole) && cur.ownerIdentityId !== actorId)
      throw new ForbiddenException('only the seller or admin can refund');
    if (!ORDER_TRANSITIONS[cur.status].includes('refunded')) throw new BadRequestException(`cannot refund from ${cur.status}`);
    if (dto.amountMinor > cur.totalMinor) throw new BadRequestException('refund exceeds total');
    const r = await this.repo.updateOrder(id, { status: 'refunded', refundedAt: new Date() });
    await this.repo.appendLedger({
      storefrontId: cur.storefrontId, ownerIdentityId: cur.ownerIdentityId,
      entryType: 'refund', amountMinor: dto.amountMinor, currency: cur.currency,
      description: `Refund order #${cur.id.slice(0, 8)} — ${dto.reason}`, sourceType: 'order', sourceId: cur.id,
    });
    await this.repo.recordAudit(cur.ownerIdentityId, actorId, actorRole, 'order.refunded', { type: 'order', id }, dto, req);
    return r;
  }

  // ─── Donations ──────────────────────────────────────
  async createDonation(donorId: string | null, dto: any, req?: any) {
    const existing = await this.repo.getDonationByIdempotency(dto.idempotencyKey);
    if (existing) return existing;
    const store = await this.repo.getStorefront(dto.storefrontId);
    if (!store || store.status !== 'active') throw new BadRequestException('storefront not active');
    if (!store.acceptDonations) throw new BadRequestException('donations disabled for this storefront');
    if (donorId && donorId === store.ownerIdentityId) throw new BadRequestException('cannot donate to yourself');
    const { feeMinor, netMinor } = computeDonationFee(dto.amountMinor);
    const d = await this.repo.createDonation({
      storefrontId: store.id, ownerIdentityId: store.ownerIdentityId,
      donorIdentityId: dto.isAnonymous ? null : donorId,
      donorDisplayName: dto.isAnonymous ? 'Anonymous' : (dto.donorDisplayName ?? null),
      isAnonymous: !!dto.isAnonymous, status: 'pending',
      amountMinor: dto.amountMinor, feeMinor, netMinor, currency: dto.currency ?? store.currency,
      message: dto.message ?? null, idempotencyKey: dto.idempotencyKey, meta: dto.meta ?? {},
    });
    await this.repo.recordAudit(store.ownerIdentityId, donorId, 'donor', 'donation.created', { type: 'donation', id: d.id }, { amountMinor: dto.amountMinor }, req);
    return d;
  }
  async confirmDonation(actorId: string | null, id: string, providerRef: string, req?: any) {
    const cur = await this.repo.getDonation(id);
    if (!cur) throw new NotFoundException('donation not found');
    if (!DONATION_TRANSITIONS[cur.status].includes('paid')) throw new BadRequestException(`cannot confirm from ${cur.status}`);
    const r = await this.repo.updateDonation(id, { status: 'paid', providerRef, paidAt: new Date() });
    await this.repo.appendLedger({
      storefrontId: cur.storefrontId, ownerIdentityId: cur.ownerIdentityId,
      entryType: 'credit', amountMinor: cur.netMinor, currency: cur.currency,
      description: `Donation${cur.isAnonymous ? ' (anon)' : ''}`, sourceType: 'donation', sourceId: cur.id,
      providerRef,
    });
    if (cur.feeMinor > 0) {
      await this.repo.appendLedger({
        storefrontId: cur.storefrontId, ownerIdentityId: cur.ownerIdentityId,
        entryType: 'fee', amountMinor: cur.feeMinor, currency: cur.currency,
        description: `Platform fee for donation`, sourceType: 'donation', sourceId: cur.id,
      });
    }
    await this.repo.recordAudit(cur.ownerIdentityId, actorId, 'system', 'donation.paid', { type: 'donation', id }, { providerRef }, req);
    return r;
  }
  async refundDonation(actorId: string, id: string, dto: { amountMinor: number; reason: string }, actorRole: string, req?: any) {
    const cur = await this.repo.getDonation(id);
    if (!cur) throw new NotFoundException('donation not found');
    if (!['admin','moderator'].includes(actorRole) && cur.ownerIdentityId !== actorId)
      throw new ForbiddenException('only the recipient or admin can refund');
    if (!DONATION_TRANSITIONS[cur.status].includes('refunded')) throw new BadRequestException(`cannot refund from ${cur.status}`);
    if (dto.amountMinor > cur.amountMinor) throw new BadRequestException('refund exceeds amount');
    const r = await this.repo.updateDonation(id, { status: 'refunded', refundedAt: new Date() });
    await this.repo.appendLedger({
      storefrontId: cur.storefrontId, ownerIdentityId: cur.ownerIdentityId,
      entryType: 'refund', amountMinor: dto.amountMinor, currency: cur.currency,
      description: `Refund donation — ${dto.reason}`, sourceType: 'donation', sourceId: cur.id,
    });
    await this.repo.recordAudit(cur.ownerIdentityId, actorId, actorRole, 'donation.refunded', { type: 'donation', id }, dto, req);
    return r;
  }
  myDonations(donorId: string) { return this.repo.listDonationsByDonor(donorId); }
  creatorDonations(creatorId: string, status?: string) { return this.repo.listDonationsByCreator(creatorId, status); }

  // ─── Ledger ─────────────────────────────────────────
  ledger(ownerId: string, limit = 200) { return this.repo.listLedger(ownerId, limit); }
}
