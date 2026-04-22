import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { X, Hash, TrendingUp, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   1. HASHTAG PARSER — converts text with #tags into rich JSX
   ═══════════════════════════════════════════════════════════ */

const HASHTAG_REGEX = /#([\w\u00C0-\u024F]{2,30})/g;
const MENTION_REGEX = /@([\w.\-]{2,30})/g;

export function parseHashtags(text: string): string[] {
  const matches = text.match(HASHTAG_REGEX);
  if (!matches) return [];
  return [...new Set(matches.map(m => m.slice(1).toLowerCase()))];
}

export function parseMentions(text: string): string[] {
  const matches = text.match(MENTION_REGEX);
  if (!matches) return [];
  return [...new Set(matches.map(m => m.slice(1)))];
}

interface RichTextProps {
  text: string;
  onHashtagClick?: (tag: string) => void;
  onMentionClick?: (handle: string) => void;
  className?: string;
}

export const RichText: React.FC<RichTextProps> = ({ text, onHashtagClick, onMentionClick, className }) => {
  const parts: React.ReactNode[] = [];
  const combined = /(?:#([\w\u00C0-\u024F]{2,30}))|(?:@([\w.\-]{2,30}))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = combined.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      const tag = match[1];
      parts.push(
        <button
          key={`h-${match.index}`}
          onClick={(e) => { e.stopPropagation(); onHashtagClick?.(tag.toLowerCase()); }}
          className="text-accent font-semibold hover:underline cursor-pointer transition-colors inline"
        >
          #{tag}
        </button>
      );
    } else if (match[2]) {
      const handle = match[2];
      parts.push(
        <button
          key={`m-${match.index}`}
          onClick={(e) => { e.stopPropagation(); onMentionClick?.(handle); }}
          className="text-[hsl(var(--gigvora-blue))] font-semibold hover:underline cursor-pointer transition-colors inline"
        >
          @{handle}
        </button>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <span className={className}>{parts}</span>;
};

/* ═══════════════════════════════════════════════════════════
   2. HASHTAG CHIPS — clickable tag row (for post footers)
   ═══════════════════════════════════════════════════════════ */

interface HashtagChipsProps {
  tags: string[];
  onTagClick?: (tag: string) => void;
  size?: 'xs' | 'sm' | 'md';
  limit?: number;
  className?: string;
}

export const HashtagChips: React.FC<HashtagChipsProps> = ({ tags, onTagClick, size = 'xs', limit, className }) => {
  const displayed = limit ? tags.slice(0, limit) : tags;
  const remaining = limit ? tags.length - limit : 0;

  const sizes = {
    xs: 'text-[9px] px-2 py-0.5 h-5',
    sm: 'text-[10px] px-2.5 py-1 h-6',
    md: 'text-[11px] px-3 py-1 h-7',
  };

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {displayed.map(tag => (
        <button
          key={tag}
          onClick={(e) => { e.stopPropagation(); onTagClick?.(tag); }}
          className={cn(
            'inline-flex items-center gap-0.5 rounded-lg border font-medium transition-all',
            'hover:bg-accent/10 hover:border-accent/30 hover:text-accent',
            'text-muted-foreground border-border/60',
            sizes[size],
          )}
        >
          <Hash className={cn(size === 'xs' ? 'h-2.5 w-2.5' : size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
          {tag}
        </button>
      ))}
      {remaining > 0 && (
        <span className={cn('inline-flex items-center text-muted-foreground/60 font-medium', sizes[size])}>
          +{remaining} more
        </span>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   3. TAG INPUT — reusable tag editor with autocomplete
   ═══════════════════════════════════════════════════════════ */

// Trending/suggested tags (would come from API in production)
const SUGGESTED_TAGS = [
  'remotework', 'hiring2026', 'aitools', 'freelancing', 'startup',
  'productdesign', 'leadership', 'engineering', 'design', 'ux',
  'marketing', 'sales', 'fintech', 'saas', 'blockchain',
  'machinelearning', 'cloudcomputing', 'devops', 'agile', 'growth',
  'branding', 'contentcreation', 'networking', 'mentorship', 'innovation',
];

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  suggestions?: string[];
  variant?: 'default' | 'compact';
  className?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  onChange,
  placeholder = 'Add tag...',
  maxTags = 20,
  suggestions = SUGGESTED_TAGS,
  variant = 'default',
  className,
}) => {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = input.trim()
    ? suggestions.filter(s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)).slice(0, 6)
    : [];

  const addTag = useCallback((tag: string) => {
    const clean = tag.replace(/^#/, '').trim().toLowerCase().replace(/[^a-z0-9_\u00C0-\u024F]/gi, '');
    if (!clean || clean.length < 2) return;
    if (tags.includes(clean)) { toast.info(`"#${clean}" already added`); return; }
    if (tags.length >= maxTags) { toast.info(`Maximum ${maxTags} tags allowed`); return; }
    onChange([...tags, clean]);
    setInput('');
    setShowSuggestions(false);
  }, [tags, onChange, maxTags]);

  const removeTag = useCallback((tag: string) => {
    onChange(tags.filter(t => t !== tag));
  }, [tags, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',' || e.key === ' ') && input.trim()) {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isCompact = variant === 'compact';

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className={cn(
        'flex flex-wrap gap-1.5 rounded-xl border bg-background transition-all',
        'focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent/40',
        isCompact ? 'p-1.5 min-h-[32px]' : 'p-2.5 min-h-[40px]',
      )}>
        {tags.map(tag => (
          <Badge
            key={tag}
            variant="secondary"
            className={cn(
              'gap-1 pr-1 font-medium transition-all hover:bg-destructive/10 group/tag',
              isCompact ? 'text-[9px] h-5' : 'text-[10px] h-6',
            )}
          >
            <Hash className={cn(isCompact ? 'h-2 w-2' : 'h-2.5 w-2.5', 'text-accent')} />
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="ml-0.5 hover:text-destructive transition-colors"
            >
              <X className={cn(isCompact ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={e => { setInput(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : 'Add more...'}
          className={cn(
            'flex-1 min-w-[80px] bg-transparent focus:outline-none',
            isCompact ? 'text-[10px]' : 'text-xs',
          )}
        />
      </div>

      {/* Autocomplete dropdown */}
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border bg-popover shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {filtered.map(s => (
            <button
              key={s}
              onClick={() => addTag(s)}
              className="w-full flex items-center gap-2 px-3 py-2 text-[11px] hover:bg-muted/60 transition-colors text-left"
            >
              <Hash className="h-3 w-3 text-accent/60" />
              <span className="font-medium">{s}</span>
              <TrendingUp className="h-2.5 w-2.5 text-muted-foreground/40 ml-auto" />
            </button>
          ))}
        </div>
      )}

      {/* Tag count indicator */}
      {tags.length > 0 && (
        <div className="flex items-center justify-between mt-1.5 px-1">
          <span className="text-[9px] text-muted-foreground/60">
            {tags.length}/{maxTags} tags
          </span>
          {tags.length > 3 && (
            <button
              onClick={() => onChange([])}
              className="text-[9px] text-muted-foreground/60 hover:text-destructive transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   4. TRENDING TAGS — sidebar widget
   ═══════════════════════════════════════════════════════════ */

interface TrendingTag {
  tag: string;
  posts: string | number;
  trending?: boolean;
}

interface TrendingTagsWidgetProps {
  tags: TrendingTag[];
  onTagClick?: (tag: string) => void;
  title?: string;
  className?: string;
}

export const TrendingTagsWidget: React.FC<TrendingTagsWidgetProps> = ({
  tags,
  onTagClick,
  title = 'Trending',
  className,
}) => (
  <div className={cn('rounded-2xl border bg-card p-3.5 shadow-sm', className)}>
    <div className="flex items-center gap-1.5 mb-2.5">
      <TrendingUp className="h-3.5 w-3.5 text-accent" />
      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{title}</span>
    </div>
    <div className="space-y-1.5">
      {tags.map((t, i) => (
        <button
          key={t.tag}
          onClick={() => onTagClick?.(t.tag.replace('#', ''))}
          className="w-full flex items-center justify-between hover:bg-muted/30 rounded-xl px-2.5 py-1.5 transition-all group text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-muted-foreground/40 w-3">{i + 1}</span>
            <span className="text-[10px] text-accent font-medium group-hover:underline">{t.tag}</span>
          </div>
          <span className="text-[9px] text-muted-foreground">{t.posts}</span>
        </button>
      ))}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   5. TOPIC CHIPS — browsable topic cloud
   ═══════════════════════════════════════════════════════════ */

interface TopicCloudProps {
  topics: string[];
  activeTopic?: string;
  onTopicClick?: (topic: string) => void;
  title?: string;
  className?: string;
}

export const TopicCloud: React.FC<TopicCloudProps> = ({
  topics,
  activeTopic,
  onTopicClick,
  title = 'Topics',
  className,
}) => (
  <div className={cn('rounded-2xl border bg-card p-3.5 shadow-sm', className)}>
    <div className="flex items-center gap-1.5 mb-2.5">
      <Hash className="h-3.5 w-3.5 text-accent" />
      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{title}</span>
    </div>
    <div className="flex flex-wrap gap-1.5">
      {topics.map(t => (
        <button
          key={t}
          onClick={() => onTopicClick?.(t)}
          className={cn(
            'flex items-center gap-0.5 text-[9px] px-2.5 py-1 rounded-xl border cursor-pointer transition-all font-medium',
            activeTopic === t
              ? 'bg-accent/15 border-accent/40 text-accent'
              : 'hover:bg-accent/10 hover:border-accent/30 hover:text-accent',
          )}
        >
          <Hash className="h-2.5 w-2.5" />{t}
        </button>
      ))}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   6. HOOK — useHashtagFilter for filtering content by tag
   ═══════════════════════════════════════════════════════════ */

export function useHashtagFilter() {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const handleTagClick = useCallback((tag: string) => {
    const normalized = tag.replace(/^#/, '').toLowerCase();
    if (activeTag === normalized) {
      setActiveTag(null);
      toast.info('Filter cleared');
    } else {
      setActiveTag(normalized);
      toast.info(`Filtering by #${normalized}`);
    }
  }, [activeTag]);

  const filterByTag = useCallback(<T extends { hashtags?: string[] }>(items: T[]): T[] => {
    if (!activeTag) return items;
    return items.filter(item => item.hashtags?.some(h => h.toLowerCase() === activeTag));
  }, [activeTag]);

  const clearFilter = useCallback(() => setActiveTag(null), []);

  return { activeTag, handleTagClick, filterByTag, clearFilter };
}
