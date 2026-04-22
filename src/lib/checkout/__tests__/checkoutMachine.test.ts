import { describe, it, expect } from 'vitest';
import { checkoutReduce, initialSnapshot, nextEvents, isSettled, isTerminal } from '../checkoutMachine';

describe('checkoutMachine', () => {
  it('walks the happy path idle → succeeded', () => {
    let s = initialSnapshot;
    s = checkoutReduce(s, { type: 'OPEN_CART', cartId: 'c1' });
    expect(s.state).toBe('cart');
    s = checkoutReduce(s, { type: 'REQUEST_QUOTE', quoteId: 'q1', amountCents: 5000, currency: 'usd' });
    expect(s.state).toBe('quote');
    s = checkoutReduce(s, { type: 'PROCEED_TO_PAYMENT', paymentIntentId: 'pi_1' });
    expect(s.state).toBe('payment');
    s = checkoutReduce(s, { type: 'CONFIRM_PAYMENT' });
    expect(s.state).toBe('confirming');
    s = checkoutReduce(s, { type: 'PAYMENT_SUCCEEDED', orderId: 'o_1', fraudScore: 0.02 });
    expect(s.state).toBe('succeeded');
    expect(s.context.orderId).toBe('o_1');
  });

  it('blocks invalid transitions', () => {
    const s = checkoutReduce(initialSnapshot, { type: 'CONFIRM_PAYMENT' });
    expect(s.state).toBe('idle'); // unchanged
  });

  it('transitions to failed on payment failure', () => {
    let s = checkoutReduce(initialSnapshot, { type: 'OPEN_CART', cartId: 'c1' });
    s = checkoutReduce(s, { type: 'REQUEST_QUOTE', quoteId: 'q1', amountCents: 100, currency: 'usd' });
    s = checkoutReduce(s, { type: 'PROCEED_TO_PAYMENT', paymentIntentId: 'pi_2' });
    s = checkoutReduce(s, { type: 'CONFIRM_PAYMENT' });
    s = checkoutReduce(s, { type: 'PAYMENT_FAILED', errorCode: 'card_declined' });
    expect(s.state).toBe('failed');
    expect(isTerminal(s.state)).toBe(true);
  });

  it('only allows REFUND from succeeded', () => {
    let s = checkoutReduce(initialSnapshot, { type: 'OPEN_CART', cartId: 'c1' });
    s = checkoutReduce(s, { type: 'REFUND', reason: 'too_early' });
    expect(s.state).toBe('cart'); // refund ignored

    s = checkoutReduce(s, { type: 'REQUEST_QUOTE', quoteId: 'q', amountCents: 1, currency: 'usd' });
    s = checkoutReduce(s, { type: 'PROCEED_TO_PAYMENT', paymentIntentId: 'pi_3' });
    s = checkoutReduce(s, { type: 'CONFIRM_PAYMENT' });
    s = checkoutReduce(s, { type: 'PAYMENT_SUCCEEDED', orderId: 'o_2' });
    s = checkoutReduce(s, { type: 'REFUND', reason: 'customer_request' });
    expect(s.state).toBe('refunded');
    expect(s.context.refundReason).toBe('customer_request');
  });

  it('RESET returns to idle from anywhere', () => {
    let s = checkoutReduce(initialSnapshot, { type: 'OPEN_CART', cartId: 'c1' });
    s = checkoutReduce(s, { type: 'RESET' });
    expect(s.state).toBe('idle');
    expect(s.context).toEqual({});
  });

  it('nextEvents whitelist matches reducer', () => {
    expect(nextEvents('idle')).toContain('OPEN_CART');
    expect(nextEvents('cart')).toContain('REQUEST_QUOTE');
    expect(nextEvents('confirming')).toEqual(expect.arrayContaining(['PAYMENT_SUCCEEDED', 'PAYMENT_FAILED']));
  });

  it('isSettled covers terminal + succeeded', () => {
    expect(isSettled('succeeded')).toBe(true);
    expect(isSettled('failed')).toBe(true);
    expect(isSettled('refunded')).toBe(true);
    expect(isSettled('cart')).toBe(false);
  });
});
