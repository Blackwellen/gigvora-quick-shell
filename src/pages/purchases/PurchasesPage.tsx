import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { SectionBackNav } from '@/components/shell/SectionBackNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ShoppingBag, Layers, Store, Briefcase, CreditCard,
  Clock, ChevronRight, Download, Star, FileText,
  Package, Ticket, Zap,
} from 'lucide-react';

const PURCHASES = [
  { id: 'p1', title: 'Logo Design Package', seller: 'DesignPro Studio', type: 'gig', price: '$250', date: 'Apr 12, 2026', status: 'delivered' },
  { id: 'p2', title: 'SEO Retainer - Q2', seller: 'Growth Hackers Inc', type: 'service', price: '$1,200/mo', date: 'Apr 1, 2026', status: 'active' },
  { id: 'p3', title: 'React Masterclass', seller: 'DevAcademy', type: 'webinar', price: '$49', date: 'Mar 28, 2026', status: 'completed' },
  { id: 'p4', title: 'Pro Subscription', seller: 'Gigvora', type: 'subscription', price: '$29/mo', date: 'Mar 15, 2026', status: 'active' },
  { id: 'p5', title: 'E-commerce Redesign', seller: 'Agency X', type: 'project', price: '$8,500', date: 'Mar 10, 2026', status: 'in-progress' },
  { id: 'p6', title: '500 AI Credits', seller: 'Gigvora', type: 'credits', price: '$25', date: 'Mar 5, 2026', status: 'completed' },
  { id: 'p7', title: 'Startup Fundraising Webinar', seller: 'VCInsider', type: 'webinar', price: '$99', date: 'Feb 28, 2026', status: 'completed' },
  { id: 'p8', title: 'Brand Identity Service', seller: 'Creative Co', type: 'service', price: '$3,000', date: 'Feb 15, 2026', status: 'delivered' },
];

const typeIcon = (t: string) => t === 'gig' ? Layers : t === 'service' ? Store : t === 'project' ? Briefcase : t === 'webinar' ? Ticket : t === 'subscription' ? Zap : CreditCard;
const typeColor = (t: string) => t === 'gig' ? 'bg-accent/10 text-accent' : t === 'service' ? 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' : t === 'project' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground';

export default function PurchasesPage() {
  const [tab, setTab] = useState('all');
  const filtered = PURCHASES.filter(p => tab === 'all' || p.type === tab);

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <ShoppingBag className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold mr-4">Purchases</h1>
          <KPICard label="Total Orders" value={String(PURCHASES.length)} />
          <KPICard label="Active" value={String(PURCHASES.filter(p => p.status === 'active' || p.status === 'in-progress').length)} />
          <KPICard label="This Month" value="$1,524" />
        </div>
      }
    >
      <SectionBackNav homeRoute="/dashboard" homeLabel="Dashboard" currentLabel="Purchases" icon={<ShoppingBag className="h-3 w-3" />} />

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="h-7">
          <TabsTrigger value="all" className="text-[10px] h-5 px-2">All</TabsTrigger>
          <TabsTrigger value="gig" className="text-[10px] h-5 px-2">Gigs</TabsTrigger>
          <TabsTrigger value="service" className="text-[10px] h-5 px-2">Services</TabsTrigger>
          <TabsTrigger value="project" className="text-[10px] h-5 px-2">Projects</TabsTrigger>
          <TabsTrigger value="subscription" className="text-[10px] h-5 px-2">Subscriptions</TabsTrigger>
          <TabsTrigger value="credits" className="text-[10px] h-5 px-2">Credits</TabsTrigger>
          <TabsTrigger value="webinar" className="text-[10px] h-5 px-2">Webinars</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        {filtered.map(p => {
          const Icon = typeIcon(p.type);
          return (
            <SectionCard key={p.id} className="!rounded-2xl">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${typeColor(p.type)}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-bold">{p.title}</span>
                    <Badge variant="outline" className="text-[7px] h-3.5 capitalize">{p.type}</Badge>
                    <StatusBadge status={p.status === 'active' || p.status === 'in-progress' ? 'pending' : p.status === 'delivered' || p.status === 'completed' ? 'healthy' : 'review'} label={p.status} />
                  </div>
                  <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                    <span>{p.seller}</span>
                    <span>•</span>
                    <Clock className="h-2.5 w-2.5" />
                    <span>{p.date}</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-accent">{p.price}</span>
                <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg"><ChevronRight className="h-3 w-3" /></Button>
              </div>
            </SectionCard>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
