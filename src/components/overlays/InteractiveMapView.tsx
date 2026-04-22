import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MapPin, Search, List, Grid, ZoomIn, ZoomOut,
  Navigation, Star, ChevronRight, Eye,
  Briefcase, Calendar, Megaphone, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ══════════════════════════════════════════════
   Interactive Map View Component
   ══════════════════════════════════════════════
   CSS-based map visualization with pins, clusters,
   list/grid toggle, filters, and preview cards.
   Supports: ads, events, services, networking, 
   and geo-targeted explorer results.
   ══════════════════════════════════════════════ */

export type MapPinType = 'event' | 'service' | 'ad' | 'person' | 'gig' | 'venue';

export interface MapPin_ {
  id: string;
  type: MapPinType;
  title: string;
  subtitle?: string;
  lat: number;
  lng: number;
  rating?: number;
  price?: string;
  status?: 'live' | 'upcoming' | 'featured' | 'promoted';
  tags?: string[];
  avatar?: string;
  distance?: string;
}

interface InteractiveMapViewProps {
  pins: MapPin_[];
  title?: string;
  onPinClick?: (pin: MapPin_) => void;
  onPinPreview?: (pin: MapPin_) => void;
  className?: string;
  initialView?: 'map' | 'list' | 'grid';
  filters?: Array<{ id: string; label: string; count: number }>;
}

const PIN_COLORS: Record<MapPinType, string> = {
  event: 'bg-[hsl(var(--state-caution))] text-white',
  service: 'bg-[hsl(var(--gigvora-teal))] text-white',
  ad: 'bg-accent text-white',
  person: 'bg-primary text-white',
  gig: 'bg-[hsl(var(--state-healthy))] text-white',
  venue: 'bg-[hsl(var(--gigvora-purple))] text-white',
};

const PIN_SOFT: Record<MapPinType, string> = {
  event: 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]',
  service: 'bg-[hsl(var(--gigvora-teal)/0.1)] text-[hsl(var(--gigvora-teal))]',
  ad: 'bg-accent/10 text-accent',
  person: 'bg-primary/10 text-primary',
  gig: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
  venue: 'bg-[hsl(var(--gigvora-purple)/0.1)] text-[hsl(var(--gigvora-purple))]',
};

const PIN_ICONS: Record<MapPinType, React.ElementType> = {
  event: Calendar,
  service: Star,
  ad: Megaphone,
  person: Users,
  gig: Briefcase,
  venue: MapPin,
};

const STATUS_BADGES: Record<string, string> = {
  live: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
  upcoming: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]',
  featured: 'bg-accent/10 text-accent',
  promoted: 'bg-[hsl(var(--gigvora-purple)/0.1)] text-[hsl(var(--gigvora-purple))]',
};

