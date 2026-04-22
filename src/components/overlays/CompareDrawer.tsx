import React, { useState } from 'react';
import { X, ArrowLeftRight, Check, Minus, ExternalLink, Crown, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface CompareItem {
  id: string;
  title: string;
  subtitle?: string;
  avatar?: string;
  fields: Record<string, string | number | boolean | null>;
  badges?: string[];
  detailPath?: string;
}

interface CompareDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CompareItem[];
  fieldLabels: Record<string, string>;
  title?: string;
}

export const CompareDrawer: React.FC<CompareDrawerProps> = ({
  open, onOpenChange, items, fieldLabels, title = 'Compare',
}) => {
  const [highlightDiffs, setHighlightDiffs] = useState(true);

  if (!open || items.length < 2) return null;

  const allFieldKeys = Object.keys(fieldLabels);

  const renderValue = (val: string | number | boolean | null) => {
    if (val === null || val === undefined) return <Minus className="h-3 w-3 text-muted-foreground mx-auto" />;
    if (typeof val === 'boolean') return val ? <Check className="h-4 w-4 text-[hsl(var(--state-healthy))] mx-auto" /> : <Minus className="h-3 w-3 text-muted-foreground mx-auto" />;
    return <span className="text-[11px] font-semibold">{val}</span>;
  };

  const isDifferent = (key: string) => {
    const vals = items.map(i => JSON.stringify(i.fields[key]));
    return new Set(vals).size > 1;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => onOpenChange(false)}>
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-card rounded-t-3xl sm:rounded-3xl border shadow-2xl flex flex-col animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <ArrowLeftRight className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h2 className="text-sm font-bold">{title}</h2>
              <p className="text-[10px] text-muted-foreground">{items.length} items · {allFieldKeys.length} fields</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHighlightDiffs(!highlightDiffs)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all border',
                highlightDiffs ? 'bg-accent/10 text-accent border-accent/20' : 'bg-muted/50 text-muted-foreground border-transparent'
              )}
            >
              {highlightDiffs ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              Differences
            </button>
            <button onClick={() => onOpenChange(false)} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-muted transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Compare table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/20">
                <th className="text-left px-5 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-40 sticky left-0 bg-muted/20">Field</th>
                {items.map((item, idx) => (
                  <th key={item.id} className="px-5 py-4 text-center min-w-[200px]">
                    <div className="flex flex-col items-center gap-2">
                      <div className={cn(
                        'h-12 w-12 rounded-2xl flex items-center justify-center text-sm font-bold transition-transform hover:scale-105',
                        idx === 0 ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'
                      )}>
                        {item.title.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-[11px] flex items-center gap-1 justify-center">
                          {item.title}
                          {idx === 0 && <Crown className="h-3 w-3 text-[hsl(var(--gigvora-amber))]" />}
                        </div>
                        {item.subtitle && <div className="text-[9px] text-muted-foreground font-normal mt-0.5">{item.subtitle}</div>}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allFieldKeys.map((key, idx) => {
                const hasDiff = isDifferent(key);
                return (
                  <tr key={key} className={cn(
                    'border-b transition-colors',
                    idx % 2 === 0 ? 'bg-transparent' : 'bg-muted/10',
                    highlightDiffs && hasDiff && 'bg-[hsl(var(--gigvora-amber)/0.04)]'
                  )}>
                    <td className="px-5 py-3 text-[10px] font-medium text-muted-foreground sticky left-0 bg-inherit">
                      <div className="flex items-center gap-1.5">
                        {highlightDiffs && hasDiff && <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--gigvora-amber))]" />}
                        {fieldLabels[key]}
                      </div>
                    </td>
                    {items.map(item => {
                      const val = item.fields[key];
                      const otherVals = items.filter(i => i.id !== item.id).map(i => i.fields[key]);
                      const isBest = typeof val === 'number' && otherVals.every(v => typeof v === 'number' && val >= v);
                      return (
                        <td key={item.id} className={cn('px-5 py-3 text-center', isBest && 'bg-[hsl(var(--state-healthy)/0.06)]')}>
                          <span className={cn(isBest && 'text-[hsl(var(--state-healthy))]')}>
                            {renderValue(val)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {/* Badges row */}
              <tr className="border-b">
                <td className="px-5 py-3 text-[10px] font-medium text-muted-foreground sticky left-0 bg-card">Tags</td>
                {items.map(item => (
                  <td key={item.id} className="px-5 py-3 text-center">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {item.badges?.map(b => <Badge key={b} variant="outline" className="text-[8px] h-5 rounded-lg">{b}</Badge>)}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-3.5 flex items-center justify-between bg-muted/10">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[hsl(var(--state-healthy))]" /> Best value highlighted
            {highlightDiffs && (
              <>
                <span className="mx-1.5">·</span>
                <div className="h-2 w-2 rounded-full bg-[hsl(var(--gigvora-amber))]" /> Differences marked
              </>
            )}
          </span>
          <div className="flex gap-2">
            {items.map(item => item.detailPath && (
              <Button key={item.id} variant="outline" size="sm" className="text-[10px] h-8 gap-1.5 rounded-xl" asChild>
                <a href={item.detailPath}><ExternalLink className="h-3 w-3" /> {item.title}</a>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
