import React, { useState } from 'react';
import {
  User, Briefcase, Building2, Check, Crown, ChevronDown, Zap, Shield, ArrowRight, Clock, Sparkles,
  ShieldCheck,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRole } from '@/contexts/RoleContext';
import { ROLE_CONFIGS, PLAN_CONFIGS } from '@/types/role';
import type { UserRole } from '@/types/role';
import { cn } from '@/lib/utils';
import { PlanUpgradeDrawer } from './PlanUpgradeDrawer';
import { toast } from 'sonner';

const ROLE_ICONS: Record<UserRole, React.ElementType> = {
  user: User,
  professional: Briefcase,
  enterprise: Building2,
  admin: ShieldCheck,
};

const ROLE_COLORS: Record<UserRole, string> = {
  user: 'bg-[hsl(var(--gigvora-blue)/0.1)] text-[hsl(var(--gigvora-blue))]',
  professional: 'bg-[hsl(var(--gigvora-purple)/0.1)] text-[hsl(var(--gigvora-purple))]',
  enterprise: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]',
  admin: 'bg-destructive/10 text-destructive',
};

/** Roles shown in the switcher (excludes admin which requires separate auth) */
const SWITCHABLE_ROLES: UserRole[] = ['user', 'professional', 'enterprise'];

export { ROLE_ICONS, ROLE_COLORS };

export const RoleSwitcher: React.FC = () => {
  const { activeRole, setActiveRole, currentPlan, roleSwitchHistory } = useRole();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const ActiveIcon = ROLE_ICONS[activeRole];
  const planCfg = PLAN_CONFIGS[currentPlan];

  const handleRoleSwitch = (role: UserRole) => {
    if (role !== activeRole) {
      setActiveRole(role);
      toast.success(`Switched to ${ROLE_CONFIGS[role].label}`, {
        description: ROLE_CONFIGS[role].description,
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-[11px] px-2.5 font-medium rounded-xl hover:-translate-y-px transition-all duration-200"
          >
            <div className={cn('h-5 w-5 rounded-lg flex items-center justify-center', ROLE_COLORS[activeRole])}>
              <ActiveIcon className="h-3 w-3" />
            </div>
            <span className="hidden lg:inline">{ROLE_CONFIGS[activeRole].label}</span>
            {currentPlan !== 'free' && (
              <Badge className="text-[7px] h-3.5 px-1 bg-[hsl(var(--state-premium)/0.1)] text-[hsl(var(--state-premium))] border-0">
                {planCfg.label}
              </Badge>
            )}
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 rounded-2xl p-1.5 max-h-[70vh] overflow-y-auto">
          {/* Current plan badge */}
          <div className="px-3 py-2.5 rounded-xl bg-muted/30 mb-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  'h-7 w-7 rounded-xl flex items-center justify-center',
                  currentPlan === 'free' ? 'bg-muted' : 'bg-[hsl(var(--state-premium)/0.1)]'
                )}>
                  {currentPlan === 'free' ? <Shield className="h-3.5 w-3.5 text-muted-foreground" /> : <Crown className="h-3.5 w-3.5 text-[hsl(var(--state-premium))]" />}
                </div>
                <div>
                  <div className="text-[11px] font-semibold">{planCfg.label} Plan</div>
                  <div className="text-[9px] text-muted-foreground">{planCfg.description}</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-[9px] h-6 px-2 gap-0.5 rounded-lg" onClick={() => setShowUpgrade(true)}>
                <Zap className="h-2.5 w-2.5" /> {currentPlan === 'free' ? 'Upgrade' : 'Manage'}
              </Button>
            </div>
          </div>

          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground pt-2 px-2">
            Switch Workspace
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-1" />

          {SWITCHABLE_ROLES.map((role) => {
            const cfg = ROLE_CONFIGS[role];
            const Icon = ROLE_ICONS[role];
            const isActive = role === activeRole;
            return (
              <DropdownMenuItem
                key={role}
                onClick={() => handleRoleSwitch(role)}
                className={cn(
                  'flex items-start gap-3 py-2 px-2.5 cursor-pointer rounded-xl my-0.5 transition-all duration-200',
                  isActive && 'bg-accent/5 border border-accent/15',
                  !isActive && 'hover:-translate-y-px'
                )}
              >
                <div className={cn(
                  'h-7 w-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-transform duration-200',
                  isActive ? ROLE_COLORS[role] : 'bg-muted'
                )}>
                  <Icon className={cn('h-3.5 w-3.5', isActive ? '' : 'text-muted-foreground')} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold flex items-center gap-1.5">
                    {cfg.label}
                    {isActive && <Check className="h-3 w-3 text-accent" />}
                  </div>
                  <div className="text-[9px] text-muted-foreground leading-snug mt-0.5">{cfg.description}</div>
                  {isActive && (
                    <div className="flex items-center gap-1 mt-1">
                      <Badge className="text-[7px] h-3.5 bg-accent/10 text-accent border-0">Active</Badge>
                      <span className="text-[8px] text-muted-foreground">{cfg.dashboardTabs.length} modules</span>
                    </div>
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}

          {/* Recent switches */}
          {roleSwitchHistory.length > 0 && (
            <>
              <DropdownMenuSeparator className="my-1" />
              <div className="px-2.5 py-2">
                <div className="text-[9px] text-muted-foreground flex items-center gap-1 mb-1.5">
                  <Clock className="h-2.5 w-2.5" /> Recent switches
                </div>
                {roleSwitchHistory.slice(-3).reverse().map((entry, i) => {
                  const FromIcon = ROLE_ICONS[entry.from];
                  const ToIcon = ROLE_ICONS[entry.to];
                  return (
                    <div key={i} className="flex items-center gap-1.5 text-[9px] text-muted-foreground py-0.5">
                      <FromIcon className="h-2.5 w-2.5" />
                      <span>{ROLE_CONFIGS[entry.from].label}</span>
                      <ArrowRight className="h-2 w-2" />
                      <ToIcon className="h-2.5 w-2.5" />
                      <span>{ROLE_CONFIGS[entry.to].label}</span>
                      <span className="ml-auto opacity-50">
                        {entry.at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuItem className="py-2.5 px-2.5 cursor-pointer rounded-xl" onClick={() => setShowUpgrade(true)}>
            <div className="flex items-center gap-2.5 w-full">
              <div className="h-7 w-7 rounded-xl bg-[hsl(var(--gigvora-amber)/0.1)] flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />
              </div>
              <div className="flex-1">
                <span className="text-[11px] font-semibold block">View Plans & Entitlements</span>
                <span className="text-[9px] text-muted-foreground">Compare features across plans</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <PlanUpgradeDrawer open={showUpgrade} onOpenChange={setShowUpgrade} />
    </>
  );
};
