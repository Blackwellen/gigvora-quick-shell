import { Injectable, Inject } from '@nestjs/common';
import { and, asc, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';
import {
  bitCommercialProfiles, bitTaxRates, bitInvoices, bitInvoiceLineItems,
  bitInvoicePayments, bitCreditNotes, bitSubscriptions, bitDunningAttempts,
  bitDisputes, bitInvoiceEvents, bitWebhookDeliveries, bitAuditEvents,
} from '@gigvora/db/schema/billing-invoices-tax';

export type DrizzleDb = any;

@Injectable()
export class BillingInvoicesTaxRepository {
  constructor(@Inject('DRIZZLE_DB') private readonly db: DrizzleDb) {}

  // Profiles
  async getProfile(ownerId: string) {
    const rows = await this.db.select().from(bitCommercialProfiles).where(eq(bitCommercialProfiles.ownerIdentityId, ownerId)).limit(1);
    return rows[0] ?? null;
  }
  async upsertProfile(ownerId: string, dto: any) {
    const existing = await this.getProfile(ownerId);
    if (existing) {
      const [row] = await this.db.update(bitCommercialProfiles).set({ ...dto, updatedAt: new Date() })
        .where(eq(bitCommercialProfiles.ownerIdentityId, ownerId)).returning();
      return row;
    }
    const [row] = await this.db.insert(bitCommercialProfiles).values({ ownerIdentityId: ownerId, ...dto }).returning();
    return row;
  }
  async incrementInvoiceSeq(ownerId: string): Promise<number> {
    const r = await this.db.execute(sql`
      UPDATE bit_commercial_profiles SET next_invoice_seq = next_invoice_seq + 1, updated_at = now()
      WHERE owner_identity_id = ${ownerId} RETURNING next_invoice_seq - 1 AS seq
    `);
    return Number(((r as any).rows ?? r)[0]?.seq ?? 1);
  }

  // Tax rates
  listTaxRates(ownerId: string) {
    return this.db.select().from(bitTaxRates).where(eq(bitTaxRates.ownerIdentityId, ownerId)).orderBy(asc(bitTaxRates.jurisdiction));
  }
  async createTaxRate(ownerId: string, dto: any) {
    const [row] = await this.db.insert(bitTaxRates).values({ ownerIdentityId: ownerId, ...dto }).returning();
    return row;
  }
  async getActiveRate(ownerId: string, jurisdiction: string, category: string) {
    const rows = await this.db.select().from(bitTaxRates)
      .where(and(eq(bitTaxRates.ownerIdentityId, ownerId), eq(bitTaxRates.jurisdiction, jurisdiction), eq(bitTaxRates.category, category)))
      .orderBy(desc(bitTaxRates.appliesFrom)).limit(1);
    return rows[0] ?? null;
  }

  // Invoices
  async listInvoices(ownerId: string, q: any) {
    const conds: any[] = [eq(bitInvoices.ownerIdentityId, ownerId)];
    if (q.status) conds.push(eq(bitInvoices.status, q.status));
    if (q.customerIdentityId) conds.push(eq(bitInvoices.customerIdentityId, q.customerIdentityId));
    if (q.search) conds.push(or(ilike(bitInvoices.number, `%${q.search}%`), ilike(bitInvoices.customerName, `%${q.search}%`), ilike(bitInvoices.customerEmail, `%${q.search}%`))!);
    if (q.from) conds.push(gte(bitInvoices.issueDate, new Date(q.from)));
    if (q.to) conds.push(lte(bitInvoices.issueDate, new Date(q.to)));
    const offset = (q.page - 1) * q.pageSize;
    const items = await this.db.select().from(bitInvoices).where(and(...conds))
      .orderBy(desc(bitInvoices.createdAt)).limit(q.pageSize).offset(offset);
    return { items, page: q.page, pageSize: q.pageSize, total: items.length };
  }
  listCustomerInvoices(customerId: string) {
    return this.db.select().from(bitInvoices).where(eq(bitInvoices.customerIdentityId, customerId)).orderBy(desc(bitInvoices.createdAt));
  }
  async getInvoice(id: string) {
    const rows = await this.db.select().from(bitInvoices).where(eq(bitInvoices.id, id)).limit(1);
    return rows[0] ?? null;
  }
  async createInvoice(values: any) { const [row] = await this.db.insert(bitInvoices).values(values).returning(); return row; }
  async updateInvoice(id: string, patch: any) {
    const [row] = await this.db.update(bitInvoices).set({ ...patch, updatedAt: new Date() }).where(eq(bitInvoices.id, id)).returning();
    return row;
  }
  // Lines
  async replaceLines(invoiceId: string, lines: any[]) {
    await this.db.delete(bitInvoiceLineItems).where(eq(bitInvoiceLineItems.invoiceId, invoiceId));
    if (lines.length) await this.db.insert(bitInvoiceLineItems).values(lines.map((l) => ({ invoiceId, ...l })));
  }
  listLines(invoiceId: string) {
    return this.db.select().from(bitInvoiceLineItems).where(eq(bitInvoiceLineItems.invoiceId, invoiceId));
  }
  // Payments
  async addPayment(values: any) { const [row] = await this.db.insert(bitInvoicePayments).values(values).returning(); return row; }
  listPayments(invoiceId: string) {
    return this.db.select().from(bitInvoicePayments).where(eq(bitInvoicePayments.invoiceId, invoiceId)).orderBy(desc(bitInvoicePayments.paidAt));
  }
  // Credit notes
  async createCreditNote(values: any) { const [row] = await this.db.insert(bitCreditNotes).values(values).returning(); return row; }
  listCreditNotes(invoiceId: string) {
    return this.db.select().from(bitCreditNotes).where(eq(bitCreditNotes.invoiceId, invoiceId)).orderBy(desc(bitCreditNotes.createdAt));
  }
  // Events (append-only)
  async appendEvent(values: any) { await this.db.insert(bitInvoiceEvents).values(values); }
  listEvents(invoiceId: string, limit = 100) {
    return this.db.select().from(bitInvoiceEvents).where(eq(bitInvoiceEvents.invoiceId, invoiceId)).orderBy(desc(bitInvoiceEvents.createdAt)).limit(limit);
  }

  // Subscriptions
  listSubscriptions(ownerId: string, status?: string) {
    const conds: any[] = [eq(bitSubscriptions.ownerIdentityId, ownerId)];
    if (status) conds.push(eq(bitSubscriptions.status, status));
    return this.db.select().from(bitSubscriptions).where(and(...conds)).orderBy(desc(bitSubscriptions.createdAt));
  }
  listCustomerSubscriptions(customerId: string) {
    return this.db.select().from(bitSubscriptions).where(eq(bitSubscriptions.customerIdentityId, customerId)).orderBy(desc(bitSubscriptions.createdAt));
  }
  async getSubscription(id: string) {
    const rows = await this.db.select().from(bitSubscriptions).where(eq(bitSubscriptions.id, id)).limit(1);
    return rows[0] ?? null;
  }
  async createSubscription(values: any) { const [row] = await this.db.insert(bitSubscriptions).values(values).returning(); return row; }
  async updateSubscription(id: string, patch: any) {
    const [row] = await this.db.update(bitSubscriptions).set({ ...patch, updatedAt: new Date() }).where(eq(bitSubscriptions.id, id)).returning();
    return row;
  }

  // Dunning
  async scheduleDunning(values: any) { const [row] = await this.db.insert(bitDunningAttempts).values(values).returning(); return row; }
  listDunning(invoiceId: string) {
    return this.db.select().from(bitDunningAttempts).where(eq(bitDunningAttempts.invoiceId, invoiceId)).orderBy(asc(bitDunningAttempts.attemptNumber));
  }

  // Disputes
  async openDispute(values: any) { const [row] = await this.db.insert(bitDisputes).values(values).returning(); return row; }
  async getDispute(id: string) {
    const rows = await this.db.select().from(bitDisputes).where(eq(bitDisputes.id, id)).limit(1);
    return rows[0] ?? null;
  }
  async updateDispute(id: string, patch: any) {
    const [row] = await this.db.update(bitDisputes).set(patch).where(eq(bitDisputes.id, id)).returning();
    return row;
  }
  listDisputes(ownerId: string) {
    return this.db.execute(sql`
      SELECT d.* FROM bit_disputes d
      JOIN bit_invoices i ON i.id = d.invoice_id
      WHERE i.owner_identity_id = ${ownerId}
      ORDER BY d.opened_at DESC
    `).then((r: any) => r.rows ?? r);
  }

  // Webhooks
  async hasWebhook(provider: string, eventId: string) {
    const rows = await this.db.select().from(bitWebhookDeliveries)
      .where(and(eq(bitWebhookDeliveries.provider, provider), eq(bitWebhookDeliveries.eventId, eventId))).limit(1);
    return !!rows[0];
  }
  async recordWebhook(values: any) { await this.db.insert(bitWebhookDeliveries).values(values).onConflictDoNothing(); }

  // Audit
  async recordAudit(ownerId: string | null, actorId: string | null, action: string,
                     target: { type?: string; id?: string } = {}, diff: any = {},
                     req?: { ip?: string; userAgent?: string }) {
    await this.db.insert(bitAuditEvents).values({
      ownerIdentityId: ownerId, actorIdentityId: actorId, action,
      targetType: target.type ?? null, targetId: target.id ?? null, diff,
      ip: req?.ip ?? null, userAgent: req?.userAgent ?? null,
    });
  }
  listAudit(ownerId: string, limit = 100) {
    return this.db.select().from(bitAuditEvents).where(eq(bitAuditEvents.ownerIdentityId, ownerId))
      .orderBy(desc(bitAuditEvents.createdAt)).limit(limit);
  }

  // Aging report
  async aging(ownerId: string) {
    const r = await this.db.execute(sql`
      SELECT
        COALESCE(SUM(CASE WHEN status IN ('open','partially_paid') AND due_date >= now() THEN total_minor - paid_minor ELSE 0 END), 0)::bigint AS not_due,
        COALESCE(SUM(CASE WHEN status IN ('open','partially_paid') AND due_date < now() AND due_date >= now() - INTERVAL '30 days' THEN total_minor - paid_minor ELSE 0 END), 0)::bigint AS d0_30,
        COALESCE(SUM(CASE WHEN status IN ('open','partially_paid') AND due_date < now() - INTERVAL '30 days' AND due_date >= now() - INTERVAL '60 days' THEN total_minor - paid_minor ELSE 0 END), 0)::bigint AS d31_60,
        COALESCE(SUM(CASE WHEN status IN ('open','partially_paid') AND due_date < now() - INTERVAL '60 days' THEN total_minor - paid_minor ELSE 0 END), 0)::bigint AS d61_plus
      FROM bit_invoices WHERE owner_identity_id = ${ownerId}
    `);
    return ((r as any).rows ?? r)[0] ?? { not_due: 0, d0_30: 0, d31_60: 0, d61_plus: 0 };
  }
}
