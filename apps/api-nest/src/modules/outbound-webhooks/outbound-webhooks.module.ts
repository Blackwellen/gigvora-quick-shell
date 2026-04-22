import { Module } from '@nestjs/common';
import { WebhookSubscriptionsController, WebhookDeliveriesController } from './outbound-webhooks.controller';

@Module({ controllers: [WebhookSubscriptionsController, WebhookDeliveriesController] })
export class OutboundWebhooksModule {}
