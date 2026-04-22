import { Module, OnModuleInit } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventsRepository } from './events.repository';
import { EventsAnalyticsService } from './events.analytics.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { WorkspaceModule } from '../workspace/workspace.module';

/**
 * Domain 15 — Events, Networking Sessions, RSVPs & Social Meetups.
 *
 * Bootstraps a realistic spread of seed events (webinar, meetup, summit,
 * speed-networking, enterprise roundtable) so the existing UI surfaces
 * (EventsDiscoveryPage, EventDetailPage, EventRSVPPage, EventLobbyPage,
 * EventLiveRoomPage, EventReplayPage, EventCreatePage, EventHostControlsPage,
 * EventAttendeeManagementPage, EventAnalyticsPage, EnterpriseEventsPage,
 * GroupEventsPage, NetworkingSessionsPage, LiveSpeedNetworkingPage,
 * ProfileEventsTab) render believable data the moment the backend wires in.
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
  controllers: [EventsController],
  providers: [EventsService, EventsRepository, EventsAnalyticsService, JwtStrategy],
  exports: [EventsService, EventsAnalyticsService],
})
export class EventsModule implements OnModuleInit {
  constructor(private readonly repo: EventsRepository) {}

  async onModuleInit() {
    if (await this.repo.getBySlug('design-systems-at-scale')) return;
    const hostId = '00000000-0000-0000-0000-00000000seed';
    const now = Date.now();
    const day = 86400 * 1000;

    await this.repo.seed({
      slug: 'design-systems-at-scale', title: 'Design Systems at Scale',
      type: 'webinar', format: 'virtual', visibility: 'public',
      description: 'Senior designers discuss scaling design systems across product teams.',
      startsAt: new Date(now + 14 * day).toISOString(),
      endsAt:   new Date(now + 14 * day + 90 * 60 * 1000).toISOString(),
      timezone: 'America/New_York', capacity: 500,
      hostId, tags: ['design', 'systems', 'enterprise'],
      meetingUrl: 'https://meet.gigvora.dev/design-systems',
      rsvpCount: 240,
    });

    await this.repo.seed({
      slug: 'product-design-meetup-nyc', title: 'Product Design Meetup NYC',
      type: 'meetup', format: 'in_person', visibility: 'public',
      description: 'Monthly NYC meetup for product designers — networking, lightning talks, drinks.',
      startsAt: new Date(now + 21 * day).toISOString(),
      timezone: 'America/New_York', location: 'WeWork — 25 W 39th St, New York',
      capacity: 85, hostId, tags: ['design', 'nyc', 'meetup'],
      rsvpCount: 67,
    });

    await this.repo.seed({
      slug: 'speed-networking-april', title: 'Speed Networking — April Edition',
      type: 'speed_networking', format: 'virtual', visibility: 'public',
      description: '60-minute live speed networking. 4 rounds × 6 minutes per match.',
      startsAt: new Date(now + 5 * day).toISOString(),
      timezone: 'UTC', capacity: 200, hostId,
      tags: ['networking', 'speed', 'live'], rsvpCount: 178,
    });

    await this.repo.seed({
      slug: 'enterprise-connect-summit-2026', title: 'Enterprise Connect Summit 2026',
      type: 'summit', format: 'hybrid', visibility: 'public',
      description: 'The premier enterprise networking and partnership summit.',
      startsAt: new Date(now + 35 * day).toISOString(),
      endsAt:   new Date(now + 37 * day).toISOString(),
      timezone: 'America/Los_Angeles', location: 'Moscone West, San Francisco',
      capacity: 500, hostId, tags: ['summit', 'enterprise', 'partnerships'],
      priceCents: 49900, currency: 'USD', rsvpCount: 230,
    });

    await this.repo.seed({
      slug: 'ai-supply-chain-roundtable', title: 'AI in Supply Chain — Executive Roundtable',
      type: 'roundtable', format: 'virtual', visibility: 'enterprise_only',
      description: 'Senior leaders discuss AI adoption in enterprise supply chains.',
      startsAt: new Date(now + 4 * day).toISOString(),
      timezone: 'UTC', capacity: 25, hostId,
      tags: ['ai', 'supply-chain', 'executive'], rsvpCount: 18,
    });
  }
}
