import { Module } from '@nestjs/common';
import { InternalAdminLoginTerminalController } from './internal-admin-login-terminal.controller';
import { InternalAdminLoginTerminalService } from './internal-admin-login-terminal.service';
import { InternalAdminLoginTerminalRepository } from './internal-admin-login-terminal.repository';

@Module({
  controllers: [InternalAdminLoginTerminalController],
  providers: [InternalAdminLoginTerminalService, InternalAdminLoginTerminalRepository],
  exports: [InternalAdminLoginTerminalService],
})
export class InternalAdminLoginTerminalModule {}
