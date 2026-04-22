import React from 'react';
import { Building2, Check, ChevronDown, Plus, Settings } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const OrgSwitcher: React.FC = () => {
  const { activeOrg, setActiveOrg, availableOrgs } = useWorkspace();

  const handleSwitch = (org: typeof availableOrgs[0]) => {
    if (org.id !== activeOrg?.id) {
      setActiveOrg(org);
      toast.success(`Switched to ${org.name}`, { description: `Role: ${org.role}` });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-[11px] px-2.5 font-medium rounded-xl hover:-translate-y-px transition-all duration-200">
          <div className="h-5 w-5 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-3 w-3 text-primary" />
          </div>
          <span className="hidden lg:inline max-w-24 truncate">{activeOrg?.name || 'Personal'}</span>
          <ChevronDown className="h-2.5 w-2.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 rounded-2xl p-1.5">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground px-2">
          Switch Organization
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />
        {availableOrgs.map(org => {
          const isActive = activeOrg?.id === org.id;
          return (
            <DropdownMenuItem
              key={org.id}
              onClick={() => handleSwitch(org)}
              className={cn(
                'flex items-center gap-3 py-2.5 px-2.5 cursor-pointer rounded-xl my-0.5 transition-all duration-200',
                isActive && 'bg-accent/5 border border-accent/15',
                !isActive && 'hover:-translate-y-px'
              )}
            >
              <div className={cn(
                'h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                isActive ? 'bg-primary/10' : 'bg-muted'
              )}>
                <Building2 className={cn('h-3.5 w-3.5', isActive ? 'text-primary' : 'text-muted-foreground')} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold flex items-center gap-1.5">
                  {org.name}
                  {isActive && <Check className="h-3.5 w-3.5 text-accent" />}
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[8px] h-3.5 px-1">{org.role}</Badge>
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem className="py-2 px-2.5 cursor-pointer rounded-xl text-[11px] gap-2.5">
          <div className="h-7 w-7 rounded-xl bg-muted flex items-center justify-center">
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <span className="font-medium">Create Organization</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="py-2 px-2.5 cursor-pointer rounded-xl text-[11px] gap-2.5">
          <div className="h-7 w-7 rounded-xl bg-muted flex items-center justify-center">
            <Settings className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <span className="font-medium">Manage Organizations</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
