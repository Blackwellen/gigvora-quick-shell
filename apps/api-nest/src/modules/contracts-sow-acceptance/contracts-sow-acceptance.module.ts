import { Module } from '@nestjs/common';
import { ContractsSowAcceptanceController } from './contracts-sow-acceptance.controller';
import { ContractsSowAcceptanceService } from './contracts-sow-acceptance.service';
import { ContractsSowAcceptanceRepository } from './contracts-sow-acceptance.repository';
import { ContractsSowAcceptanceAnalyticsService } from './contracts-sow-acceptance.analytics.service';
import { ContractsSowAcceptanceSubscriber } from './contracts-sow-acceptance.subscriber';

/**
 * Domain 36 — Contracts, SoW, Terms Acceptance & Signature Follow-Through.
 * Auto-mints contracts when D35 (proposal-review-award) closes an award and
 * runs the click-to-sign signature ledger. Escrow release is intentionally
 * NOT wired here — it remains owned by D34 + delivery + dispute domains.
 */
@Module({
  controllers: [ContractsSowAcceptanceController],
  providers: [
    ContractsSowAcceptanceService,
    ContractsSowAcceptanceRepository,
    ContractsSowAcceptanceAnalyticsService,
    ContractsSowAcceptanceSubscriber,
  ],
  exports: [ContractsSowAcceptanceService],
})
export class ContractsSowAcceptanceModule {}
