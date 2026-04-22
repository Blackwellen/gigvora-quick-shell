import React, { useState } from 'react';
import { PageSEO } from '@/components/seo/PageSEO';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2, ArrowRight, X, ChevronDown, Sparkles,
  Shield, Headphones, Building2, Send, Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PLANS = [
  {
    name: 'Free',
    price: { monthly: '$0', annual: '$0' },
    period: '/month',
    description: 'For individuals getting started',
    features: ['Basic profile', 'Browse marketplace', 'Limited messaging (10/day)', '5 proposal credits/month', 'Feed access', 'Group membership (3 groups)'],
    cta: 'Get Started',
    popular: false,
    badge: null,
  },
  {
    name: 'Professional',
    price: { monthly: '$29', annual: '$23' },
    period: '/month',
    description: 'For serious professionals and freelancers',
    features: ['Unlimited proposals', 'Advanced analytics', 'Creation Studio', 'AI writing & image tools', 'Priority support', 'Portfolio showcase', 'Gig analytics & insights', 'Document vault (50GB)', 'Custom profile URL'],
    cta: 'Go Professional',
    popular: true,
    badge: 'Most Popular',
  },
  {
    name: 'Enterprise',
    price: { monthly: '$99', annual: '$79' },
    period: '/seat/month',
    description: 'For teams and organizations',
    features: ['Everything in Professional', 'Team management (RBAC)', 'ATS access (basic)', 'Shared inbox', 'Advanced permissions', 'Custom branding', 'API access', 'Dedicated support manager', 'SSO integration', 'Compliance & audit tools'],
    cta: 'Contact Sales',
    popular: false,
    badge: 'Best for Teams',
  },
];

const ADDONS = [
  { name: 'Recruiter Pro', price: '$49/seat/mo', desc: 'Full ATS, talent search, video interviews, scorecards, headhunter workflows', icon: '🎯' },
  { name: 'Sales Navigator', price: '$39/seat/mo', desc: 'Lead search, CRM tasks, outreach sequences, relationship graphs', icon: '📊' },
  { name: 'Gigvora Ads', price: 'Pay as you go', desc: 'Campaign management, audience builder, keyword planner, analytics', icon: '📢' },
  { name: 'Enterprise Connect', price: '$29/mo', desc: 'Startup showcase, advisor marketplace, partnerships, client success', icon: '🏢' },
];

const COMPARISON_FEATURES = [
  { feature: 'Profile & Portfolio', free: true, pro: true, ent: true },
  { feature: 'Marketplace Browse', free: true, pro: true, ent: true },
  { feature: 'Messaging', free: '10/day', pro: 'Unlimited', ent: 'Unlimited + Shared' },
  { feature: 'Proposal Credits', free: '5/mo', pro: 'Unlimited', ent: 'Unlimited' },
  { feature: 'Analytics', free: 'Basic', pro: 'Advanced', ent: 'Advanced + Team' },
  { feature: 'Creation Studio', free: false, pro: true, ent: true },
  { feature: 'AI Tools', free: false, pro: true, ent: true },
  { feature: 'Document Vault', free: '1GB', pro: '50GB', ent: '500GB' },
  { feature: 'Team Management', free: false, pro: false, ent: true },
  { feature: 'ATS Access', free: false, pro: false, ent: 'Basic' },
  { feature: 'Custom Branding', free: false, pro: false, ent: true },
  { feature: 'API Access', free: false, pro: false, ent: true },
  { feature: 'SSO', free: false, pro: false, ent: true },
  { feature: 'Support', free: 'Community', pro: 'Priority', ent: 'Dedicated Manager' },
  { feature: 'Uptime SLA', free: false, pro: false, ent: '99.9%' },
];

const FAQ_ITEMS = [
  { q: 'Can I switch plans anytime?', a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle. Downgrades preserve your data — features simply become inaccessible until you re-upgrade.' },
  { q: 'Is there a free trial for paid plans?', a: 'All paid plans come with a 14-day free trial. No credit card required to start. You\'ll get full access to all features during the trial.' },
  { q: 'How does billing work for teams?', a: 'Enterprise plans are billed per seat per month. You can add or remove seats at any time. Volume discounts apply for 25+ seats — contact sales for custom pricing.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and bank transfers for enterprise accounts. Invoicing is available for Enterprise plans.' },
  { q: 'Can I cancel at any time?', a: 'Absolutely. You can cancel your subscription at any time from your account settings. No cancellation fees, no lock-in periods.' },
  { q: 'What happens to my data if I downgrade?', a: 'Your data is always preserved. On downgrade, premium features become view-only. Documents in the vault beyond your new limit remain accessible but read-only.' },
  { q: 'Do add-ons require a base plan?', a: 'Recruiter Pro and Sales Navigator require at least a Professional plan. Enterprise Connect and Gigvora Ads work with any plan.' },
];

const CellValue: React.FC<{ value: boolean | string }> = ({ value }) => {
  if (value === true) return <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))] mx-auto" />;
  if (value === false) return <X className="h-3.5 w-3.5 text-muted-foreground/30 mx-auto" />;
  return <span className="text-[11px] font-medium text-center">{value}</span>;
};

