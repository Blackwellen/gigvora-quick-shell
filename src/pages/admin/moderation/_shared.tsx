/** Shared shell for Moderator & Trust Review Portal sub-pages (AD-020). */
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export const ModBackLink: React.FC = () => (
  <Link to="/admin/moderation" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
    <ArrowLeft className="h-3.5 w-3.5" /> Back to Moderation
  </Link>
);

export const ModPageHeader: React.FC<{ eyebrow: string; title: string; subtitle: string; right?: React.ReactNode }> = ({
  eyebrow, title, subtitle, right,
}) => (
  <div className="mb-6 flex items-end justify-between gap-4">
    <div>
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <ShieldAlert className="h-3.5 w-3.5" /> Moderation · {eyebrow}
      </div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{subtitle}</p>
    </div>
    {right}
  </div>
);

export const ModPageShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mx-auto w-full max-w-[1500px] px-8 py-8">{children}</div>
);

export const ModKpiCard: React.FC<{ label: string; value: string; delta?: string; positive?: boolean; icon: React.ElementType }> = ({
  label, value, delta, positive, icon: Icon,
}) => (
  <div className="rounded-xl border bg-card p-4">
    <div className="flex items-center justify-between mb-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      {delta && (
        <span className={`text-[10px] font-medium tabular-nums ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {delta}
        </span>
      )}
    </div>
    <div className="text-xl font-semibold tracking-tight tabular-nums">{value}</div>
    <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
  </div>
);

export const ModTable: React.FC<{ headers: string[]; rows: React.ReactNode[][]; empty?: string }> = ({ headers, rows, empty = 'No items.' }) => (
  <div className="rounded-xl border bg-card overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>{headers.map((h) => <th key={h} className="text-left font-medium px-4 py-2.5">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y">
          {rows.length === 0 ? (
            <tr><td colSpan={headers.length} className="px-4 py-10 text-center text-[13px] text-muted-foreground">{empty}</td></tr>
          ) : rows.map((r, i) => (
            <tr key={i} className="hover:bg-muted/30 transition-colors">
              {r.map((c, j) => (
                <td key={j} className="px-4 py-3 align-middle text-[13px]">
                  {React.isValidElement(c) ? React.cloneElement(c as React.ReactElement, { key: j }) : c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const ModBadge: React.FC<{ tone?: 'neutral' | 'success' | 'warn' | 'danger' | 'info'; children: React.ReactNode }> = ({ tone = 'neutral', children }) => {
  const map = {
    neutral: 'bg-muted text-foreground/70',
    success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    warn: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    danger: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
    info: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${map[tone]}`}>{children}</span>;
};
