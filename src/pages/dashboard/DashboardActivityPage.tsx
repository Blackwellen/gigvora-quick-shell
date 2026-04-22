import React, { useState } from 'react';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Activity, Heart, MessageSquare, Users, Briefcase, Star,
  ShoppingBag, Calendar, FileText, CreditCard, HelpCircle,
  Eye, Clock, Filter, ChevronRight, Settings, Bookmark,
  FolderKanban, Award, Bell,
} from 'lucide-react';

type FilterType = 'all' | 'purchases' | 'bookings' | 'applications' | 'projects' | 'support' | 'account' | 'billing';

const ACTIVITIES = [
  { id: 1, type: 'purchases' as const, icon: ShoppingBag, color: 'text-accent', text: 'Purchased "Brand Strategy" service from StudioLab', time: '2h ago', detail: 'Order #GV-4521 · $450' },
  { id: 2, type: 'bookings' as const, icon: Calendar, color: 'text-[hsl(var(--gigvora-purple))]', text: 'Booked a consultation with Elena Rodriguez', time: '3h ago', detail: 'Tomorrow at 2:00 PM · 30 min' },
  { id: 3, type: 'applications' as const, icon: FileText, color: 'text-[hsl(var(--state-healthy))]', text: 'Applied to Senior Frontend Developer at Stripe', time: '5h ago', detail: 'Application submitted · Stage: Under Review' },
  { id: 4, type: 'projects' as const, icon: FolderKanban, color: 'text-blue-500', text: 'Milestone 2 approved on "Dashboard Redesign" project', time: '6h ago', detail: 'Payment released · $1,200' },
  { id: 5, type: 'account' as const, icon: Heart, color: 'text-pink-500', text: 'Sarah Chen liked your post "Design Trends 2026"', time: '8h ago', detail: '12 total reactions' },
  { id: 6, type: 'account' as const, icon: Users, color: 'text-accent', text: 'Marcus Johnson accepted your connection request', time: '10h ago', detail: 'You now have 48 connections' },
  { id: 7, type: 'support' as const, icon: HelpCircle, color: 'text-[hsl(var(--state-caution))]', text: 'Support ticket #1204 updated — awaiting your reply', time: '1d ago', detail: 'Category: Billing · Priority: Medium' },
  { id: 8, type: 'billing' as const, icon: CreditCard, color: 'text-[hsl(var(--gigvora-purple))]', text: 'Invoice #INV-3201 paid successfully', time: '1d ago', detail: '$29.00 · Pro subscription' },
  { id: 9, type: 'purchases' as const, icon: ShoppingBag, color: 'text-accent', text: 'Ordered "Logo Package" from DesignCraft', time: '2d ago', detail: 'Order #GV-4518 · $180 · In Progress' },
  { id: 10, type: 'bookings' as const, icon: Calendar, color: 'text-[hsl(var(--gigvora-purple))]', text: 'Session completed with Tom Williams', time: '3d ago', detail: 'Career Coaching · 45 min · Completed' },
  { id: 11, type: 'account' as const, icon: Star, color: 'text-[hsl(var(--state-caution))]', text: 'Your profile was viewed 18 times this week', time: '3d ago', detail: '+22% from last week' },
  { id: 12, type: 'applications' as const, icon: FileText, color: 'text-[hsl(var(--state-healthy))]', text: 'Interview scheduled — Product Designer at Notion', time: '4d ago', detail: 'Apr 18 at 10:00 AM · Video Call' },
  { id: 13, type: 'account' as const, icon: Award, color: 'text-purple-500', text: 'You earned the "Active Networker" badge', time: '5d ago', detail: 'Connected with 5+ people this week' },
  { id: 14, type: 'billing' as const, icon: CreditCard, color: 'text-[hsl(var(--gigvora-purple))]', text: 'Added Visa ending 4242 as payment method', time: '1w ago', detail: 'Default payment method updated' },
];

const FILTERS: { value: FilterType; label: string; icon: React.ElementType }[] = [
  { value: 'all', label: 'All', icon: Activity },
  { value: 'purchases', label: 'Purchases', icon: ShoppingBag },
  { value: 'bookings', label: 'Bookings', icon: Calendar },
  { value: 'applications', label: 'Applications', icon: FileText },
  { value: 'projects', label: 'Projects', icon: FolderKanban },
  { value: 'support', label: 'Support', icon: HelpCircle },
  { value: 'account', label: 'Account', icon: Settings },
  { value: 'billing', label: 'Billing', icon: CreditCard },
];

const DashboardActivityPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = filter === 'all' ? ACTIVITIES : ACTIVITIES.filter(a => a.type === filter);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold flex items-center gap-2"><Activity className="h-5 w-5 text-accent" /> My Activity</h1>
        <p className="text-[11px] text-muted-foreground">Your consolidated activity timeline across Gigvora</p>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)} className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-medium shrink-0 transition-all',
            filter === f.value ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}>
            <f.icon className="h-3 w-3" />{f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <SectionCard className="!rounded-2xl">
        <div className="space-y-0">
          {filtered.map((a, i) => (
            <div key={a.id} className={cn('flex items-start gap-3 py-3 group cursor-pointer hover:bg-muted/20 rounded-xl px-2 transition-colors', i !== filtered.length - 1 && 'border-b border-border/30')}>
              <div className="h-9 w-9 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors">
                <a.icon className={cn('h-4 w-4', a.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold group-hover:text-accent transition-colors">{a.text}</div>
                <div className="text-[8px] text-muted-foreground mt-0.5">{a.detail}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[8px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{a.time}</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-accent transition-colors" />
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <Activity className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
              <div className="text-xs font-semibold text-muted-foreground">No activity found</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Try adjusting your filters</div>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
};

export default DashboardActivityPage;
