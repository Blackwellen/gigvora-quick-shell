import { Module } from '@nestjs/common';
import { MasterSettingsController } from './master-settings.controller';
import { MasterSettingsService } from './master-settings.service';
import { MasterSettingsRepo } from './master-settings.repo';
import { SuperAdminCommandCenterModule } from '../super-admin-command-center/super-admin-command-center.module';

@Module({
  imports: [SuperAdminCommandCenterModule],
  controllers: [MasterSettingsController],
  providers: [MasterSettingsService, MasterSettingsRepo],
  exports: [MasterSettingsService],
})
export class MasterSettingsModule {}
