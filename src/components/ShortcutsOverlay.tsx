import React, { useEffect, useState } from 'react';
import { X, Keyboard, Search, Command } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShortcutGroup {
  title: string;
  icon?: React.ElementType;
  shortcuts: Array<{ keys: string[]; description: string }>;
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Global',
    icon: Command,
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open command palette' },
      { keys: ['Shift', '?'], description: 'Show keyboard shortcuts' },
      { keys: ['Esc'], description: 'Close overlay / dialog' },
      { keys: ['⌘', '/'], description: 'Focus search bar' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['G', 'H'], description: 'Go to Home / Feed' },
      { keys: ['G', 'D'], description: 'Go to Dashboard' },
      { keys: ['G', 'I'], description: 'Go to Inbox' },
      { keys: ['G', 'N'], description: 'Go to Notifications' },
      { keys: ['G', 'P'], description: 'Go to Profile' },
      { keys: ['G', 'S'], description: 'Go to Settings' },
      { keys: ['G', 'C'], description: 'Go to Calendar' },
    ],
  },
  {
    title: 'Marketplace',
    shortcuts: [
      { keys: ['G', 'J'], description: 'Go to Jobs' },
      { keys: ['G', 'G'], description: 'Go to Gigs' },
      { keys: ['G', 'R'], description: 'Go to Projects' },
      { keys: ['G', 'E'], description: 'Go to Explorer' },
    ],
  },
  {
    title: 'Actions',
    shortcuts: [
      { keys: ['N'], description: 'Quick create menu' },
      { keys: ['M'], description: 'New message' },
      { keys: ['S'], description: 'Save / bookmark current item' },
      { keys: ['.'], description: 'Toggle right rail' },
      { keys: ['['], description: 'Toggle sidebar' },
    ],
  },
  {
    title: 'Lists & Tables',
    shortcuts: [
      { keys: ['J'], description: 'Move down in list' },
      { keys: ['K'], description: 'Move up in list' },
      { keys: ['↵'], description: 'Open selected item' },
      { keys: ['X'], description: 'Select / deselect item' },
      { keys: ['⌘', 'A'], description: 'Select all' },
    ],
  },
];

interface ShortcutsOverlayProps {
  open: boolean;
  onClose: () => void;
}

export const ShortcutsOverlay: React.FC<ShortcutsOverlayProps> = ({ open, onClose }) => {
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    if (!open) return;
    setFilterQuery('');
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const q = filterQuery.toLowerCase();
  const filteredGroups = SHORTCUT_GROUPS.map(group => ({
    ...group,
    shortcuts: group.shortcuts.filter(s =>
      !q || s.description.toLowerCase().includes(q) || s.keys.some(k => k.toLowerCase().includes(q))
    ),
  })).filter(g => g.shortcuts.length > 0);

  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
      <div className="relative flex justify-center items-start pt-[6vh] sm:pt-[8vh] px-3 sm:px-0">
        <div
          className="w-full max-w-3xl bg-card rounded-3xl border shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center">
                <Keyboard className="h-4.5 w-4.5 text-accent" />
              </div>
              <div>
                <h2 className="text-sm font-bold">Keyboard Shortcuts</h2>
                <p className="text-[10px] text-muted-foreground">Navigate faster with keyboard shortcuts</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Filter input */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/50 border border-transparent focus-within:border-accent/20 transition-colors">
                <Search className="h-3 w-3 text-muted-foreground" />
                <input
                  value={filterQuery}
                  onChange={e => setFilterQuery(e.target.value)}
                  placeholder="Filter shortcuts..."
                  className="bg-transparent text-[11px] w-32 focus:outline-none placeholder:text-muted-foreground/50"
                />
              </div>
              <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Grid */}
          <div className="grid md:grid-cols-2 gap-3 p-4 max-h-[65vh] overflow-y-auto">
            {filteredGroups.map(group => (
              <div key={group.title} className="rounded-2xl bg-muted/20 border p-4 hover:border-accent/10 transition-colors">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  {group.icon && <group.icon className="h-3 w-3" />}
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.shortcuts.map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-muted/50 transition-colors group">
                      <span className="text-[11px] text-foreground group-hover:text-foreground/90">{s.description}</span>
                      <div className="flex items-center gap-1 shrink-0 ml-3">
                        {s.keys.map((key, ki) => (
                          <React.Fragment key={ki}>
                            {ki > 0 && <span className="text-[8px] text-muted-foreground">+</span>}
                            <kbd className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-lg bg-card border shadow-sm text-[10px] font-mono font-semibold text-foreground/80">
                              {key}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {filteredGroups.length === 0 && (
              <div className="col-span-2 py-12 text-center">
                <Search className="h-8 w-8 mx-auto mb-3 text-muted-foreground/20" />
                <p className="text-sm font-medium text-muted-foreground">No shortcuts match "{filterQuery}"</p>
                <button onClick={() => setFilterQuery('')} className="text-xs text-accent mt-2 hover:underline">Clear filter</button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t text-[10px] text-muted-foreground flex items-center justify-between bg-muted/20">
            <span className="flex items-center gap-1.5">
              Press <kbd className="px-1.5 py-0.5 bg-card rounded-lg font-mono text-[9px] border shadow-sm">Shift</kbd> + <kbd className="px-1.5 py-0.5 bg-card rounded-lg font-mono text-[9px] border shadow-sm">?</kbd> anywhere to toggle
            </span>
            <span>Some shortcuts may vary by context</span>
          </div>
        </div>
      </div>
    </div>
  );
};
