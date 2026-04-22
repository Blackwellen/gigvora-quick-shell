import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Zap, Crown, ArrowRight, Shield, CheckCircle2, Star, Sparkles, Users, HardDrive, FileText, BarChart3, Rocket, Globe, Lock, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRole } from '@/contexts/RoleContext';
import { PLAN_CONFIGS, ENTITLEMENT_LABELS, type PlanTier, type FeatureEntitlement } from '@/types/role';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PlanUpgradeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  highlightFeature?: FeatureEntitlement;
}

const PLAN_ORDER: PlanTier[] = ['free', 'starter', 'pro', 'business', 'enterprise'];

const PLAN_ICONS: Record<PlanTier, React.ElementType> = {
  free: Shield,
  starter: Zap,
  pro: Star,
  business: Users,
  enterprise: Crown,
};

const PLAN_ACCENT: Record<PlanTier, string> = {
  free: 'border-muted',
  starter: 'border-[hsl(var(--gigvora-blue)/0.3)]',
  pro: 'border-[hsl(var(--gigvora-amber)/0.4)] ring-1 ring-[hsl(var(--gigvora-amber)/0.15)]',
  business: 'border-[hsl(var(--gigvora-purple)/0.3)]',
  enterprise: 'border-[hsl(var(--state-premium)/0.3)]',
};

