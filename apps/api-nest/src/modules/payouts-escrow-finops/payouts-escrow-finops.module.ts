import { Module } from '@nestjs/common';
import { PayoutsEscrowFinopsController, PayoutsEscrowFinopsAdminController, PayoutsEscrowFinopsWebhookController } from './payouts-escrow-finops.controller';
import { PayoutsEscrowFinopsService } from './payouts-escrow-finops.service';
import { PayoutsEscrowFinopsRepository } from './payouts-escrow-finops.repository';

@Module({
  controllers: [PayoutsEscrowFinopsController, PayoutsEscrowFinopsAdminController, PayoutsEscrowFinopsWebhookController],
  providers: [PayoutsEscrowFinopsService, PayoutsEscrowFinopsRepository],
  exports: [PayoutsEscrowFinopsService],
})
export class PayoutsEscrowFinopsModule {}
