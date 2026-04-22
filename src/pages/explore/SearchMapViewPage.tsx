import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Map, Search, MapPin, Users, Briefcase, Eye, SlidersHorizontal, Layers } from 'lucide-react';

const MARKERS = [
  { name: 'TechFlow Inc.', type: 'Company', location: 'San Francisco, CA', lat: '37.7749', lng: '-122.4194', category: 'Technology' },
  { name: 'Product Design Meetup', type: 'Event', location: 'New York, NY', lat: '40.7128', lng: '-74.0060', category: 'Design' },
  { name: 'DesignCraft Studio', type: 'Agency', location: 'London, UK', lat: '51.5074', lng: '-0.1278', category: 'Design' },
  { name: 'Freelancer Co-Working', type: 'Space', location: 'Berlin, DE', lat: '52.5200', lng: '13.4050', category: 'Community' },
  { name: 'AI Research Lab', type: 'Company', location: 'Boston, MA', lat: '42.3601', lng: '-71.0589', category: 'Technology' },
];

const LAYERS_LIST = ['People', 'Companies', 'Events', 'Coworking', 'Meetups'];

export default function SearchMapViewPage() {
  return (
    <DashboardLayout topStrip={<><Map className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Map View</span><div className="flex-1" /><Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Layers className="h-3 w-3" />Layers</Button><Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><SlidersHorizontal className="h-3 w-3" />Filters</Button></>}>
      <div className="flex gap-2 mb-3"><div className="relative flex-1"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Search location or place..." className="pl-8 h-8 text-xs rounded-xl" /></div></div>
      <div className="flex flex-wrap gap-1 mb-3">{LAYERS_LIST.map(l => <Badge key={l} className="text-[8px] bg-accent/10 text-accent border-0 rounded-lg cursor-pointer">{l}</Badge>)}</div>

      {/* Map placeholder */}
      <SectionCard className="!rounded-2xl mb-3">
        <div className="h-64 rounded-xl bg-muted/20 border-2 border-dashed border-border/30 flex items-center justify-center">
          <div className="text-center">
            <Map className="h-12 w-12 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-[10px] text-muted-foreground">Interactive Map View</p>
            <p className="text-[8px] text-muted-foreground">Showing {MARKERS.length} results in your area</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Nearby Results" className="!rounded-2xl">
        <div className="space-y-2">
          {MARKERS.map((m, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
              <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0"><MapPin className="h-4 w-4 text-accent" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5"><span className="text-[10px] font-bold">{m.name}</span><Badge variant="outline" className="text-[7px] rounded-md">{m.type}</Badge><Badge variant="outline" className="text-[7px] rounded-md">{m.category}</Badge></div>
                <div className="text-[8px] text-muted-foreground flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{m.location}</div>
              </div>
              <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg"><Eye className="h-2.5 w-2.5 mr-0.5" />View</Button>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
