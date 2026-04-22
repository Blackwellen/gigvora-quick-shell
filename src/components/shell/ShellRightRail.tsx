import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock, Star, Pin, X, ChevronRight, Building2,
  Briefcase, FileText, Layers, Users, MessageSquare,
  Activity, Bookmark, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useRole } from '@/contexts/RoleContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const TYPE_ICONS: Record<string, React.ElementType> = {
  page: FileText,
  profile: Users,
  project: FileText,
  job: Briefcase,
  gig: Layers,
  message: MessageSquare,
};

const SUGGESTIONS = [
  { label: 'Complete your profile', description: 'Add skills and experience', route: '/profile', priority: 'high' as const },
  { label: 'Set up notifications', description: 'Customize your alerts', route: '/settings', priority: 'medium' as const },
  { label: 'Explore trending gigs', description: '12 new gigs match your skills', route: '/gigs', priority: 'low' as const },
];

export const ShellRightRail: React.FC = () => {
  const { recentItems, savedViews, togglePinView, removeSavedView, activeOrg, rightRailOpen, setRightRailOpen } = useWorkspace();

  if (!rightRailOpen) return null;

  return (
    <aside className="hidden xl:flex flex-col w-72 border-l bg-sidebar/60 backdrop-blur-sm shrink-0 ml-1"
      style={{ height: 'calc(100vh - var(--topbar-height) - var(--megamenu-height))' }}
    >
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Organization context */}
          {activeOrg && (
            <div className="rounded-2xl border bg-card/80 p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">{activeOrg.name}</div>
                  <div className="text-[10px] text-muted-foreground">{activeOrg.role}</div>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Activity className="h-3 w-3" /> Suggestions
              </span>
            </div>
            <div className="space-y-1.5">
              {SUGGESTIONS.map((s, i) => (
                <Link
                  key={i}
                  to={s.route}
                  className="block rounded-2xl border bg-card/80 p-2.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium group-hover:text-accent transition-colors">{s.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{s.description}</div>
                    </div>
                    <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
                  </div>
                  {s.priority === 'high' && (
                    <div className="mt-1.5">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-state-caution/10 text-[hsl(var(--state-caution))] font-medium">
                        Recommended
                      </span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>

          <Separator />

          {/* Saved views */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Bookmark className="h-3 w-3" /> Saved Views
              </span>
              <span className="text-[10px] text-muted-foreground">{savedViews.length}</span>
            </div>
            <div className="space-y-0.5">
              {savedViews.map(view => (
                <div key={view.id} className="flex items-center gap-1.5 group">
                  <Link
                    to={view.route}
                    className="flex-1 flex items-center gap-2 px-2 py-1.5 rounded-xl text-[11px] hover:bg-muted/50 transition-colors truncate"
                  >
                    <Star className={cn('h-3 w-3 shrink-0 transition-colors', view.pinned ? 'text-accent fill-accent' : 'text-muted-foreground')} />
                    <span className="truncate">{view.label}</span>
                  </Link>
                  <button
                    onClick={() => togglePinView(view.id)}
                    className="p-1 rounded-lg hover:bg-muted/50 opacity-0 group-hover:opacity-100 transition-all duration-200"
                  >
                    <Pin className={cn('h-2.5 w-2.5', view.pinned ? 'text-accent' : 'text-muted-foreground')} />
                  </button>
                  <button
                    onClick={() => removeSavedView(view.id)}
                    className="p-1 rounded-lg hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
                  >
                    <X className="h-2.5 w-2.5 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Recent items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Recent
              </span>
            </div>
            <div className="space-y-0.5">
              {recentItems.slice(0, 6).map(item => {
                const Icon = TYPE_ICONS[item.type] || FileText;
                return (
                  <Link
                    key={item.id}
                    to={item.route}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-muted/50 transition-all duration-200 group hover:-translate-y-px"
                  >
                    <Icon className="h-3 w-3 text-muted-foreground shrink-0 group-hover:text-accent transition-colors" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] truncate">{item.label}</div>
                    </div>
                    <span className="text-[9px] text-muted-foreground shrink-0">{item.timestamp}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Shell health */}
          <Separator />
          <div className="rounded-2xl border bg-card/80 p-2.5 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--state-healthy))] animate-pulse" />
              System Status
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Search</span>
                <span className="flex items-center gap-1 state-healthy">
                  <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--state-healthy))]" /> Healthy
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Notifications</span>
                <span className="flex items-center gap-1 state-healthy">
                  <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--state-healthy))]" /> Synced
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Last refresh</span>
                <span className="text-muted-foreground">12s ago</span>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Close rail */}
      <div className="border-t p-2 flex justify-center">
        <button
          onClick={() => setRightRailOpen(false)}
          className="p-1.5 rounded-xl hover:bg-muted/50 text-muted-foreground text-[10px] flex items-center gap-1 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <X className="h-3 w-3" /> Close
        </button>
      </div>
    </aside>
  );
};
