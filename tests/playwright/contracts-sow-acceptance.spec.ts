import { expect, test } from '@playwright/test';

/**
 * D36 — Contracts, SoW, Terms Acceptance & Signature Follow-Through.
 *
 * Validates the full end-to-end signing flow against the live NestJS API:
 *   1. Mint a contract from a (mocked) award handoff with two parties.
 *   2. Send for signature.
 *   3. Out-of-order signature attempt is rejected.
 *   4. Sequenced signing — client (signOrder=1), then provider (signOrder=2)
 *      — flips status partially-signed → signed → active.
 *   5. Hash chain verification reports `ok: true`.
 *   6. Idempotent re-sign with the same idempotencyKey returns the same row.
 *   7. Amend mints a successor and supersedes the prior contract.
 *
 * Escrow release is intentionally NOT exercised here — that journey lives in
 * D34 + delivery + dispute domains and is covered by their own specs.
 */
const API = process.env.API_BASE ?? 'http://localhost:3001';

test.describe('@d36 contracts + sow + signatures', () => {
  test('end-to-end: mint → send → sequenced sign → activate → verify → amend', async ({ request }) => {
    const proposalId = '33333333-3333-3333-3333-333333333333';
    const projectId  = '44444444-4444-4444-4444-444444444444';
    const idem       = `e2e-${Date.now()}`;

    // 1. mint
    const mintRes = await request.post(`${API}/api/v1/contracts-sow-acceptance/contracts/from-award`, {
      data: {
        awardId: `award-${idem}`,
        proposalId, projectId,
        title: 'E2E Contract',
        governingLaw: 'UK',
        expiresInDays: 14,
        parties: [
          { partyId: 'client-e2e',   role: 'client',   displayName: 'Client E2E',   signOrder: 1 },
          { partyId: 'provider-e2e', role: 'provider', displayName: 'Provider E2E', signOrder: 2 },
        ],
        idempotencyKey: `mint-${idem}`,
      },
    });
    expect(mintRes.ok()).toBeTruthy();
    const contract = await mintRes.json();
    expect(contract.status).toBe('draft');

    // 2. send
    const sent = await request.post(`${API}/api/v1/contracts-sow-acceptance/contracts/send`, {
      data: { contractId: contract.id, message: 'Please countersign.' },
    });
    expect(sent.ok()).toBeTruthy();
    expect((await sent.json()).status).toBe('sent');

    // 3. out-of-order sign attempt should fail
    const ooo = await request.post(`${API}/api/v1/contracts-sow-acceptance/contracts/sign`, {
      data: {
        contractId: contract.id,
        partyId: 'provider-e2e',
        typedName: 'Provider E2E',
        acceptTos: true,
        acceptScope: true,
        idempotencyKey: `sign-ooo-${idem}`,
      },
    });
    expect(ooo.ok()).toBeFalsy();

    // 4a. client signs first
    const sign1 = await request.post(`${API}/api/v1/contracts-sow-acceptance/contracts/sign`, {
      data: {
        contractId: contract.id,
        partyId: 'client-e2e',
        typedName: 'Client E2E',
        acceptTos: true,
        acceptScope: true,
        clientCapturedIp: '203.0.113.10',
        clientCapturedUa: 'playwright/e2e',
        idempotencyKey: `sign-1-${idem}`,
      },
    });
    expect(sign1.ok()).toBeTruthy();
    const sign1Body = await sign1.json();
    expect(sign1Body.contract.status).toBe('partially-signed');
    expect(sign1Body.allSigned).toBe(false);

    // 4b. provider signs second → contract activates
    const sign2 = await request.post(`${API}/api/v1/contracts-sow-acceptance/contracts/sign`, {
      data: {
        contractId: contract.id,
        partyId: 'provider-e2e',
        typedName: 'Provider E2E',
        acceptTos: true,
        acceptScope: true,
        clientCapturedIp: '203.0.113.20',
        clientCapturedUa: 'playwright/e2e',
        idempotencyKey: `sign-2-${idem}`,
      },
    });
    expect(sign2.ok()).toBeTruthy();
    const sign2Body = await sign2.json();
    expect(sign2Body.allSigned).toBe(true);

    const detail = await (await request.get(`${API}/api/v1/contracts-sow-acceptance/contracts/${contract.id}`)).json();
    expect(detail.status).toBe('active');
    expect(detail.signatures.length).toBe(2);

    // 5. verify hash chain
    const verify = await request.post(`${API}/api/v1/contracts-sow-acceptance/contracts/verify-hash`, {
      data: { contractId: contract.id },
    });
    expect(verify.ok()).toBeTruthy();
    expect((await verify.json()).ok).toBe(true);

    // 6. idempotent re-sign returns same signature row
    const replay = await request.post(`${API}/api/v1/contracts-sow-acceptance/contracts/sign`, {
      data: {
        contractId: contract.id,
        partyId: 'provider-e2e',
        typedName: 'Provider E2E',
        acceptTos: true,
        acceptScope: true,
        idempotencyKey: `sign-2-${idem}`,
      },
    });
    expect(replay.ok()).toBeTruthy();
    expect((await replay.json()).signature.id).toBe(sign2Body.signature.id);

    // 7. amend mints a successor
    const amend = await request.post(`${API}/api/v1/contracts-sow-acceptance/contracts/amend`, {
      data: {
        contractId: contract.id,
        changeSummary: 'Add an additional sprint and extend timeline by 2 weeks.',
        newExpiresInDays: 30,
        idempotencyKey: `amend-${idem}`,
      },
    });
    expect(amend.ok()).toBeTruthy();
    const successor = await amend.json();
    expect(successor.amendsContractId).toBe(contract.id);

    const prior = await (await request.get(`${API}/api/v1/contracts-sow-acceptance/contracts/${contract.id}`)).json();
    expect(prior.status).toBe('superseded');
  });

  test('insights endpoint returns finite counters', async ({ request }) => {
    const r = await request.get(`${API}/api/v1/contracts-sow-acceptance/insights`);
    expect(r.ok()).toBeTruthy();
    const body = await r.json();
    expect(body.total).toBeGreaterThanOrEqual(0);
    expect(typeof body.integrityOkPct).toBe('number');
  });
});
