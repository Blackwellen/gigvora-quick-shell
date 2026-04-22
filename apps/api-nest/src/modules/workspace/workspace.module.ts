import { Module } from '@nestjs/common';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';
import { OrgsController } from './orgs.controller';
import { SavedViewsController } from './saved-views.controller';
import { RecentItemsController } from './recent-items.controller';
import { ShellPrefsController } from './shell-prefs.controller';
import { WorkspaceRepository } from './workspace.repository';
import { AuditService } from './audit.service';

@Module({
  controllers: [
    WorkspaceController,
    OrgsController,
    SavedViewsController,
    RecentItemsController,
    ShellPrefsController,
  ],
  providers: [WorkspaceService, WorkspaceRepository, AuditService],
  exports: [WorkspaceService, AuditService],
})
export class WorkspaceModule {}