export const InteractiveMapView: React.FC<InteractiveMapViewProps> = ({
  pins, title = 'Map Explorer', onPinClick, onPinPreview, className,
  initialView = 'map', filters,
}) => {
  const [view, setView] = useState(initialView);
  const [search, setSearch] = useState('');
  const [selectedPin, setSelectedPin] = useState<MapPin_ | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);

  const filtered = useMemo(() => {
    return pins.filter(p => {
      if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (activeFilters.length > 0 && !activeFilters.includes(p.type)) return false;
      return true;
    });
  }, [pins, search, activeFilters]);

  const toggleFilter = (id: string) => {
    setActiveFilters(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const handlePinClick = (pin: MapPin_) => {
    setSelectedPin(pin);
    onPinClick?.(pin);
  };

  // Normalize pin positions to viewport (0-100 range)
  const normalizePos = (pin: MapPin_) => {
    const allLats = pins.map(p => p.lat);
    const allLngs = pins.map(p => p.lng);
    const minLat = Math.min(...allLats), maxLat = Math.max(...allLats);
    const minLng = Math.min(...allLngs), maxLng = Math.max(...allLngs);
    const padLat = (maxLat - minLat) * 0.1 || 1;
    const padLng = (maxLng - minLng) * 0.1 || 1;
    return {
      x: ((pin.lng - minLng + padLng) / (maxLng - minLng + 2 * padLng)) * 100,
      y: 100 - ((pin.lat - minLat + padLat) / (maxLat - minLat + 2 * padLat)) * 100,
    };
  };

  return (
    <div className={cn('rounded-2xl border bg-card overflow-hidden flex flex-col', className)}>
      {/* ═══ Toolbar ═══ */}
      <div className="p-3 border-b flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 mr-auto">
          <MapPin className="h-4 w-4 text-accent" />
          <span className="text-[11px] font-bold">{title}</span>
          <Badge variant="outline" className="text-[7px] h-4">{filtered.length}</Badge>
        </div>

        <div className="relative flex-1 min-w-[140px] max-w-[240px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search locations..."
            className="pl-8 h-7 text-[9px] rounded-lg"
          />
        </div>

        <div className="flex items-center gap-0.5 rounded-lg border p-0.5">
          {([['map', MapPin], ['list', List], ['grid', Grid]] as const).map(([v, Icon]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn('p-1 rounded-md transition-colors', view === v ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:text-foreground')}
            >
              <Icon className="h-3 w-3" />
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Filter chips ═══ */}
      {filters && (
        <div className="px-3 py-2 border-b flex gap-1 overflow-x-auto">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => toggleFilter(f.id)}
              className={cn(
                'px-2 py-0.5 rounded-lg text-[7px] font-semibold whitespace-nowrap transition-all',
                activeFilters.includes(f.id) ? 'bg-accent/10 text-accent' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
              )}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      )}

      {/* ═══ Map View ═══ */}
      {view === 'map' && (
        <div className="relative flex-1 min-h-[400px] bg-muted/10">
          {/* Map background pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          }} />

          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: `${80 * zoom}px ${80 * zoom}px`,
          }} />

          {/* Pins */}
          {filtered.map(pin => {
            const pos = normalizePos(pin);
            const PinIcon = PIN_ICONS[pin.type];
            const isSelected = selectedPin?.id === pin.id;
            return (
              <button
                key={pin.id}
                onClick={() => handlePinClick(pin)}
                className={cn(
                  'absolute transform -translate-x-1/2 -translate-y-full transition-all duration-200 z-10',
                  isSelected && 'z-20 scale-125',
                )}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                <div className={cn(
                  'flex flex-col items-center',
                  isSelected && 'animate-bounce',
                )}>
                  <div className={cn(
                    'h-7 w-7 rounded-full flex items-center justify-center shadow-md ring-2 ring-card transition-all',
                    PIN_COLORS[pin.type],
                    isSelected && 'ring-accent h-8 w-8',
                  )}>
                    <PinIcon className="h-3 w-3" />
                  </div>
                  <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent" style={{
                    borderTopColor: `hsl(var(${pin.type === 'event' ? '--state-caution' : pin.type === 'service' ? '--gigvora-teal' : pin.type === 'gig' ? '--state-healthy' : '--accent'}))`,
                  }} />
                </div>
                {isSelected && (
                  <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 w-40 rounded-xl border bg-card p-2 shadow-lg text-left">
                    <div className="text-[9px] font-bold truncate">{pin.title}</div>
                    {pin.subtitle && <div className="text-[7px] text-muted-foreground truncate">{pin.subtitle}</div>}
                    <div className="flex items-center gap-1.5 mt-1">
                      {pin.rating && <span className="text-[7px] flex items-center gap-0.5"><Star className="h-2 w-2 fill-[hsl(var(--gigvora-amber))] text-[hsl(var(--gigvora-amber))]" />{pin.rating}</span>}
                      {pin.price && <span className="text-[7px] font-semibold text-accent">{pin.price}</span>}
                      {pin.distance && <span className="text-[7px] text-muted-foreground">{pin.distance}</span>}
                    </div>
                    <Button size="sm" className="w-full h-5 text-[7px] rounded-md mt-1.5 gap-0.5" onClick={() => onPinPreview?.(pin)}>
                      <Eye className="h-2 w-2" />Preview
                    </Button>
                  </div>
                )}
              </button>
            );
          })}

          {/* Zoom controls */}
          <div className="absolute bottom-3 right-3 flex flex-col gap-1">
            <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="h-7 w-7 rounded-lg bg-card border flex items-center justify-center hover:bg-muted/50 transition-colors shadow-sm">
              <ZoomIn className="h-3 w-3" />
            </button>
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="h-7 w-7 rounded-lg bg-card border flex items-center justify-center hover:bg-muted/50 transition-colors shadow-sm">
              <ZoomOut className="h-3 w-3" />
            </button>
            <button onClick={() => { setZoom(1); setSelectedPin(null); }} className="h-7 w-7 rounded-lg bg-card border flex items-center justify-center hover:bg-muted/50 transition-colors shadow-sm">
              <Navigation className="h-3 w-3" />
            </button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 rounded-xl border bg-card/95 p-2 backdrop-blur-sm">
            <div className="text-[7px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Legend</div>
            <div className="flex flex-wrap gap-1.5">
              {(Object.entries(PIN_COLORS) as [MapPinType, string][]).map(([type, color]) => {
                const Icon = PIN_ICONS[type];
                return (
                  <span key={type} className="flex items-center gap-0.5 text-[7px]">
                    <div className={cn('h-3 w-3 rounded-full flex items-center justify-center', color)}>
                      <Icon className="h-1.5 w-1.5" />
                    </div>
                    <span className="capitalize text-muted-foreground">{type}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ List View ═══ */}
      {view === 'list' && (
        <ScrollArea className="flex-1 min-h-[400px]">
          <div className="p-2 space-y-1">
            {filtered.map(pin => {
              const PinIcon = PIN_ICONS[pin.type];
              return (
                <button
                  key={pin.id}
                  onClick={() => handlePinClick(pin)}
                  className={cn(
                    'w-full flex items-center gap-2.5 p-2.5 rounded-xl border hover:bg-muted/20 transition-all text-left group',
                    selectedPin?.id === pin.id && 'bg-accent/5 border-accent/20',
                  )}
                >
                  <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', PIN_SOFT[pin.type])}>
                    <PinIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold truncate">{pin.title}</span>
                      {pin.status && <Badge className={cn('text-[6px] h-3 border-0 capitalize', STATUS_BADGES[pin.status])}>{pin.status}</Badge>}
                    </div>
                    {pin.subtitle && <div className="text-[8px] text-muted-foreground truncate">{pin.subtitle}</div>}
                    <div className="flex items-center gap-2 mt-0.5 text-[7px] text-muted-foreground">
                      {pin.distance && <span>{pin.distance}</span>}
                      {pin.rating && <span className="flex items-center gap-0.5"><Star className="h-2 w-2 fill-[hsl(var(--gigvora-amber))] text-[hsl(var(--gigvora-amber))]" />{pin.rating}</span>}
                      {pin.price && <span className="font-semibold text-foreground">{pin.price}</span>}
                    </div>
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-accent transition-colors shrink-0" />
                </button>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* ═══ Grid View ═══ */}
      {view === 'grid' && (
        <ScrollArea className="flex-1 min-h-[400px]">
          <div className="p-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filtered.map(pin => {
              const PinIcon = PIN_ICONS[pin.type];
              return (
                <button
                  key={pin.id}
                  onClick={() => handlePinClick(pin)}
                  className="rounded-xl border bg-card p-3 hover:shadow-sm transition-all text-left group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center', PIN_SOFT[pin.type])}>
                      <PinIcon className="h-3 w-3" />
                    </div>
                    {pin.status && <Badge className={cn('text-[6px] h-3 border-0 capitalize ml-auto', STATUS_BADGES[pin.status])}>{pin.status}</Badge>}
                  </div>
                  <div className="text-[9px] font-semibold truncate">{pin.title}</div>
                  {pin.subtitle && <div className="text-[7px] text-muted-foreground truncate mt-0.5">{pin.subtitle}</div>}
                  <div className="flex items-center gap-2 mt-1.5 text-[7px] text-muted-foreground">
                    {pin.distance && <span className="flex items-center gap-0.5"><MapPin className="h-2 w-2" />{pin.distance}</span>}
                    {pin.rating && <span className="flex items-center gap-0.5"><Star className="h-2 w-2 fill-[hsl(var(--gigvora-amber))] text-[hsl(var(--gigvora-amber))]" />{pin.rating}</span>}
                    {pin.price && <span className="font-semibold text-foreground">{pin.price}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
