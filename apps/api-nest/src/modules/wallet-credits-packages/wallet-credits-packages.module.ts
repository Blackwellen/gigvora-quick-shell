import { Module } from '@nestjs/common';
import { WalletCreditsPackagesController, WalletCreditsPackagesWebhookController } from './wallet-credits-packages.controller';
import { WalletCreditsPackagesService } from './wallet-credits-packages.service';
import { WalletCreditsPackagesRepository } from './wallet-credits-packages.repository';

@Module({
  controllers: [WalletCreditsPackagesController, WalletCreditsPackagesWebhookController],
  providers: [WalletCreditsPackagesService, WalletCreditsPackagesRepository],
  exports: [WalletCreditsPackagesService],
})
export class WalletCreditsPackagesModule {}
