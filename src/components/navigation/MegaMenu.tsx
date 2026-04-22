import React, { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Search, Clock, ArrowRight, Sparkles, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { MegaMenuData, MegaMenuItem } from '@/data/navigation';

interface MegaMenuProps {
  menus: MegaMenuData[];
  className?: string;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({ menus, className }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleEnter = (i: number) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenIndex(i);
    setSearch('');
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => { setOpenIndex(null); setSearch(''); }, 200);
  };

  const close = useCallback(() => { setOpenIndex(null); setSearch(''); }, []);

  return (
    <nav className={cn('flex items-center gap-0.5', className)}>
      {menus.map((menu, i) => {
        const hasDropdown = menu.columns.length > 0;
        const isOpen = openIndex === i;

        if (!hasDropdown && menu.href) {
          return (
            <Link
              key={menu.label}
              to={menu.href}
              className="px-2.5 py-2 text-[11px] font-semibold text-foreground/70 hover:text-foreground transition-colors rounded-lg hover:bg-accent/8"
            >
              {menu.label}
            </Link>
          );
        }

        // Filter items by search
        const filteredColumns = search.trim()
          ? menu.columns.map(col => ({
              ...col,
              items: col.items.filter(item =>
                item.label.toLowerCase().includes(search.toLowerCase()) ||
                item.description.toLowerCase().includes(search.toLowerCase())
              ),
            })).filter(col => col.items.length > 0)
          : menu.columns;

        const totalColumns = filteredColumns.length;
        const menuWidth = menu.featured
          ? 'min-w-[700px]'
          : totalColumns >= 3 ? 'min-w-[640px]' : totalColumns >= 2 ? 'min-w-[480px]' : 'min-w-[280px]';

        return (
          <div
            key={menu.label}
            className="relative"
            onMouseEnter={() => handleEnter(i)}
            onMouseLeave={handleLeave}
          >
            <button
              className={cn(
                'flex items-center gap-0.5 px-2.5 py-2 text-[11px] font-semibold transition-all rounded-lg',
                isOpen
                  ? 'text-foreground bg-accent/10'
                  : 'text-foreground/70 hover:text-foreground hover:bg-accent/8'
              )}
            >
              {menu.icon && <menu.icon className="h-3 w-3 mr-0.5" />}
              {menu.label}
              {menu.badge && <Badge className="text-[7px] h-3.5 bg-accent text-white border-0 rounded-full ml-0.5 px-1">{menu.badge}</Badge>}
              {hasDropdown && (
                <ChevronDown className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-180')} />
              )}
            </button>

            {hasDropdown && isOpen && (
              <div className={cn(
                'absolute top-full left-0 mt-0.5 rounded-2xl border bg-popover shadow-xl z-50',
                'animate-in fade-in-0 zoom-in-[0.98] duration-150',
                menuWidth
              )}>
                {/* Search within menu */}
                {menu.searchable && (
                  <div className="px-4 pt-3 pb-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={`Search ${menu.label.toLowerCase()}...`}
                        className="pl-8 h-7 text-[10px] rounded-lg bg-muted/30 border-border/30"
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                <div className="p-3 flex gap-3">
                  {/* Main columns */}
                  <div className={cn('flex gap-3 flex-1', menu.featured && 'flex-1')}>
                    {filteredColumns.map((col) => (
                      <div key={col.title} className="flex-1 min-w-[150px]">
                        <h4 className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-2">
                          {col.title}
                        </h4>
                        <ul className="space-y-0.5">
                          {col.items.map((item) => (
                            <li key={item.label}>
                              <Link
                                to={item.href}
                                className="flex items-start gap-2.5 rounded-xl p-2 hover:bg-accent/8 transition-all group"
                                onClick={close}
                              >
                                <div className="h-7 w-7 rounded-lg bg-muted/40 flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors">
                                  <item.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-accent transition-colors" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[11px] font-semibold text-foreground group-hover:text-accent transition-colors">
                                      {item.label}
                                    </span>
                                    {item.badge && <Badge className="text-[6px] h-3 bg-accent/10 text-accent border-0 rounded-full px-1">{item.badge}</Badge>}
                                  </div>
                                  <div className="text-[9px] text-muted-foreground leading-snug mt-0.5">
                                    {item.description}
                                  </div>
                                </div>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Featured card */}
                  {menu.featured && (
                    <div className="w-[200px] shrink-0 border-l pl-3">
                      <h4 className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                        {menu.featured.title}
                      </h4>
                      {menu.featured.items.map((fi, idx) => (
                        <Link
                          key={idx}
                          to={fi.href}
                          onClick={close}
                          className="block rounded-xl p-2.5 mb-1.5 bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/10 hover:border-accent/25 transition-all group"
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            {fi.icon && <fi.icon className="h-3 w-3 text-accent" />}
                            <span className="text-[10px] font-bold text-foreground">{fi.label}</span>
                          </div>
                          <p className="text-[8px] text-muted-foreground leading-relaxed">{fi.description}</p>
                        </Link>
                      ))}

                      {/* Quick actions */}
                      {menu.quickActions && menu.quickActions.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border/20">
                          <h5 className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 px-1">Quick Actions</h5>
                          {menu.quickActions.map((qa, idx) => (
                            <Link
                              key={idx}
                              to={qa.href}
                              onClick={close}
                              className="flex items-center gap-1.5 py-1 px-1 text-[9px] text-accent hover:text-accent/80 transition-colors"
                            >
                              <ArrowRight className="h-2.5 w-2.5" />{qa.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Recently used */}
                {menu.recentItems && menu.recentItems.length > 0 && (
                  <div className="px-4 pb-3 pt-0">
                    <div className="border-t pt-2">
                      <div className="flex items-center gap-1 text-[8px] text-muted-foreground mb-1.5">
                        <Clock className="h-2.5 w-2.5" />Recently visited
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {menu.recentItems.map((ri, idx) => (
                          <Link
                            key={idx}
                            to={ri.href}
                            onClick={close}
                            className="text-[9px] px-2 py-1 rounded-lg bg-muted/30 hover:bg-muted/50 text-foreground/70 hover:text-foreground transition-colors"
                          >
                            {ri.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* No results */}
                {search.trim() && filteredColumns.length === 0 && (
                  <div className="px-4 pb-4 text-center">
                    <p className="text-[10px] text-muted-foreground">No results for "{search}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};
