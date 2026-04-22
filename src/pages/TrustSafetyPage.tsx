import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, UserCheck, Scale, Eye, AlertTriangle, FileCheck, Award, ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const TRUST_FEATURES = [
  { icon: Lock, title: 'Escrow Protection', desc: 'Funds held securely in escrow until work is delivered and approved. Milestone-based releases for projects.', link: '/legal/payments-escrow' },
  { icon: Scale, title: 'Fair Dispute Resolution', desc: 'Structured dispute process with evidence submission, professional review, and arbitration when needed.', link: '/legal/disputes-policy' },
  { icon: UserCheck, title: 'Identity Verification', desc: 'Multi-level verification for individuals and businesses including ID checks and document validation.', link: null },
  { icon: Eye, title: 'Content Moderation', desc: 'AI-assisted moderation with human review ensures a safe, professional environment for all users.', link: '/legal/community-guidelines' },
  { icon: AlertTriangle, title: 'Fraud Prevention', desc: 'Advanced fraud detection systems protect against scams, suspicious behavior, and unauthorized access.', link: null },
  { icon: FileCheck, title: 'Compliance', desc: 'Platform-wide compliance with GDPR, SOC 2, and financial regulations across all operating regions.', link: '/privacy' },
  { icon: Award, title: 'Trust Badges', desc: 'Earn verified badges for identity, skills, and business legitimacy to build credibility on the platform.', link: null },
  { icon: Shield, title: 'Data Security', desc: 'Enterprise-grade AES-256 encryption, role-based access, regular audits, and incident response protocols.', link: '/privacy' },
];

const STATS = [
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '<2h', label: 'Avg fraud response' },
  { value: '97%', label: 'Dispute resolution rate' },
  { value: 'SOC 2', label: 'Compliance certified' },
];

const POLICIES = [
  { title: 'Privacy Policy', desc: 'How we handle your data', to: '/privacy' },
  { title: 'Terms & Conditions', desc: 'Platform usage agreement', to: '/terms' },
  { title: 'Disputes Policy', desc: 'Resolution process and rights', to: '/legal/disputes-policy' },
  { title: 'Payments & Escrow', desc: 'Transaction protections', to: '/legal/payments-escrow' },
  { title: 'Community Guidelines', desc: 'Conduct and content rules', to: '/legal/community-guidelines' },
  { title: 'Appeals & Enforcement', desc: 'Challenge decisions', to: '/legal/appeals' },
];

const TrustSafetyPage: React.FC = () => (
  <div>
    {/* Hero */}
    <section className="bg-gradient-to-br from-[hsl(var(--gigvora-navy))] via-[hsl(var(--gigvora-navy-light))] to-[hsl(var(--gigvora-green)/0.1)] py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--gigvora-green)/0.08),transparent_50%)]" />
      <div className="relative max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
            <Shield className="h-7 w-7 text-white/70" />
          </div>
          <div>
            <Badge className="bg-white/10 text-white/70 border-white/15 text-[10px] mb-2">Security & Compliance</Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Trust & Safety</h1>
            <p className="text-sm text-white/50 max-w-xl">Your safety is our priority. Gigvora is built on trust with industry-leading protection at every layer of the platform.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10">
          {STATS.map(s => (
            <div key={s.label} className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
              <div className="text-xl font-bold text-white mb-0.5">{s.value}</div>
              <div className="text-[9px] text-white/40">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Features Grid */}
    <section className="py-14">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <h2 className="text-lg font-bold mb-6">Protection at Every Layer</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TRUST_FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-5 hover:shadow-md hover:border-accent/20 transition-all group">
              <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
                <f.icon className="h-4 w-4 text-accent" />
              </div>
              <h3 className="text-[11px] font-bold mb-1.5">{f.title}</h3>
              <p className="text-[9px] text-muted-foreground leading-relaxed mb-3">{f.desc}</p>
              {f.link && (
                <Link to={f.link} className="text-[8px] text-accent flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ChevronRight className="h-2.5 w-2.5" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Related Policies */}
    <section className="py-10 bg-muted/20 border-t border-b">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <h2 className="text-lg font-bold mb-4">Related Policies</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {POLICIES.map(p => (
            <Link key={p.to} to={p.to} className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:border-accent/20 hover:shadow-sm transition-all group">
              <FileCheck className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold">{p.title}</div>
                <div className="text-[8px] text-muted-foreground">{p.desc}</div>
              </div>
              <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-accent transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-12">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/15 p-8 text-center">
          <Shield className="h-8 w-8 text-accent mx-auto mb-3" />
          <h2 className="text-lg font-bold mb-2">Have a Safety Concern?</h2>
          <p className="text-[10px] text-muted-foreground mb-5 max-w-md mx-auto">Our Trust & Safety team is available 24/7. Reports are reviewed within 2 hours and all submissions are confidential.</p>
          <div className="flex justify-center gap-2">
            <Button size="sm" className="h-8 text-[10px] rounded-xl gap-1" asChild>
              <Link to="/support/contact">Report an Issue <ArrowRight className="h-3 w-3" /></Link>
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-xl" asChild>
              <Link to="/help">Help Center</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  </div>
);

export default TrustSafetyPage;
