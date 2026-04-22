import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { SectionBackNav } from '@/components/shell/SectionBackNav';
import { AdvancedFilterPanel, FilterDefinition, FilterValues } from '@/components/shell/AdvancedFilterPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search, Filter, Star, MapPin, Clock, Heart, ChevronRight, Shield, Users, SlidersHorizontal, Store } from 'lucide-react';

const SERVICES = [
  { title: 'Brand Identity Design', seller: 'DesignCraft Studio', rating: 4.9, reviews: 342, price: 'From $500', location: 'Remote', delivery: '5-7 days', tags: ['Branding', 'Logo', 'Guidelines'], featured: true, verified: true },
  { title: 'Full-Stack Web Development', seller: 'CodeWorks Pro', rating: 4.8, reviews: 218, price: 'From $2,000', location: 'Remote', delivery: '2-4 weeks', tags: ['React', 'Node.js', 'AWS'], featured: false, verified: true },
  { title: 'SEO & Content Strategy', seller: 'GrowthLab Digital', rating: 4.7, reviews: 156, price: 'From $800/mo', location: 'Remote', delivery: 'Ongoing', tags: ['SEO', 'Content', 'Analytics'], featured: true, verified: true },
  { title: 'Financial Consulting', seller: 'Apex Advisory', rating: 4.9, reviews: 89, price: 'From $150/hr', location: 'New York', delivery: 'Flexible', tags: ['Finance', 'Strategy', 'Tax'], featured: false, verified: false },
  { title: 'Video Production', seller: 'PixelMotion', rating: 4.6, reviews: 124, price: 'From $1,200', location: 'Los Angeles', delivery: '1-2 weeks', tags: ['Video', 'Animation', 'Editing'], featured: false, verified: true },
];

const CATEGORIES = ['All', 'Design', 'Development', 'Marketing', 'Consulting', 'Media', 'Writing'];

