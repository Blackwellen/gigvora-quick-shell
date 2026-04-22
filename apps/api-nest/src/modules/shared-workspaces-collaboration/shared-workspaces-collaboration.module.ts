import { Module } from '@nestjs/common';
import { SharedWorkspacesCollaborationController } from './shared-workspaces-collaboration.controller';
import { SharedWorkspacesCollaborationService } from './shared-workspaces-collaboration.service';
import { SharedWorkspacesCollaborationRepository } from './shared-workspaces-collaboration.repository';

@Module({
  controllers: [SharedWorkspacesCollaborationController],
  providers: [SharedWorkspacesCollaborationService, SharedWorkspacesCollaborationRepository],
  exports: [SharedWorkspacesCollaborationService],
})
export class SharedWorkspacesCollaborationModule {}
