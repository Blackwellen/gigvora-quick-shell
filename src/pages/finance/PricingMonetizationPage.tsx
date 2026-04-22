import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import {
  Tag, DollarSign, Gift, Percent, Package, Layers, ShoppingCart, CreditCard,
  Clock, Download, TrendingUp, Filter, ChevronRight, AlertTriangle, Eye, Star,
  ArrowUpRight, ArrowDownRight, History, Smartphone, ExternalLink, CheckCircle2,
  Plus, Search, BarChart3, Wallet, FileText, Shield, Zap, Crown, Users, HelpCircle,
  Scale, BookOpen, Check, X, Sparkles, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

type PTab = 'overview' | 'compare' | 'promos' | 'upsell' | 'credits' | 'faq' | 'checkout' | 'mobile';

interface PricingPlan {
  id: string; name: string; price: string; period: string; badge?: string;
  features: string[]; cta: string; popular?: boolean; color: string;
}

interface Promo {
  id: string; name: string; code: string; discount: string; type: 'percentage' | 'fixed' | 'bundle';
  validUntil: string; uses: number; maxUses: number; status: 'active' | 'expired' | 'scheduled' | 'paused';
  appliesTo: string;
}

interface UpsellOffer {
  id: string; name: string; from: string; to: string; savings: string;
  conversionRate: string; status: 'active' | 'draft' | 'paused'; trigger: string;
}

const PLANS: PricingPlan[] = [
  { id: 'free', name: 'Free', price: '$0', period: '/mo', features: ['5 projects', 'Basic analytics', 'Community support', '1 GB storage'], cta: 'Get Started', color: 'border-muted' },
  { id: 'pro', name: 'Pro', price: '$29', period: '/mo', badge: 'Popular', popular: true, features: ['Unlimited projects', 'Advanced analytics', 'Priority support', '50 GB storage', 'Custom domains', 'API access'], cta: 'Upgrade to Pro', color: 'border-accent' },
  { id: 'team', name: 'Team', price: '$79', period: '/mo', features: ['Everything in Pro', 'Team collaboration', 'SSO & SAML', '200 GB storage', 'Audit logs', 'Role management', 'SLA guarantee'], cta: 'Start Team Trial', color: 'border-primary' },
  { id: 'enterprise', name: 'Enterprise', price: 'Custom', period: '', badge: 'Contact Sales', features: ['Everything in Team', 'Unlimited storage', 'Dedicated support', 'Custom integrations', 'On-premise option', 'Custom SLA', 'White-label'], cta: 'Contact Sales', color: 'border-muted' },
];

const PROMOS: Promo[] = [
  { id: 'PRM-01', name: 'Spring Launch 2026', code: 'SPRING26', discount: '30% off', type: 'percentage', validUntil: 'May 31', uses: 142, maxUses: 500, status: 'active', appliesTo: 'Pro & Team plans' },
  { id: 'PRM-02', name: 'Agency Bundle', code: 'AGENCY50', discount: '$50 off', type: 'fixed', validUntil: 'Jun 15', uses: 28, maxUses: 100, status: 'active', appliesTo: 'Team plan (annual)' },
  { id: 'PRM-03', name: 'Creator Pack', code: 'CREATE10', discount: '10% + bonus credits', type: 'bundle', validUntil: 'Apr 30', uses: 89, maxUses: 200, status: 'active', appliesTo: 'Pro plan + 500 credits' },
  { id: 'PRM-04', name: 'Black Friday 2025', code: 'BF2025', discount: '40% off', type: 'percentage', validUntil: 'Dec 1, 2025', uses: 1200, maxUses: 1200, status: 'expired', appliesTo: 'All plans' },
  { id: 'PRM-05', name: 'Summer Sale', code: 'SUMMER26', discount: '25% off', type: 'percentage', validUntil: 'Jul 1', uses: 0, maxUses: 300, status: 'scheduled', appliesTo: 'Pro plan' },
];

const UPSELLS: UpsellOffer[] = [
  { id: 'UP-01', name: 'Pro → Team Upgrade', from: 'Pro', to: 'Team', savings: '$120/yr', conversionRate: '18%', status: 'active', trigger: 'Team invite sent' },
  { id: 'UP-02', name: 'Free → Pro Nudge', from: 'Free', to: 'Pro', savings: '$0 first month', conversionRate: '12%', status: 'active', trigger: 'Storage limit hit' },
  { id: 'UP-03', name: 'Credits Bundle Upsell', from: 'Any', to: '1000 Credits', savings: 'Save 20%', conversionRate: '22%', status: 'active', trigger: 'Credits < 50' },
  { id: 'UP-04', name: 'Annual Switch', from: 'Monthly', to: 'Annual', savings: '2 months free', conversionRate: '15%', status: 'draft', trigger: 'Month 3 renewal' },
];

const CREDIT_TIERS = [
  { credits: 100, price: '$10', perCredit: '$0.10', savings: '' },
  { credits: 500, price: '$40', perCredit: '$0.08', savings: 'Save 20%' },
  { credits: 1000, price: '$70', perCredit: '$0.07', savings: 'Save 30%', popular: true },
  { credits: 5000, price: '$300', perCredit: '$0.06', savings: 'Save 40%' },
];

const STATUS_MAP: Record<string, 'healthy' | 'caution' | 'degraded' | 'blocked'> = {
  active: 'healthy', scheduled: 'caution', paused: 'caution', expired: 'degraded', draft: 'degraded',
};

const COMPARE_FEATURES = [
  { feature: 'Projects', free: '5', pro: 'Unlimited', team: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'Storage', free: '1 GB', pro: '50 GB', team: '200 GB', enterprise: 'Unlimited' },
  { feature: 'Analytics', free: 'Basic', pro: 'Advanced', team: 'Advanced+', enterprise: 'Custom' },
  { feature: 'Support', free: 'Community', pro: 'Priority', team: 'Dedicated', enterprise: 'Custom SLA' },
  { feature: 'API Access', free: false, pro: true, team: true, enterprise: true },
  { feature: 'Custom Domains', free: false, pro: true, team: true, enterprise: true },
  { feature: 'SSO / SAML', free: false, pro: false, team: true, enterprise: true },
  { feature: 'Audit Logs', free: false, pro: false, team: true, enterprise: true },
  { feature: 'Role Management', free: false, pro: false, team: true, enterprise: true },
  { feature: 'White-label', free: false, pro: false, team: false, enterprise: true },
];

/* ── Promo Drawer ── */
const PromoDrawer: React.FC<{ promo: Promo | null; open: boolean; onClose: () => void }> = ({ promo, open, onClose }) => {
  if (!promo) return null;
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[440px] overflow-y-auto">
        <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><Tag className="h-4 w-4 text-accent" />{promo.id}</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="h-20 rounded-2xl bg-gradient-to-br from-accent/10 to-primary/10 flex items-center justify-center">
            <div className="text-center"><div className="text-xl font-bold">{promo.discount}</div><div className="text-[8px] text-muted-foreground">{promo.name}</div></div>
          </div>
          <div className="flex justify-center gap-2"><StatusBadge status={STATUS_MAP[promo.status]} label={promo.status} /><Badge variant="secondary" className="text-[7px] font-mono">{promo.code}</Badge></div>
          <div className="grid grid-cols-2 gap-2">
            {[{ l: 'Type', v: promo.type }, { l: 'Applies To', v: promo.appliesTo }, { l: 'Valid Until', v: promo.validUntil }, { l: 'Uses', v: `${promo.uses}/${promo.maxUses}` }].map(m => (
              <div key={m.l} className="rounded-xl border p-2"><div className="text-[7px] text-muted-foreground">{m.l}</div><div className="text-[9px] font-semibold">{m.v}</div></div>
            ))}
          </div>
          <div><div className="text-[8px] text-muted-foreground mb-1">Redemption Progress</div><Progress value={(promo.uses / promo.maxUses) * 100} className="h-2" /><div className="text-[7px] text-muted-foreground mt-0.5">{((promo.uses / promo.maxUses) * 100).toFixed(0)}% redeemed</div></div>
          <div className="flex flex-wrap gap-1.5 border-t pt-3">
            {promo.status === 'active' && <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Pausing promo')}><X className="h-2.5 w-2.5" />Pause</Button>}
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Duplicating')}><Plus className="h-2.5 w-2.5" />Duplicate</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Exporting')}><Download className="h-2.5 w-2.5" />Export</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/* ── Main Page ── */
const PricingMonetizationPage: React.FC = () => {
  const { activeRole } = useRole();
  const [tab, setTab] = useState<PTab>('overview');
  const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);
  const [search, setSearch] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const topStrip = (
    <>
      <Tag className="h-3.5 w-3.5 text-accent" />
      <span className="text-[11px] font-semibold">Pricing · Promotions · Offer Packaging · Monetization</span>
      <Badge variant="secondary" className="text-[7px] capitalize">{activeRole}</Badge>
      <div className="flex-1" />
      <div className="flex items-center gap-1 rounded-xl border p-0.5">
        {(['monthly', 'annual'] as const).map(c => (
          <button key={c} onClick={() => setBillingCycle(c)} className={cn('px-2 py-0.5 rounded-lg text-[8px] font-medium transition-colors capitalize', billingCycle === c ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted/30')}>{c}</button>
        ))}
      </div>
      <div className="relative"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="h-6 w-32 rounded-xl border bg-background pl-7 pr-2 text-[8px]" /></div>
      <Badge variant="secondary" className="text-[7px] gap-0.5"><Clock className="h-2.5 w-2.5" />Live</Badge>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Revenue Summary" icon={<DollarSign className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="text-lg font-bold">$18.4K</div>
        <div className="text-[8px] text-muted-foreground">MRR this month</div>
        <div className="mt-1.5 space-y-0.5 text-[8px]">
          {[{ l: 'Active Plans', v: '248' }, { l: 'Promos Active', v: '3' }, { l: 'Conversion', v: '14.2%' }, { l: 'ARPU', v: '$74' }].map(m => (
            <div key={m.l} className="flex justify-between"><span className="text-muted-foreground">{m.l}</span><span className="font-medium">{m.v}</span></div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Alerts" icon={<AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />} className="!rounded-2xl">
        <div className="space-y-1">
          {[
            { label: 'Spring promo nearing cap (142/500)', severity: 'caution' as const },
            { label: 'Creator Pack expires Apr 30', severity: 'caution' as const },
            { label: 'Enterprise renewal pending', severity: 'blocked' as const },
          ].map(a => (
            <div key={a.label} className="flex items-center gap-1.5 p-1.5 rounded-lg border text-[8px]">
              <StatusBadge status={a.severity} label={a.severity === 'blocked' ? 'Alert' : 'Warning'} />
              <span className="flex-1">{a.label}</span>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Quick Links" className="!rounded-2xl">
        <div className="space-y-0.5">
          {[
            { label: 'Wallet', icon: Wallet, to: '/finance/wallet' },
            { label: 'Billing', icon: CreditCard, to: '/finance/billing' },
            { label: 'Commerce', icon: ShoppingCart, to: '/finance/commerce' },
            { label: 'Invoices', icon: FileText, to: '/finance/invoices' },
          ].map(a => (
            <Link key={a.label} to={a.to}><button className="flex items-center gap-2 p-1.5 rounded-lg w-full text-left hover:bg-muted/30 transition-colors text-[8px]"><a.icon className="h-3 w-3 text-muted-foreground" /><span>{a.label}</span><ChevronRight className="h-2.5 w-2.5 ml-auto text-muted-foreground" /></button></Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const bottomSection = (
    <div className="p-3">
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><History className="h-3.5 w-3.5 text-accent" />Monetization Activity</div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {[
          { action: 'SPRING26 redeemed by 3 users', time: '1h ago', type: 'promo' },
          { action: 'New Team plan signup ($79/mo)', time: '3h ago', type: 'conversion' },
          { action: 'Free → Pro upgrade via storage nudge', time: '5h ago', type: 'upsell' },
          { action: 'Creator Pack promo 89/200 used', time: '1d ago', type: 'promo' },
          { action: 'Enterprise renewal quote sent', time: '2d ago', type: 'enterprise' },
        ].map((a, i) => (
          <div key={i} className="shrink-0 rounded-2xl border bg-card px-3 py-2 min-w-[210px] hover:shadow-sm transition-all">
            <Badge variant="secondary" className="text-[6px] capitalize mb-1">{a.type}</Badge>
            <p className="text-[8px] text-muted-foreground line-clamp-2">{a.action}</p>
            <div className="text-[7px] text-muted-foreground mt-0.5">{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56" bottomSection={bottomSection}>
      <div className="flex items-center gap-1 mb-3 border-b pb-2 overflow-x-auto">
        {([
          { key: 'overview' as const, label: 'Pricing Overview', icon: Tag },
          { key: 'compare' as const, label: 'Plan Compare', icon: Layers },
          { key: 'promos' as const, label: 'Promo Bundles', icon: Gift },
          { key: 'upsell' as const, label: 'Upsell / Cross-Sell', icon: TrendingUp },
          { key: 'credits' as const, label: 'Credits', icon: Zap },
          { key: 'faq' as const, label: 'FAQ & Legal', icon: HelpCircle },
          { key: 'checkout' as const, label: 'Checkout Handoff', icon: ShoppingCart },
          { key: 'mobile' as const, label: 'Mobile Compare', icon: Smartphone },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] transition-colors whitespace-nowrap shrink-0', tab === t.key ? 'bg-accent/10 text-accent font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30')}><t.icon className="h-3 w-3" />{t.label}</button>
        ))}
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {tab === 'overview' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="MRR" value="$18.4K" change="+12%" trend="up" />
            <KPICard label="Active Subscriptions" value="248" change="+8" trend="up" />
            <KPICard label="Free → Paid Conv." value="14.2%" change="+1.8%" trend="up" />
            <KPICard label="Avg Revenue/User" value="$74" />
          </KPIBand>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {PLANS.map(plan => (
              <div key={plan.id} className={cn('rounded-2xl border p-4 relative transition-all hover:shadow-md', plan.popular && 'ring-2 ring-accent/30', plan.color)}>
                {plan.badge && <Badge className="absolute -top-2 right-3 text-[7px]">{plan.badge}</Badge>}
                <div className="text-[10px] font-semibold text-muted-foreground">{plan.name}</div>
                <div className="flex items-baseline gap-0.5 mt-1"><span className="text-2xl font-bold">{billingCycle === 'annual' && plan.price !== 'Custom' ? `$${Math.round(parseInt(plan.price.replace('$', '')) * 0.8)}` : plan.price}</span><span className="text-[8px] text-muted-foreground">{plan.period}{billingCycle === 'annual' && plan.period ? ' (billed annually)' : ''}</span></div>
                {billingCycle === 'annual' && plan.price !== '$0' && plan.price !== 'Custom' && <div className="text-[7px] text-[hsl(var(--state-healthy))] font-medium">Save 20% with annual</div>}
                <ul className="mt-3 space-y-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-1.5 text-[8px]"><Check className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))] shrink-0" />{f}</li>
                  ))}
                </ul>
                <Button size="sm" className={cn('w-full mt-3 h-7 text-[9px] rounded-xl', plan.popular && 'bg-accent text-accent-foreground')} onClick={() => toast.info(`Selected ${plan.name}`)}>{plan.cta}</Button>
              </div>
            ))}
          </div>

          <SectionCard title="Plan Distribution" icon={<BarChart3 className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-2">
              {[{ l: 'Free', v: 1240, pct: 62 }, { l: 'Pro', v: 480, pct: 24 }, { l: 'Team', v: 220, pct: 11 }, { l: 'Enterprise', v: 60, pct: 3 }].map(r => (
                <div key={r.l}>
                  <div className="flex justify-between text-[8px] mb-0.5"><span>{r.l}</span><span className="font-semibold">{r.v} users ({r.pct}%)</span></div>
                  <Progress value={r.pct} className="h-1.5" />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ PLAN COMPARE ═══ */}
      {tab === 'compare' && (
        <div className="space-y-3">
          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/30"><tr className="text-[8px] text-muted-foreground font-medium"><th className="text-left px-3 py-2 w-1/5">Feature</th><th className="text-center px-3 py-2">Free</th><th className="text-center px-3 py-2 bg-accent/5"><div className="flex items-center justify-center gap-1"><Crown className="h-3 w-3 text-accent" />Pro</div></th><th className="text-center px-3 py-2">Team</th><th className="text-center px-3 py-2">Enterprise</th></tr></thead>
              <tbody>
                {COMPARE_FEATURES.map(row => (
                  <tr key={row.feature} className="border-t text-[8px] hover:bg-muted/10 transition-colors">
                    <td className="px-3 py-2 font-medium">{row.feature}</td>
                    {(['free', 'pro', 'team', 'enterprise'] as const).map(plan => {
                      const val = row[plan];
                      return (
                        <td key={plan} className={cn('px-3 py-2 text-center', plan === 'pro' && 'bg-accent/5')}>
                          {typeof val === 'boolean' ? (val ? <Check className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))] mx-auto" /> : <X className="h-3.5 w-3.5 text-muted-foreground/40 mx-auto" />) : <span>{val}</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {PLANS.map(p => (
              <Button key={p.id} variant={p.popular ? 'default' : 'outline'} size="sm" className="h-8 text-[9px] rounded-xl w-full" onClick={() => toast.info(`Choose ${p.name}`)}>{p.cta}</Button>
            ))}
          </div>
        </div>
      )}

      {/* ═══ PROMO BUNDLES ═══ */}
      {tab === 'promos' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Active Promos" value={String(PROMOS.filter(p => p.status === 'active').length)} />
            <KPICard label="Total Redemptions" value="259" />
            <KPICard label="Revenue Impact" value="+$4.2K" />
            <KPICard label="Avg Discount" value="26%" />
          </KPIBand>

          <SectionCard title="Promotions" icon={<Gift className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl"
            action={<Button size="sm" className="h-6 text-[8px] rounded-xl gap-1" onClick={() => toast.info('Create promo')}><Plus className="h-3 w-3" />New Promo</Button>}>
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/30"><tr className="text-[8px] text-muted-foreground font-medium"><th className="text-left px-3 py-1.5">Promotion</th><th className="text-center px-3 py-1.5">Code</th><th className="text-center px-3 py-1.5">Discount</th><th className="text-center px-3 py-1.5">Status</th><th className="text-center px-3 py-1.5">Usage</th><th className="text-right px-3 py-1.5">Expires</th><th className="text-center px-3 py-1.5">Action</th></tr></thead>
                <tbody>
                  {PROMOS.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase())).map(promo => (
                    <tr key={promo.id} className="border-t text-[8px] hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setSelectedPromo(promo)}>
                      <td className="px-3 py-1.5"><div className="font-medium">{promo.name}</div><div className="text-[7px] text-muted-foreground">{promo.appliesTo}</div></td>
                      <td className="px-3 py-1.5 text-center"><Badge variant="secondary" className="text-[7px] font-mono">{promo.code}</Badge></td>
                      <td className="px-3 py-1.5 text-center font-semibold">{promo.discount}</td>
                      <td className="px-3 py-1.5 text-center"><StatusBadge status={STATUS_MAP[promo.status]} label={promo.status} /></td>
                      <td className="px-3 py-1.5 text-center"><div className="flex items-center justify-center gap-1"><Progress value={(promo.uses / promo.maxUses) * 100} className="h-1 w-10" /><span className="text-[7px]">{promo.uses}/{promo.maxUses}</span></div></td>
                      <td className="px-3 py-1.5 text-right text-muted-foreground">{promo.validUntil}</td>
                      <td className="px-3 py-1.5 text-center"><Button variant="ghost" size="sm" className="h-5 text-[7px] rounded-lg"><Eye className="h-2.5 w-2.5" /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ UPSELL / CROSS-SELL ═══ */}
      {tab === 'upsell' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Active Offers" value={String(UPSELLS.filter(u => u.status === 'active').length)} />
            <KPICard label="Avg Conversion" value="16.8%" />
            <KPICard label="Revenue Lift" value="+$2.8K" />
            <KPICard label="Top Performer" value="Credits Bundle" />
          </KPIBand>

          <SectionCard title="Upsell & Cross-Sell Offers" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl"
            action={<Button size="sm" className="h-6 text-[8px] rounded-xl gap-1" onClick={() => toast.info('New offer')}><Plus className="h-3 w-3" />New Offer</Button>}>
            <div className="space-y-2">
              {UPSELLS.map(u => (
                <div key={u.id} className="rounded-2xl border p-3 hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center"><ArrowUpRight className="h-4 w-4 text-accent" /></div>
                      <div><div className="text-[10px] font-semibold">{u.name}</div><div className="text-[7px] text-muted-foreground">{u.id} · Trigger: {u.trigger}</div></div>
                    </div>
                    <StatusBadge status={STATUS_MAP[u.status]} label={u.status} />
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-[8px]">
                    <div><span className="text-muted-foreground">From</span><div className="font-semibold">{u.from}</div></div>
                    <div><span className="text-muted-foreground">To</span><div className="font-semibold">{u.to}</div></div>
                    <div><span className="text-muted-foreground">Savings</span><div className="font-semibold text-[hsl(var(--state-healthy))]">{u.savings}</div></div>
                    <div><span className="text-muted-foreground">Conv. Rate</span><div className="font-semibold">{u.conversionRate}</div></div>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg"><Eye className="h-2.5 w-2.5 mr-0.5" />Preview</Button>
                    {u.status === 'draft' && <Button size="sm" className="h-5 text-[7px] rounded-lg">Activate</Button>}
                    {u.status === 'active' && <Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg">Edit</Button>}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ CREDITS ═══ */}
      {tab === 'credits' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Credits Sold" value="12.4K" />
            <KPICard label="Revenue" value="$8,680" />
            <KPICard label="Most Popular" value="1000 pack" />
            <KPICard label="Burn Rate" value="~320/day" />
          </KPIBand>

          <SectionCard title="How Credits Work" icon={<Zap className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="rounded-xl bg-gradient-to-br from-accent/5 to-primary/5 border p-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[{ icon: Zap, title: 'Earn & Buy', desc: 'Purchase packs or earn through activity' },
                  { icon: Sparkles, title: 'Use Anywhere', desc: 'Spend on AI, boosts, premium features' },
                  { icon: RefreshCw, title: 'Never Expire', desc: 'Credits stay in your wallet forever' },
                  { icon: Gift, title: 'Gift & Transfer', desc: 'Send credits to creators or teammates' },
                ].map(s => (
                  <div key={s.title} className="text-center">
                    <s.icon className="h-5 w-5 mx-auto mb-1 text-accent" />
                    <div className="text-[9px] font-semibold">{s.title}</div>
                    <div className="text-[7px] text-muted-foreground">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Credit Packages" icon={<Package className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CREDIT_TIERS.map(tier => (
                <div key={tier.credits} className={cn('rounded-2xl border p-3 text-center transition-all hover:shadow-md cursor-pointer relative', tier.popular && 'ring-2 ring-accent/30')}>
                  {tier.popular && <Badge className="absolute -top-2 right-2 text-[6px]">Best Value</Badge>}
                  <Zap className="h-5 w-5 mx-auto mb-1 text-accent" />
                  <div className="text-xl font-bold">{tier.credits.toLocaleString()}</div>
                  <div className="text-[8px] text-muted-foreground">credits</div>
                  <div className="text-sm font-bold mt-1">{tier.price}</div>
                  <div className="text-[7px] text-muted-foreground">{tier.perCredit}/credit</div>
                  {tier.savings && <div className="text-[7px] text-[hsl(var(--state-healthy))] font-medium mt-0.5">{tier.savings}</div>}
                  <Button size="sm" className="w-full mt-2 h-6 text-[8px] rounded-xl" onClick={() => toast.success(`${tier.credits} credits added to cart`)}>Buy</Button>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ FAQ & LEGAL ═══ */}
      {tab === 'faq' && (
        <div className="space-y-3">
          <SectionCard title="Frequently Asked Questions" icon={<HelpCircle className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-2">
              {[
                { q: 'Can I switch plans anytime?', a: 'Yes, upgrade or downgrade at any time. Changes apply at the next billing cycle. Upgrades are prorated.' },
                { q: 'What happens to my data if I downgrade?', a: 'Your data is preserved. If you exceed the lower plan limits, you will need to archive or remove excess items.' },
                { q: 'Do credits expire?', a: 'No, credits never expire. They remain in your wallet until used.' },
                { q: 'Can I get a refund?', a: 'We offer a 14-day money-back guarantee on all paid plans. Credits are non-refundable once used.' },
                { q: 'How does team billing work?', a: 'Team plans are billed per seat. You can add or remove seats anytime. Unused seat time is prorated.' },
                { q: 'Is there a student discount?', a: 'Yes! Students get 50% off Pro plans with a valid .edu email address.' },
              ].map(faq => (
                <div key={faq.q} className="rounded-xl border p-3 hover:bg-muted/10 transition-colors">
                  <div className="text-[10px] font-semibold mb-1">{faq.q}</div>
                  <div className="text-[8px] text-muted-foreground">{faq.a}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Legal & Policies" icon={<Scale className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { label: 'Terms of Service', icon: FileText, to: '/terms' },
                { label: 'Privacy Policy', icon: Shield, to: '/privacy' },
                { label: 'User Agreements', icon: BookOpen, to: '/agreements' },
                { label: 'Trust & Safety', icon: Shield, to: '/trust' },
              ].map(l => (
                <Link key={l.label} to={l.to}>
                  <div className="rounded-2xl border p-3 text-center hover:shadow-sm transition-all cursor-pointer hover:border-accent/30">
                    <l.icon className="h-5 w-5 mx-auto mb-1 text-accent" />
                    <div className="text-[9px] font-medium">{l.label}</div>
                  </div>
                </Link>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ CHECKOUT HANDOFF ═══ */}
      {tab === 'checkout' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Cart Abandonment" value="28%" change="-3%" trend="down" />
            <KPICard label="Checkout Conv." value="72%" />
            <KPICard label="Avg Cart Value" value="$94" />
            <KPICard label="Payment Success" value="96%" />
          </KPIBand>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SectionCard title="Active Checkout Sessions" icon={<ShoppingCart className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="space-y-1.5">
                {[
                  { user: 'Sarah M.', item: 'Pro Plan (Annual)', amount: '$278', status: 'in_progress', time: '2m ago' },
                  { user: 'Alex K.', item: '1000 Credits', amount: '$70', status: 'payment', time: '5m ago' },
                  { user: 'DevCorp', item: 'Team Plan + 5 seats', amount: '$395', status: 'review', time: '12m ago' },
                ].map(s => (
                  <div key={s.user} className="flex items-center gap-2 p-2 rounded-xl border hover:bg-muted/20 transition-colors text-[8px]">
                    <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center text-[7px] font-bold text-accent">{s.user[0]}</div>
                    <div className="flex-1 min-w-0"><div className="font-medium truncate">{s.user} — {s.item}</div><div className="text-[7px] text-muted-foreground">{s.time}</div></div>
                    <span className="font-semibold shrink-0">{s.amount}</span>
                    <Badge variant="secondary" className="text-[6px] capitalize shrink-0">{s.status.replace('_', ' ')}</Badge>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Payment Methods" icon={<CreditCard className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="space-y-1.5">
                {[
                  { method: 'Credit / Debit Card', share: '62%', icon: CreditCard },
                  { method: 'PayPal', share: '24%', icon: Wallet },
                  { method: 'Bank Transfer', share: '8%', icon: DollarSign },
                  { method: 'Apple / Google Pay', share: '6%', icon: Smartphone },
                ].map(m => (
                  <div key={m.method} className="flex items-center gap-2 p-2 rounded-xl border text-[8px]">
                    <m.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="flex-1">{m.method}</span>
                    <span className="font-semibold">{m.share}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* ═══ MOBILE COMPARE ═══ */}
      {tab === 'mobile' && (
        <div className="space-y-3">
          <div className="rounded-3xl bg-gradient-to-br from-accent/10 to-primary/10 border p-4">
            <div className="flex items-center gap-2 mb-2"><Crown className="h-5 w-5 text-accent" /><div><div className="text-sm font-bold">Choose Your Plan</div><div className="text-[8px] text-muted-foreground">Compare plans side-by-side</div></div></div>
            <div className="flex items-center gap-1 justify-center mt-2 rounded-xl border p-0.5 bg-card">
              {(['monthly', 'annual'] as const).map(c => (
                <button key={c} onClick={() => setBillingCycle(c)} className={cn('flex-1 px-2 py-1 rounded-lg text-[9px] font-medium transition-colors capitalize', billingCycle === c ? 'bg-accent text-accent-foreground' : 'text-muted-foreground')}>{c}{c === 'annual' ? ' (Save 20%)' : ''}</button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {PLANS.map(plan => (
              <div key={plan.id} className={cn('rounded-2xl border p-3 transition-all', plan.popular && 'ring-2 ring-accent/30')}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5"><span className="text-[11px] font-semibold">{plan.name}</span>{plan.badge && <Badge className="text-[6px]">{plan.badge}</Badge>}</div>
                  <div><span className="text-lg font-bold">{billingCycle === 'annual' && plan.price !== 'Custom' ? `$${Math.round(parseInt(plan.price.replace('$', '')) * 0.8)}` : plan.price}</span><span className="text-[8px] text-muted-foreground">{plan.period}</span></div>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {plan.features.slice(0, 3).map(f => <Badge key={f} variant="secondary" className="text-[6px]">{f}</Badge>)}
                  {plan.features.length > 3 && <Badge variant="secondary" className="text-[6px]">+{plan.features.length - 3} more</Badge>}
                </div>
                <Button size="sm" className={cn('w-full h-8 text-[9px] rounded-xl', plan.popular && 'bg-accent text-accent-foreground')} onClick={() => toast.info(`Selected ${plan.name}`)}>{plan.cta}</Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button className="flex-1 h-10 text-[10px] rounded-xl gap-1"><Crown className="h-3.5 w-3.5" />Upgrade Now</Button>
            <Button variant="outline" className="flex-1 h-10 text-[10px] rounded-xl gap-1"><Zap className="h-3.5 w-3.5" />Buy Credits</Button>
          </div>
        </div>
      )}

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t shadow-lg p-3 flex items-center gap-2 safe-area-bottom">
        <div className="flex-1"><span className="text-[10px] font-semibold">$18.4K MRR</span><div className="text-[8px] text-muted-foreground">248 active · 3 promos live</div></div>
        <Button size="sm" className="h-9 text-[10px] gap-1 rounded-xl px-4"><Crown className="h-3.5 w-3.5" />Plans</Button>
      </div>

      <PromoDrawer promo={selectedPromo} open={!!selectedPromo} onClose={() => setSelectedPromo(null)} />
    </DashboardLayout>
  );
};

export default PricingMonetizationPage;
