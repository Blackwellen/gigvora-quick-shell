import { Module } from '@nestjs/common';
import { FinanceAdminController } from './finance-admin.controller';
import { FinanceAdminService } from './finance-admin.service';
import { FinanceAdminRepository } from './finance-admin.repository';
import { FinanceVaultController } from './finance-vault.controller';
import { FinanceVaultService } from './finance-vault.service';
import { FinanceVaultRepository } from './finance-vault.repository';

@Module({
  controllers: [FinanceAdminController, FinanceVaultController],
  providers: [FinanceAdminService, FinanceAdminRepository, FinanceVaultService, FinanceVaultRepository],
  exports: [FinanceAdminService, FinanceVaultService],
})
export class FinanceAdminModule {}