const SERVICE_FILTERS: FilterDefinition[] = [
  { id: 'category', label: 'Category', type: 'multi-select', group: 'Service', options: [
    { value: 'design', label: 'Design', count: 420 }, { value: 'development', label: 'Development', count: 380 },
    { value: 'marketing', label: 'Marketing', count: 290 }, { value: 'consulting', label: 'Consulting', count: 180 },
    { value: 'media', label: 'Media & Video', count: 150 }, { value: 'writing', label: 'Writing', count: 200 },
    { value: 'data', label: 'Data & Analytics', count: 120 }, { value: 'legal', label: 'Legal', count: 60 },
  ], defaultOpen: true },
  { id: 'priceRange', label: 'Price Range', type: 'range', group: 'Cost', min: 0, max: 10000, step: 100, unit: '$' },
  { id: 'pricingModel', label: 'Pricing Model', type: 'multi-select', group: 'Cost', options: [
    { value: 'fixed', label: 'Fixed Price' }, { value: 'hourly', label: 'Hourly Rate' },
    { value: 'monthly', label: 'Monthly Retainer' }, { value: 'custom', label: 'Custom Quote' },
  ]},
  { id: 'delivery', label: 'Delivery Time', type: 'single-select', group: 'Timing', options: [
    { value: '24h', label: '24 Hours' }, { value: '3d', label: '1-3 Days' },
    { value: '1w', label: '1 Week' }, { value: '2w', label: '2 Weeks' },
    { value: '1m', label: '1 Month+' }, { value: 'ongoing', label: 'Ongoing' },
  ]},
  { id: 'rating', label: 'Min Rating', type: 'range', group: 'Quality', min: 1, max: 5, step: 0.5 },
  { id: 'reviews', label: 'Min Reviews', type: 'range', group: 'Quality', min: 0, max: 500, step: 10 },
  { id: 'verified', label: 'Verified Providers Only', type: 'toggle', group: 'Quality' },
  { id: 'featured', label: 'Featured Only', type: 'toggle', group: 'Quality' },
  { id: 'location', label: 'Location', type: 'multi-select', group: 'Location', options: [
    { value: 'remote', label: 'Remote' }, { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' }, { value: 'eu', label: 'Europe' },
    { value: 'asia', label: 'Asia' }, { value: 'anywhere', label: 'Anywhere' },
  ]},
  { id: 'experience', label: 'Provider Experience', type: 'single-select', group: 'Provider', options: [
    { value: 'new', label: 'New (< 1 year)' }, { value: 'mid', label: '1-3 Years' },
    { value: 'senior', label: '3-5 Years' }, { value: 'expert', label: '5+ Years' },
  ]},
  { id: 'completedOrders', label: 'Min Completed Orders', type: 'range', group: 'Provider', min: 0, max: 1000, step: 10 },
  { id: 'responseTime', label: 'Response Time', type: 'single-select', group: 'Provider', options: [
    { value: '1h', label: '< 1 Hour' }, { value: '4h', label: '< 4 Hours' },
    { value: '24h', label: '< 24 Hours' }, { value: 'any', label: 'Any' },
  ]},
  { id: 'hasPortfolio', label: 'Has Portfolio', type: 'toggle', group: 'Provider' },
  { id: 'languages', label: 'Languages', type: 'multi-select', group: 'Provider', options: [
    { value: 'en', label: 'English' }, { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' }, { value: 'de', label: 'German' },
    { value: 'zh', label: 'Chinese' }, { value: 'ja', label: 'Japanese' },
  ]},
];

export default function ServicesBrowsePage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(true);
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  return (
    <DashboardLayout topStrip={<><Store className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Services Marketplace</span><div className="flex-1" /></>}>
      <SectionBackNav homeRoute="/dashboard" homeLabel="Dashboard" currentLabel="Services" icon={<Store className="h-3 w-3" />} />

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search services..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs rounded-xl" />
        </div>
        <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-0.5">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} className={cn('px-2.5 py-1 rounded-lg text-[8px] font-medium transition-colors', category === c ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground')}>{c}</button>
          ))}
        </div>
        <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1 rounded-xl" onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal className="h-3 w-3" /> Filters
          {Object.keys(filterValues).length > 0 && (
            <Badge className="text-[7px] h-3.5 px-1 ml-0.5 bg-accent text-accent-foreground">{Object.keys(filterValues).length}</Badge>
          )}
        </Button>
      </div>

      {showFilters && (
        <div className="mb-4">
          <AdvancedFilterPanel filters={SERVICE_FILTERS} values={filterValues} onChange={setFilterValues} inline />
        </div>
      )}

      <KPIBand className="mb-4">
        <KPICard label="Available Services" value="2,840" className="!rounded-2xl" />
        <KPICard label="Verified Providers" value="1,120" className="!rounded-2xl" />
        <KPICard label="Avg Rating" value="4.7" className="!rounded-2xl" />
        <KPICard label="Categories" value="24" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {SERVICES.map((s, i) => (
          <SectionCard key={i} className="!rounded-2xl">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[12px] font-bold">{s.title}</span>
                  {s.featured && <Badge className="text-[7px] bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))] border-0 rounded-lg">Featured</Badge>}
                  {s.verified && <Badge className="text-[7px] bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] border-0 rounded-lg"><Shield className="h-2 w-2 mr-0.5" />Verified</Badge>}
                </div>
                <div className="text-[9px] text-muted-foreground flex items-center gap-3 mb-1.5">
                  <span className="font-medium text-foreground">{s.seller}</span>
                  <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />{s.rating} ({s.reviews})</span>
                  <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{s.location}</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{s.delivery}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-wrap gap-1">{s.tags.map(t => <Badge key={t} variant="outline" className="text-[7px] h-3.5 rounded-md">{t}</Badge>)}</div>
                  <span className="text-[10px] font-bold text-accent ml-auto">{s.price}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 ml-3">
                <Button size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><ChevronRight className="h-3 w-3" />View</Button>
                <Button variant="ghost" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Heart className="h-3 w-3" />Save</Button>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </DashboardLayout>
  );
}
