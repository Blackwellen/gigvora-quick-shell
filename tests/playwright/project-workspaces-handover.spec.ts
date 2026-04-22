import { expect, test } from '@playwright/test';

/**
 * D37 — Project Workspaces & Handover.
 *
 * Validates the full execution + handover flow against the live NestJS API:
 *   1. Mint a workspace from a (mocked) contract activation with two milestones.
 *   2. Kickoff flips kickoff → active.
 *   3. Milestone transitions enforce optimistic concurrency.
 *   4. Submit + accept a deliverable.
 *   5. Accepting every milestone auto-flips workspace to in-review.
 *   6. Start handover, complete every checklist item.
 *   7. Close workspace publishes the final report and flips status → closed.
 *   8. Idempotent close replay returns the same report row.
 *
 * Escrow release is intentionally NOT exercised here — that journey lives in
 * D34 + dispute domains.
 */
const API = process.env.API_BASE ?? 'http://localhost:3001';

test.describe('@d37 project workspaces + handover', () => {
  test('end-to-end: mint → kickoff → milestones → handover → close', async ({ request }) => {
    const contractId = '55555555-5555-5555-5555-555555555555';
    const projectId  = '66666666-6666-6666-6666-666666666666';
    const idem       = `e2e-${Date.now()}`;

    // 1. mint
    const mintRes = await request.post(`${API}/api/v1/project-workspaces-handover/workspaces/from-contract`, {
      data: {
        contractId, projectId,
        title: 'E2E Workspace',
        milestones: [
          { title: 'Sprint 1', amountCents: 1000_00, dueAt: null },
          { title: 'Sprint 2', amountCents: 1000_00, dueAt: null },
        ],
        parties: [
          { partyId: 'client-e2e',   role: 'client',   displayName: 'Client E2E' },
          { partyId: 'provider-e2e', role: 'provider', displayName: 'Provider E2E' },
        ],
        idempotencyKey: `mint-${idem}`,
      },
    });
    expect(mintRes.ok()).toBeTruthy();
    const ws = await mintRes.json();
    expect(ws.status).toBe('kickoff');

    // 2. kickoff
    const kickoff = await request.post(`${API}/api/v1/project-workspaces-handover/workspaces/${ws.id}/kickoff`);
    expect(kickoff.ok()).toBeTruthy();
    expect((await kickoff.json()).status).toBe('active');

    // 3. transitions
    const detail1 = await (await request.get(`${API}/api/v1/project-workspaces-handover/workspaces/${ws.id}`)).json();
    const m1 = detail1.milestones[0];
    const m2 = detail1.milestones[1];

    // version conflict guarded
    const conflict = await request.post(`${API}/api/v1/project-workspaces-handover/milestones/transition`, {
      data: { workspaceId: ws.id, milestoneId: m1.id, toStatus: 'in-progress', expectedVersion: 999 },
    });
    expect(conflict.ok()).toBeFalsy();

    const start1 = await request.post(`${API}/api/v1/project-workspaces-handover/milestones/transition`, {
      data: { workspaceId: ws.id, milestoneId: m1.id, toStatus: 'in-progress', expectedVersion: m1.version },
    });
    expect(start1.ok()).toBeTruthy();
    const m1v2 = await start1.json();

    // 4. submit + accept deliverable
    const deliv = await request.post(`${API}/api/v1/project-workspaces-handover/deliverables/submit`, {
      data: {
        workspaceId: ws.id, milestoneId: m1.id,
        title: 'Sprint 1 build', url: 'https://example.com/build.zip',
        idempotencyKey: `deliv-${idem}`,
      },
    });
    expect(deliv.ok()).toBeTruthy();
    const delivRow = await deliv.json();

    const review = await request.post(`${API}/api/v1/project-workspaces-handover/deliverables/review`, {
      data: { workspaceId: ws.id, deliverableId: delivRow.id, decision: 'accepted' },
    });
    expect(review.ok()).toBeTruthy();

    // submit + accept milestone 1 + 2
    const sub1 = await request.post(`${API}/api/v1/project-workspaces-handover/milestones/transition`, {
      data: { workspaceId: ws.id, milestoneId: m1.id, toStatus: 'submitted', expectedVersion: m1v2.version },
    });
    const acc1 = await request.post(`${API}/api/v1/project-workspaces-handover/milestones/transition`, {
      data: { workspaceId: ws.id, milestoneId: m1.id, toStatus: 'accepted', expectedVersion: (await sub1.json()).version },
    });
    expect(acc1.ok()).toBeTruthy();

    let cur = m2;
    for (const to of ['in-progress', 'submitted', 'accepted']) {
      const r = await request.post(`${API}/api/v1/project-workspaces-handover/milestones/transition`, {
        data: { workspaceId: ws.id, milestoneId: m2.id, toStatus: to, expectedVersion: cur.version },
      });
      expect(r.ok()).toBeTruthy();
      cur = await r.json();
    }

    // 5. workspace auto-flipped to in-review
    const detail2 = await (await request.get(`${API}/api/v1/project-workspaces-handover/workspaces/${ws.id}`)).json();
    expect(detail2.status).toBe('in-review');

    // 6. start handover + complete every checklist item
    const startHandover = await request.post(`${API}/api/v1/project-workspaces-handover/handover/start`, {
      data: { workspaceId: ws.id },
    });
    expect(startHandover.ok()).toBeTruthy();
    expect((await startHandover.json()).status).toBe('handover');

    const detail3 = await (await request.get(`${API}/api/v1/project-workspaces-handover/workspaces/${ws.id}`)).json();
    for (const item of detail3.checklist) {
      const r = await request.post(`${API}/api/v1/project-workspaces-handover/handover/complete-item`, {
        data: { workspaceId: ws.id, itemId: item.id },
      });
      expect(r.ok()).toBeTruthy();
    }

    // 7. close
    const close = await request.post(`${API}/api/v1/project-workspaces-handover/workspaces/close`, {
      data: {
        workspaceId: ws.id,
        finalReportMd: '# Final report\nDelivered every milestone, transferred all assets, retainer arranged.',
        idempotencyKey: `close-${idem}`,
      },
    });
    expect(close.ok()).toBeTruthy();
    const closed = await close.json();
    expect(closed.workspace.status).toBe('closed');
    expect(closed.report.id).toBeTruthy();

    // 8. idempotent close
    const replay = await request.post(`${API}/api/v1/project-workspaces-handover/workspaces/close`, {
      data: {
        workspaceId: ws.id,
        finalReportMd: 'should not overwrite',
        idempotencyKey: `close-${idem}`,
      },
    });
    expect(replay.ok()).toBeTruthy();
    const replayed = await replay.json();
    expect(replayed.report.id).toBe(closed.report.id);
  });

  test('insights endpoint returns finite counters', async ({ request }) => {
    const r = await request.get(`${API}/api/v1/project-workspaces-handover/insights`);
    expect(r.ok()).toBeTruthy();
    const body = await r.json();
    expect(body.total).toBeGreaterThanOrEqual(0);
    expect(typeof body.handoverReadinessPct).toBe('number');
  });
});
