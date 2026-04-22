import { Module } from '@nestjs/common';
import { PricingPromotionsMonetizationController } from './pricing-promotions-monetization.controller';
import { PricingPromotionsMonetizationService } from './pricing-promotions-monetization.service';
import { PricingPromotionsMonetizationRepository } from './pricing-promotions-monetization.repository';

@Module({
  controllers: [PricingPromotionsMonetizationController],
  providers: [PricingPromotionsMonetizationService, PricingPromotionsMonetizationRepository],
  exports: [PricingPromotionsMonetizationService],
})
export class PricingPromotionsMonetizationModule {}
