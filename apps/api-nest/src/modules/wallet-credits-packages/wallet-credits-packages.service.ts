import { Injectable, BadRequestException, NotFoundException, ConflictException, Logger, ForbiddenException } from '@nestjs/common';
import { WalletCreditsPackagesRepository } from './wallet-credits-packages.repository';
import { PACKAGE_TRANSITIONS, PackageStatus } from './dto';

const ANALYTICS_BASE = process.env.ANALYTICS_PYTHON_URL ?? 'http://localhost:8089';
const ML_BASE = process.env.ML_PYTHON_URL ?? 'http://localhost:8088';

@Injectable()
export class WalletCreditsPackagesService {
  private readonly logger = new Logger(WalletCreditsPackagesService.name);
  constructor(private readonly repo: WalletCreditsPackagesRepository) {}

  // ─── Overview ──────────────────────────────────────────
  async overview(ownerId: string) {
    const wallet = await this.repo.getOrCreateWallet(ownerId);
    const [purchases, payouts, ledger] = await Promise.all([
      this.repo.listPurchases(ownerId, { page: 1, pageSize: 20 }),
      this.repo.listPayouts(wallet.id),
      this.repo.listLedger(wallet.id, 50),
    ]);
    const lifetimeSpend = purchases.items
      .filter((p: any) => p.status === 'succeeded' || p.status === 'partially_refunded')
      .reduce((s: number, p: any) => s + (Number(p.amountMinor) - Number(p.refundedMinor)), 0);

    const insights = await this.fetchInsights(ownerId, {
      cashBalanceMinor: wallet.cashBalanceMinor, creditBalance: wallet.creditBalance,
      heldBalanceMinor: wallet.heldBalanceMinor, lifetimeSpendMinor: lifetimeSpend,
      pendingPurchases: purchases.items.filter((p: any) => p.status === 'pending').length,
      failedPurchases: purchases.items.filter((p: any) => p.status === 'failed').length,
    }).catch(() => this.fallbackInsights(wallet));

    return {
      wallet,
      kpis: {
        cashBalanceMinor: wallet.cashBalanceMinor,
        creditBalance: wallet.creditBalance,
        heldBalanceMinor: wallet.heldBalanceMinor,
        lifetimeSpendMinor: lifetimeSpend,
        purchaseCount: purchases.items.length,
        payoutCount: payouts.length,
      },
      recentPurchases: purchases.items.slice(0, 10),
      recentLedger: ledger.slice(0, 20),
      insights,
      computedAt: new Date().toISOString(),
    };
  }

