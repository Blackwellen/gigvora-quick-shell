import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { FeedRepository } from './feed.repository';
import { FeedMlService } from './feed.ml.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { WorkspaceModule } from '../workspace/workspace.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      signOptions: { expiresIn: '15m' },
    }),
    WorkspaceModule, // exports AuditService
  ],
  controllers: [FeedController],
  providers: [FeedService, FeedRepository, FeedMlService, JwtStrategy],
  exports: [FeedService, FeedMlService],
})
export class FeedModule {}

