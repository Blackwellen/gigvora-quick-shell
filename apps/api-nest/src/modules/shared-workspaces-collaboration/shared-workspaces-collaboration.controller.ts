import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SharedWorkspacesCollaborationService } from './shared-workspaces-collaboration.service';
import {
  ListWorkspacesQuerySchema, CreateWorkspaceSchema, UpdateWorkspaceSchema, TransitionWorkspaceSchema,
  AddMemberSchema, ChangeMemberRoleSchema,
  ListNotesQuerySchema, CreateNoteSchema, UpdateNoteSchema, TransitionNoteSchema,
  ListHandoffsQuerySchema, CreateHandoffSchema, TransitionHandoffSchema, UpdateChecklistSchema,
} from './dto';

@Controller('api/v1/shared-workspaces-collaboration')
@UseGuards(AuthGuard('jwt'))
export class SharedWorkspacesCollaborationController {
  constructor(private readonly svc: SharedWorkspacesCollaborationService) {}

  private reqMeta(req: any) {
    return { ip: req.ip ?? req.headers?.['x-forwarded-for'], userAgent: req.headers?.['user-agent'] };
  }
  private orgOf(req: any): string { return req.user.orgId ?? req.user.sub; }
  private idOf(req: any): string { return req.user.sub; }

  @Get('overview')
  overview(@Req() req: any) { return this.svc.overview(this.orgOf(req), this.idOf(req)); }

  // Workspaces
  @Get('workspaces')
  listWorkspaces(@Req() req: any, @Query() q: any) {
    return this.svc.listWorkspaces(this.orgOf(req), ListWorkspacesQuerySchema.parse(q));
  }
  @Post('workspaces')
  createWorkspace(@Req() req: any, @Body() body: any) {
    return this.svc.createWorkspace(this.orgOf(req), CreateWorkspaceSchema.parse(body),
      this.idOf(req), req.user.fullName ?? 'Unknown', req.user.email ?? 'unknown@example.com', this.reqMeta(req));
  }
  @Get('workspaces/:id')
  getWorkspace(@Req() req: any, @Param('id') id: string) {
    return this.svc.getWorkspace(this.orgOf(req), id, this.idOf(req));
  }
  @Patch('workspaces/:id')
  updateWorkspace(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateWorkspace(this.orgOf(req), id, UpdateWorkspaceSchema.parse(body), this.idOf(req), this.reqMeta(req));
  }
  @Patch('workspaces/:id/status')
  transitionWorkspace(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const { status } = TransitionWorkspaceSchema.parse(body);
    return this.svc.transitionWorkspace(this.orgOf(req), id, status, this.idOf(req), this.reqMeta(req));
  }

  // Members
  @Get('workspaces/:id/members')
  listMembers(@Req() req: any, @Param('id') id: string) {
    return this.svc.listMembers(this.orgOf(req), id, this.idOf(req));
  }
  @Post('workspaces/:id/members')
  addMember(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.addMember(this.orgOf(req), id, AddMemberSchema.parse(body), this.idOf(req), this.reqMeta(req));
  }
  @Patch('workspaces/:id/members/:memberId/role')
  changeMemberRole(@Req() req: any, @Param('id') id: string, @Param('memberId') memberId: string, @Body() body: any) {
    const { role } = ChangeMemberRoleSchema.parse(body);
    return this.svc.changeMemberRole(this.orgOf(req), id, memberId, role, this.idOf(req), this.reqMeta(req));
  }
  @Delete('workspaces/:id/members/:memberId')
  removeMember(@Req() req: any, @Param('id') id: string, @Param('memberId') memberId: string) {
    return this.svc.removeMember(this.orgOf(req), id, memberId, this.idOf(req), this.reqMeta(req));
  }

  // Notes
  @Get('workspaces/:id/notes')
  listNotes(@Req() req: any, @Param('id') id: string, @Query() q: any) {
    return this.svc.listNotes(this.orgOf(req), id, ListNotesQuerySchema.parse(q), this.idOf(req));
  }
  @Get('workspaces/:id/notes/:noteId')
  getNote(@Req() req: any, @Param('id') id: string, @Param('noteId') noteId: string) {
    return this.svc.getNote(this.orgOf(req), id, noteId, this.idOf(req));
  }
  @Post('workspaces/:id/notes')
  createNote(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.createNote(this.orgOf(req), id, CreateNoteSchema.parse(body), this.idOf(req), this.reqMeta(req));
  }
  @Patch('workspaces/:id/notes/:noteId')
  updateNote(@Req() req: any, @Param('id') id: string, @Param('noteId') noteId: string, @Body() body: any) {
    return this.svc.updateNote(this.orgOf(req), id, noteId, UpdateNoteSchema.parse(body), this.idOf(req), this.reqMeta(req));
  }
  @Patch('workspaces/:id/notes/:noteId/status')
  transitionNote(@Req() req: any, @Param('id') id: string, @Param('noteId') noteId: string, @Body() body: any) {
    const { status } = TransitionNoteSchema.parse(body);
    return this.svc.transitionNote(this.orgOf(req), id, noteId, status, this.idOf(req), this.reqMeta(req));
  }

  // Handoffs
  @Get('workspaces/:id/handoffs')
  listHandoffs(@Req() req: any, @Param('id') id: string, @Query() q: any) {
    return this.svc.listHandoffs(this.orgOf(req), id, ListHandoffsQuerySchema.parse(q), this.idOf(req));
  }
  @Get('workspaces/:id/handoffs/:handoffId')
  getHandoff(@Req() req: any, @Param('id') id: string, @Param('handoffId') handoffId: string) {
    return this.svc.getHandoff(this.orgOf(req), id, handoffId, this.idOf(req));
  }
  @Post('workspaces/:id/handoffs')
  createHandoff(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.createHandoff(this.orgOf(req), id, CreateHandoffSchema.parse(body), this.idOf(req), this.reqMeta(req));
  }
  @Patch('workspaces/:id/handoffs/:handoffId/status')
  transitionHandoff(@Req() req: any, @Param('id') id: string, @Param('handoffId') handoffId: string, @Body() body: any) {
    return this.svc.transitionHandoff(this.orgOf(req), id, handoffId, TransitionHandoffSchema.parse(body), this.idOf(req), this.reqMeta(req));
  }
  @Patch('workspaces/:id/handoffs/:handoffId/checklist')
  updateChecklist(@Req() req: any, @Param('id') id: string, @Param('handoffId') handoffId: string, @Body() body: any) {
    const { checklist } = UpdateChecklistSchema.parse(body);
    return this.svc.updateHandoffChecklist(this.orgOf(req), id, handoffId, checklist, this.idOf(req), this.reqMeta(req));
  }

  // Audit
  @Get('workspaces/:id/audit')
  audit(@Req() req: any, @Param('id') id: string, @Query('limit') limit?: string) {
    return this.svc.listAudit(this.orgOf(req), id, this.idOf(req), Math.min(500, Math.max(1, Number(limit) || 100)));
  }
}
