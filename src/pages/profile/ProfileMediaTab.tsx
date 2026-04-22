import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Image, Video, FileText, Eye, Download, Plus, Play } from 'lucide-react';

const MEDIA = [
  { title: 'Acme Brand Guidelines', type: 'PDF', size: '4.2 MB', views: 128, date: 'Apr 10, 2026', category: 'Portfolio' },
  { title: 'Logo Design Process', type: 'Video', size: '48 MB', views: 342, date: 'Mar 25, 2026', category: 'Behind the Scenes' },
  { title: 'Mobile App Mockups', type: 'Image', size: '12 MB', views: 256, date: 'Mar 18, 2026', category: 'Portfolio' },
  { title: 'Client Testimonial Reel', type: 'Video', size: '85 MB', views: 189, date: 'Mar 5, 2026', category: 'Testimonials' },
  { title: 'Design System Components', type: 'Image', size: '8.4 MB', views: 94, date: 'Feb 22, 2026', category: 'Portfolio' },
  { title: 'UX Case Study — TechFlow', type: 'PDF', size: '6.1 MB', views: 203, date: 'Feb 15, 2026', category: 'Case Studies' },
];

const ICON_MAP = { Image, Video, PDF: FileText };

export default function ProfileMediaTab() {
  return (
    <DashboardLayout topStrip={<><Image className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Media</span><div className="flex-1" /><Button size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Plus className="h-3 w-3" />Upload</Button></>}>
      <KPIBand className="mb-3">
        <KPICard label="Total Items" value={String(MEDIA.length)} className="!rounded-2xl" />
        <KPICard label="Total Views" value="1.2K" className="!rounded-2xl" />
        <KPICard label="Downloads" value="86" className="!rounded-2xl" />
        <KPICard label="Storage Used" value="164 MB" className="!rounded-2xl" />
      </KPIBand>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {MEDIA.map((m, i) => {
          const Icon = ICON_MAP[m.type as keyof typeof ICON_MAP] || FileText;
          return (
            <SectionCard key={i} className="!rounded-2xl">
              <div className="h-24 rounded-xl bg-muted/30 flex items-center justify-center mb-2">
                {m.type === 'Video' ? <Play className="h-8 w-8 text-muted-foreground/40" /> : <Icon className="h-8 w-8 text-muted-foreground/40" />}
              </div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold truncate">{m.title}</span>
                <Badge variant="outline" className="text-[6px] rounded-md shrink-0">{m.type}</Badge>
              </div>
              <div className="flex items-center gap-2 text-[8px] text-muted-foreground">
                <span>{m.size}</span>
                <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{m.views}</span>
                <span>{m.date}</span>
              </div>
              <Badge variant="outline" className="text-[6px] rounded-md mt-1">{m.category}</Badge>
            </SectionCard>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
