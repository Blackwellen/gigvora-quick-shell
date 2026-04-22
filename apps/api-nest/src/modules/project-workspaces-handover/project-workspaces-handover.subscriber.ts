/**
 * D37 subscriber — auto-mint a workspace whenever D36 activates a contract.
 *
 * Listens on the in-process domain bus for `csa.contract.activated` and
 * snapshots the contract's milestones into a fresh workspace. Idempotency key
 * derived from contractId so replays from the bus or webhook gateway never
 * double-mint. Falls back to a sensible default milestone plan when the
 * payload doesn't carry one.
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { domainBus } from '../domain-bus/domain-bus';
import { ProjectWorkspacesHandoverService } from './project-workspaces-handover.service';

@Injectable()
export class ProjectWorkspacesHandoverSubscriber implements OnModuleInit {
  private readonly log = new Logger('pwh.sub');

  constructor(private readonly svc: ProjectWorkspacesHandoverService) {}

  onModuleInit() {
    domainBus.on('csa.contract.activated', (msg: any) => {
      try {
        const tenantId: string = msg?.tenantId ?? 'tenant-demo';
        const contractId: string = msg?.entityId ?? 'unknown-contract';
        const payload = msg?.payload ?? {};
        const projectId: string = payload.projectId ?? '00000000-0000-0000-0000-000000000000';
        const existing = this.svc.byContract(contractId);
        if (existing) {
          this.log.log(`csa.contract.activated → workspace already minted ${existing.id} for contract ${contractId}`);
          return;
        }
        const milestones = Array.isArray(payload.milestones) && payload.milestones.length
          ? payload.milestones.map((m: any) => ({ title: String(m.title ?? 'Milestone'), amountCents: Number(m.amountCents ?? 0), dueAt: m.dueAt ?? null }))
          : [
              { title: 'Kickoff + plan',      amountCents: 5_000_00, dueAt: null },
              { title: 'Delivery — sprint 1', amountCents: 10_000_00, dueAt: null },
              { title: 'Delivery — sprint 2', amountCents: 10_000_00, dueAt: null },
              { title: 'Handover + close',    amountCents: 5_000_00, dueAt: null },
            ];
        const parties = Array.isArray(payload.parties) && payload.parties.length
          ? payload.parties.map((p: any) => ({ partyId: String(p.partyId), role: (p.role === 'provider' || p.role === 'observer' ? p.role : 'client') as 'client' | 'provider' | 'observer', displayName: String(p.displayName ?? p.partyId) }))
          : [
              { partyId: payload.clientPartyId   ?? `client-${contractId}`,   role: 'client'   as const, displayName: payload.clientName   ?? 'Client' },
              { partyId: payload.providerPartyId ?? `provider-${contractId}`, role: 'provider' as const, displayName: payload.providerName ?? 'Provider' },
            ];
        const ws = this.svc.mintFromContract({
          tenantId, contractId, projectId,
          title: payload.title ?? `Workspace from contract ${contractId}`,
          milestones, parties,
          idempotencyKey: `mint-from-contract-${contractId}`,
          actor: 'system:pwh-subscriber',
        });
        this.log.log(`csa.contract.activated → minted workspace ${ws.id} for contract ${contractId}`);
      } catch (e: any) {
        this.log.warn(`csa.contract.activated handler failed: ${e?.message}`);
      }
    });
  }
}
