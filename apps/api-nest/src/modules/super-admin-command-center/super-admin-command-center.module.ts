import { Module } from '@nestjs/common';
import { SuperAdminCommandCenterController } from './super-admin-command-center.controller';
import { SuperAdminCommandCenterService } from './super-admin-command-center.service';
import { SuperAdminCommandCenterRepository } from './super-admin-command-center.repository';
import { SuperAdminAuditService } from './audit.service';

@Module({
  controllers: [SuperAdminCommandCenterController],
  providers: [SuperAdminCommandCenterService, SuperAdminCommandCenterRepository, SuperAdminAuditService],
  exports: [SuperAdminCommandCenterService, SuperAdminAuditService],
})
export class SuperAdminCommandCenterModule {}
