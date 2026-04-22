/**
 * D36 subscriber — auto-mint a contract whenever D35 closes an award.
 *
 * Listens on the in-process domain bus for `praa.award.closed` and snapshots
 * the proposal into a fresh contract. Idempotency key derived from awardId so
 * replays from the bus or webhook gateway never double-mint.
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { domainBus } from '../domain-bus/domain-bus';
import { ContractsSowAcceptanceService } from './contracts-sow-acceptance.service';

@Injectable()
export class ContractsSowAcceptanceSubscriber implements OnModuleInit {
  private readonly log = new Logger('csa.sub');

  constructor(private readonly svc: ContractsSowAcceptanceService) {}

  onModuleInit() {
    domainBus.on('praa.award.closed', (msg: any) => {
      try {
        const tenantId: string = msg?.tenantId ?? 'tenant-demo';
        const awardId: string = msg?.entityId ?? 'unknown-award';
        const payload = msg?.payload ?? {};
        const proposalId: string = payload.proposalId ?? '00000000-0000-0000-0000-000000000000';
        const projectId: string = payload.projectId ?? '00000000-0000-0000-0000-000000000000';
        const existing = this.svc.byProposal(proposalId);
        if (existing) {
          this.log.log(`praa.award.closed → already minted contract ${existing.id} for proposal ${proposalId}`);
          return;
        }
        const contract = this.svc.mintFromAward({
          tenantId,
          awardId,
          proposalId,
          projectId,
          title: payload.title ?? 'Contract from award',
          governingLaw: 'UK',
          expiresInDays: 30,
          parties: [
            { partyId: payload.clientPartyId ?? `client-${awardId}`,   role: 'client',   displayName: payload.clientName   ?? 'Client',   signOrder: 1 },
            { partyId: payload.providerPartyId ?? `provider-${awardId}`, role: 'provider', displayName: payload.providerName ?? 'Provider', signOrder: 2 },
          ],
          snapshot: payload.snapshot,
          idempotencyKey: `mint-from-award-${awardId}`,
          actor: 'system:csa-subscriber',
        });
        this.log.log(`praa.award.closed → minted contract ${contract.id} for proposal ${proposalId}`);
      } catch (e: any) {
        this.log.warn(`praa.award.closed handler failed: ${e?.message}`);
      }
    });
  }
}
