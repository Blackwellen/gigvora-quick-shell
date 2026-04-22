import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { SettingsRepository } from './settings.repository';
import { JwtStrategy } from '../auth/jwt.strategy';
import { WorkspaceModule } from '../workspace/workspace.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      signOptions: { expiresIn: '15m' },
    }),
    WorkspaceModule, // for AuditService
  ],
  controllers: [SettingsController],
  providers: [SettingsService, SettingsRepository, JwtStrategy],
  exports: [SettingsService],
})
export class SettingsModule {}
