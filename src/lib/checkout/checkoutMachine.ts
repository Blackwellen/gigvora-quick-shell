/**
 * checkoutMachine — typed finite-state machine for cart → pay → fulfilment.
 *
 * Implementation note: zero external deps. We intentionally do not import
 * xstate so this can run in the Worker SSR runtime without bundler concerns.
 * The shape mirrors xstate semantics so it is portable later if desired.
 *
 * States:
 *   idle → cart → quote → payment → confirming → succeeded | failed | refunded
 *
 * Each transition is pure: (state, event) → state. Side effects (Stripe
 * confirm, server POST, fraud scoring) happen in caller code which dispatches
 * follow-up events.
 */

export type CheckoutState =
  | 'idle' | 'cart' | 'quote' | 'payment' | 'confirming'
  | 'succeeded' | 'failed' | 'refunded';

export interface CheckoutContext {
  cartId?: string;
  quoteId?: string;
  paymentIntentId?: string;
  orderId?: string;
  amountCents?: number;
  currency?: string;
  fraudScore?: number;
  errorCode?: string;
  refundReason?: string;
}

export type CheckoutEvent =
  | { type: 'OPEN_CART'; cartId: string }
  | { type: 'REQUEST_QUOTE'; quoteId: string; amountCents: number; currency: string }
  | { type: 'PROCEED_TO_PAYMENT'; paymentIntentId: string }
  | { type: 'CONFIRM_PAYMENT' }
  | { type: 'PAYMENT_SUCCEEDED'; orderId: string; fraudScore?: number }
  | { type: 'PAYMENT_FAILED'; errorCode: string }
  | { type: 'REFUND'; reason: string }
  | { type: 'RESET' };

export interface CheckoutSnapshot { state: CheckoutState; context: CheckoutContext }

export const initialSnapshot: CheckoutSnapshot = { state: 'idle', context: {} };

/** Pure transition function. */
export function checkoutReduce(snap: CheckoutSnapshot, event: CheckoutEvent): CheckoutSnapshot {
  const { state, context } = snap;

  // Global RESET wins from any state.
  if (event.type === 'RESET') return initialSnapshot;

  switch (state) {
    case 'idle':
      if (event.type === 'OPEN_CART') return { state: 'cart', context: { cartId: event.cartId } };
      return snap;

    case 'cart':
      if (event.type === 'REQUEST_QUOTE') {
        return { state: 'quote', context: { ...context, quoteId: event.quoteId, amountCents: event.amountCents, currency: event.currency } };
      }
      return snap;

    case 'quote':
      if (event.type === 'PROCEED_TO_PAYMENT') {
        return { state: 'payment', context: { ...context, paymentIntentId: event.paymentIntentId } };
      }
      return snap;

    case 'payment':
      if (event.type === 'CONFIRM_PAYMENT') return { state: 'confirming', context };
      return snap;

    case 'confirming':
      if (event.type === 'PAYMENT_SUCCEEDED') {
        return { state: 'succeeded', context: { ...context, orderId: event.orderId, fraudScore: event.fraudScore } };
      }
      if (event.type === 'PAYMENT_FAILED') {
        return { state: 'failed', context: { ...context, errorCode: event.errorCode } };
      }
      return snap;

    case 'succeeded':
      if (event.type === 'REFUND') {
        return { state: 'refunded', context: { ...context, refundReason: event.reason } };
      }
      return snap;

    case 'failed':
    case 'refunded':
      // Terminal in normal flow; only RESET (handled above) escapes.
      return snap;

    default:
      return snap;
  }
}

/** Whitelist of events that are valid from a given state — useful for UI. */
export function nextEvents(state: CheckoutState): CheckoutEvent['type'][] {
  switch (state) {
    case 'idle':       return ['OPEN_CART'];
    case 'cart':       return ['REQUEST_QUOTE', 'RESET'];
    case 'quote':      return ['PROCEED_TO_PAYMENT', 'RESET'];
    case 'payment':    return ['CONFIRM_PAYMENT', 'RESET'];
    case 'confirming': return ['PAYMENT_SUCCEEDED', 'PAYMENT_FAILED'];
    case 'succeeded':  return ['REFUND', 'RESET'];
    case 'failed':     return ['RESET'];
    case 'refunded':   return ['RESET'];
  }
}

export const isTerminal = (s: CheckoutState) => s === 'failed' || s === 'refunded';
export const isSettled  = (s: CheckoutState) => s === 'succeeded' || isTerminal(s);
