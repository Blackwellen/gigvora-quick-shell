import { Module, OnModuleInit } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { InboxController } from './inbox.controller';
import { InboxService } from './inbox.service';
import { InboxRepository } from './inbox.repository';
import { InboxAnalyticsService } from './inbox.analytics.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { WorkspaceModule } from '../workspace/workspace.module';

/**
 * Domain 17 — Inbox, Messaging & Context-Aware Threads.
 *
 * Wiring follows the established Gigvora pattern (see TrustModule):
 *  • Passport JWT for participant identity.
 *  • AuditService via WorkspaceModule for audit-sensitive transitions.
 *  • InboxAnalyticsService talks to analytics-python with deterministic
 *    fallback so insights cards never blank.
 *  • In-memory repo with bootstrap seed mirrors the existing /inbox UI so
 *    surfaces (InboxThreadPage, ThreadDetailPage, ChatSharedFilesPage,
 *    ChatLinkedContextPage, UnreadMentionCenterPage, ChatSearchPage) become
 *    live without redesign.
 */
@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      signOptions: { expiresIn: '15m' },
    }),
    WorkspaceModule,
  ],
  controllers: [InboxController],
  providers: [InboxService, InboxRepository, InboxAnalyticsService, JwtStrategy],
  exports: [InboxService, InboxAnalyticsService],
})
export class InboxModule implements OnModuleInit {
  constructor(private readonly repo: InboxRepository) {}
  async onModuleInit() {
    // Seed the canonical demo identity so /inbox renders realistic data.
    await this.repo.seed('seed-user');
  }
}
