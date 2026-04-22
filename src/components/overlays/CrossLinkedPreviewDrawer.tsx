import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  X, ChevronLeft, ExternalLink, ArrowLeftRight,
  MapPin, Star, Shield, MessageSquare, FileText, Send,
  ArrowRight, Users, Briefcase, Pin, PinOff, Layers,
  Calendar, DollarSign, Link as LinkIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { type OverlayEntity, type OverlayEntityType } from './OverlayContext';

/* ══════════════════════════════════════════════
   Cross-Linked Preview Drawer
   ══════════════════════════════════════════════
   A rich preview panel with:
   - Entity navigation stack (breadcrumb back)
   - Linked entity cards for cross-navigation
   - Follow-through action buttons
   - Compare mode integration
   - Activity timeline
   - Pin/detach to pop-out
   ══════════════════════════════════════════════ */

const TYPE_COLORS: Record<string, string> = {
  person: 'bg-accent/10 text-accent',
  company: 'bg-[hsl(var(--gigvora-purple)/0.1)] text-[hsl(var(--gigvora-purple))]',
  gig: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
  service: 'bg-[hsl(var(--gigvora-teal)/0.1)] text-[hsl(var(--gigvora-teal))]',
  job: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]',
  project: 'bg-primary/10 text-primary',
  event: 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]',
  group: 'bg-muted text-muted-foreground',
  order: 'bg-primary/10 text-primary',
  dispute: 'bg-destructive/10 text-destructive',
  ticket: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]',
  creator: 'bg-accent/10 text-accent',
  proposal: 'bg-[hsl(var(--gigvora-teal)/0.1)] text-[hsl(var(--gigvora-teal))]',
  lead: 'bg-[hsl(var(--gigvora-blue)/0.1)] text-[hsl(var(--gigvora-blue))]',
  candidate: 'bg-primary/10 text-primary',
  account: 'bg-muted text-muted-foreground',
};

const TYPE_ICONS: Partial<Record<OverlayEntityType, React.ElementType>> = {
  person: Users, company: Briefcase, gig: Star, project: Layers,
  job: Briefcase, order: DollarSign, dispute: FileText,
  event: Calendar, service: Star, creator: Star,
};

const STATUS_COLORS: Record<string, string> = {
  healthy: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
  caution: 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]',
  blocked: 'bg-[hsl(var(--state-blocked)/0.1)] text-[hsl(var(--state-blocked))]',
  premium: 'bg-[hsl(var(--state-premium)/0.1)] text-[hsl(var(--state-premium))]',
  live: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
  pending: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]',
};

interface CrossLinkedPreviewDrawerProps {
  open: boolean;
  onClose: () => void;
  entity: OverlayEntity | null;
  // Stack navigation
  stackDepth?: number;
  onBack?: () => void;
  // Cross-linking
  onEntityClick?: (entity: OverlayEntity) => void;
  onCompareToggle?: (entity: OverlayEntity) => void;
  isInCompare?: boolean;
  // Follow-through
  followThroughActions?: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  }>;
  // Pop-out
  onDetach?: () => void;
  pinned?: boolean;
  onPinToggle?: () => void;
}