export const PlanUpgradeDrawer: React.FC<PlanUpgradeDrawerProps> = ({
  open, onOpenChange, highlightFeature,
}) => {
  const { currentPlan, setPlan } = useRole();
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual');
  const [upgrading, setUpgrading] = useState<PlanTier | null>(null);
  const [view, setView] = useState<'cards' | 'compare'>('cards');

  if (!open) return null;

  const currentIdx = PLAN_ORDER.indexOf(currentPlan);

  const handleUpgrade = (plan: PlanTier) => {
    setUpgrading(plan);
    setTimeout(() => {
      setPlan(plan);
      setUpgrading(null);
      toast.success(`Upgraded to ${PLAN_CONFIGS[plan].label} plan!`, {
        description: 'Your new features are now available.',
      });
      onOpenChange(false);
    }, 1500);
  };

  const allEntitlements = Object.keys(ENTITLEMENT_LABELS) as FeatureEntitlement[];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange(false)} />

      <div className="relative w-full max-w-[720px] bg-card shadow-2xl border-l flex flex-col rounded-l-3xl overflow-hidden animate-in slide-in-from-right-8 duration-300">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 md:px-7 py-4 border-b bg-gradient-to-r from-card to-muted/20 shrink-0">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Crown className="h-5 w-5 text-[hsl(var(--gigvora-amber))]" />
              Plans & Entitlements
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {highlightFeature
                ? `Unlock ${ENTITLEMENT_LABELS[highlightFeature].label} and more`
                : 'Choose the plan that fits your needs'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted/60 rounded-xl p-0.5">
              <button className={cn('px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all', view === 'cards' && 'bg-card shadow-sm')} onClick={() => setView('cards')}>Cards</button>
              <button className={cn('px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all', view === 'compare' && 'bg-card shadow-sm')} onClick={() => setView('compare')}>Compare</button>
            </div>
            <button onClick={() => onOpenChange(false)} className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-muted transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Billing toggle ── */}
        <div className="px-5 md:px-7 py-3 border-b flex items-center justify-between shrink-0">
          <div className="flex items-center bg-muted/60 rounded-xl p-0.5">
            <button
              className={cn('px-3.5 py-1.5 rounded-lg text-[11px] font-medium transition-all', billing === 'monthly' ? 'bg-card shadow-sm' : '')}
              onClick={() => setBilling('monthly')}
            >Monthly</button>
            <button
              className={cn('px-3.5 py-1.5 rounded-lg text-[11px] font-medium transition-all', billing === 'annual' ? 'bg-card shadow-sm' : '')}
              onClick={() => setBilling('annual')}
            >
              Annual
              <Badge className="text-[7px] h-3.5 ml-1.5 bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] border-0">Save 20%</Badge>
            </button>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground hidden sm:flex">
            <Shield className="h-3 w-3" /> 30-day money-back guarantee
          </div>
        </div>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-5 md:px-7 py-5 space-y-4">
            {/* Highlight feature callout */}
            {highlightFeature && (
              <div className="rounded-2xl bg-[hsl(var(--state-premium)/0.05)] border border-[hsl(var(--state-premium)/0.15)] p-4 flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-[hsl(var(--state-premium)/0.1)] flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-[hsl(var(--state-premium))]" />
                </div>
                <div>
                  <div className="text-xs font-semibold">{ENTITLEMENT_LABELS[highlightFeature].label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{ENTITLEMENT_LABELS[highlightFeature].description}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    Available from <span className="font-semibold text-foreground">{PLAN_CONFIGS[ENTITLEMENT_LABELS[highlightFeature].minPlan].label}</span> plan
                  </div>
                </div>
              </div>
            )}

            {view === 'cards' ? (
              <>
                {PLAN_ORDER.filter(p => p !== 'enterprise').map((planId) => {
                  const plan = PLAN_CONFIGS[planId];
                  const planIdx = PLAN_ORDER.indexOf(planId);
                  const isCurrent = planId === currentPlan;
                  const isDowngrade = planIdx < currentIdx;
                  const isHighlightPlan = highlightFeature && plan.entitlements.includes(highlightFeature);
                  const monthlyPrice = billing === 'annual' ? Math.round(plan.price.annual / 12) : plan.price.monthly;
                  const PlanIcon = PLAN_ICONS[planId];

                  return (
                    <div
                      key={planId}
                      className={cn(
                        'rounded-2xl border p-5 transition-all duration-200 hover:shadow-md',
                        PLAN_ACCENT[planId],
                        isCurrent && 'border-accent bg-accent/5 ring-1 ring-accent/20 shadow-sm',
                        isHighlightPlan && !isCurrent && 'border-[hsl(var(--state-premium))] bg-[hsl(var(--state-premium)/0.02)] ring-1 ring-[hsl(var(--state-premium)/0.2)]',
                      )}
                    >
                      {/* Plan header row */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'h-10 w-10 rounded-2xl flex items-center justify-center shrink-0',
                            isCurrent ? 'bg-accent/10' : 'bg-muted/60'
                          )}>
                            <PlanIcon className={cn('h-4.5 w-4.5', isCurrent ? 'text-accent' : 'text-muted-foreground')} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-bold">{plan.label}</h3>
                              {isCurrent && <Badge className="text-[8px] h-4 bg-accent/10 text-accent border-0">Current Plan</Badge>}
                              {plan.badge && !isCurrent && <Badge variant="outline" className="text-[8px] h-4">{plan.badge}</Badge>}
                              {plan.highlight && !isCurrent && (
                                <Badge className="text-[8px] h-4 bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))] border-0">
                                  <Star className="h-2 w-2 mr-0.5" />Best Value
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{plan.description}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          {monthlyPrice > 0 ? (
                            <>
                              <div className="text-xl font-bold">${monthlyPrice}<span className="text-[10px] font-normal text-muted-foreground">/mo</span></div>
                              {billing === 'annual' && <div className="text-[9px] text-muted-foreground">${plan.price.annual}/yr</div>}
                            </>
                          ) : (
                            <div className="text-xl font-bold">$0</div>
                          )}
                        </div>
                      </div>

                      {/* Entitlement chips */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {plan.entitlements.slice(0, 6).map((ent) => (
                          <span
                            key={ent}
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-medium border transition-colors',
                              highlightFeature === ent
                                ? 'bg-[hsl(var(--state-premium)/0.1)] text-[hsl(var(--state-premium))] border-[hsl(var(--state-premium)/0.2)]'
                                : 'bg-muted/40 border-transparent'
                            )}
                          >
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            {ENTITLEMENT_LABELS[ent]?.label || ent}
                          </span>
                        ))}
                        {plan.entitlements.length > 6 && (
                          <span className="text-[9px] text-muted-foreground px-2 py-0.5">+{plan.entitlements.length - 6} more</span>
                        )}
                      </div>

                      {/* Limits grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                        {[
                          { icon: FileText, label: 'Proposals', val: plan.limits.proposals === -1 ? '∞' : plan.limits.proposals },
                          { icon: BarChart3, label: 'Projects', val: plan.limits.projects === -1 ? '∞' : plan.limits.projects },
                          { icon: Users, label: 'Team', val: plan.limits.teamMembers === -1 ? '∞' : plan.limits.teamMembers },
                          { icon: HardDrive, label: 'Storage', val: plan.limits.storage },
                        ].map(l => (
                          <div key={l.label} className="rounded-xl bg-muted/30 px-2.5 py-2 text-center">
                            <l.icon className="h-3 w-3 mx-auto text-muted-foreground mb-0.5" />
                            <div className="text-[11px] font-bold">{l.val}</div>
                            <div className="text-[8px] text-muted-foreground">{l.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* CTA */}
                      {isCurrent ? (
                        <Button variant="outline" size="sm" className="w-full text-[11px] h-9 rounded-xl" disabled>
                          <Check className="h-3.5 w-3.5 mr-1.5" /> Current Plan
                        </Button>
                      ) : isDowngrade ? (
                        <Button variant="ghost" size="sm" className="w-full text-[11px] h-9 rounded-xl text-muted-foreground" disabled>
                          Downgrade
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className={cn(
                            'w-full text-[11px] h-9 gap-1.5 font-semibold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-px transition-all duration-200',
                            isHighlightPlan && 'bg-[hsl(var(--state-premium))] hover:bg-[hsl(var(--state-premium)/0.9)]'
                          )}
                          onClick={() => handleUpgrade(planId)}
                          disabled={upgrading !== null}
                        >
                          {upgrading === planId ? (
                            <span className="animate-pulse">Processing...</span>
                          ) : (
                            <><Zap className="h-3.5 w-3.5" /> Upgrade to {plan.label} <ArrowRight className="h-3.5 w-3.5" /></>
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}

                {/* Enterprise CTA */}
                <div className="rounded-2xl border-2 border-dashed border-[hsl(var(--state-premium)/0.3)] bg-gradient-to-br from-[hsl(var(--state-premium)/0.03)] to-transparent p-6 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-[hsl(var(--gigvora-amber)/0.1)] flex items-center justify-center mx-auto mb-3">
                    <Crown className="h-5 w-5 text-[hsl(var(--gigvora-amber))]" />
                  </div>
                  <h3 className="text-sm font-bold">Enterprise</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5 mb-3 max-w-xs mx-auto">Custom solutions for large organizations with dedicated support, SLAs, and advanced security</p>
                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    {[
                      { icon: Lock, label: 'SSO / SAML' },
                      { icon: Headphones, label: 'Dedicated CSM' },
                      { icon: Globe, label: 'Unlimited seats' },
                      { icon: Rocket, label: 'Custom SLA' },
                    ].map(f => (
                      <span key={f.label} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] bg-muted/40 font-medium">
                        <f.icon className="h-2.5 w-2.5 text-muted-foreground" />{f.label}
                      </span>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="text-[11px] h-9 gap-1.5 rounded-xl">
                    Contact Sales <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </>
            ) : (
              /* ── Compare Table View ── */
              <div className="overflow-x-auto -mx-2 px-2">
                <table className="w-full text-[10px] min-w-[500px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2.5 pr-3 font-semibold text-xs sticky left-0 bg-card">Feature</th>
                      {PLAN_ORDER.filter(p => p !== 'enterprise').map(p => (
                        <th key={p} className={cn('text-center py-2.5 px-2 font-semibold text-xs', p === currentPlan && 'text-accent')}>
                          {PLAN_CONFIGS[p].label}
                          {p === currentPlan && <div className="text-[8px] font-normal text-accent">Current</div>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allEntitlements.map(ent => (
                      <tr key={ent} className={cn('border-b border-muted/50', highlightFeature === ent && 'bg-[hsl(var(--state-premium)/0.03)]')}>
                        <td className="py-2 pr-3 sticky left-0 bg-card">
                          <div className="font-medium text-[10px]">{ENTITLEMENT_LABELS[ent].label}</div>
                          <div className="text-[9px] text-muted-foreground">{ENTITLEMENT_LABELS[ent].description}</div>
                        </td>
                        {PLAN_ORDER.filter(p => p !== 'enterprise').map(p => (
                          <td key={p} className="text-center py-2 px-2">
                            {PLAN_CONFIGS[p].entitlements.includes(ent)
                              ? <CheckCircle2 className="h-3.5 w-3.5 mx-auto text-[hsl(var(--state-healthy))]" />
                              : <X className="h-3.5 w-3.5 mx-auto text-muted-foreground/30" />
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                    {(['proposals', 'projects', 'teamMembers', 'storage'] as const).map(lim => (
                      <tr key={lim} className="border-b border-muted/50">
                        <td className="py-2 pr-3 font-medium text-[10px] capitalize sticky left-0 bg-card">{lim === 'teamMembers' ? 'Team Members' : lim}</td>
                        {PLAN_ORDER.filter(p => p !== 'enterprise').map(p => (
                          <td key={p} className="text-center py-2 px-2 text-[10px] font-semibold">
                            {PLAN_CONFIGS[p].limits[lim] === -1 ? '∞' : PLAN_CONFIGS[p].limits[lim]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-5 md:px-7 py-3 border-t flex items-center justify-between text-[10px] text-muted-foreground shrink-0 bg-muted/10">
          <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> 256-bit encrypted • SOC 2 compliant</span>
          <span>Questions? <button className="text-[hsl(var(--gigvora-blue))] hover:underline font-medium">Contact support</button></span>
        </div>
      </div>
    </div>,
    document.body
  );
};
