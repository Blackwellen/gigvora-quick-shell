import { Module } from '@nestjs/common';
import { AdsManagerBuilderController, AdsManagerBuilderModerationController, AdsManagerBuilderWebhookController } from './ads-manager-builder.controller';
import { AdsManagerBuilderService } from './ads-manager-builder.service';
import { AdsManagerBuilderRepository } from './ads-manager-builder.repository';

@Module({
  controllers: [AdsManagerBuilderController, AdsManagerBuilderModerationController, AdsManagerBuilderWebhookController],
  providers: [AdsManagerBuilderService, AdsManagerBuilderRepository],
  exports: [AdsManagerBuilderService],
})
export class AdsManagerBuilderModule {}
