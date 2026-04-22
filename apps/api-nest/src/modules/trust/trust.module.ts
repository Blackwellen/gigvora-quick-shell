import { Module, OnModuleInit } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TrustController } from './trust.controller';
import { TrustService } from './trust.service';
import { TrustRepository } from './trust.repository';
import { TrustAnalyticsService } from './trust.analytics.service';
import { TrustMlService } from './trust.ml.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { WorkspaceModule } from '../workspace/workspace.module';

/**
 * Domain 16 — Ratings, Reviews, Trust Badges & Social Proof.
 *
 * Wiring follows the established Gigvora pattern: Passport JWT, AuditService
 * via WorkspaceModule, MlClient via the global infra module, in-memory
 * repository (swap to Drizzle by binding the same shape), and a bootstrap
 * seed so the existing `/trust` UI renders realistic data immediately.
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
  controllers: [TrustController],
  providers: [TrustService, TrustRepository, TrustAnalyticsService, TrustMlService, JwtStrategy],
  exports: [TrustService, TrustAnalyticsService, TrustMlService],
})
export class TrustModule implements OnModuleInit {
  constructor(private readonly repo: TrustRepository) {}
  async onModuleInit() {
    // Seed canonical demo trust profile so TrustPage renders realistic data
    // until a real identity is signed in.
    await this.repo.seed('seed-user');
  }
}
