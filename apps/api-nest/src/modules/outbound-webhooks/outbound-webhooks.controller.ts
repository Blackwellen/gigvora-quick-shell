/**
 * NestJS controller exposing outbound webhook subscriptions + delivery logs +
 * replay. Used by every domain workbench's "Webhooks" tab.
 */
import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { outboundWebhooks, WebhookEvent } from './outbound-webhooks.publisher';

@Controller('webhook-subscriptions')
export class WebhookSubscriptionsController {
  @Get() list(@Query('tenantId') tenantId = 'tenant-demo') { return outboundWebhooks.listSubscriptions(tenantId); }
  @Post() create(@Body() body: { tenantId?: string; url: string; events?: WebhookEvent[]; active?: boolean }) {
    return outboundWebhooks.upsertSubscription({
      tenantId: body.tenantId ?? 'tenant-demo',
      url: body.url, events: body.events ?? [], active: body.active ?? true,
    });
  }
  @Post(':id/rotate-secret') rotate(@Param('id') id: string) { return outboundWebhooks.rotateSecret(id); }
  @Delete(':id') deactivate(@Param('id') id: string) {
    const subs = outboundWebhooks.listSubscriptions('tenant-demo');
    const s = subs.find((x) => x.id === id); if (s) s.active = false; return { ok: true };
  }
}

@Controller('webhook-deliveries')
export class WebhookDeliveriesController {
  @Get() list(
    @Query('tenantId') tenantId = 'tenant-demo',
    @Query('event') event?: WebhookEvent,
    @Query('status') status?: 'pending' | 'success' | 'failed' | 'dlq',
  ) { return outboundWebhooks.listDeliveries(tenantId, { event, status }); }
  @Post(':id/replay') replay(@Param('id') id: string) { return outboundWebhooks.replay(id); }
}