/* ── Enterprise Contact Form Drawer ── */
const EnterpriseSalesForm: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-card border-l shadow-2xl animate-in slide-in-from-right-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-base font-bold">Contact Sales</h3>
            <p className="text-[11px] text-muted-foreground">Get a custom quote for your team</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted/50">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto" style={{ height: 'calc(100% - 65px)' }}>
          {submitted ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="h-14 w-14 rounded-full bg-[hsl(var(--state-healthy)/0.1)] flex items-center justify-center mb-4">
                <CheckCircle2 className="h-7 w-7 text-[hsl(var(--state-healthy))]" />
              </div>
              <h3 className="text-lg font-bold mb-2">Request Received!</h3>
              <p className="text-xs text-muted-foreground mb-6 max-w-xs">Our sales team will reach out within 24 hours. Check your email for confirmation.</p>
              <Button size="sm" className="text-xs h-8" onClick={onClose}>Close</Button>
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); setSubmitted(true); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium mb-1.5 block">First Name *</label>
                  <input type="text" required className="w-full h-9 rounded-lg border bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring" placeholder="John" />
                </div>
                <div>
                  <label className="text-[11px] font-medium mb-1.5 block">Last Name *</label>
                  <input type="text" required className="w-full h-9 rounded-lg border bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Doe" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium mb-1.5 block">Work Email *</label>
                <input type="email" required className="w-full h-9 rounded-lg border bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring" placeholder="john@company.com" />
              </div>
              <div>
                <label className="text-[11px] font-medium mb-1.5 block">Company *</label>
                <input type="text" required className="w-full h-9 rounded-lg border bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Acme Corp" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium mb-1.5 block">Team Size *</label>
                  <select required className="w-full h-9 rounded-lg border bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Select...</option>
                    <option>1-10</option>
                    <option>11-50</option>
                    <option>51-200</option>
                    <option>201-1000</option>
                    <option>1000+</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium mb-1.5 block">Job Title</label>
                  <input type="text" className="w-full h-9 rounded-lg border bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring" placeholder="VP of Engineering" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium mb-1.5 block">Interested In</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Enterprise Plan', 'Recruiter Pro', 'Sales Navigator', 'Custom Integration'].map(opt => (
                    <label key={opt} className="flex items-center gap-2 text-[11px] cursor-pointer">
                      <input type="checkbox" className="rounded border-input" /> {opt}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium mb-1.5 block">Anything else?</label>
                <textarea className="w-full rounded-lg border bg-background px-3 py-2 text-xs min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Tell us about your needs..." />
              </div>
              <Button type="submit" size="sm" className="w-full h-9 text-xs gap-1.5 font-semibold">
                <Send className="h-3 w-3" /> Submit Request
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">We'll respond within 24 hours. No spam, ever.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const PricingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [annual, setAnnual] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);

  return (
    <div>
      <PageSEO title="Pricing & Plans" description="Explore Gigvora plans — Free, Starter, Pro, Business, and Enterprise. Find the right plan for your needs." canonical="/pricing" />
      {/* Header */}
      <section className="bg-gradient-to-br from-[hsl(var(--gigvora-navy))] via-[hsl(var(--gigvora-navy-light))] to-[hsl(var(--gigvora-blue)/0.2)] py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,hsl(var(--gigvora-blue)/0.1),transparent_60%)]" />
        <div className="relative max-w-[1600px] mx-auto px-4 lg:px-8 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] text-white/80 mb-5">
            <Sparkles className="h-3 w-3" /> Simple, transparent pricing
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">Plans That Scale With You</h1>
          <p className="text-sm text-white/60 max-w-lg mx-auto mb-8">Start free, upgrade as you grow. No hidden fees, no surprises.</p>
          <div className="inline-flex items-center gap-1 bg-white/10 rounded-full p-1 backdrop-blur-sm">
            <button
              onClick={() => setAnnual(false)}
              className={cn('px-4 py-1.5 rounded-full text-[11px] font-semibold transition-all', !annual ? 'bg-white text-[hsl(var(--gigvora-navy))] shadow-sm' : 'text-white/70 hover:text-white')}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn('px-4 py-1.5 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1.5', annual ? 'bg-white text-[hsl(var(--gigvora-navy))] shadow-sm' : 'text-white/70 hover:text-white')}
            >
              Annual <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[hsl(var(--state-healthy)/0.15)] text-[hsl(var(--state-healthy))] font-bold">-20%</span>
            </button>
          </div>
        </div>
      </section>

      {/* Plan Cards */}
      <section className="py-14">
        <div className="max-w-5xl mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-3 gap-5">
            {PLANS.map((plan) => (
              <div key={plan.name} className={cn(
                'rounded-3xl border p-6 lg:p-7 relative transition-all duration-300 hover:shadow-elevated',
                plan.popular ? 'border-accent shadow-elevated ring-1 ring-accent/50 scale-[1.02]' : 'bg-card hover:-translate-y-1'
              )}>
                {plan.badge && (
                  <span className={cn(
                    'absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-1 rounded-full',
                    plan.popular ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground'
                  )}>
                    {plan.badge}
                  </span>
                )}
                <h3 className="text-lg font-bold mb-0.5">{plan.name}</h3>
                <p className="text-[11px] text-muted-foreground mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-0.5 mb-6">
                  <span className="text-4xl font-bold tracking-tight">
                    {annual ? plan.price.annual : plan.price.monthly}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{plan.period}</span>
                  {annual && plan.price.annual !== '$0' && (
                    <span className="text-[10px] text-muted-foreground line-through ml-1.5">{plan.price.monthly}</span>
                  )}
                </div>
                <ul className="space-y-2.5 mb-7">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))] shrink-0 mt-0.5" /> <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.popular ? 'default' : 'outline'}
                  size="sm"
                  className={cn('w-full text-xs h-9 font-semibold', plan.popular && 'shadow-md')}
                  onClick={plan.name === 'Enterprise' ? () => setSalesOpen(true) : undefined}
                  asChild={plan.name !== 'Enterprise'}
                >
                  {plan.name === 'Enterprise' ? (
                    <span>{plan.cta} <ArrowRight className="h-3 w-3 ml-1" /></span>
                  ) : (
                    <Link to="/signup">{plan.cta} <ArrowRight className="h-3 w-3 ml-1" /></Link>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Premium Add-ons</h2>
            <p className="text-xs text-muted-foreground">Powerful modules that extend your workspace</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {ADDONS.map((a) => (
              <div key={a.name} className="rounded-2xl border bg-card p-5 flex items-start gap-4 hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300">
                <span className="text-2xl">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-bold">{a.name}</h4>
                    <span className="text-[11px] font-bold text-[hsl(var(--gigvora-blue))]">{a.price}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-14">
        <div className="max-w-4xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Feature Comparison</h2>
            <p className="text-xs text-muted-foreground">See exactly what's included in each plan</p>
          </div>
          <div className="rounded-xl border overflow-hidden shadow-card">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left text-[11px] font-semibold p-3 w-1/3">Feature</th>
                  <th className="text-center text-[11px] font-semibold p-3 w-[22%]">Free</th>
                  <th className="text-center text-[11px] font-semibold p-3 w-[22%] bg-accent/5 border-x border-accent/10">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-3 w-3 text-accent" /> Professional
                    </div>
                  </th>
                  <th className="text-center text-[11px] font-semibold p-3 w-[22%]">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map((row, i) => (
                  <tr key={row.feature} className={cn('border-t', i % 2 === 0 && 'bg-muted/20')}>
                    <td className="text-xs p-3 font-medium">{row.feature}</td>
                    <td className="text-center p-3"><CellValue value={row.free} /></td>
                    <td className="text-center p-3 bg-accent/5 border-x border-accent/10"><CellValue value={row.pro} /></td>
                    <td className="text-center p-3"><CellValue value={row.ent} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="py-8 border-y bg-muted/20">
        <div className="max-w-4xl mx-auto px-4 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-center">
            {[
              { icon: Shield, text: 'SOC 2 compliant' },
              { icon: Headphones, text: 'Priority support' },
              { icon: Building2, text: 'Enterprise-ready' },
            ].map(t => (
              <div key={t.text} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <t.icon className="h-4 w-4 text-[hsl(var(--gigvora-blue))]" /> {t.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 bg-background">
        <div className="max-w-2xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Frequently Asked Questions</h2>
            <p className="text-xs text-muted-foreground">Everything you need to know about pricing</p>
          </div>
          <div className="space-y-2">
            {FAQ_ITEMS.map((faq, i) => (
              <div key={i} className="rounded-xl border bg-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/20 transition-colors"
                >
                  <span className="text-xs font-semibold pr-4">{faq.q}</span>
                  <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform shrink-0', openFaq === i && 'rotate-180')} />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed animate-in fade-in-0 slide-in-from-top-1">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-gradient-to-br from-[hsl(var(--gigvora-navy))] via-[hsl(var(--gigvora-navy-light))] to-[hsl(var(--gigvora-blue)/0.2)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--gigvora-blue)/0.1),transparent_60%)]" />
        <div className="relative max-w-[1600px] mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">Ready to get started?</h2>
          <p className="text-xs text-white/50 mb-6 max-w-sm mx-auto">Join thousands of professionals building on Gigvora. Start free, upgrade anytime.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="sm" className="bg-[hsl(var(--gigvora-blue))] text-white hover:bg-[hsl(var(--gigvora-blue)/0.9)] shadow-lg shadow-[hsl(var(--gigvora-blue)/0.3)] h-9 text-xs gap-1.5 font-semibold" asChild>
              <Link to="/signup">Start Free Trial <ArrowRight className="h-3 w-3" /></Link>
            </Button>
            <Button size="sm" variant="outline" className="bg-white text-foreground border-white/80 hover:bg-white/90 h-9 text-xs" onClick={() => setSalesOpen(true)}>
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      <EnterpriseSalesForm open={salesOpen} onClose={() => setSalesOpen(false)} />
    </div>
  );
};

export default PricingPage;
