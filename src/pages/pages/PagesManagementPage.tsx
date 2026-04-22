import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { SectionBackNav } from '@/components/shell/SectionBackNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Globe, Eye, Users, Edit, ExternalLink, Plus,
  BarChart3, Settings, ChevronRight, Clock,
} from 'lucide-react';

const MY_PAGES = [
  { id: 'pg1', title: 'Portfolio — Design Work', url: '/pages/portfolio', status: 'published', views: '2.4K', lastEdited: '2d ago' },
  { id: 'pg2', title: 'Consulting Services', url: '/pages/consulting', status: 'published', views: '890', lastEdited: '1w ago' },
  { id: 'pg3', title: 'About Me', url: '/pages/about', status: 'draft', views: '—', lastEdited: '3d ago' },
  { id: 'pg4', title: 'Case Studies', url: '/pages/cases', status: 'published', views: '1.2K', lastEdited: '5d ago' },
];

export default function PagesManagementPage() {
  const [tab, setTab] = useState('all');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <Globe className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold mr-4">My Pages</h1>
          <KPICard label="Total Pages" value={String(MY_PAGES.length)} />
          <KPICard label="Published" value={String(MY_PAGES.filter(p => p.status === 'published').length)} />
          <KPICard label="Total Views" value="4.5K" />
        </div>
      }
    >
      <SectionBackNav homeRoute="/dashboard" homeLabel="Dashboard" currentLabel="Pages" icon={<Globe className="h-3 w-3" />} />

      <div className="flex items-center justify-between mb-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-7">
            <TabsTrigger value="all" className="text-[10px] h-5 px-2">All</TabsTrigger>
            <TabsTrigger value="published" className="text-[10px] h-5 px-2">Published</TabsTrigger>
            <TabsTrigger value="draft" className="text-[10px] h-5 px-2">Drafts</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button size="sm" className="h-7 text-[10px] gap-1 rounded-xl"><Plus className="h-3 w-3" /> New Page</Button>
      </div>

      <div className="space-y-2">
        {MY_PAGES.filter(p => tab === 'all' || p.status === tab).map(p => (
          <SectionCard key={p.id} className="!rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <Globe className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-bold">{p.title}</span>
                  <StatusBadge status={p.status === 'published' ? 'healthy' : 'review'} label={p.status} />
                </div>
                <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                  <span><Eye className="h-2.5 w-2.5 inline" /> {p.views} views</span>
                  <span><Clock className="h-2.5 w-2.5 inline" /> Edited {p.lastEdited}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-1 rounded-lg"><Edit className="h-2.5 w-2.5" /> Edit</Button>
                <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-1 rounded-lg"><ExternalLink className="h-2.5 w-2.5" /></Button>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </DashboardLayout>
  );
}
