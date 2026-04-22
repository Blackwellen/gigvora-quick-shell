import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Briefcase, MessageSquare,
  Plus, User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileNavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

const NAV_ITEMS: MobileNavItem[] = [
  { label: 'Home', icon: Home, path: '/feed' },
  { label: 'Jobs', icon: Briefcase, path: '/jobs' },
  { label: 'Create', icon: Plus, path: '/create/post' },
  { label: 'Inbox', icon: MessageSquare, path: '/inbox', badge: 5 },
  { label: 'Me', icon: User, path: '/profile' },
];

export const MobileBottomNav: React.FC = () => {
  const { pathname } = useLocation();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          const isCreate = item.label === 'Create';

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-1 relative min-w-[48px] min-h-[48px] rounded-xl transition-colors',
                isCreate
                  ? ''
                  : active
                    ? 'text-primary'
                    : 'text-muted-foreground active:text-foreground'
              )}
            >
              {isCreate ? (
                <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                  <Plus className="h-5 w-5 text-primary-foreground" />
                </div>
              ) : (
                <>
                  <div className="relative">
                    <item.icon className="h-5 w-5" />
                    {item.badge && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1.5 h-3.5 min-w-[14px] rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground flex items-center justify-center px-1">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className={cn('text-[10px]', active ? 'font-semibold' : 'font-medium')}>
                    {item.label}
                  </span>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
