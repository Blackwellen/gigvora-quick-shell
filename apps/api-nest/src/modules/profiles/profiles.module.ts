import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { ProfilesRepository } from './profiles.repository';
import { ProfilesMlService } from './profiles.ml.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { WorkspaceModule } from '../workspace/workspace.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      signOptions: { expiresIn: '15m' },
    }),
    WorkspaceModule,
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService, ProfilesRepository, ProfilesMlService, JwtStrategy],
  exports: [ProfilesService, ProfilesMlService],
})
export class ProfilesDomainModule {}