  private async fetchInsights(ownerId: string, signals: any) {
    try {
      const res = await fetch(`${ANALYTICS_BASE}/wallet-credits-packages/insights`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ owner_id: ownerId, signals }), signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return (await res.json()).insights ?? [];
    } catch (e) { this.logger.warn(`analytics down: ${(e as Error).message}`); }
    return this.fallbackInsights(signals);
  }
  private fallbackInsights(s: any) {
    const out: any[] = [];
    if ((s.creditBalance ?? 0) === 0) out.push({ id: 'no-credits', severity: 'warn', title: 'No credits remaining', body: 'Top up to keep using metered features.' });
    if ((s.failedPurchases ?? 0) > 0) out.push({ id: 'failed-purchases', severity: 'error', title: `${s.failedPurchases} failed purchase(s)`, body: 'Retry or contact your bank.' });
    if (!out.length) out.push({ id: 'healthy', severity: 'success', title: 'Wallet healthy', body: 'Balances and recent activity look normal.' });
    return out;
  }

  // ─── Anomaly / fraud heuristic via ML ─────────────────
  async assessPurchase(ownerId: string, amountMinor: number) {
    try {
      const wallet = await this.repo.getOrCreateWallet(ownerId);
      const purchases = await this.repo.listPurchases(ownerId, { page: 1, pageSize: 30 });
      const res = await fetch(`${ML_BASE}/wallet-credits-packages/risk-score`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount_minor: amountMinor,
          wallet: { cash: wallet.cashBalanceMinor, credit: wallet.creditBalance },
          recent_count: purchases.items.length,
          recent_failures: purchases.items.filter((p: any) => p.status === 'failed').length,
        }),
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return await res.json();
    } catch (e) { this.logger.warn(`ml down: ${(e as Error).message}`); }
    // Deterministic fallback
    const failures = (await this.repo.listPurchases(ownerId, { page: 1, pageSize: 30 })).items
      .filter((p: any) => p.status === 'failed').length;
    const score = Math.min(1, 0.1 + failures * 0.15 + (amountMinor > 100_00 ? 0.2 : 0));
    return { source: 'fallback', riskScore: score, action: score > 0.7 ? 'manual_review' : 'allow' };
  }

  // ─── Packages ─────────────────────────────────────────
  listPackagesForOwner(ownerId: string, q: any) { return this.repo.listPackages(ownerId, q); }
  listActivePackages(q: any) { return this.repo.listActivePackagesForBuyer(q); }
  async getPackage(id: string) {
    const r = await this.repo.getPackage(id);
    if (!r) throw new NotFoundException('package not found');
    return r;
  }
  async createPackage(ownerId: string, dto: any, actorId: string, req?: any) {
    const existing = await this.repo.getPackageBySlug(ownerId, dto.slug);
    if (existing) throw new ConflictException(`slug already in use: ${dto.slug}`);
    const row = await this.repo.createPackage({ ownerIdentityId: ownerId, ...dto, status: 'draft' });
    await this.repo.recordAudit(ownerId, actorId, 'package.created', { type: 'package', id: row.id }, dto, req);
    return row;
  }
  async updatePackage(ownerId: string, id: string, patch: any, actorId: string, req?: any) {
    const before = await this.getPackage(id);
    if (before.ownerIdentityId !== ownerId) throw new ForbiddenException('not your package');
    const row = await this.repo.updatePackage(id, patch);
    await this.repo.recordAudit(ownerId, actorId, 'package.updated', { type: 'package', id }, { before, after: row }, req);
    return row;
  }
  async transitionPackage(ownerId: string, id: string, status: PackageStatus, actorId: string, req?: any) {
    const pkg = await this.getPackage(id);
    if (pkg.ownerIdentityId !== ownerId) throw new ForbiddenException('not your package');
    const allowed = PACKAGE_TRANSITIONS[pkg.status as PackageStatus] ?? [];
    if (!allowed.includes(status)) throw new BadRequestException(`invalid transition: ${pkg.status} → ${status}`);
    const row = await this.repo.setPackageStatus(id, status);
    await this.repo.recordAudit(ownerId, actorId, `package.${status}`, { type: 'package', id }, { from: pkg.status, to: status }, req);
    return row;
  }

  // ─── Purchases & checkout ─────────────────────────────
  listPurchases(buyerId: string, q: any) { return this.repo.listPurchases(buyerId, q); }
  async getPurchase(buyerId: string, id: string) {
    const r = await this.repo.getPurchase(id);
    if (!r) throw new NotFoundException('purchase not found');
    if (r.buyerIdentityId !== buyerId) throw new ForbiddenException('not your purchase');
    return r;
  }

  async createPurchase(buyerId: string, dto: any, actorId: string, req?: any) {
    // Idempotency: same key returns the existing purchase
    const existing = await this.repo.getPurchaseByIdempotency(buyerId, dto.idempotencyKey);
    if (existing) return existing;

    const pkg = await this.getPackage(dto.packageId);
    if (pkg.status !== 'active') throw new BadRequestException(`package is not active (${pkg.status})`);
    const currency = dto.currency ?? pkg.currency;
    const amount = pkg.priceMinor;
    const vat = Math.round((amount * pkg.vatRateBp) / 10_000);

    // Risk pre-check (assistive only)
    const risk = await this.assessPurchase(buyerId, amount);
    if (risk.action === 'manual_review') {
      const row = await this.repo.createPurchase({
        buyerIdentityId: buyerId, packageId: pkg.id,
        packageSnapshot: { slug: pkg.slug, name: pkg.name, kind: pkg.kind, vatRateBp: pkg.vatRateBp },
        amountMinor: amount, vatMinor: vat, currency, creditsGranted: pkg.creditsGranted,
        status: 'pending', provider: 'stripe', idempotencyKey: dto.idempotencyKey,
        failureReason: 'flagged_for_manual_review',
      });
      await this.repo.recordAudit(buyerId, actorId, 'purchase.flagged', { type: 'purchase', id: row.id }, { risk }, req);
      return row;
    }

    // Issue a fake client secret in the absence of a real provider; replaced by integration.
    const clientSecret = `pi_${Date.now()}_${Math.random().toString(36).slice(2, 10)}_secret`;
    const row = await this.repo.createPurchase({
      buyerIdentityId: buyerId, packageId: pkg.id,
      packageSnapshot: { slug: pkg.slug, name: pkg.name, kind: pkg.kind, vatRateBp: pkg.vatRateBp },
      amountMinor: amount, vatMinor: vat, currency, creditsGranted: pkg.creditsGranted,
      status: 'pending', provider: 'stripe', providerClientSecret: clientSecret,
      idempotencyKey: dto.idempotencyKey,
    });
    await this.repo.recordAudit(buyerId, actorId, 'purchase.created', { type: 'purchase', id: row.id }, { packageId: pkg.id, amount }, req);
    return row;
  }

  async confirmPurchase(buyerId: string, id: string, dto: any, actorId: string, req?: any) {
    const p = await this.getPurchase(buyerId, id);
    if (p.status !== 'pending') throw new BadRequestException(`cannot confirm purchase in status ${p.status}`);
    const wallet = await this.repo.getOrCreateWallet(buyerId, p.currency);
    const row = await this.repo.updatePurchase(id, {
      status: 'succeeded', providerRef: dto.providerRef,
      receiptUrl: dto.receiptUrl ?? null,
      invoiceNumber: p.invoiceNumber ?? `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000 + 10000)}`,
      succeededAt: new Date(),
    });
    // Append ledger entries (cash + credit grant) and update cached balances.
    await this.repo.appendLedger({ walletId: wallet.id, kind: 'purchase', amountMinor: p.amountMinor, credits: 0,
      currency: p.currency, reference: `purchase:${id}`, meta: { invoice: row.invoiceNumber } });
    if (p.creditsGranted > 0) {
      await this.repo.appendLedger({ walletId: wallet.id, kind: 'credit_grant', amountMinor: 0, credits: p.creditsGranted,
        currency: p.currency, reference: `purchase:${id}`, meta: {} });
    }
    await this.repo.adjustWalletBalances(wallet.id, { cashMinor: p.amountMinor, credit: p.creditsGranted });
    await this.repo.recordAudit(buyerId, actorId, 'purchase.succeeded', { type: 'purchase', id }, { providerRef: dto.providerRef }, req);
    return row;
  }

  async failPurchase(buyerId: string, id: string, reason: string, actorId: string, req?: any) {
    const p = await this.getPurchase(buyerId, id);
    if (p.status !== 'pending') throw new BadRequestException(`cannot fail purchase in status ${p.status}`);
    const row = await this.repo.updatePurchase(id, { status: 'failed', failureReason: reason, failedAt: new Date() });
    await this.repo.recordAudit(buyerId, actorId, 'purchase.failed', { type: 'purchase', id }, { reason }, req);
    return row;
  }

  async cancelPurchase(buyerId: string, id: string, actorId: string, req?: any) {
    const p = await this.getPurchase(buyerId, id);
    if (p.status !== 'pending') throw new BadRequestException(`cannot cancel purchase in status ${p.status}`);
    const row = await this.repo.updatePurchase(id, { status: 'cancelled', cancelledAt: new Date() });
    await this.repo.recordAudit(buyerId, actorId, 'purchase.cancelled', { type: 'purchase', id }, {}, req);
    return row;
  }

  async refundPurchase(buyerId: string, id: string, amountMinor: number, reason: string, actorId: string, req?: any) {
    const p = await this.getPurchase(buyerId, id);
    if (p.status !== 'succeeded' && p.status !== 'partially_refunded') {
      throw new BadRequestException(`cannot refund purchase in status ${p.status}`);
    }
    const remaining = p.amountMinor - p.refundedMinor;
    if (amountMinor > remaining) throw new BadRequestException(`refund exceeds remaining (${remaining})`);
    const newRefunded = p.refundedMinor + amountMinor;
    const newStatus = newRefunded >= p.amountMinor ? 'refunded' : 'partially_refunded';
    const row = await this.repo.updatePurchase(id, { status: newStatus, refundedMinor: newRefunded, refundedAt: new Date() });

    const wallet = await this.repo.getOrCreateWallet(buyerId, p.currency);
    await this.repo.appendLedger({ walletId: wallet.id, kind: 'refund', amountMinor: -amountMinor, credits: 0,
      currency: p.currency, reference: `purchase:${id}`, meta: { reason } });
    await this.repo.adjustWalletBalances(wallet.id, { cashMinor: -amountMinor });
    await this.repo.recordAudit(buyerId, actorId, 'purchase.refunded', { type: 'purchase', id }, { amountMinor, reason }, req);
    return row;
  }

  // ─── Credits ──────────────────────────────────────────
  async spendCredits(ownerId: string, dto: any, actorId: string, req?: any) {
    const wallet = await this.repo.getOrCreateWallet(ownerId);
    if (wallet.creditBalance < dto.amount) throw new BadRequestException('insufficient credits');
    await this.repo.appendLedger({ walletId: wallet.id, kind: 'credit_spend', amountMinor: 0, credits: -dto.amount,
      currency: wallet.currency, reference: dto.reference, meta: dto.meta ?? {} });
    await this.repo.adjustWalletBalances(wallet.id, { credit: -dto.amount });
    await this.repo.recordAudit(ownerId, actorId, 'credits.spent', { type: 'wallet', id: wallet.id }, { amount: dto.amount, reference: dto.reference }, req);
    return await this.repo.getWalletById(wallet.id);
  }

  async grantCredits(adminId: string, dto: any, req?: any) {
    const wallet = await this.repo.getOrCreateWallet(dto.ownerIdentityId);
    await this.repo.appendLedger({ walletId: wallet.id, kind: 'credit_grant', amountMinor: 0, credits: dto.amount,
      currency: wallet.currency, reference: `admin-grant:${adminId}`, meta: { reason: dto.reason } });
    await this.repo.adjustWalletBalances(wallet.id, { credit: dto.amount });
    await this.repo.recordAudit(dto.ownerIdentityId, adminId, 'credits.granted', { type: 'wallet', id: wallet.id }, { amount: dto.amount, reason: dto.reason }, req);
    return await this.repo.getWalletById(wallet.id);
  }

  // ─── Payouts ──────────────────────────────────────────
  async createPayout(ownerId: string, dto: any, actorId: string, req?: any) {
    const wallet = await this.repo.getOrCreateWallet(ownerId, dto.currency);
    const available = wallet.cashBalanceMinor - wallet.heldBalanceMinor;
    if (dto.amountMinor > available) throw new BadRequestException(`payout exceeds available (${available})`);
    const row = await this.repo.createPayout({
      walletId: wallet.id, amountMinor: dto.amountMinor, currency: wallet.currency,
      status: 'pending', scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : null,
    });
    // Hold the funds.
    await this.repo.appendLedger({ walletId: wallet.id, kind: 'hold', amountMinor: 0, credits: 0,
      currency: wallet.currency, reference: `payout:${row.id}`, meta: { amount: dto.amountMinor } });
    await this.repo.adjustWalletBalances(wallet.id, { heldMinor: dto.amountMinor });
    await this.repo.recordAudit(ownerId, actorId, 'payout.created', { type: 'payout', id: row.id }, dto, req);
    return row;
  }
  listPayouts(ownerId: string) {
    return this.repo.getOrCreateWallet(ownerId).then((w) => this.repo.listPayouts(w.id));
  }

  // ─── Ledger / Wallet ──────────────────────────────────
  async wallet(ownerId: string) { return this.repo.getOrCreateWallet(ownerId); }
  async ledger(ownerId: string, limit = 200) {
    const w = await this.repo.getOrCreateWallet(ownerId);
    return this.repo.listLedger(w.id, limit);
  }
  async reconcile(ownerId: string) {
    const w = await this.repo.getOrCreateWallet(ownerId);
    const sums = await this.repo.sumLedger(w.id);
    return {
      walletId: w.id,
      cached: { cash: w.cashBalanceMinor, credit: w.creditBalance },
      ledger: { cash: sums.cash, credit: sums.credits },
      drift: { cash: w.cashBalanceMinor - sums.cash, credit: w.creditBalance - sums.credits },
    };
  }

  // ─── Webhooks ─────────────────────────────────────────
  async handleWebhook(provider: string, evt: { id: string; type: string; data: any }, signatureValid: boolean, req?: any) {
    if (await this.repo.hasWebhook(provider, evt.id)) {
      return { status: 'duplicate' };
    }
    if (!signatureValid) {
      await this.repo.recordWebhook({ provider, eventId: evt.id, eventType: evt.type, signatureValid: 'false', status: 'failed', payload: evt });
      throw new ForbiddenException('invalid webhook signature');
    }
    let outcome: 'processed' | 'skipped' = 'skipped';
    try {
      if (evt.type === 'payment_intent.succeeded' || evt.type === 'charge.succeeded') {
        const ref = evt.data?.object?.id ?? evt.data?.payment_intent_id;
        if (ref) {
          const purchase = await this.repo.getPurchaseByProviderRef(provider, ref);
          if (purchase && purchase.status === 'pending') {
            await this.confirmPurchase(purchase.buyerIdentityId, purchase.id, { providerRef: ref, receiptUrl: evt.data?.object?.receipt_url }, 'webhook', req);
            outcome = 'processed';
          }
        }
      }
      if (evt.type === 'payment_intent.payment_failed') {
        const ref = evt.data?.object?.id;
        if (ref) {
          const purchase = await this.repo.getPurchaseByProviderRef(provider, ref);
          if (purchase && purchase.status === 'pending') {
            await this.failPurchase(purchase.buyerIdentityId, purchase.id, evt.data?.object?.last_payment_error?.message ?? 'provider_failure', 'webhook', req);
            outcome = 'processed';
          }
        }
      }
      if (evt.type === 'charge.refunded') {
        const ref = evt.data?.object?.payment_intent ?? evt.data?.object?.id;
        const amount = Number(evt.data?.object?.amount_refunded ?? 0);
        if (ref && amount > 0) {
          const purchase = await this.repo.getPurchaseByProviderRef(provider, ref);
          if (purchase) {
            await this.refundPurchase(purchase.buyerIdentityId, purchase.id, amount, 'provider_webhook_refund', 'webhook', req);
            outcome = 'processed';
          }
        }
      }
    } finally {
      await this.repo.recordWebhook({ provider, eventId: evt.id, eventType: evt.type, signatureValid: 'true', status: outcome, payload: evt });
    }
    return { status: outcome };
  }

  // ─── Audit ────────────────────────────────────────────
  audit(ownerId: string, limit = 100) { return this.repo.listAudit(ownerId, limit); }
}
