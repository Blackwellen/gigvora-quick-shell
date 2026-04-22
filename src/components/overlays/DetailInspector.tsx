import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Pin, PinOff, ExternalLink, History, MessageSquare, FileText, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface TimelineEntry {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
  detail?: string;
}

interface DetailInspectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  status?: string;
  statusColor?: string;
  children: React.ReactNode;
  timeline?: TimelineEntry[];
  onPin?: () => void;
  pinned?: boolean;
  onNavigate?: (direction: 'prev' | 'next') => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  actions?: React.ReactNode;
  width?: string;
}

export const DetailInspector: React.FC<DetailInspectorProps> = ({
  open, onOpenChange, title, subtitle, status, statusColor,
  children, timeline, onPin, pinned, onNavigate, hasPrev, hasNext,
  actions, width = 'max-w-xl',
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const [noteText, setNoteText] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={() => onOpenChange(false)}>
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />
      <div
        className={cn('relative w-full bg-card shadow-2xl border-l sm:rounded-l-3xl flex flex-col animate-in slide-in-from-right-8 duration-300', width)}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              {onNavigate && (
                <>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl" disabled={!hasPrev} onClick={() => onNavigate('prev')}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl" disabled={!hasNext} onClick={() => onNavigate('next')}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
              {status && (
                <Badge className={cn('text-[8px] h-5 border-0 rounded-lg', statusColor || 'bg-muted')}>{status}</Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {onPin && (
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl" onClick={onPin} title={pinned ? 'Unpin' : 'Pin'}>
                  {pinned ? <PinOff className="h-3.5 w-3.5 text-accent" /> : <Pin className="h-3.5 w-3.5" />}
                </Button>
              )}
              <button onClick={() => onOpenChange(false)} className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <h2 className="text-sm font-bold">{title}</h2>
          {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-5 border-b">
            <TabsList className="h-9 bg-transparent p-0 gap-5">
              <TabsTrigger value="details" className="text-[10px] h-9 px-0 pb-2 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none">
                <FileText className="h-3 w-3 mr-1.5" /> Details
              </TabsTrigger>
              {timeline && (
                <TabsTrigger value="timeline" className="text-[10px] h-9 px-0 pb-2 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none">
                  <History className="h-3 w-3 mr-1.5" /> Timeline
                  <Badge variant="outline" className="text-[7px] h-4 ml-1.5 rounded-lg">{timeline.length}</Badge>
                </TabsTrigger>
              )}
              <TabsTrigger value="notes" className="text-[10px] h-9 px-0 pb-2 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none">
                <MessageSquare className="h-3 w-3 mr-1.5" /> Notes
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="details" className="flex-1 overflow-y-auto p-5 mt-0">
            {children}
          </TabsContent>

          {timeline && (
            <TabsContent value="timeline" className="flex-1 overflow-y-auto p-5 mt-0">
              <div className="space-y-0">
                {timeline.map((entry, i) => (
                  <div key={entry.id} className="flex gap-3 group">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'h-3 w-3 rounded-full mt-1 ring-2 ring-card transition-colors',
                        i === 0 ? 'bg-accent' : 'bg-muted-foreground/30'
                      )} />
                      {i < timeline.length - 1 && <div className="flex-1 w-px bg-border/60" />}
                    </div>
                    <div className="pb-4">
                      <div className="text-[11px]">
                        <span className="font-semibold">{entry.actor}</span>{' '}
                        <span className="text-muted-foreground">{entry.action}</span>
                      </div>
                      <div className="text-[9px] text-muted-foreground mt-0.5">{entry.timestamp}</div>
                      {entry.detail && (
                        <div className="text-[10px] text-muted-foreground mt-1.5 bg-muted/30 rounded-xl px-3 py-2 border">{entry.detail}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          )}

          <TabsContent value="notes" className="flex-1 overflow-y-auto p-5 mt-0">
            <div className="text-center py-8">
              <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground/30" />
              </div>
              <p className="text-[11px] text-muted-foreground mb-4">No notes yet. Add context for your team.</p>
            </div>
            {/* Compose note */}
            <div className="flex items-center gap-2 mt-auto">
              <input
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Add a note..."
                className="flex-1 h-9 rounded-xl border bg-muted/30 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
              />
              <Button size="icon" className="h-9 w-9 rounded-xl shrink-0" disabled={!noteText.trim()}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        {actions && (
          <div className="border-t px-5 py-4 flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
