import { Module, OnModuleInit } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { GroupsRepository } from './groups.repository';
import { GroupsMlService } from './groups.ml.service';
import { GroupsAnalyticsService } from './groups.analytics.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { WorkspaceModule } from '../workspace/workspace.module';

/**
 * Domain 14 — Groups, Community Hubs & Member Conversations.
 *
 * Bootstraps two seed groups so the existing UI (GroupsHubPage,
 * GroupDetailPage, GroupFeedPage, GroupMembersPage, GroupModerationPage,
 * GroupJoinApprovalPage, GroupEventsPage, GroupAnalyticsPage,
 * GroupChatsPage, GroupsSearchPage) renders realistic data the moment
 * the backend wires in. Production swaps the in-memory repository for
 * the Drizzle-backed implementation against `packages/db/src/schema/groups.ts`.
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
  controllers: [GroupsController],
  providers: [GroupsService, GroupsRepository, GroupsMlService, GroupsAnalyticsService, JwtStrategy],
  exports: [GroupsService, GroupsMlService, GroupsAnalyticsService],
})
export class GroupsModule implements OnModuleInit {
  constructor(private readonly repo: GroupsRepository) {}

  async onModuleInit() {
    if (await this.repo.getBySlug('product-design-collective')) return;
    const ownerId = '00000000-0000-0000-0000-00000000seed';

    const g1 = await this.repo.seed({
      slug: 'product-design-collective', name: 'Product Design Collective',
      category: 'Design', type: 'public', joinPolicy: 'open', postingPolicy: 'members',
      description: 'Community for product designers sharing work, feedback, and career advice.',
      tags: ['design', 'figma', 'ux'], ownerId,
      memberCount: 4200, postsLast7d: 84,
    });
    await this.repo.upsertMember(g1.id, ownerId, { role: 'owner', status: 'active', displayName: 'Apex Studio' });
    await this.repo.addChannel(g1.id, { name: 'General', slug: 'general', type: 'discussion', position: 0 });
    await this.repo.addChannel(g1.id, { name: 'Show Your Work', slug: 'show-your-work', type: 'discussion', position: 1 });
    await this.repo.addChannel(g1.id, { name: 'Announcements', slug: 'announcements', type: 'announcement', position: 2 });
    await this.repo.addPost(g1.id, ownerId, { body: 'Welcome to the collective! Introduce yourself and share what you’re working on.', pinned: true });
    await this.repo.addPost(g1.id, ownerId, { body: 'Monthly portfolio review — drop your latest case studies in the thread.' });

    const g2 = await this.repo.seed({
      slug: 'react-developers-hub', name: 'React Developers Hub',
      category: 'Engineering', type: 'public', joinPolicy: 'open', postingPolicy: 'members',
      description: 'All things React — hooks, patterns, performance, and best practices.',
      tags: ['react', 'typescript', 'frontend'], ownerId,
      memberCount: 8600, postsLast7d: 168,
    });
    await this.repo.upsertMember(g2.id, ownerId, { role: 'owner', status: 'active' });
    await this.repo.addChannel(g2.id, { name: 'General', slug: 'general', type: 'discussion', position: 0 });
    await this.repo.addPost(g2.id, ownerId, { body: 'React 19 RSC patterns — share your prod migrations and gotchas.' });

    const g3 = await this.repo.seed({
      slug: 'freelancer-mastermind', name: 'Freelancer Mastermind',
      category: 'Business', type: 'private', joinPolicy: 'request', postingPolicy: 'members',
      description: 'Accountability group for freelancers growing their businesses.',
      tags: ['freelance', 'business', 'growth'], ownerId,
      memberCount: 1800, postsLast7d: 32,
    });
    await this.repo.upsertMember(g3.id, ownerId, { role: 'owner', status: 'active' });
  }
}
