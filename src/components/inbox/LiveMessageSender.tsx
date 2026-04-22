/**
 * Live message sender — drop-in for the bottom of any inbox/chat view.
 * Wired to /api/v1/inbox/threads/:id/messages. Falls back to toast in preview.
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Smile, Send, Loader2, Mic, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSendMessage, inboxApiConfigured } from '@/lib/api/inbox';
import { toast } from 'sonner';

interface Props {
  threadId?: string;
  onSent?: () => void;
  placeholder?: string;
}

export function LiveMessageSender({ threadId, onSent, placeholder = 'Write a message…' }: Props) {
  const [text, setText] = useState('');
  const apiOn = inboxApiConfigured();
  const send = useSendMessage(threadId ?? '');

  const submit = () => {
    const body = text.trim();
    if (body.length < 1) return;
    if (!threadId) { toast.error('Pick a thread first'); return; }
    if (!apiOn) {
      toast.success('Sent (preview mode — set VITE_GIGVORA_API_URL to deliver)');
      setText(''); onSent?.();
      return;
    }
    send.mutate({ body }, { onSuccess: () => { setText(''); onSent?.(); } });
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  return (
    <div className="rounded-2xl border border-border/40 bg-card p-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKey}
        placeholder={placeholder}
        className="min-h-[44px] text-sm resize-none border-0 bg-transparent focus-visible:ring-0 p-1"
        maxLength={4000}
      />
      <div className="flex items-center justify-between border-t border-border/30 pt-1.5">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" type="button"><Paperclip className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" type="button"><Smile className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" type="button"><Mic className="h-3.5 w-3.5" /></Button>
        </div>
        <div className="flex items-center gap-2">
          {!apiOn && <Badge variant="secondary" className="gap-1 text-[8px]"><WifiOff className="h-2.5 w-2.5" />Preview</Badge>}
          <span className="text-[9px] text-muted-foreground">{text.length}/4000 · ⏎ to send</span>
          <Button size="sm" className="h-7 text-[10px] gap-1" onClick={submit} disabled={send.isPending || text.trim().length < 1 || !threadId}>
            {send.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
