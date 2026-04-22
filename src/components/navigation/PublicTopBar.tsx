import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight, Sparkles, Briefcase, Layers, Store, UserCheck, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MegaMenu } from './MegaMenu';
import { PUBLIC_MEGA_MENUS } from '@/data/navigation';
import { GigvoraLogo } from '@/components/GigvoraLogo';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const CTA_LINKS: { label: string; to: string; icon: React.ElementType; desc: string }[] = [];

export const PublicTopBar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  return (
    <>
      {/* Announcement Bar */}
      {!bannerDismissed && (
        <div className="bg-gradient-to-r from-[hsl(var(--gigvora-navy))] to-[hsl(var(--gigvora-blue)/0.8)] text-white py-1.5 px-4 text-center relative">
          <div className="flex items-center justify-center gap-2 text-[10px]">
            <Sparkles className="h-3 w-3 text-[hsl(var(--gigvora-blue-light))]" />
            <span>
              <strong>New:</strong> Enterprise Connect is live — startup showcases, advisor marketplace & more.{' '}
              <Link to="/enterprise-connect" className="underline font-semibold hover:text-white/90">Learn more →</Link>
            </span>
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
        {/* Top row */}
        <div className="flex h-14 items-center justify-between px-[var(--shell-gutter)] max-w-[var(--public-max-width)] mx-auto">
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <GigvoraLogo size="sm" />
          </Link>

          {/* CTA buttons — conversion-focused hierarchy */}
          <div className="hidden md:flex items-center gap-1.5">
            {CTA_LINKS.map(cta => (
              <Button key={cta.to} variant="ghost" size="sm" className="text-[10px] h-8 font-medium rounded-xl hover:bg-accent/10 transition-all gap-1" asChild>
                <Link to={cta.to}>
                  <cta.icon className="h-3 w-3" />{cta.label}
                </Link>
              </Button>
            ))}
            <div className="h-5 w-px bg-border mx-1" />
            <Button variant="outline" size="sm" className="text-[10px] h-8 font-medium rounded-xl" asChild>
              <Link to="/signin">Sign In</Link>
            </Button>
            <Button size="sm" className="text-[10px] h-8 gap-1 font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-px transition-all duration-200" asChild>
              <Link to="/signup">
                Get Started Free <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-muted/50 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Bottom row — mega menu nav */}
        <div className="hidden md:block border-t bg-background">
          <div className="max-w-[var(--public-max-width)] mx-auto px-[var(--shell-gutter)]">
            <MegaMenu menus={PUBLIC_MEGA_MENUS} />
          </div>
        </div>
      </header>

      {/* Mobile navigation sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[300px] p-0">
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle className="text-sm flex items-center gap-2">
              <GigvoraLogo size="sm" />
            </SheetTitle>
          </SheetHeader>

          <Separator />

          <ScrollArea className="flex-1 h-[calc(100vh-120px)]">
            <div className="p-3 space-y-1">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold px-2 pt-1 pb-1.5">Navigation</div>
              {PUBLIC_MEGA_MENUS.map((m) => (
                <Link
                  key={m.label}
                  to={m.href || '#'}
                  className="flex items-center gap-2.5 py-2.5 px-3 text-xs font-medium rounded-xl hover:bg-accent/10 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {m.label}
                  <ChevronRight className="h-3 w-3 text-muted-foreground/30 ml-auto" />
                </Link>
              ))}

              <Separator className="my-3" />

              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold px-2 pt-1 pb-1.5">Get Started</div>
              {CTA_LINKS.map(cta => (
                <Link
                  key={cta.to}
                  to={cta.to}
                  className="flex items-center gap-2.5 py-2 px-3 text-xs font-medium rounded-xl hover:bg-accent/10 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  <cta.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <div className="text-[11px] font-semibold">{cta.label}</div>
                    <div className="text-[8px] text-muted-foreground">{cta.desc}</div>
                  </div>
                </Link>
              ))}

              <Separator className="my-3" />

              <div className="space-y-2 px-1">
                <Button variant="outline" size="sm" className="text-xs w-full h-9 rounded-xl" asChild>
                  <Link to="/signin" onClick={() => setMobileOpen(false)}>Sign In</Link>
                </Button>
                <Button size="sm" className="text-xs w-full h-9 gap-1 rounded-xl shadow-md" asChild>
                  <Link to="/signup" onClick={() => setMobileOpen(false)}>
                    Get Started Free <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
};
