import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const InboxCounter: React.FC = () => {
  const totalUnread = 23;

  return (
    <Link to="/inbox">
      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl relative hover:bg-muted/80 transition-all">
        <MessageSquare className="h-4 w-4" />
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] rounded-full text-[9px] font-bold flex items-center justify-center px-1 ring-2 ring-card bg-accent text-accent-foreground">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </Button>
    </Link>
  );
};
