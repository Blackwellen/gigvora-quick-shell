import { Module } from '@nestjs/common';
import { MarketingController } from './marketing.controller';
import { MarketingService } from './marketing.service';
import { MarketingRepository } from './marketing.repository';
import { WorkspaceModule } from '../workspace/workspace.module';
import { MarketingAdminController } from './admin/marketing-admin.controller';
import { MarketingAdminService } from './admin/marketing-admin.service';
import { MarketingAdminRepository } from './admin/marketing-admin.repository';
import { MarketingAdminMlService } from './admin/marketing-admin.ml.service';

@Module({
  imports: [WorkspaceModule], // for AuditService
  controllers: [MarketingController, MarketingAdminController],
  providers: [MarketingService, MarketingRepository, MarketingAdminService, MarketingAdminRepository, MarketingAdminMlService],
  exports: [MarketingService, MarketingAdminService],
})
export class MarketingModule {}
