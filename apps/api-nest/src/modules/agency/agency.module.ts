import { Module, OnModuleInit } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AgencyController } from './agency.controller';
import { AgencyService } from './agency.service';
import { AgencyRepository } from './agency.repository';
import { AgencyAnalyticsService } from './agency.analytics.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { WorkspaceModule } from '../workspace/workspace.module';

/**
 * Domain 13 — Agency Pages, Service Presence & Public Proof Surfaces.
 *
 * Module wiring follows the established Gigvora pattern: Passport JWT,
 * AuditService via WorkspaceModule, in-memory repository (swap to Drizzle
 * by binding the same shape). On bootstrap we seed the canonical
 * "Apex Digital Studio" record so the existing AgencyPage UI renders
 * realistic data the moment the backend wires in.
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
  controllers: [AgencyController],
  providers: [AgencyService, AgencyRepository, AgencyAnalyticsService, JwtStrategy],
  exports: [AgencyService, AgencyAnalyticsService],
})
export class AgencyModule implements OnModuleInit {
  constructor(private readonly repo: AgencyRepository, private readonly svc: AgencyService) {}

  async onModuleInit() {
    // Seed canonical demo agency to keep UI parity until DB is wired.
    const existing = await this.repo.getBySlug('apex-digital-studio');
    if (existing) return;
    const a = await this.repo.seed({
      slug: 'apex-digital-studio',
      name: 'Apex Digital Studio',
      tagline: 'Full-stack product design and engineering for ambitious startups',
      industry: 'Digital Agency',
      size: '25–50',
      founded: '2019',
      headquarters: 'Austin, TX',
      website: 'https://apexdigital.studio',
      verified: true,
      acceptingProjects: true,
      status: 'active',
      visibility: 'public',
      followerCount: 3200,
      ratingAvg: 4.8,
      ratingCount: 94,
      completedProjects: 187,
      about:
        "Apex Digital Studio is a boutique product agency specialising in end-to-end design and engineering for early-stage and growth-stage startups. We partner with founders to ship MVPs, scale platforms, and build design systems that last.",
      specialties: ['Product Design', 'React / Next.js', 'Mobile (React Native)', 'Design Systems', 'Brand Identity', 'Growth Engineering'],
      languages: ['English', 'Spanish', 'Portuguese'],
      engagementModels: ['Project-based', 'Retainer', 'Staff augmentation', 'Fractional CTO'],
      values: ['Founder-First', 'Craft Over Speed', 'Radical Ownership', 'Ship & Iterate'],
    });
    const seedServices = [
      { name: 'Product Design Sprint', description: 'Five-day sprint from problem framing to validated prototype.', priceFromCents: 1500000, priceToCents: 2500000, duration: '1 week', popular: true, status: 'active', position: 0 },
      { name: 'MVP Development',       description: 'End-to-end build from wireframe to production-ready launch.', priceFromCents: 4000000, priceToCents: 8000000, duration: '6–12 weeks', popular: true, status: 'active', position: 1 },
      { name: 'Design System Build',   description: 'Component library, tokens, documentation, and Figma kit.',     priceFromCents: 2000000, priceToCents: 3500000, duration: '4–8 weeks', popular: false, status: 'active', position: 2 },
      { name: 'Staff Augmentation',    description: 'Embedded senior engineers and designers for your team.',       priceFromCents: 1200000, priceToCents: 1800000, duration: 'Ongoing',  popular: false, status: 'active', position: 3 },
    ];
    for (const s of seedServices) await this.repo.addService(a.id, s);

    const seedTeam = [
      { name: 'Jordan Lee', role: 'Founder & Creative Director', skills: ['Strategy', 'Design', 'Leadership'], available: true, badge: 'Founder', position: 0 },
      { name: 'Maya Torres', role: 'Lead Engineer', skills: ['React', 'TypeScript', 'Node.js'], available: true, badge: 'Lead', position: 1 },
      { name: 'Alex Nguyen', role: 'Senior Product Designer', skills: ['UI/UX', 'Figma', 'Research'], available: false, badge: 'Senior', position: 2 },
    ];
    for (const m of seedTeam) await this.repo.addTeam(a.id, m);

    const seedCases = [
      { title: 'FinVault — Neobank MVP', client: 'FinVault Inc.', outcome: 'Launched in 10 weeks, raised $4.2M Seed', tags: ['Fintech', 'MVP', 'React Native'], status: 'published', publishedAt: new Date().toISOString() },
      { title: 'GreenGrid — Energy Dashboard', client: 'GreenGrid Energy', outcome: '3x user engagement after redesign', tags: ['CleanTech', 'Dashboard', 'Design System'], status: 'published', publishedAt: new Date().toISOString() },
    ];
    for (const c of seedCases) await this.repo.addCaseStudy(a.id, c);

    const seedProofs = [
      { kind: 'security' as const,      label: 'SOC 2 Type II',  issuer: 'Drata',         issuedAt: '2024-08-01' },
      { kind: 'certification' as const, label: 'ISO 27001',      issuer: 'BSI',           issuedAt: '2024-03-12' },
      { kind: 'partnership' as const,   label: 'AWS Partner',    issuer: 'Amazon Web Services' },
    ];
    for (const p of seedProofs) {
      const proof = await this.repo.addProof(a.id, p);
      await this.repo.setProofVerified(a.id, proof.id, true);
    }

    const seedReviews = [
      { authorName: 'Emily Chen', authorCompany: 'FinVault Inc.', rating: 5, title: 'Exceptional execution', body: 'Apex delivered our MVP ahead of schedule with outstanding quality.', pros: 'Speed, communication, technical depth', cons: 'Wish they had more capacity' },
      { authorName: 'David Park', authorCompany: 'GreenGrid Energy', rating: 5, title: 'Design excellence', body: 'World-class design thinking; the design system still serves us two years later.', pros: 'Design quality, documentation', cons: 'Premium pricing' },
      { authorName: 'Rachel Morris', authorCompany: 'Luma Health', rating: 4, title: 'Reliable partner', body: 'Navigated complex compliance requirements with ease.', pros: 'Compliance expertise', cons: 'Onboarding took a bit long' },
    ];
    for (const r of seedReviews) await this.repo.addReview(a.id, r);
  }
}
