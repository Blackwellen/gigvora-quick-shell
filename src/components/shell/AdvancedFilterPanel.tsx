import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { ChevronDown, X, Search, SlidersHorizontal, RotateCcw } from 'lucide-react';

/* ── Filter definition types ── */

export type FilterType = 'multi-select' | 'single-select' | 'range' | 'toggle' | 'text';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterDefinition {
  id: string;
  label: string;
  type: FilterType;
  options?: FilterOption[];
  /** For range type */
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  /** Group heading to organize filters */
  group?: string;
  /** Default collapsed */
  defaultOpen?: boolean;
}

export type FilterValues = Record<string, string | string[] | boolean | [number, number]>;

interface AdvancedFilterPanelProps {
  filters: FilterDefinition[];
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  className?: string;
  /** Show as inline horizontal bar instead of sidebar */
  inline?: boolean;
  /** Compact mode for smaller screens */
  compact?: boolean;
}

export const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  filters, values, onChange, className, inline = false, compact = false,
}) => {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(true);

  const activeCount = useMemo(() => {
    return Object.entries(values).filter(([, v]) => {
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'boolean') return v;
      if (typeof v === 'string') return v.length > 0;
      return false;
    }).length;
  }, [values]);

  const grouped = useMemo(() => {
    const groups: Record<string, FilterDefinition[]> = {};
    const filtered = filters.filter(f => !search || f.label.toLowerCase().includes(search.toLowerCase()));
    filtered.forEach(f => {
      const g = f.group || 'Filters';
      if (!groups[g]) groups[g] = [];
      groups[g].push(f);
    });
    return groups;
  }, [filters, search]);

  const updateValue = (id: string, val: FilterValues[string]) => {
    onChange({ ...values, [id]: val });
  };

  const clearAll = () => onChange({});

  const toggleMulti = (id: string, optVal: string) => {
    const current = (values[id] as string[]) || [];
    const next = current.includes(optVal)
      ? current.filter(v => v !== optVal)
      : [...current, optVal];
    updateValue(id, next);
  };

  if (inline) {
    return (
      <div className={cn('flex items-center gap-1.5 flex-wrap', className)}>
        <SlidersHorizontal className="h-3 w-3 text-muted-foreground shrink-0" />
        {activeCount > 0 && (
          <Badge variant="secondary" className="text-[8px] gap-0.5">
            {activeCount} active
            <button onClick={clearAll}><X className="h-2 w-2" /></button>
          </Badge>
        )}
        {Object.entries(values).map(([id, val]) => {
          if (!val || (Array.isArray(val) && val.length === 0)) return null;
          const def = filters.find(f => f.id === id);
          const display = Array.isArray(val) ? val.join(', ') : String(val);
          return (
            <Badge key={id} variant="secondary" className="text-[8px] gap-0.5 cursor-pointer hover:bg-accent/10">
              {def?.label}: {display}
              <button onClick={() => updateValue(id, Array.isArray(val) ? [] : '')}><X className="h-2 w-2" /></button>
            </Badge>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('rounded-[var(--card-radius-lg)] border bg-card overflow-hidden', className)}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <SlidersHorizontal className="h-3.5 w-3.5 text-accent" />
        <span className="text-[11px] font-semibold flex-1 text-left">Filters</span>
        {activeCount > 0 && <Badge className="text-[8px] bg-accent/10 text-accent border-0 rounded-full h-4 px-1.5">{activeCount}</Badge>}
        <ChevronDown className={cn('h-3 w-3 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <>
          {/* Search + Clear */}
          <div className="px-3 pb-2 flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search filters..."
                className="h-7 pl-7 text-[10px] rounded-lg"
              />
            </div>
            {activeCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-[9px] gap-0.5 text-muted-foreground" onClick={clearAll}>
                <RotateCcw className="h-2.5 w-2.5" />Clear
              </Button>
            )}
          </div>

          {/* Filter groups */}
          <ScrollArea className={cn('px-3 pb-3', compact ? 'max-h-[300px]' : 'max-h-[500px]')}>
            <div className="space-y-1">
              {Object.entries(grouped).map(([group, defs]) => (
                <div key={group}>
                  {Object.keys(grouped).length > 1 && (
                    <div className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider px-1 pt-2 pb-1">{group}</div>
                  )}
                  {defs.map(f => (
                    <FilterItem key={f.id} def={f} value={values[f.id]} onUpdate={(v) => updateValue(f.id, v)} onToggleMulti={(v) => toggleMulti(f.id, v)} />
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
};

/* ── Individual filter item ── */

const FilterItem: React.FC<{
  def: FilterDefinition;
  value: FilterValues[string] | undefined;
  onUpdate: (v: FilterValues[string]) => void;
  onToggleMulti: (optVal: string) => void;
}> = ({ def, value, onUpdate, onToggleMulti }) => {
  const [open, setOpen] = useState(def.defaultOpen ?? true);

  if (def.type === 'toggle') {
    return (
      <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors">
        <input
          type="checkbox"
          checked={!!value}
          onChange={e => onUpdate(e.target.checked)}
          className="rounded border-muted-foreground/30 h-3 w-3 accent-[hsl(var(--accent))]"
        />
        <span className="text-[10px]">{def.label}</span>
      </label>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-muted/30 transition-colors">
        <span className="text-[10px] font-medium flex-1 text-left">{def.label}</span>
        {def.type === 'multi-select' && Array.isArray(value) && (value as string[]).length > 0 && (
          <Badge className="text-[7px] bg-accent/10 text-accent border-0 h-3.5 px-1">{(value as string[]).length}</Badge>
        )}
        <ChevronDown className={cn('h-2.5 w-2.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-2 pr-1 pb-1 pt-0.5">
          {def.type === 'text' && (
            <Input
              value={(value as string) || ''}
              onChange={e => onUpdate(e.target.value)}
              placeholder={`Enter ${def.label.toLowerCase()}...`}
              className="h-6 text-[9px] rounded-md"
            />
          )}

          {def.type === 'single-select' && def.options && (
            <div className="space-y-0.5 max-h-[140px] overflow-y-auto">
              {def.options.map(o => (
                <button
                  key={o.value}
                  onClick={() => onUpdate(value === o.value ? '' : o.value)}
                  className={cn(
                    'flex items-center gap-1.5 w-full px-2 py-1 rounded-md text-[9px] transition-colors',
                    value === o.value ? 'bg-accent/10 text-accent font-medium' : 'hover:bg-muted/30'
                  )}
                >
                  <span className="flex-1 text-left">{o.label}</span>
                  {o.count !== undefined && <span className="text-[8px] text-muted-foreground">{o.count}</span>}
                </button>
              ))}
            </div>
          )}

          {def.type === 'multi-select' && def.options && (
            <div className="space-y-0.5 max-h-[140px] overflow-y-auto">
              {def.options.map(o => {
                const selected = Array.isArray(value) && (value as string[]).includes(o.value);
                return (
                  <label
                    key={o.value}
                    className={cn(
                      'flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] cursor-pointer transition-colors',
                      selected ? 'bg-accent/10 text-accent' : 'hover:bg-muted/30'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleMulti(o.value)}
                      className="rounded border-muted-foreground/30 h-2.5 w-2.5 accent-[hsl(var(--accent))]"
                    />
                    <span className="flex-1">{o.label}</span>
                    {o.count !== undefined && <span className="text-[8px] text-muted-foreground">{o.count}</span>}
                  </label>
                );
              })}
            </div>
          )}

          {def.type === 'range' && (
            <div className="flex items-center gap-2 px-1">
              <Input
                type="number"
                min={def.min}
                max={def.max}
                step={def.step}
                value={Array.isArray(value) ? (value as [number, number])[0] : def.min || 0}
                onChange={e => {
                  const cur = Array.isArray(value) ? (value as [number, number]) : [def.min || 0, def.max || 100];
                  onUpdate([Number(e.target.value), cur[1]]);
                }}
                className="h-6 text-[9px] w-16 rounded-md"
                placeholder="Min"
              />
              <span className="text-[8px] text-muted-foreground">to</span>
              <Input
                type="number"
                min={def.min}
                max={def.max}
                step={def.step}
                value={Array.isArray(value) ? (value as [number, number])[1] : def.max || 100}
                onChange={e => {
                  const cur = Array.isArray(value) ? (value as [number, number]) : [def.min || 0, def.max || 100];
                  onUpdate([cur[0], Number(e.target.value)]);
                }}
                className="h-6 text-[9px] w-16 rounded-md"
                placeholder="Max"
              />
              {def.unit && <span className="text-[8px] text-muted-foreground">{def.unit}</span>}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

/* ══════════════════════════════════════════════════════
   Section-Specific Filter Presets
   ══════════════════════════════════════════════════════ */

export const NAVIGATOR_LEADS_FILTERS: FilterDefinition[] = [
  { id: 'connection', label: 'Connection Degree', type: 'single-select', group: 'Relationship', options: [{ value: '1st', label: '1st Degree' }, { value: '2nd', label: '2nd Degree' }, { value: '3rd', label: '3rd Degree' }, { value: 'none', label: 'Out of Network' }] },
  { id: 'signals', label: 'Buying Signals', type: 'multi-select', group: 'Signals', options: [{ value: 'hiring', label: 'Hiring' }, { value: 'funding', label: 'Funding' }, { value: 'expanding', label: 'Expanding' }, { value: 'new_role', label: 'New Role' }, { value: 'active', label: 'Recently Active' }, { value: 'engaged', label: 'Engaged' }] },
  { id: 'industry', label: 'Industry', type: 'multi-select', group: 'Company', options: [{ value: 'saas', label: 'SaaS', count: 42 }, { value: 'fintech', label: 'FinTech', count: 28 }, { value: 'cloud', label: 'Cloud Infrastructure', count: 19 }, { value: 'ai', label: 'AI/ML', count: 31 }, { value: 'martech', label: 'MarTech', count: 15 }, { value: 'analytics', label: 'Data Analytics', count: 23 }, { value: 'healthcare', label: 'Healthcare', count: 11 }, { value: 'ecommerce', label: 'E-Commerce', count: 17 }] },
  { id: 'companySize', label: 'Company Size', type: 'multi-select', group: 'Company', options: [{ value: 'startup', label: 'Startup (1-50)' }, { value: 'smb', label: 'SMB (51-200)' }, { value: 'mid', label: 'Mid-Market (201-1K)' }, { value: 'enterprise', label: 'Enterprise (1K+)' }] },
  { id: 'revenue', label: 'Company Revenue', type: 'single-select', group: 'Company', options: [{ value: '<10m', label: 'Under $10M' }, { value: '10-50m', label: '$10M-$50M' }, { value: '50-100m', label: '$50M-$100M' }, { value: '100-250m', label: '$100M-$250M' }, { value: '250m+', label: '$250M+' }] },
  { id: 'seniority', label: 'Seniority Level', type: 'multi-select', group: 'Person', options: [{ value: 'c-suite', label: 'C-Suite' }, { value: 'vp', label: 'VP' }, { value: 'director', label: 'Director' }, { value: 'manager', label: 'Manager' }, { value: 'ic', label: 'Individual Contributor' }] },
  { id: 'function', label: 'Job Function', type: 'multi-select', group: 'Person', options: [{ value: 'engineering', label: 'Engineering' }, { value: 'product', label: 'Product' }, { value: 'sales', label: 'Sales' }, { value: 'marketing', label: 'Marketing' }, { value: 'operations', label: 'Operations' }, { value: 'hr', label: 'HR / People' }, { value: 'finance', label: 'Finance' }, { value: 'design', label: 'Design' }] },
  { id: 'title', label: 'Job Title', type: 'text', group: 'Person' },
  { id: 'location', label: 'Location', type: 'multi-select', group: 'Geography', options: [{ value: 'us-west', label: 'US - West Coast' }, { value: 'us-east', label: 'US - East Coast' }, { value: 'us-central', label: 'US - Central' }, { value: 'uk', label: 'United Kingdom' }, { value: 'eu', label: 'EU' }, { value: 'apac', label: 'Asia Pacific' }, { value: 'latam', label: 'Latin America' }, { value: 'remote', label: 'Remote' }] },
  { id: 'country', label: 'Country', type: 'multi-select', group: 'Geography', options: [{ value: 'us', label: 'United States' }, { value: 'uk', label: 'United Kingdom' }, { value: 'de', label: 'Germany' }, { value: 'fr', label: 'France' }, { value: 'in', label: 'India' }, { value: 'au', label: 'Australia' }, { value: 'ca', label: 'Canada' }, { value: 'sg', label: 'Singapore' }] },
  { id: 'scoreMin', label: 'Minimum Lead Score', type: 'range', group: 'Scoring', min: 0, max: 100, step: 5 },
  { id: 'lastActive', label: 'Last Active', type: 'single-select', group: 'Activity', options: [{ value: '24h', label: 'Last 24 hours' }, { value: '7d', label: 'Last 7 days' }, { value: '30d', label: 'Last 30 days' }, { value: '90d', label: 'Last 90 days' }] },
  { id: 'saved', label: 'Saved Only', type: 'toggle', group: 'Lists' },
  { id: 'hasEmail', label: 'Has Email', type: 'toggle', group: 'Contact' },
  { id: 'hasPhone', label: 'Has Phone', type: 'toggle', group: 'Contact' },
  { id: 'engaged', label: 'Previously Engaged', type: 'toggle', group: 'Activity' },
  { id: 'fundingStage', label: 'Funding Stage', type: 'multi-select', group: 'Company', options: [{ value: 'pre-seed', label: 'Pre-Seed' }, { value: 'seed', label: 'Seed' }, { value: 'series-a', label: 'Series A' }, { value: 'series-b', label: 'Series B' }, { value: 'series-c+', label: 'Series C+' }, { value: 'public', label: 'Public' }, { value: 'bootstrapped', label: 'Bootstrapped' }] },
  { id: 'techStack', label: 'Tech Stack', type: 'multi-select', group: 'Technology', options: [{ value: 'react', label: 'React' }, { value: 'python', label: 'Python' }, { value: 'aws', label: 'AWS' }, { value: 'gcp', label: 'GCP' }, { value: 'azure', label: 'Azure' }, { value: 'kubernetes', label: 'Kubernetes' }, { value: 'salesforce', label: 'Salesforce' }, { value: 'hubspot', label: 'HubSpot' }] },
  { id: 'growthRate', label: 'Company Growth Rate', type: 'single-select', group: 'Company', options: [{ value: '50+', label: '50%+ Growth' }, { value: '25-50', label: '25-50% Growth' }, { value: '10-25', label: '10-25% Growth' }, { value: '<10', label: 'Under 10% Growth' }] },
  { id: 'founded', label: 'Founded Year', type: 'range', group: 'Company', min: 2000, max: 2026, step: 1 },
  { id: 'teamGrowth', label: 'Team Growth', type: 'single-select', group: 'Signals', options: [{ value: 'rapid', label: 'Rapid (20%+ in 6mo)' }, { value: 'steady', label: 'Steady (5-20%)' }, { value: 'flat', label: 'Flat' }, { value: 'declining', label: 'Declining' }] },
  { id: 'contentEngagement', label: 'Content Engagement', type: 'single-select', group: 'Activity', options: [{ value: 'high', label: 'High (10+ interactions)' }, { value: 'medium', label: 'Medium (3-9)' }, { value: 'low', label: 'Low (1-2)' }, { value: 'none', label: 'No engagement' }] },
  { id: 'intent', label: 'Purchase Intent', type: 'single-select', group: 'Signals', options: [{ value: 'hot', label: 'Hot — actively evaluating' }, { value: 'warm', label: 'Warm — researching' }, { value: 'cold', label: 'Cold — no signals' }] },
];

export const NAVIGATOR_ACCOUNTS_FILTERS: FilterDefinition[] = [
  { id: 'industry', label: 'Industry', type: 'multi-select', group: 'Company', options: [{ value: 'saas', label: 'SaaS' }, { value: 'fintech', label: 'FinTech' }, { value: 'cloud', label: 'Cloud' }, { value: 'ai', label: 'AI/ML' }, { value: 'analytics', label: 'Analytics' }, { value: 'healthcare', label: 'Healthcare' }, { value: 'ecommerce', label: 'E-Commerce' }, { value: 'edtech', label: 'EdTech' }] },
  { id: 'size', label: 'Company Size', type: 'multi-select', group: 'Company', options: [{ value: 'startup', label: 'Startup (1-50)' }, { value: 'smb', label: 'SMB (51-200)' }, { value: 'mid', label: 'Mid-Market (201-1K)' }, { value: 'enterprise', label: 'Enterprise (1K+)' }] },
  { id: 'revenue', label: 'Revenue Range', type: 'single-select', group: 'Financials', options: [{ value: '<10m', label: '<$10M' }, { value: '10-50m', label: '$10M-$50M' }, { value: '50-100m', label: '$50M-$100M' }, { value: '100m+', label: '$100M+' }] },
  { id: 'signals', label: 'Active Signals', type: 'multi-select', group: 'Signals', options: [{ value: 'hiring', label: 'Hiring' }, { value: 'funding', label: 'Funding' }, { value: 'expanding', label: 'Expanding' }, { value: 'new_role', label: 'Leadership Change' }, { value: 'active', label: 'Platform Active' }] },
  { id: 'location', label: 'Headquarters', type: 'multi-select', group: 'Geography', options: [{ value: 'sf', label: 'San Francisco' }, { value: 'nyc', label: 'New York' }, { value: 'austin', label: 'Austin' }, { value: 'london', label: 'London' }, { value: 'seattle', label: 'Seattle' }, { value: 'boston', label: 'Boston' }] },
  { id: 'stage', label: 'Sales Stage', type: 'single-select', group: 'Pipeline', options: [{ value: 'prospecting', label: 'Prospecting' }, { value: 'qualified', label: 'Qualified' }, { value: 'opportunity', label: 'Opportunity' }, { value: 'negotiation', label: 'Negotiation' }, { value: 'closed', label: 'Closed' }] },
  { id: 'fundingStage', label: 'Funding Stage', type: 'multi-select', group: 'Financials', options: [{ value: 'seed', label: 'Seed' }, { value: 'series-a', label: 'Series A' }, { value: 'series-b', label: 'Series B' }, { value: 'series-c+', label: 'Series C+' }, { value: 'ipo', label: 'IPO/Public' }, { value: 'bootstrapped', label: 'Bootstrapped' }] },
  { id: 'founded', label: 'Founded Year', type: 'range', group: 'Company', min: 2000, max: 2026, step: 1 },
  { id: 'scoreMin', label: 'Min Account Score', type: 'range', group: 'Scoring', min: 0, max: 100, step: 5 },
  { id: 'techStack', label: 'Tech Stack', type: 'multi-select', group: 'Technology', options: [{ value: 'react', label: 'React' }, { value: 'go', label: 'Go' }, { value: 'python', label: 'Python' }, { value: 'kubernetes', label: 'Kubernetes' }, { value: 'aws', label: 'AWS' }, { value: 'gcp', label: 'GCP' }] },
  { id: 'growth', label: 'Growth Rate', type: 'single-select', group: 'Signals', options: [{ value: '50+', label: '50%+' }, { value: '25-50', label: '25-50%' }, { value: '10-25', label: '10-25%' }, { value: '<10', label: '<10%' }] },
  { id: 'leadsMin', label: 'Min Leads Found', type: 'range', group: 'Pipeline', min: 0, max: 50, step: 1 },
  { id: 'hasContacts', label: 'Has Known Contacts', type: 'toggle', group: 'Contact' },
  { id: 'recentActivity', label: 'Recent Activity', type: 'single-select', group: 'Activity', options: [{ value: '24h', label: 'Last 24h' }, { value: '7d', label: 'Last 7 days' }, { value: '30d', label: 'Last 30 days' }] },
  { id: 'countries', label: 'Countries Operating', type: 'multi-select', group: 'Geography', options: [{ value: 'us', label: 'United States' }, { value: 'uk', label: 'United Kingdom' }, { value: 'de', label: 'Germany' }, { value: 'in', label: 'India' }, { value: 'au', label: 'Australia' }, { value: 'jp', label: 'Japan' }] },
  { id: 'retailOutlets', label: 'Retail Outlets', type: 'range', group: 'Company', min: 0, max: 1000, step: 10, unit: 'outlets' },
  { id: 'subsidiaries', label: 'Subsidiaries', type: 'range', group: 'Company', min: 0, max: 100, step: 1 },
  { id: 'positionChanges', label: 'Recent Leadership Changes', type: 'toggle', group: 'Signals' },
  { id: 'buyerReady', label: 'Buyer Ready', type: 'toggle', group: 'Pipeline' },
  { id: 'partnerOpen', label: 'Open to Partnerships', type: 'toggle', group: 'Pipeline' },
  { id: 'verified', label: 'Verified Account', type: 'toggle', group: 'Trust' },
];

export const NAVIGATOR_COMPANY_INTEL_FILTERS: FilterDefinition[] = [
  { id: 'industry', label: 'Industry', type: 'multi-select', group: 'Company', options: [{ value: 'saas', label: 'SaaS' }, { value: 'cloud', label: 'Cloud' }, { value: 'ai', label: 'AI/ML' }, { value: 'analytics', label: 'Analytics' }, { value: 'fintech', label: 'FinTech' }, { value: 'healthcare', label: 'Healthcare' }] },
  { id: 'employees', label: 'Employee Count', type: 'multi-select', group: 'Company', options: [{ value: '1-50', label: '1-50' }, { value: '51-200', label: '51-200' }, { value: '201-500', label: '201-500' }, { value: '501-1k', label: '501-1K' }, { value: '1k-5k', label: '1K-5K' }, { value: '5k+', label: '5K+' }] },
  { id: 'revenue', label: 'Revenue', type: 'single-select', group: 'Financials', options: [{ value: '<10m', label: '<$10M' }, { value: '10-50m', label: '$10-50M' }, { value: '50-100m', label: '$50-100M' }, { value: '100-250m', label: '$100-250M' }, { value: '250m+', label: '$250M+' }] },
  { id: 'growth', label: 'Growth Rate', type: 'single-select', group: 'Signals', options: [{ value: '100+', label: '100%+ Hyper-Growth' }, { value: '50-100', label: '50-100%' }, { value: '25-50', label: '25-50%' }, { value: '10-25', label: '10-25%' }, { value: '<10', label: '<10%' }] },
  { id: 'location', label: 'Headquarters', type: 'multi-select', group: 'Geography', options: [{ value: 'sf', label: 'San Francisco' }, { value: 'nyc', label: 'New York' }, { value: 'austin', label: 'Austin' }, { value: 'london', label: 'London' }, { value: 'seattle', label: 'Seattle' }, { value: 'boston', label: 'Boston' }, { value: 'berlin', label: 'Berlin' }] },
  { id: 'countriesOperating', label: 'Countries Operating In', type: 'multi-select', group: 'Geography', options: [{ value: 'us', label: 'United States' }, { value: 'uk', label: 'UK' }, { value: 'de', label: 'Germany' }, { value: 'in', label: 'India' }, { value: 'au', label: 'Australia' }, { value: 'sg', label: 'Singapore' }, { value: 'jp', label: 'Japan' }, { value: 'br', label: 'Brazil' }] },
  { id: 'retailOutlets', label: 'Retail Outlets Count', type: 'range', group: 'Company', min: 0, max: 5000, step: 50, unit: 'outlets' },
  { id: 'subsidiaries', label: 'Number of Subsidiaries', type: 'range', group: 'Company', min: 0, max: 200, step: 1 },
  { id: 'positionChanges', label: 'Recent C-Suite Changes', type: 'toggle', group: 'Signals' },
  { id: 'techStack', label: 'Technology Stack', type: 'multi-select', group: 'Technology', options: [{ value: 'react', label: 'React' }, { value: 'python', label: 'Python' }, { value: 'go', label: 'Go' }, { value: 'aws', label: 'AWS' }, { value: 'gcp', label: 'GCP' }, { value: 'azure', label: 'Azure' }, { value: 'kubernetes', label: 'Kubernetes' }, { value: 'spark', label: 'Spark' }] },
  { id: 'fundingStage', label: 'Funding Stage', type: 'multi-select', group: 'Financials', options: [{ value: 'seed', label: 'Seed' }, { value: 'series-a', label: 'Series A' }, { value: 'series-b', label: 'Series B' }, { value: 'series-c+', label: 'Series C+' }, { value: 'public', label: 'Public' }] },
  { id: 'fundingAmount', label: 'Total Funding', type: 'range', group: 'Financials', min: 0, max: 500, step: 10, unit: 'M$' },
  { id: 'founded', label: 'Founded Year', type: 'range', group: 'Company', min: 1990, max: 2026, step: 1 },
  { id: 'score', label: 'Min Intel Score', type: 'range', group: 'Scoring', min: 0, max: 100, step: 5 },
  { id: 'recentNews', label: 'Has Recent News', type: 'toggle', group: 'Activity' },
  { id: 'hiring', label: 'Currently Hiring', type: 'toggle', group: 'Signals' },
  { id: 'expanding', label: 'Expanding Operations', type: 'toggle', group: 'Signals' },
  { id: 'partnerships', label: 'Min Partnerships', type: 'range', group: 'Company', min: 0, max: 50, step: 1 },
  { id: 'complianceCerts', label: 'Compliance Certs', type: 'multi-select', group: 'Trust', options: [{ value: 'soc2', label: 'SOC 2' }, { value: 'iso27001', label: 'ISO 27001' }, { value: 'gdpr', label: 'GDPR' }, { value: 'hipaa', label: 'HIPAA' }, { value: 'pci', label: 'PCI DSS' }] },
  { id: 'keyPositions', label: 'Key Positions Held', type: 'multi-select', group: 'Person', options: [{ value: 'ceo', label: 'CEO' }, { value: 'cto', label: 'CTO' }, { value: 'cfo', label: 'CFO' }, { value: 'cmo', label: 'CMO' }, { value: 'coo', label: 'COO' }, { value: 'vp-eng', label: 'VP Engineering' }, { value: 'vp-sales', label: 'VP Sales' }] },
];

export const RECRUITER_SEARCH_FILTERS: FilterDefinition[] = [
  { id: 'skills', label: 'Skills', type: 'multi-select', group: 'Skills & Expertise', options: [{ value: 'react', label: 'React' }, { value: 'typescript', label: 'TypeScript' }, { value: 'python', label: 'Python' }, { value: 'java', label: 'Java' }, { value: 'go', label: 'Go' }, { value: 'rust', label: 'Rust' }, { value: 'nodejs', label: 'Node.js' }, { value: 'graphql', label: 'GraphQL' }, { value: 'kubernetes', label: 'Kubernetes' }, { value: 'terraform', label: 'Terraform' }, { value: 'pytorch', label: 'PyTorch' }, { value: 'llms', label: 'LLMs' }] },
  { id: 'experience', label: 'Years of Experience', type: 'range', group: 'Experience', min: 0, max: 30, step: 1, unit: 'years' },
  { id: 'seniority', label: 'Seniority Level', type: 'multi-select', group: 'Experience', options: [{ value: 'intern', label: 'Intern' }, { value: 'junior', label: 'Junior (0-2 yrs)' }, { value: 'mid', label: 'Mid-Level (3-5 yrs)' }, { value: 'senior', label: 'Senior (5-8 yrs)' }, { value: 'staff', label: 'Staff (8-12 yrs)' }, { value: 'principal', label: 'Principal (12+ yrs)' }, { value: 'director', label: 'Director' }, { value: 'vp', label: 'VP' }, { value: 'c-suite', label: 'C-Suite' }] },
  { id: 'education', label: 'Education', type: 'multi-select', group: 'Education', options: [{ value: 'phd', label: 'PhD' }, { value: 'masters', label: "Master's Degree" }, { value: 'bachelors', label: "Bachelor's Degree" }, { value: 'associates', label: "Associate's" }, { value: 'bootcamp', label: 'Bootcamp' }, { value: 'self-taught', label: 'Self-Taught' }] },
  { id: 'university', label: 'University / School', type: 'text', group: 'Education' },
  { id: 'certifications', label: 'Certifications', type: 'multi-select', group: 'Education', options: [{ value: 'aws-sa', label: 'AWS Solutions Architect' }, { value: 'gcp-pro', label: 'GCP Professional' }, { value: 'azure-dev', label: 'Azure Developer' }, { value: 'pmp', label: 'PMP' }, { value: 'scrum', label: 'Scrum Master' }, { value: 'cissp', label: 'CISSP' }, { value: 'cka', label: 'CKA (Kubernetes)' }] },
  { id: 'jobTitle', label: 'Current Job Title', type: 'text', group: 'Position' },
  { id: 'company', label: 'Current Company', type: 'text', group: 'Position' },
  { id: 'previousCompanies', label: 'Previous Companies', type: 'text', group: 'Position' },
  { id: 'industry', label: 'Industry', type: 'multi-select', group: 'Position', options: [{ value: 'tech', label: 'Technology' }, { value: 'fintech', label: 'FinTech' }, { value: 'healthcare', label: 'Healthcare' }, { value: 'ecommerce', label: 'E-Commerce' }, { value: 'enterprise', label: 'Enterprise SaaS' }, { value: 'gaming', label: 'Gaming' }, { value: 'media', label: 'Media' }, { value: 'consulting', label: 'Consulting' }] },
  { id: 'location', label: 'Location', type: 'multi-select', group: 'Geography', options: [{ value: 'sf', label: 'San Francisco' }, { value: 'nyc', label: 'New York' }, { value: 'london', label: 'London' }, { value: 'seattle', label: 'Seattle' }, { value: 'austin', label: 'Austin' }, { value: 'boston', label: 'Boston' }, { value: 'berlin', label: 'Berlin' }, { value: 'toronto', label: 'Toronto' }, { value: 'bangalore', label: 'Bangalore' }] },
  { id: 'remote', label: 'Work Preference', type: 'single-select', group: 'Geography', options: [{ value: 'remote', label: 'Remote Only' }, { value: 'hybrid', label: 'Hybrid' }, { value: 'onsite', label: 'On-Site' }, { value: 'flexible', label: 'Flexible' }] },
  { id: 'willingToRelocate', label: 'Willing to Relocate', type: 'toggle', group: 'Geography' },
  { id: 'openToWork', label: 'Open to Work', type: 'toggle', group: 'Availability' },
  { id: 'noticePeriod', label: 'Notice Period', type: 'single-select', group: 'Availability', options: [{ value: 'immediate', label: 'Immediately' }, { value: '2w', label: '2 Weeks' }, { value: '1m', label: '1 Month' }, { value: '2m', label: '2 Months' }, { value: '3m+', label: '3+ Months' }] },
  { id: 'salaryRange', label: 'Salary Expectation', type: 'range', group: 'Compensation', min: 50, max: 500, step: 10, unit: 'K$' },
  { id: 'languages', label: 'Languages Spoken', type: 'multi-select', group: 'Personal', options: [{ value: 'en', label: 'English' }, { value: 'es', label: 'Spanish' }, { value: 'fr', label: 'French' }, { value: 'de', label: 'German' }, { value: 'zh', label: 'Mandarin' }, { value: 'ja', label: 'Japanese' }, { value: 'pt', label: 'Portuguese' }, { value: 'hi', label: 'Hindi' }] },
  { id: 'diversity', label: 'Diversity Tags', type: 'multi-select', group: 'Personal', options: [{ value: 'veteran', label: 'Veteran' }, { value: 'disability', label: 'Person with Disability' }, { value: 'underrepresented', label: 'Underrepresented Group' }] },
  { id: 'matchScore', label: 'Min Match Score', type: 'range', group: 'Scoring', min: 0, max: 100, step: 5 },
  { id: 'lastActive', label: 'Last Active', type: 'single-select', group: 'Activity', options: [{ value: '24h', label: 'Last 24h' }, { value: '7d', label: 'Last 7 days' }, { value: '30d', label: 'Last 30 days' }, { value: '90d', label: 'Last 90 days' }] },
  { id: 'hasPortfolio', label: 'Has Portfolio', type: 'toggle', group: 'Profile' },
  { id: 'hasReferences', label: 'Has References', type: 'toggle', group: 'Profile' },
  { id: 'profileComplete', label: 'Profile Completeness', type: 'single-select', group: 'Profile', options: [{ value: '90+', label: '90%+ Complete' }, { value: '70-89', label: '70-89%' }, { value: '50-69', label: '50-69%' }, { value: '<50', label: '<50%' }] },
  { id: 'platforms', label: 'Platform Activity', type: 'multi-select', group: 'Activity', options: [{ value: 'github', label: 'GitHub' }, { value: 'stackoverflow', label: 'Stack Overflow' }, { value: 'medium', label: 'Medium / Blog' }, { value: 'speaker', label: 'Conference Speaker' }] },
  { id: 'companySize', label: 'Current Company Size', type: 'multi-select', group: 'Position', options: [{ value: 'startup', label: 'Startup (1-50)' }, { value: 'smb', label: 'SMB (51-200)' }, { value: 'mid', label: 'Mid-Market (201-1K)' }, { value: 'enterprise', label: 'Enterprise (1K+)' }] },
];

export const ENTERPRISE_DIRECTORY_FILTERS: FilterDefinition[] = [
  { id: 'sector', label: 'Sector', type: 'multi-select', group: 'Organization', options: [{ value: 'technology', label: 'Technology' }, { value: 'healthcare', label: 'Healthcare' }, { value: 'finance', label: 'Finance' }, { value: 'energy', label: 'Energy' }, { value: 'cloud', label: 'Cloud' }, { value: 'data', label: 'Data' }, { value: 'manufacturing', label: 'Manufacturing' }, { value: 'retail', label: 'Retail' }] },
  { id: 'region', label: 'Region', type: 'multi-select', group: 'Geography', options: [{ value: 'na', label: 'North America' }, { value: 'eu', label: 'Europe' }, { value: 'apac', label: 'Asia Pacific' }, { value: 'latam', label: 'Latin America' }, { value: 'mea', label: 'Middle East & Africa' }] },
  { id: 'size', label: 'Organization Size', type: 'multi-select', group: 'Organization', options: [{ value: '1-100', label: '1-100' }, { value: '100-500', label: '100-500' }, { value: '500-1k', label: '500-1,000' }, { value: '1k-5k', label: '1,000-5,000' }, { value: '5k-10k', label: '5,000-10,000' }, { value: '10k+', label: '10,000+' }] },
  { id: 'trustTier', label: 'Trust Tier', type: 'multi-select', group: 'Trust', options: [{ value: 'platinum', label: 'Platinum' }, { value: 'gold', label: 'Gold' }, { value: 'silver', label: 'Silver' }, { value: 'verified', label: 'Verified' }, { value: 'new', label: 'New' }] },
  { id: 'trustScore', label: 'Min Trust Score', type: 'range', group: 'Trust', min: 0, max: 100, step: 5 },
  { id: 'buyerReady', label: 'Buyer Ready', type: 'toggle', group: 'Procurement' },
  { id: 'verified', label: 'Verified Only', type: 'toggle', group: 'Trust' },
  { id: 'partnerOpen', label: 'Partnership Open', type: 'toggle', group: 'Partnerships' },
  { id: 'recentlyActive', label: 'Recently Active', type: 'toggle', group: 'Activity' },
  { id: 'services', label: 'Services Offered', type: 'multi-select', group: 'Capabilities', options: [{ value: 'cloud-infra', label: 'Cloud Infrastructure' }, { value: 'ai-ml', label: 'AI/ML' }, { value: 'devops', label: 'DevOps' }, { value: 'consulting', label: 'Consulting' }, { value: 'integration', label: 'Integration' }, { value: 'health-tech', label: 'Health Tech' }, { value: 'compliance', label: 'Compliance' }, { value: 'banking-api', label: 'Banking API' }] },
  { id: 'founded', label: 'Founded Year', type: 'range', group: 'Organization', min: 1990, max: 2026, step: 1 },
  { id: 'minPartnerships', label: 'Min Partnerships', type: 'range', group: 'Partnerships', min: 0, max: 50, step: 1 },
  { id: 'minConnections', label: 'Min Connections', type: 'range', group: 'Network', min: 0, max: 500, step: 10 },
  { id: 'procurementActive', label: 'Has Active RFPs', type: 'toggle', group: 'Procurement' },
  { id: 'countriesOperating', label: 'Countries Operating', type: 'multi-select', group: 'Geography', options: [{ value: 'us', label: 'United States' }, { value: 'uk', label: 'United Kingdom' }, { value: 'de', label: 'Germany' }, { value: 'fr', label: 'France' }, { value: 'in', label: 'India' }, { value: 'au', label: 'Australia' }, { value: 'jp', label: 'Japan' }, { value: 'sg', label: 'Singapore' }] },
  { id: 'compliance', label: 'Compliance Certs', type: 'multi-select', group: 'Trust', options: [{ value: 'soc2', label: 'SOC 2' }, { value: 'iso27001', label: 'ISO 27001' }, { value: 'gdpr', label: 'GDPR' }, { value: 'hipaa', label: 'HIPAA' }] },
];

export const EXPLORE_PEOPLE_FILTERS: FilterDefinition[] = [
  { id: 'industry', label: 'Industry', type: 'multi-select', group: 'Professional', options: [{ value: 'tech', label: 'Technology' }, { value: 'design', label: 'Design' }, { value: 'marketing', label: 'Marketing' }, { value: 'finance', label: 'Finance' }, { value: 'healthcare', label: 'Healthcare' }, { value: 'education', label: 'Education' }] },
  { id: 'location', label: 'Location', type: 'multi-select', group: 'Geography', options: [{ value: 'remote', label: 'Remote' }, { value: 'us', label: 'United States' }, { value: 'uk', label: 'United Kingdom' }, { value: 'eu', label: 'Europe' }, { value: 'apac', label: 'Asia Pacific' }] },
  { id: 'experience', label: 'Experience Level', type: 'single-select', group: 'Professional', options: [{ value: 'entry', label: 'Entry (0-2 yrs)' }, { value: 'mid', label: 'Mid (3-5 yrs)' }, { value: 'senior', label: 'Senior (6-10 yrs)' }, { value: 'expert', label: 'Expert (10+ yrs)' }] },
  { id: 'skills', label: 'Skills', type: 'multi-select', group: 'Skills', options: [{ value: 'product', label: 'Product Strategy' }, { value: 'ux', label: 'UX Design' }, { value: 'engineering', label: 'Engineering' }, { value: 'data', label: 'Data Science' }, { value: 'marketing', label: 'Marketing' }, { value: 'leadership', label: 'Leadership' }] },
  { id: 'availability', label: 'Availability', type: 'single-select', group: 'Status', options: [{ value: 'available', label: 'Available Now' }, { value: 'open', label: 'Open to Connect' }, { value: 'mentor', label: 'Mentoring' }, { value: 'hiring', label: 'Hiring' }] },
  { id: 'rating', label: 'Min Rating', type: 'range', group: 'Reputation', min: 1, max: 5, step: 0.1 },
  { id: 'mutual', label: 'Has Mutual Connections', type: 'toggle', group: 'Network' },
  { id: 'verified', label: 'Verified Profile', type: 'toggle', group: 'Trust' },
  { id: 'connectionDegree', label: 'Connection Degree', type: 'single-select', group: 'Network', options: [{ value: '1st', label: '1st Degree' }, { value: '2nd', label: '2nd Degree' }, { value: '3rd+', label: '3rd+ Degree' }] },
  { id: 'company', label: 'Company', type: 'text', group: 'Professional' },
];

export const EXPLORE_GIGS_FILTERS: FilterDefinition[] = [
  { id: 'category', label: 'Category', type: 'multi-select', group: 'Service', options: [{ value: 'design', label: 'Design' }, { value: 'development', label: 'Development' }, { value: 'writing', label: 'Writing' }, { value: 'video', label: 'Video & Animation' }, { value: 'marketing', label: 'Marketing' }, { value: 'music', label: 'Music & Audio' }, { value: 'business', label: 'Business' }, { value: 'ai', label: 'AI Services' }] },
  { id: 'priceRange', label: 'Price Range', type: 'range', group: 'Pricing', min: 5, max: 1000, step: 5, unit: '$' },
  { id: 'delivery', label: 'Delivery Time', type: 'single-select', group: 'Timing', options: [{ value: '24h', label: '24 Hours' }, { value: '3d', label: 'Up to 3 Days' }, { value: '7d', label: 'Up to 7 Days' }, { value: '14d', label: 'Up to 14 Days' }, { value: 'any', label: 'Any' }] },
  { id: 'sellerLevel', label: 'Seller Level', type: 'multi-select', group: 'Seller', options: [{ value: 'top', label: 'Top Rated' }, { value: 'level-2', label: 'Level 2' }, { value: 'level-1', label: 'Level 1' }, { value: 'new', label: 'New Seller' }] },
  { id: 'rating', label: 'Min Rating', type: 'range', group: 'Quality', min: 1, max: 5, step: 0.1 },
  { id: 'revisions', label: 'Includes Revisions', type: 'toggle', group: 'Service' },
  { id: 'format', label: 'Output Format', type: 'multi-select', group: 'Service', options: [{ value: 'digital', label: 'Digital File' }, { value: 'physical', label: 'Physical Product' }, { value: 'service', label: 'Service' }, { value: 'consultation', label: 'Consultation' }] },
  { id: 'location', label: 'Seller Location', type: 'multi-select', group: 'Geography', options: [{ value: 'us', label: 'United States' }, { value: 'uk', label: 'UK' }, { value: 'eu', label: 'Europe' }, { value: 'apac', label: 'Asia' }] },
  { id: 'language', label: 'Language', type: 'multi-select', group: 'Communication', options: [{ value: 'en', label: 'English' }, { value: 'es', label: 'Spanish' }, { value: 'fr', label: 'French' }, { value: 'de', label: 'German' }] },
  { id: 'trending', label: 'Trending Only', type: 'toggle', group: 'Discovery' },
];

export const EXPLORE_JOBS_FILTERS: FilterDefinition[] = [
  { id: 'type', label: 'Job Type', type: 'multi-select', group: 'Position', options: [{ value: 'full-time', label: 'Full-Time' }, { value: 'part-time', label: 'Part-Time' }, { value: 'contract', label: 'Contract' }, { value: 'freelance', label: 'Freelance' }, { value: 'internship', label: 'Internship' }] },
  { id: 'remote', label: 'Remote Policy', type: 'single-select', group: 'Work Style', options: [{ value: 'remote', label: 'Remote' }, { value: 'hybrid', label: 'Hybrid' }, { value: 'onsite', label: 'On-Site' }] },
  { id: 'experience', label: 'Experience Level', type: 'single-select', group: 'Position', options: [{ value: 'entry', label: 'Entry Level' }, { value: 'mid', label: 'Mid Level' }, { value: 'senior', label: 'Senior' }, { value: 'lead', label: 'Lead / Principal' }, { value: 'director', label: 'Director+' }] },
  { id: 'salary', label: 'Salary Range', type: 'range', group: 'Compensation', min: 30, max: 500, step: 10, unit: 'K$' },
  { id: 'industry', label: 'Industry', type: 'multi-select', group: 'Company', options: [{ value: 'tech', label: 'Technology' }, { value: 'finance', label: 'Finance' }, { value: 'healthcare', label: 'Healthcare' }, { value: 'ecommerce', label: 'E-Commerce' }, { value: 'education', label: 'Education' }] },
  { id: 'companySize', label: 'Company Size', type: 'multi-select', group: 'Company', options: [{ value: 'startup', label: 'Startup' }, { value: 'smb', label: 'SMB' }, { value: 'mid', label: 'Mid-Market' }, { value: 'enterprise', label: 'Enterprise' }] },
  { id: 'location', label: 'Location', type: 'multi-select', group: 'Geography', options: [{ value: 'us', label: 'United States' }, { value: 'uk', label: 'United Kingdom' }, { value: 'eu', label: 'Europe' }, { value: 'apac', label: 'Asia' }, { value: 'remote', label: 'Anywhere' }] },
  { id: 'posted', label: 'Date Posted', type: 'single-select', group: 'Timing', options: [{ value: '24h', label: 'Last 24h' }, { value: '7d', label: 'Last 7 days' }, { value: '30d', label: 'Last 30 days' }] },
  { id: 'benefits', label: 'Benefits', type: 'multi-select', group: 'Compensation', options: [{ value: 'equity', label: 'Equity' }, { value: 'health', label: 'Health Insurance' }, { value: '401k', label: '401K' }, { value: 'unlimited-pto', label: 'Unlimited PTO' }, { value: 'parental', label: 'Parental Leave' }] },
  { id: 'visa', label: 'Visa Sponsorship', type: 'toggle', group: 'Requirements' },
];
