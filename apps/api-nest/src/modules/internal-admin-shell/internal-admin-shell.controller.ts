import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InternalAdminShellService } from './internal-admin-shell.service';
import {
  WorkspaceSchema, QueueSchema, QueueItemSchema, QueueItemTransitionSchema,
  QueueJumpSchema, ShortcutSchema,
} from './dto';

/**
 * Internal-only routes. The reverse proxy MUST scope `/api/v1/internal-admin-shell/*`
 * to the `/internal/*` boundary so public traffic never reaches it.
 */
@Controller('api/v1/internal-admin-shell')
@UseGuards(AuthGuard('jwt'))
export class InternalAdminShellController {
  constructor(private readonly svc: InternalAdminShellService) {}
  private actor(req: any): string { return req.user.sub; }
  private role(req: any): string { return req.user.role ?? 'operator'; }
  private meta(req: any) { return { ip: req.ip ?? req.headers?.['x-forwarded-for'], userAgent: req.headers?.['user-agent'] }; }

  // Overview
  @Get('overview') overview(@Req() req: any) { return this.svc.overview(this.role(req)); }

  // Workspace routing
  @Get('workspaces') listWorkspaces(@Req() req: any) { return this.svc.listWorkspaces(this.role(req)); }
  @Post('workspaces') createWorkspace(@Req() req: any, @Body() body: any) {
    return this.svc.createWorkspace(this.actor(req), this.role(req), WorkspaceSchema.parse(body), this.meta(req));
  }

  // Queues
  @Get('queues') listQueues(@Req() req: any, @Query('workspaceSlug') ws?: string, @Query('domain') d?: string) {
    return this.svc.listQueues(this.role(req), { workspaceSlug: ws, domain: d });
  }
  @Get('queues/:slug/items') items(@Req() req: any, @Param('slug') slug: string) {
    return this.svc.listQueueItems(this.role(req), slug);
  }
  @Post('queue-items') createItem(@Req() req: any, @Body() body: any) {
    return this.svc.createQueueItem(this.actor(req), this.role(req), QueueItemSchema.parse(body), this.meta(req));
  }
  @Patch('queue-items/transition') transition(@Req() req: any, @Body() body: any) {
    return this.svc.transitionQueueItem(this.actor(req), this.role(req), QueueItemTransitionSchema.parse(body), this.meta(req));
  }
  @Post('queue-jump') jump(@Req() req: any, @Body() body: any) {
    return this.svc.queueJump(this.actor(req), this.role(req), QueueJumpSchema.parse(body), this.meta(req));
  }

  // Shortcuts
  @Get('shortcuts') shortcuts(@Req() req: any) { return this.svc.shortcuts(this.role(req)); }
  @Post('shortcuts') upsertShortcut(@Req() req: any, @Body() body: any) {
    return this.svc.upsertShortcut(this.actor(req), this.role(req), ShortcutSchema.parse(body), this.meta(req));
  }

  // Audit
  @Get('audit') audit() { return this.svc.audit(); }
}
