/**
 * MessageUserDialog — universal admin → any-user composer.
 *
 * Usable from any admin portal (CS, Finance, Moderation, Ops, Super, Marketing).
 * Two-pane flow:
 *   1. Search any user (by name, handle, email, id) via the Gigvora SDK.
 *   2. Compose body, optional banner, channel (Inbox DM | System notice).
 *
 * The active admin role is recorded server-side as the sender context so the
 * recipient sees "Customer Service" / "Trust & Safety" / etc. in the envelope,
 * and every send is audit-trailed.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Search, Send, MessageSquare, Megaphone, Shield, ChevronLeft,
  CheckCircle2, AlertTriangle, User as UserIcon,
} from 'lucide-react';
import {
  useAdminUserSearch,
  useAdminComposeMessage,
  type AdminUserResult,
} from '@/lib/api/adminMessaging';
import type { AdminRole } from '@/lib/adminAuth';

interface Props {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  /** Admin's active role (passed in to avoid double-importing useAdminAuth). */
  asRole: AdminRole;
  /** Optional preset recipient — skips the search step. */
  preset?: AdminUserResult;
  /** Optional default banner / subject. */
  defaultBanner?: string;
}

const ROLE_LABEL: Record<AdminRole, string> = {
  'super-admin': 'Super Admin',
  'cs-admin': 'Customer Service',
  'finance-admin': 'Finance',
  'moderator': 'Moderation',
  'trust-safety': 'Trust & Safety',
  'dispute-mgr': 'Dispute Ops',
  'ads-ops': 'Ads Ops',
  'compliance': 'Compliance',
  'marketing-admin': 'Marketing',
};

const STATUS_TONE: Record<NonNullable<AdminUserResult['status']>, string> = {
  active: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  restricted: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  suspended: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  deleted: 'bg-muted text-muted-foreground',
};

export const MessageUserDialog: React.FC<Props> = ({
  open, onOpenChange, asRole, preset, defaultBanner,
}) => {
  const [step, setStep] = useState<'pick' | 'compose'>(preset ? 'compose' : 'pick');
  const [recipient, setRecipient] = useState<AdminUserResult | null>(preset ?? null);
  const [query, setQuery] = useState('');
  const [body, setBody] = useState('');
  const [banner, setBanner] = useState(defaultBanner ?? '');
  const [channel, setChannel] = useState<'inbox' | 'notice'>('inbox');

  const { data: results = [], isFetching } = useAdminUserSearch(query, 8);
  const compose = useAdminComposeMessage();

  // Reset state on open/close so dialog is fresh each time.
  useEffect(() => {
    if (open) {
      setStep(preset ? 'compose' : 'pick');
      setRecipient(preset ?? null);
      setQuery('');
      setBody('');
      setBanner(defaultBanner ?? '');
      setChannel('inbox');
    }
  }, [open, preset, defaultBanner]);

  const senderLabel = useMemo(() => ROLE_LABEL[asRole], [asRole]);
  const canSend = !!recipient && body.trim().length >= 2 && !compose.isPending;

  const handleSend = async () => {
    if (!recipient) return;
    try {
      await compose.mutateAsync({
        recipientId: recipient.id,
        body: body.trim(),
        banner: banner.trim() || undefined,
        channel,
        asRole,
      });
      onOpenChange(false);
    } catch {
      /* toast already handled inside the hook */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-[15px] font-semibold">Message any user</DialogTitle>
              <DialogDescription className="text-[12px] mt-0.5">
                Sending as <span className="font-medium text-foreground">{senderLabel}</span> · audit-logged
              </DialogDescription>
            </div>
            {step === 'compose' && !preset && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('pick')}
                className="h-8 text-[12px]"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Change
              </Button>
            )}
          </div>
        </DialogHeader>

        {step === 'pick' && (
          <div className="px-5 py-4">
            <div className="relative mb-3">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, @handle, email, or user id…"
                className="pl-9 h-10 rounded-lg text-[13px]"
                autoFocus
              />
            </div>
            <ScrollArea className="h-[280px] -mx-1">
              <ul className="px-1 py-0.5 space-y-1">
                {results.length === 0 && !isFetching && (
                  <li className="text-center py-10 text-[12px] text-muted-foreground">
                    No users matched "<span className="font-medium">{query}</span>"
                  </li>
                )}
                {results.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setRecipient(u);
                        setStep('compose');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/60 transition-colors text-left"
                    >
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-[12px] font-semibold uppercase shrink-0">
                        {u.displayName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-medium truncate">{u.displayName}</span>
                          {u.handle && <span className="text-[11px] text-muted-foreground">{u.handle}</span>}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">{u.email ?? u.id}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {u.type && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1.5 capitalize rounded">
                            {u.type}
                          </Badge>
                        )}
                        {u.status && u.status !== 'active' && (
                          <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-medium capitalize', STATUS_TONE[u.status])}>
                            {u.status}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        )}

        {step === 'compose' && recipient && (
          <div className="px-5 py-4 space-y-3.5">
            {/* Recipient strip */}
            <div className="flex items-center gap-3 p-3 rounded-xl border bg-muted/20">
              <div className="h-9 w-9 rounded-full bg-card flex items-center justify-center text-[12px] font-semibold uppercase shrink-0 border">
                {recipient.displayName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-medium truncate">{recipient.displayName}</span>
                  {recipient.handle && <span className="text-[11px] text-muted-foreground">{recipient.handle}</span>}
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                </div>
                <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
                  <UserIcon className="h-2.5 w-2.5" />
                  {recipient.email ?? recipient.id}
                  {recipient.status && recipient.status !== 'active' && (
                    <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-medium capitalize', STATUS_TONE[recipient.status])}>
                      {recipient.status}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Channel selector */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/40 w-fit">
              {([
                { id: 'inbox' as const, label: 'Inbox DM', icon: MessageSquare },
                { id: 'notice' as const, label: 'System notice', icon: Megaphone },
              ]).map((opt) => {
                const Icon = opt.icon;
                const active = channel === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setChannel(opt.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-colors',
                      active
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Banner / subject */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                Subject banner <span className="lowercase font-normal opacity-70">(optional)</span>
              </label>
              <Input
                value={banner}
                onChange={(e) => setBanner(e.target.value)}
                placeholder={`${senderLabel} · brief subject…`}
                className="h-9 text-[13px] rounded-lg"
                maxLength={80}
              />
            </div>

            {/* Body */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Message
              </label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message…"
                rows={5}
                className="text-[13px] rounded-lg resize-none"
                maxLength={2000}
              />
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[10.5px] text-muted-foreground flex items-center gap-1">
                  <Shield className="h-2.5 w-2.5" /> Recorded in audit log
                </span>
                <span className="text-[10.5px] text-muted-foreground tabular-nums">
                  {body.length} / 2000
                </span>
              </div>
            </div>

            {channel === 'notice' && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11.5px] text-amber-800 dark:text-amber-200">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>System notices render with high visibility in the recipient's inbox and cannot be ignored. Use for compliance or account actions.</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="px-5 py-3 border-t bg-muted/10 flex sm:justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {step === 'compose' && (
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!canSend}
              className="gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              {compose.isPending ? 'Sending…' : channel === 'notice' ? 'Send notice' : 'Send message'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