export const CrossLinkedPreviewDrawer: React.FC<CrossLinkedPreviewDrawerProps> = ({
  open, onClose, entity, stackDepth = 0, onBack,
  onEntityClick, onCompareToggle, isInCompare,
  followThroughActions, onDetach, pinned, onPinToggle,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [noteText, setNoteText] = useState('');

  if (!open || !entity) return null;

  const initials = entity.title.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  

  return (
    <div className={cn('fixed inset-0 z-50 flex justify-end', pinned && 'pointer-events-none')} onClick={pinned ? undefined : onClose}>
      {!pinned && <div className="absolute inset-0 bg-background/50 backdrop-blur-sm" />}
      <div
        className={cn(
          'relative w-full max-w-md bg-card shadow-elevated border-l flex flex-col animate-in slide-in-from-right-8 duration-300 pointer-events-auto',
          !pinned && 'sm:rounded-l-3xl',
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* ═══ Header ═══ */}
        <div className="px-4 py-3 border-b shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              {stackDepth > 0 && onBack && (
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl" onClick={onBack}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
              )}
              {stackDepth > 0 && (
                <Badge variant="outline" className="text-[7px] h-4 rounded-md">
                  depth {stackDepth + 1}
                </Badge>
              )}
              <Badge className={cn('text-[7px] h-4 border-0 rounded-md capitalize', TYPE_COLORS[entity.type])}>
                {entity.type}
              </Badge>
              {entity.statusColor && (
                <Badge className={cn('text-[7px] h-4 border-0 rounded-md', STATUS_COLORS[entity.statusColor])}>
                  {entity.status || entity.statusColor}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              {onCompareToggle && (
                <Button variant="ghost" size="sm" className={cn('h-7 w-7 p-0 rounded-xl', isInCompare && 'text-accent bg-accent/10')} onClick={() => onCompareToggle(entity)}>
                  <ArrowLeftRight className="h-3 w-3" />
                </Button>
              )}
              {onPinToggle && (
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl" onClick={onPinToggle}>
                  {pinned ? <PinOff className="h-3 w-3 text-accent" /> : <Pin className="h-3 w-3" />}
                </Button>
              )}
              {onDetach && (
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl" onClick={onDetach}>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
              <button onClick={onClose} className="h-7 w-7 rounded-xl flex items-center justify-center hover:bg-muted transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Entity header */}
          <div className="flex items-start gap-3">
            <Avatar className="h-11 w-11 rounded-2xl ring-1 ring-border">
              <AvatarImage src={entity.avatar} className="rounded-2xl" />
              <AvatarFallback className={cn('rounded-2xl text-[10px] font-bold', TYPE_COLORS[entity.type])}>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold truncate">{entity.title}</h3>
                {entity.verified && <Shield className="h-3 w-3 text-accent shrink-0" />}
              </div>
              {entity.subtitle && <p className="text-[9px] text-muted-foreground truncate">{entity.subtitle}</p>}
              <div className="flex items-center gap-2 mt-1 text-[8px] text-muted-foreground">
                {entity.location && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{entity.location}</span>}
                {entity.rating && (
                  <span className="flex items-center gap-0.5">
                    <Star className="h-2.5 w-2.5 fill-[hsl(var(--gigvora-amber))] text-[hsl(var(--gigvora-amber))]" />
                    <span className="font-medium text-foreground">{entity.rating}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Tabs ═══ */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-4 border-b shrink-0">
            <TabsList className="h-8 bg-transparent p-0 gap-4">
              <TabsTrigger value="overview" className="text-[9px] h-8 px-0 pb-1.5 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none">Overview</TabsTrigger>
              <TabsTrigger value="linked" className="text-[9px] h-8 px-0 pb-1.5 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none gap-1">
                <LinkIcon className="h-2.5 w-2.5" />Linked
                {entity.linkedEntities && <Badge variant="outline" className="text-[6px] h-3 rounded-md">{entity.linkedEntities.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-[9px] h-8 px-0 pb-1.5 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none">Activity</TabsTrigger>
              <TabsTrigger value="notes" className="text-[9px] h-8 px-0 pb-1.5 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none">Notes</TabsTrigger>
            </TabsList>
          </div>

          {/* Overview */}
          <TabsContent value="overview" className="flex-1 overflow-y-auto mt-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                {entity.description && (
                  <div className="rounded-2xl bg-muted/20 p-3 border">
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{entity.description}</p>
                  </div>
                )}

                {entity.meta && Object.keys(entity.meta).length > 0 && (
                  <div className="rounded-2xl border overflow-hidden">
                    {Object.entries(entity.meta).map(([key, val], i) => (
                      <div key={key} className={cn('flex items-center justify-between px-3 py-2', i > 0 && 'border-t')}>
                        <span className="text-[8px] text-muted-foreground uppercase tracking-wider">{key}</span>
                        <span className="text-[9px] font-semibold">{val}</span>
                      </div>
                    ))}
                  </div>
                )}

                {entity.tags && entity.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {entity.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-[7px] h-4 rounded-lg">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Linked entities — cross-navigation */}
          <TabsContent value="linked" className="flex-1 overflow-y-auto mt-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-1.5">
                {entity.linkedEntities && entity.linkedEntities.length > 0 ? (
                  entity.linkedEntities.map(linked => {
                    const LIcon = TYPE_ICONS[linked.type];
                    return (
                      <button
                        key={linked.id}
                        onClick={() => onEntityClick?.({
                          id: linked.id, type: linked.type, title: linked.label,
                          subtitle: `${linked.type} · ${linked.id}`,
                        })}
                        className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border hover:bg-muted/30 transition-all text-left group"
                      >
                        <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', TYPE_COLORS[linked.type])}>
                          {LIcon ? <LIcon className="h-3.5 w-3.5" /> : <Layers className="h-3.5 w-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[9px] font-semibold truncate">{linked.label}</div>
                          <div className="text-[7px] text-muted-foreground capitalize">{linked.type} · {linked.id}</div>
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-accent transition-colors shrink-0" />
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <LinkIcon className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-[10px] text-muted-foreground">No linked entities</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Activity timeline */}
          <TabsContent value="activity" className="flex-1 overflow-y-auto mt-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-0">
                {[
                  { actor: 'System', action: 'Entity created', time: '3d ago' },
                  { actor: 'Alex R.', action: 'Updated status', time: '2d ago' },
                  { actor: 'System', action: 'Verification completed', time: '1d ago' },
                  { actor: 'You', action: 'Viewed profile', time: '2h ago' },
                ].map((entry, i, arr) => (
                  <div key={i} className="flex gap-2.5">
                    <div className="flex flex-col items-center">
                      <div className={cn('h-2.5 w-2.5 rounded-full mt-1.5 ring-2 ring-card', i === 0 ? 'bg-accent' : 'bg-muted-foreground/25')} />
                      {i < arr.length - 1 && <div className="flex-1 w-px bg-border/50" />}
                    </div>
                    <div className="pb-3">
                      <div className="text-[9px]">
                        <span className="font-semibold">{entry.actor}</span> <span className="text-muted-foreground">{entry.action}</span>
                      </div>
                      <div className="text-[7px] text-muted-foreground">{entry.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Notes */}
          <TabsContent value="notes" className="flex-1 overflow-y-auto mt-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                <div className="text-center py-6 mb-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground/20 mx-auto mb-1.5" />
                  <p className="text-[9px] text-muted-foreground">No notes yet</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="Add a note..."
                    className="flex-1 h-8 rounded-xl border bg-muted/20 px-3 text-[10px] focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                  <Button size="sm" className="h-8 w-8 p-0 rounded-xl" disabled={!noteText.trim()}>
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* ═══ Footer ═══ */}
        <div className="border-t px-4 py-3 space-y-2 shrink-0">
          {entity.detailPath && (
            <Button className="w-full text-[10px] h-8 gap-1.5 rounded-xl" asChild>
              <Link to={entity.detailPath}>
                <ExternalLink className="h-3 w-3" />View Full Details
                <ArrowRight className="h-3 w-3 ml-auto" />
              </Link>
            </Button>
          )}
          {followThroughActions && followThroughActions.length > 0 && (
            <div className="flex gap-1.5">
              {followThroughActions.map(action => (
                <Button
                  key={action.id}
                  variant={(action.variant as 'default' | 'outline' | 'ghost') || 'outline'}
                  size="sm"
                  className="flex-1 text-[8px] h-7 rounded-xl gap-1"
                  onClick={action.onClick}
                >
                  {action.icon}{action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
