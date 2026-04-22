import React from 'react';
import { Link } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, Clock, ChevronRight, ArrowRight } from 'lucide-react';

const QUICK_TASKS = [
  { id: 't1', title: 'Review homepage mockups', source: 'E-commerce Redesign', type: 'project', priority: 'high', due: 'Today' },
  { id: 't2', title: 'Deliver logo concepts', source: 'Brand Identity Gig', type: 'gig', priority: 'high', due: 'Tomorrow' },
  { id: 't3', title: 'Submit proposal revision', source: 'CRM Integration', type: 'project', priority: 'medium', due: 'Apr 16' },
  { id: 't4', title: 'Schedule follow-up interview', source: 'Senior Engineer Hire', type: 'job', priority: 'high', due: 'Today' },
  { id: 't5', title: 'Complete SEO audit', source: 'SEO Retainer', type: 'service', priority: 'medium', due: 'Apr 18' },
];

const priorityColor = (p: string) => p === 'high' ? 'bg-[hsl(var(--state-critical))]' : p === 'medium' ? 'bg-[hsl(var(--gigvora-amber))]' : 'bg-muted-foreground/40';

export const TaskTray: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const urgentCount = QUICK_TASKS.filter(t => t.due === 'Today').length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl hover:bg-accent/10 transition-colors relative">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {urgentCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-3.5 min-w-[14px] rounded-full bg-[hsl(var(--state-critical))] text-[7px] font-bold text-white flex items-center justify-center px-0.5">
              {urgentCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-3 py-2.5 border-b">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold">Tasks</h3>
            <Badge className="text-[7px] h-4 px-1 bg-accent/10 text-accent">{QUICK_TASKS.length} open</Badge>
          </div>
          <Link to="/work" onClick={() => setOpen(false)} className="text-[9px] text-accent hover:underline flex items-center gap-0.5">
            Work Hub <ArrowRight className="h-2.5 w-2.5" />
          </Link>
        </div>

        <ScrollArea className="max-h-[320px]">
          <div className="p-2 space-y-0.5">
            {QUICK_TASKS.map(t => (
              <Link
                key={t.id}
                to="/work"
                onClick={() => setOpen(false)}
                className="flex items-start gap-2 p-2 rounded-xl hover:bg-muted/30 transition-colors group"
              >
                <div className={`h-2 w-2 rounded-full shrink-0 mt-1 ${priorityColor(t.priority)}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold group-hover:text-accent transition-colors truncate">{t.title}</div>
                  <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground mt-0.5">
                    <span>{t.source}</span>
                    <span>•</span>
                    <Clock className="h-2 w-2" />
                    <span className={t.due === 'Today' ? 'text-[hsl(var(--state-critical))] font-semibold' : ''}>{t.due}</span>
                  </div>
                </div>
                <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
              </Link>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t px-3 py-2 flex gap-2">
          <Link to="/work" onClick={() => setOpen(false)} className="text-[9px] text-accent hover:underline flex items-center gap-0.5">
            All Tasks <ArrowRight className="h-2.5 w-2.5" />
          </Link>
          <Link to="/work" onClick={() => setOpen(false)} className="text-[9px] text-muted-foreground hover:text-accent hover:underline flex items-center gap-0.5 ml-auto">
            Milestones
          </Link>
          <Link to="/work" onClick={() => setOpen(false)} className="text-[9px] text-muted-foreground hover:text-accent hover:underline flex items-center gap-0.5">
            Approvals
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
};
