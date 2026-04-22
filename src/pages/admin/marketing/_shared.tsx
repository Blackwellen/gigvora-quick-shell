/** Shared header/back-link for Marketing Admin sub-pages (FD-15). */
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Megaphone } from 'lucide-react';

export const MktBackLink: React.FC = () => (
  <Link to="/admin/marketing" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
    <ArrowLeft className="h-3.5 w-3.5" /> Back to Marketing
  </Link>
);

export const MktPageHeader: React.FC<{ eyebrow: string; title: string; subtitle: string; right?: React.ReactNode }> = ({
  eyebrow, title, subtitle, right,
}) => (
  <div className="mb-6 flex items-end justify-between gap-4">
    <div>
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <Megaphone className="h-3.5 w-3.5" /> Marketing · {eyebrow}
      </div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{subtitle}</p>
    </div>
    {right}
  </div>
);

export const MktPageShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mx-auto w-full max-w-[1500px] px-8 py-8">{children}</div>
);
