import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronRight, FileText, Printer, Download, ArrowUp, Clock, Shield } from 'lucide-react';

interface TOCItem { id: string; label: string; }

interface LegalPageShellProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badge?: string;
  lastUpdated: string;
  effectiveDate?: string;
  version?: string;
  toc: TOCItem[];
  relatedLinks?: { label: string; to: string }[];
  children: React.ReactNode;
}

export function LegalPageShell({ title, subtitle, icon, badge, lastUpdated, effectiveDate, version, toc, relatedLinks, children }: LegalPageShellProps) {
  const [activeSection, setActiveSection] = useState(toc[0]?.id || '');
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0.1 }
    );
    toc.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [toc]);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[hsl(var(--gigvora-navy))] via-[hsl(var(--gigvora-navy-light))] to-[hsl(var(--gigvora-blue)/0.15)] py-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--gigvora-blue)/0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,hsl(var(--gigvora-green)/0.06),transparent_50%)]" />
        <div className="relative max-w-[1400px] mx-auto px-4 lg:px-8">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              {icon}
            </div>
            <div className="flex-1">
              {badge && (
                <Badge className="bg-white/10 text-white/80 border-white/15 text-[10px] mb-2">{badge}</Badge>
              )}
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1.5 tracking-tight">{title}</h1>
              <p className="text-sm text-white/50 max-w-xl">{subtitle}</p>
              <div className="flex flex-wrap items-center gap-3 mt-4 text-[10px] text-white/40">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Updated {lastUpdated}</span>
                {effectiveDate && <span>Effective {effectiveDate}</span>}
                {version && <Badge variant="outline" className="text-[9px] border-white/20 text-white/50">{version}</Badge>}
              </div>
            </div>
            <div className="hidden md:flex gap-1.5 shrink-0">
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl border-white/15 text-white/60 hover:text-white bg-white/5">
                <Printer className="h-3 w-3 mr-1" />Print
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl border-white/15 text-white/60 hover:text-white bg-white/5">
                <Download className="h-3 w-3 mr-1" />PDF
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-10">
        <div className="flex gap-8">
          {/* Sticky TOC */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Contents</h3>
              <ScrollArea className="max-h-[70vh]">
                <nav className="space-y-0.5 pr-2">
                  {toc.map((item, i) => (
                    <button
                      key={item.id}
                      onClick={() => scrollTo(item.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] transition-all flex items-center gap-2 ${
                        activeSection === item.id
                          ? 'bg-accent/10 text-accent font-semibold'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                      }`}
                    >
                      <span className="text-[8px] text-muted-foreground/50 w-4 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                      {item.label}
                    </button>
                  ))}
                </nav>
              </ScrollArea>
              {relatedLinks && relatedLinks.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Related</h3>
                  <div className="space-y-1">
                    {relatedLinks.map(l => (
                      <Link key={l.to} to={l.to} className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-accent transition-colors py-1">
                        <ChevronRight className="h-2.5 w-2.5" />{l.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0 max-w-3xl">
            {children}
          </main>
        </div>
      </div>

      {/* Back to top */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 h-9 w-9 rounded-xl bg-accent text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-50"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

interface LegalSectionProps {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
}

export function LegalSection({ id, number, title, children }: LegalSectionProps) {
  return (
    <section id={id} className="mb-10 scroll-mt-24">
      <div className="flex items-center gap-3 mb-4">
        <span className="h-7 w-7 rounded-lg bg-accent/10 text-accent text-[10px] font-bold flex items-center justify-center shrink-0">{number}</span>
        <h2 className="text-base font-bold tracking-tight">{title}</h2>
      </div>
      <div className="text-[11px] text-muted-foreground leading-relaxed space-y-3 pl-10">
        {children}
      </div>
    </section>
  );
}

export function LegalCallout({ type = 'info', children }: { type?: 'info' | 'warning' | 'important'; children: React.ReactNode }) {
  const styles = {
    info: 'bg-[hsl(var(--gigvora-blue)/0.05)] border-[hsl(var(--gigvora-blue)/0.2)] text-[hsl(var(--gigvora-blue))]',
    warning: 'bg-[hsl(var(--gigvora-amber)/0.05)] border-[hsl(var(--gigvora-amber)/0.2)] text-[hsl(var(--gigvora-amber))]',
    important: 'bg-accent/5 border-accent/20 text-accent',
  };
  return (
    <div className={`rounded-xl border p-3 text-[10px] leading-relaxed ${styles[type]}`}>
      {children}
    </div>
  );
}
