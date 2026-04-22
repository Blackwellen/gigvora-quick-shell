import { Module } from '@nestjs/common';
import { InternalAdminShellController } from './internal-admin-shell.controller';
import { InternalAdminShellService } from './internal-admin-shell.service';
import { InternalAdminShellRepository } from './internal-admin-shell.repository';

@Module({
  controllers: [InternalAdminShellController],
  providers: [InternalAdminShellService, InternalAdminShellRepository],
  exports: [InternalAdminShellService],
})
export class InternalAdminShellModule {}
