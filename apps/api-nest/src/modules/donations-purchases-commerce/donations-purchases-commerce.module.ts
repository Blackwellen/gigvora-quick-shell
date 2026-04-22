import { Module } from '@nestjs/common';
import { DonationsPurchasesCommerceController } from './donations-purchases-commerce.controller';
import { DonationsPurchasesCommerceService } from './donations-purchases-commerce.service';
import { DonationsPurchasesCommerceRepository } from './donations-purchases-commerce.repository';

@Module({
  controllers: [DonationsPurchasesCommerceController],
  providers: [DonationsPurchasesCommerceService, DonationsPurchasesCommerceRepository],
  exports: [DonationsPurchasesCommerceService],
})
export class DonationsPurchasesCommerceModule {}
