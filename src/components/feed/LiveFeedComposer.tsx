/**
 * Live feed composer — replaces dead "post" buttons across the app.
 * Wired to /api/v1/feed/posts. Falls back to a toast in preview mode.
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Image as ImageIcon, Video, FileText, BarChart3, Send, Loader2, WifiOff } from 'lucide-react';
import { useCreatePost, feedApiConfigured } from '@/lib/api/feed';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Props {
  authorInitials?: string;
  context?: 'for-you' | 'network' | 'opportunities' | 'creators' | 'following';
  onPosted?: () => void;
}

export function LiveFeedComposer({ authorInitials = 'YO', context = 'for-you', onPosted }: Props) {
  const [body, setBody] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const create = useCreatePost();
  const apiOn = feedApiConfigured();

  const handlePost = () => {
    const trimmed = body.trim();
    if (trimmed.length < 1) { toast.error('Write something first'); return; }
    if (!apiOn) {
      toast.success('Post staged (preview mode — set VITE_GIGVORA_API_URL to publish)');
      setBody(''); setHashtags([]);
      onPosted?.();
      return;
    }
    create.mutate(
      { body: trimmed, hashtags, visibility: 'public' },
      { onSuccess: () => { setBody(''); setHashtags([]); onPosted?.(); } },
    );
  };

  // Extract #hashtags as user types
  React.useEffect(() => {
    const tags = Array.from(body.matchAll(/#(\w{2,30})/g)).map((m) => m[1]);
    setHashtags(Array.from(new Set(tags)));
  }, [body]);

  return (
    <div className="rounded-2xl border border-border/40 bg-card p-3 space-y-2">
      <div className="flex gap-2">
        <Avatar className="h-8 w-8"><AvatarFallback>{authorInitials}</AvatarFallback></Avatar>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share an update, opportunity, or insight…"
          className="min-h-[60px] text-sm resize-none border-0 bg-transparent focus-visible:ring-0 p-1"
          maxLength={5000}
        />
      </div>
      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1 px-10">
          {hashtags.map((t) => <Badge key={t} variant="secondary" className="text-[9px]">#{t}</Badge>)}
        </div>
      )}
      <div className="flex items-center justify-between border-t border-border/30 pt-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" type="button"><ImageIcon className="h-3 w-3" /> Photo</Button>
          <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" type="button"><Video className="h-3 w-3" /> Video</Button>
          <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" type="button"><FileText className="h-3 w-3" /> Doc</Button>
          <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" type="button"><BarChart3 className="h-3 w-3" /> Poll</Button>
        </div>
        <div className="flex items-center gap-2">
          {!apiOn && <Badge variant="secondary" className="gap-1 text-[8px]"><WifiOff className="h-2.5 w-2.5" />Preview</Badge>}
          <span className="text-[9px] text-muted-foreground">{body.length}/5000</span>
          <Button size="sm" className="h-7 text-[10px] gap-1" onClick={handlePost} disabled={create.isPending || body.trim().length < 1}>
            {create.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            Post
          </Button>
        </div>
      </div>
    </div>
  );
}
