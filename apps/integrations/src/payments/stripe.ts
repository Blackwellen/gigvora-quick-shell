import Stripe from 'stripe';
import { register, type Adapter } from '../index';

let client: Stripe | null = null;

export const stripeAdapter: Adapter<{ secretKey: string }> = {
  id: 'stripe',
  category: 'payments',
  configure({ secretKey }) { client = new Stripe(secretKey, { apiVersion: '2024-09-30.acacia' as any }); },
  async healthcheck() {
    if (!client) return { ok: false, detail: 'not configured' };
    try { await client.balance.retrieve(); return { ok: true }; }
    catch (e: any) { return { ok: false, detail: e.message }; }
  },
};

if (process.env.STRIPE_SECRET_KEY) stripeAdapter.configure({ secretKey: process.env.STRIPE_SECRET_KEY });
register(stripeAdapter);
export { client as stripeClient };
WE CAN ALSO SETUP ESCROW.COM, PAYPAL ESCROW TOO ETC if neccessary 