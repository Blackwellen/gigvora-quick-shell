import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Search, FileText, ChevronRight, Clock, ThumbsUp, Eye } from 'lucide-react';

const CATEGORIES = [
  { name: 'Getting Started', articles: 24, icon: '🚀', description: 'Account setup, first steps, and platform overview' },
  { name: 'Payments & Billing', articles: 18, icon: '💳', description: 'Invoices, escrow, withdrawals, and payment methods' },
  { name: 'Gigs & Services', articles: 32, icon: '🛠️', description: 'Creating, managing, and delivering gigs and services' },
  { name: 'Projects & Contracts', articles: 22, icon: '📋', description: 'Project workflows, milestones, and contract management' },
  { name: 'Jobs & Recruiting', articles: 16, icon: '💼', description: 'Job posting, applications, and hiring tools' },
  { name: 'Account & Security', articles: 14, icon: '🔒', description: 'Password, 2FA, verification, and privacy settings' },
  { name: 'Enterprise & Teams', articles: 20, icon: '🏢', description: 'Team management, SSO, and enterprise features' },
  { name: 'Disputes & Trust', articles: 12, icon: '⚖️', description: 'Dispute resolution, safety, and compliance' },
];

const POPULAR = [
  { title: 'How to withdraw earnings', views: 4200, helpful: 96, category: 'Payments' },
  { title: 'Setting up two-factor authentication', views: 3100, helpful: 94, category: 'Security' },
  { title: 'Creating your first gig listing', views: 2800, helpful: 92, category: 'Gigs' },
  { title: 'Understanding escrow protection', views: 2400, helpful: 98, category: 'Payments' },
];

export default function HelpCategoryPage() {
  return (
    <DashboardLayout
      topStrip={<><BookOpen className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Help Categories</span><div className="flex-1" /><Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl">Submit Ticket</Button></>}
      rightRail={
        <div className="space-y-3">
          <SectionCard title="Popular Articles">
            {POPULAR.map((a, i) => (
              <div key={i} className="py-2 border-b border-border/20 last:border-0 cursor-pointer hover:bg-muted/20 rounded-lg px-1.5 -mx-1.5">
                <div className="text-[9px] font-semibold mb-0.5">{a.title}</div>
                <div className="flex items-center gap-2 text-[7px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><Eye className="h-2 w-2" />{a.views.toLocaleString()}</span>
                  <span className="flex items-center gap-0.5"><ThumbsUp className="h-2 w-2" />{a.helpful}%</span>
                  <Badge variant="outline" className="text-[6px] h-3">{a.category}</Badge>
                </div>
              </div>
            ))}
          </SectionCard>
        </div>
      }
      rightRailWidth="w-48"
    >
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Search help articles..." className="pl-8 h-8 text-xs rounded-xl" /></div>
      </div>

      <KPIBand className="mb-3">
        <KPICard label="Categories" value={String(CATEGORIES.length)} className="!rounded-2xl" />
        <KPICard label="Total Articles" value="158" className="!rounded-2xl" />
        <KPICard label="Updated Today" value="6" className="!rounded-2xl" />
        <KPICard label="Avg Helpfulness" value="94%" className="!rounded-2xl" />
      </KPIBand>

      <div className="grid grid-cols-2 gap-2.5">
        {CATEGORIES.map((cat, i) => (
          <SectionCard key={i} className="!rounded-2xl cursor-pointer hover:border-accent/30 transition-all">
            <div className="flex items-start gap-3">
              <div className="text-xl shrink-0">{cat.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-bold">{cat.name}</span>
                  <Badge variant="outline" className="text-[7px] rounded-md">{cat.articles} articles</Badge>
                </div>
                <p className="text-[8px] text-muted-foreground mb-1.5">{cat.description}</p>
                <Button variant="ghost" size="sm" className="h-5 text-[8px] p-0 text-accent gap-0.5">Browse <ChevronRight className="h-2.5 w-2.5" /></Button>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </DashboardLayout>
  );
}
