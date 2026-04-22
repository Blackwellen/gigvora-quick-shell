import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const COUNTRIES = [
  { country: 'United Kingdom', flag: '🇬🇧', visitors: 48200, sessions: 64800, conv: 4.2, delta: 8.4 },
  { country: 'United States', flag: '🇺🇸', visitors: 38420, sessions: 52100, conv: 3.1, delta: 12.1 },
  { country: 'Germany', flag: '🇩🇪', visitors: 14820, sessions: 19800, conv: 3.8, delta: 4.2 },
  { country: 'France', flag: '🇫🇷', visitors: 9420, sessions: 12400, conv: 3.4, delta: -2.1 },
  { country: 'Netherlands', flag: '🇳🇱', visitors: 6240, sessions: 8200, conv: 4.1, delta: 6.8 },
  { country: 'Spain', flag: '🇪🇸', visitors: 5180, sessions: 6900, conv: 2.9, delta: 1.4 },
  { country: 'Italy', flag: '🇮🇹', visitors: 4280, sessions: 5800, conv: 2.6, delta: -4.2 },
  { country: 'Canada', flag: '🇨🇦', visitors: 3920, sessions: 5400, conv: 3.6, delta: 9.4 },
  { country: 'Australia', flag: '🇦🇺', visitors: 3420, sessions: 4800, conv: 3.2, delta: 5.1 },
  { country: 'Sweden', flag: '🇸🇪', visitors: 2840, sessions: 3800, conv: 4.4, delta: 14.2 },
];

const LocationAnalysisPage: React.FC = () => {
  const max = Math.max(...COUNTRIES.map((c) => c.visitors));
  return (
    <div className="mx-auto w-full max-w-[1500px] px-8 py-8">
      <Link to="/admin/marketing" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Marketing
      </Link>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> Marketing · Location Analysis</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Geographic distribution</h1>
        <p className="mt-1 text-sm text-muted-foreground">Visitor & conversion split by country, with week-over-week change.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Countries with traffic', value: '64' },
          { label: 'Top market', value: 'UK (33%)' },
          { label: 'Fastest growing', value: 'Sweden +14%' },
          { label: 'Highest conv. rate', value: 'Sweden 4.4%' },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border bg-card p-4">
            <div className="text-xl font-semibold tabular-nums">{k.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-sm font-semibold tracking-tight mb-4">Top 10 countries (last 24h)</h3>
        <div className="space-y-3">
          {COUNTRIES.map((c) => (
            <div key={c.country} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-lg leading-none">{c.flag}</span>
                  <span className="font-medium w-44">{c.country}</span>
                  <span className="text-muted-foreground tabular-nums">{c.visitors.toLocaleString()} visitors · {c.sessions.toLocaleString()} sessions</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums text-xs">Conv. {c.conv.toFixed(1)}%</span>
                  <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium tabular-nums w-14 justify-end', c.delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                    {c.delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(c.delta).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${(c.visitors / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LocationAnalysisPage;
