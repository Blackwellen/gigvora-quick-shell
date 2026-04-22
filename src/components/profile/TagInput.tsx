import React, { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface TagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  maxTags?: number;
  maxLength?: number;
  className?: string;
  variant?: 'default' | 'soft' | 'outline';
}

/**
 * Enterprise tag input — used for skills, job tags, technologies, languages.
 * - Enter / comma to commit
 * - Backspace on empty input removes last
 * - Optional autocomplete suggestion list
 * - Dedup + trim + maxTags + maxLength enforced
 */
export const TagInput: React.FC<TagInputProps> = ({
  value,
  onChange,
  placeholder = 'Add a tag…',
  suggestions = [],
  maxTags = 50,
  maxLength = 40,
  className,
  variant = 'soft',
}) => {
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const lower = value.map((v) => v.toLowerCase());
  const filtered = suggestions
    .filter((s) => !lower.includes(s.toLowerCase()) && s.toLowerCase().includes(draft.toLowerCase()))
    .slice(0, 8);

  const commit = (raw: string) => {
    const t = raw.trim().slice(0, maxLength);
    if (!t) return;
    if (lower.includes(t.toLowerCase())) return;
    if (value.length >= maxTags) return;
    onChange([...value, t]);
    setDraft('');
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit(draft);
    } else if (e.key === 'Backspace' && draft === '' && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const badgeVariant = variant === 'outline' ? 'outline' : 'secondary';

  return (
    <div className={cn('w-full', className)}>
      <div className="flex flex-wrap gap-1.5 rounded-xl border bg-background p-2 focus-within:ring-2 focus-within:ring-ring transition-shadow">
        {value.map((t) => (
          <Badge
            key={t}
            variant={badgeVariant}
            className="text-[11px] rounded-lg px-2 py-1 gap-1 group"
          >
            {t}
            <button
              type="button"
              onClick={() => onChange(value.filter((v) => v !== t))}
              className="opacity-60 hover:opacity-100 transition-opacity"
              aria-label={`Remove ${t}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <div className="relative flex-1 min-w-[140px]">
          <Input
            ref={inputRef}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={onKey}
            placeholder={value.length >= maxTags ? `Limit ${maxTags} reached` : placeholder}
            disabled={value.length >= maxTags}
            className="border-0 h-7 px-1 text-xs shadow-none focus-visible:ring-0"
          />
          {open && filtered.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-xl border bg-popover shadow-lg max-h-56 overflow-auto">
              {filtered.map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commit(s)}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-muted-foreground">Press Enter or , to add</span>
        <span className="text-[9px] text-muted-foreground">{value.length}/{maxTags}</span>
      </div>
    </div>
  );
};
