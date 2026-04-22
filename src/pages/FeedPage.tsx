import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageCircle, Share2, Bookmark, MoreHorizontal,
  ThumbsUp, Image, Video, FileText, BarChart3, Send,
  TrendingUp, Calendar, Users, UserPlus, BookmarkCheck,
  Sparkles, Loader2, Flag, AlertTriangle,
  CheckCircle2, ExternalLink, RefreshCw, X,
  Briefcase, Layers, Globe, Heart, Repeat2,
  Shield, Hash, Activity, MapPin, Zap, Crown,
  Play, Mic, Radio, Clock, Award, Star,
  Eye, ArrowRight, ChevronRight, MessageSquare,
  MoreVertical, Smile, Gift, Bell, Coffee,
  Flame, Target, Headphones, Tv, BookOpen,
} from 'lucide-react';
import { MOCK_FEED, MOCK_TRENDING, MOCK_SUGGESTED_CONNECTIONS, MOCK_UPCOMING_EVENTS, MOCK_USERS } from '@/data/mock';
import type { FeedPost } from '@/data/mock';
import { cn } from '@/lib/utils';
import { useAI } from '@/hooks/useAI';
import { toast } from 'sonner';
import { useCreatePost, feedApiConfigured } from '@/lib/api/feed';
import { Badge as LiveBadge2 } from '@/components/ui/badge';
import { WifiOff } from 'lucide-react';
import { RichAvatar, StackedAvatars, LiveBadge, ActivityTrace, ReactionBar, EventCountdown, Waveform } from '@/components/social/SocialPrimitives';
import { RichText, HashtagChips, TrendingTagsWidget, TopicCloud, useHashtagFilter } from '@/components/social/TagSystem';

/* ═══════════════════════════════════════════════════════════
   Types & Constants
   ═══════════════════════════════════════════════════════════ */
type FeedContext = 'for-you' | 'network' | 'opportunities' | 'creators' | 'following';

const CONTEXT_TABS: { id: FeedContext; label: string; icon: React.ElementType }[] = [
  { id: 'for-you', label: 'For You', icon: Sparkles },
  { id: 'network', label: 'Network', icon: Globe },
  { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
  { id: 'creators', label: 'Creators', icon: Mic },
  { id: 'following', label: 'Following', icon: Users },
];

const OPPORTUNITY_POSTS: FeedPost[] = MOCK_FEED.filter(p => p.sharedEntity);

const REACTIONS = [
  { emoji: '👍', label: 'Like' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '💡', label: 'Insightful' },
  { emoji: '👏', label: 'Celebrate' },
];

/* ═══════════════════════════════════════════════════════════
   Post Composer (inline feed)
   ═══════════════════════════════════════════════════════════ */
const PostComposer: React.FC = () => {
  const [content, setContent] = useState('');
  const [attachType, setAttachType] = useState<string | null>(null);
  const { loading: aiLoading, invoke: aiInvoke } = useAI({ type: 'writing-assist' });

  const handleAIAssist = async () => {
    if (!content.trim()) { toast.info('Write something first, then use AI to polish it.'); return; }
    const result = await aiInvoke({ text: content, action: 'Polish this post for a professional networking platform. Keep the same meaning but make it more engaging and professional.' });
    if (result) setContent(result);
  };

  const createPost = useCreatePost();
  const apiOn = feedApiConfigured();
  const handlePublish = () => {
    const body = content.trim();
    if (body.length < 1) return;
    const tags = Array.from(body.matchAll(/#(\w{2,30})/g)).map((m) => m[1]);
    if (!apiOn) { toast.success('Post staged (preview mode — set VITE_GIGVORA_API_URL to publish)'); setContent(''); setAttachType(null); return; }
    createPost.mutate({ body, hashtags: tags, visibility: 'public' }, {
      onSuccess: () => { setContent(''); setAttachType(null); },
    });
  };

  return (
    <div className="rounded-3xl border bg-card shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="flex gap-3 p-4">
        <RichAvatar name="Demo User" size="md" status="online" />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Share an update, insight, or opportunity..."
            className="w-full bg-transparent border-none resize-none text-[12px] placeholder:text-muted-foreground/60 focus:outline-none min-h-[52px] leading-relaxed"
          />
          {attachType && (
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant="secondary" className="text-[8px] h-4 capitalize rounded-lg">{attachType}</Badge>
              <button onClick={() => setAttachType(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-2.5 w-2.5" /></button>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5 border-t bg-muted/20">
        <div className="flex items-center gap-0.5 flex-wrap">
          {[
            { icon: Image, label: 'Photo', color: 'text-[hsl(var(--gigvora-green))]' },
            { icon: Video, label: 'Video', color: 'text-[hsl(var(--gigvora-blue))]' },
            { icon: FileText, label: 'Article', color: 'text-[hsl(var(--state-caution))]' },
            { icon: BarChart3, label: 'Poll', color: 'text-accent' },
            { icon: Briefcase, label: 'Job', color: 'text-muted-foreground' },
            { icon: Layers, label: 'Gig', color: 'text-muted-foreground' },
          ].map(a => (
            <Button key={a.label} variant="ghost" size="sm" className={cn('text-[9px] gap-1 h-7 px-2 rounded-xl', a.color)} onClick={() => setAttachType(a.label)}>
              <a.icon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{a.label}</span>
            </Button>
          ))}
          <Button variant="ghost" size="sm" className="text-[9px] gap-1 text-accent h-7 px-2 rounded-xl" onClick={handleAIAssist} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} AI
          </Button>
        </div>
        {!apiOn && <LiveBadge2 variant="secondary" className="gap-1 text-[8px] mr-2"><WifiOff className="h-2.5 w-2.5" />Preview</LiveBadge2>}
        <Button size="sm" className="h-8 text-[10px] rounded-xl px-4 gap-1.5" disabled={!content.trim() || createPost.isPending} onClick={handlePublish}>
          {createPost.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} Post
        </Button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Post Card — richer, more social
   ═══════════════════════════════════════════════════════════ */
const MOCK_COMMENTS = [
  { id: '1', user: MOCK_USERS[0], text: 'Great insights! This is exactly what I have been thinking about lately.', time: '2h ago', likes: 5, replies: [
    { id: '1a', user: MOCK_USERS[2], text: 'Totally agree - the market is shifting fast.', time: '1h ago', likes: 2 },
    { id: '1b', user: MOCK_USERS[4], text: 'Would love to discuss this further!', time: '45m ago', likes: 1 },
  ]},
  { id: '2', user: MOCK_USERS[1], text: 'Thanks for sharing this perspective. Really valuable for our hiring strategy.', time: '3h ago', likes: 8, replies: [] },
  { id: '3', user: MOCK_USERS[3], text: 'Bookmarking this for my team.', time: '5h ago', likes: 3, replies: [
    { id: '3a', user: MOCK_USERS[0], text: 'Glad it resonates!', time: '4h ago', likes: 1 },
  ]},
];

const InlineComment: React.FC<{ user: any; text: string; time: string; likes: number; isReply?: boolean }> = ({ user, text, time, likes, isReply }) => {
  const [liked, setLiked] = useState(false);
  return (
    <div className={cn('flex gap-2', isReply && 'ml-8')}>
      <RichAvatar name={user.name} src={user.avatar} size={isReply ? 'xs' : 'sm'} />
      <div className="flex-1 min-w-0">
        <div className="rounded-2xl bg-muted/40 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold">{user.name}</span>
            {user.verified && <CheckCircle2 className="h-2.5 w-2.5 text-accent" />}
            <Badge variant="secondary" className="text-[7px] h-3 capitalize rounded-lg">{user.role}</Badge>
          </div>
          <p className="text-[10px] mt-0.5 leading-relaxed">{text}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 px-1 text-[9px] text-muted-foreground">
          <button onClick={() => setLiked(!liked)} className={cn('hover:text-accent transition-colors font-medium', liked && 'text-accent')}>
            {liked ? '❤️' : 'Like'} {likes + (liked ? 1 : 0) > 0 && `(${likes + (liked ? 1 : 0)})`}
          </button>
          <button className="hover:text-accent transition-colors font-medium">Reply</button>
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
};

const PostCard: React.FC<{ post: FeedPost; onSelectDetail: () => void }> = ({ post, onSelectDetail }) => {
  const [liked, setLiked] = useState(post.liked || false);
  const [saved, setSaved] = useState(post.saved || false);
  const [showReactions, setShowReactions] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(liked ? '👍' : null);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const initials = post.author.name.split(' ').map(n => n[0]).join('');

  const handleReaction = (emoji: string) => {
    if (selectedReaction === emoji) {
      setSelectedReaction(null);
      setLiked(false);
    } else {
      setSelectedReaction(emoji);
      setLiked(true);
    }
    setShowReactions(false);
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  return (
    <div className="rounded-3xl border bg-card overflow-hidden shadow-sm hover-lift feed-card group/post">
      {/* Author row */}
      <div className="flex items-start justify-between p-4 pb-2">
        <div className="flex gap-3">
          <RichAvatar
            name={post.author.name}
            src={post.author.avatar}
            size="md"
            status={post.author.verified ? 'online' : undefined}
            verified={post.author.verified}
          />
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link to={`/profile/${post.author.id}`} className="text-[11px] font-bold hover:text-accent transition-colors">{post.author.name}</Link>
              <Badge variant="secondary" className="text-[7px] h-3.5 capitalize rounded-lg">{post.author.role}</Badge>
            </div>
            <p className="text-[10px] text-muted-foreground leading-snug">{post.author.headline}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Clock className="h-2.5 w-2.5 text-muted-foreground/50" />
              <span className="text-[9px] text-muted-foreground/70">{post.createdAt}</span>
              <span className="text-[9px] text-muted-foreground/30">·</span>
              <Globe className="h-2.5 w-2.5 text-muted-foreground/50" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl opacity-0 group-hover/post:opacity-100 transition-opacity">
            <Bookmark className="h-3 w-3 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl">
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <RichText
          text={post.content}
          onHashtagClick={(tag) => toast.info(`Filtering by #${tag}`)}
          onMentionClick={(handle) => toast.info(`Viewing @${handle}'s profile`)}
          className="text-[11px] whitespace-pre-line leading-[1.6]"
        />
        {post.hashtags && post.hashtags.length > 0 && (
          <HashtagChips
            tags={post.hashtags}
            onTagClick={(tag) => toast.info(`Filtering by #${tag}`)}
            size="xs"
            className="mt-2"
          />
        )}
      </div>

      {/* Shared Entity / Opportunity Card */}
      {post.sharedEntity && (
        <div className="mx-4 mb-3 rounded-2xl border bg-gradient-to-br from-muted/30 to-muted/10 overflow-hidden cursor-pointer hover:shadow-sm transition-all group/entity" onClick={onSelectDetail}>
          <div className="h-24 bg-gradient-to-r from-accent/5 to-[hsl(var(--gigvora-blue)/0.05)] flex items-center justify-center">
            {post.sharedEntity.type === 'job' ? <Briefcase className="h-8 w-8 text-accent/20" /> :
             post.sharedEntity.type === 'gig' ? <Layers className="h-8 w-8 text-accent/20" /> :
             <FileText className="h-8 w-8 text-accent/20" />}
          </div>
          <div className="p-3.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Badge className="text-[7px] h-3.5 rounded-lg bg-accent/10 text-accent border-0 uppercase tracking-wider">{post.sharedEntity.type}</Badge>
              {post.sharedEntity.type === 'job' && <Badge className="text-[7px] h-3.5 rounded-lg bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] border-0">Open</Badge>}
            </div>
            <div className="font-bold text-[12px] group-hover/entity:text-accent transition-colors">{post.sharedEntity.title}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{post.sharedEntity.subtitle}</div>
            <div className="flex items-center justify-between mt-2.5">
              <div className="flex -space-x-1.5">
                {['A', 'B', 'C'].map(l => (
                  <div key={l} className="h-5 w-5 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[7px] font-bold text-muted-foreground">{l}</div>
                ))}
                <div className="h-5 w-5 rounded-full bg-accent/10 border-2 border-card flex items-center justify-center text-[7px] font-bold text-accent">+5</div>
              </div>
              <Button variant="outline" size="sm" className="text-[9px] h-6 rounded-xl gap-1">
                View <ArrowRight className="h-2.5 w-2.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Poll */}
      {post.poll && (
        <div className="mx-4 mb-3 space-y-1.5">
          {post.poll.options.map(opt => {
            const pct = Math.round((opt.votes / post.poll!.totalVotes) * 100);
            return (
              <div key={opt.label} className="relative rounded-2xl border overflow-hidden cursor-pointer hover:border-accent/30 transition-all group/poll">
                <div className="absolute inset-0 bg-accent/8 rounded-2xl" style={{ width: `${pct}%` }} />
                <div className="relative flex items-center justify-between px-3.5 py-2.5">
                  <span className="text-[11px] font-medium">{opt.label}</span>
                  <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{pct}%</span>
                </div>
              </div>
            );
          })}
          <p className="text-[9px] text-muted-foreground px-1">{post.poll.totalVotes.toLocaleString()} votes · 2 days left</p>
        </div>
      )}

      {/* Engagement stats */}
      <div className="px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="flex -space-x-0.5">
            {['👍', '❤️', '🔥'].map(e => (
              <span key={e} className="text-[10px]">{e}</span>
            ))}
          </div>
          <span className="ml-1">{(liked ? post.likes + 1 : post.likes).toLocaleString()}</span>
        </div>
        <div className="flex gap-3">
          <button className="hover:text-foreground hover:underline transition-colors" onClick={() => setShowComments(!showComments)}>{post.comments} comments</button>
          <span>{post.shares} reposts</span>
        </div>
      </div>

      {/* Reaction bar */}
      <div className="px-3 py-1.5 flex items-center border-t relative">
        {/* Reaction picker */}
        {showReactions && (
          <div className="absolute bottom-full left-3 mb-1 flex items-center gap-1 bg-card border rounded-2xl shadow-lg px-2 py-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200 z-10">
            {REACTIONS.map(r => (
              <button
                key={r.emoji}
                onClick={() => handleReaction(r.emoji)}
                className={cn(
                  'text-lg hover:scale-125 transition-transform p-0.5 rounded-lg',
                  selectedReaction === r.emoji && 'bg-accent/10 scale-110'
                )}
                title={r.label}
              >{r.emoji}</button>
            ))}
          </div>
        )}

        <Button
          variant="ghost" size="sm"
          className={cn('flex-1 text-[10px] gap-1.5 h-8 rounded-xl', selectedReaction && 'text-accent font-semibold')}
          onClick={() => setShowReactions(!showReactions)}
          onDoubleClick={() => handleReaction('👍')}
        >
          {selectedReaction ? <span className="text-sm">{selectedReaction}</span> : <ThumbsUp className="h-3.5 w-3.5" />}
          {selectedReaction ? REACTIONS.find(r => r.emoji === selectedReaction)?.label : 'Like'}
        </Button>
        <Button variant="ghost" size="sm" className={cn('flex-1 text-[10px] gap-1.5 h-8 rounded-xl', showComments && 'text-accent font-semibold')} onClick={() => setShowComments(!showComments)}>
          <MessageCircle className={cn('h-3.5 w-3.5', showComments && 'fill-current')} /> Comment
        </Button>
        <Button variant="ghost" size="sm" className="flex-1 text-[10px] gap-1.5 h-8 rounded-xl">
          <Repeat2 className="h-3.5 w-3.5" /> Repost
        </Button>
        <Button variant="ghost" size="sm" className="text-[10px] gap-1.5 h-8 rounded-xl">
          <Share2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className={cn('text-[10px] gap-1 h-8 rounded-xl', saved && 'text-accent')} onClick={() => setSaved(!saved)}>
          {saved ? <BookmarkCheck className="h-3.5 w-3.5 fill-current" /> : <Bookmark className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {/* ── Inline Comments Section ── */}
      {showComments && (
        <div className="border-t bg-muted/10 animate-in slide-in-from-top-2 duration-200">
          {/* Comment input */}
          <div className="flex gap-2.5 p-3.5 border-b border-border/50">
            <RichAvatar name="Demo User" size="sm" status="online" />
            <div className="flex-1 flex gap-1.5">
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 text-[10px] bg-card border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
                onKeyDown={e => { if (e.key === 'Enter' && commentText.trim()) { toast.success('Comment posted!'); setCommentText(''); } }}
              />
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-accent">
                  <Smile className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-accent">
                  <Image className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" className="h-8 rounded-xl px-3" disabled={!commentText.trim()}>
                  <Send className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Comments list */}
          <div className="p-3.5 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                {post.comments} Comments
              </span>
              <Button variant="ghost" size="sm" className="text-[9px] h-5 rounded-lg text-muted-foreground">Most relevant ▾</Button>
            </div>

            {MOCK_COMMENTS.map(comment => (
              <div key={comment.id} className="space-y-2">
                <InlineComment
                  user={comment.user}
                  text={comment.text}
                  time={comment.time}
                  likes={comment.likes}
                />
                {/* Replies toggle */}
                {comment.replies.length > 0 && (
                  <>
                    <button
                      onClick={() => toggleReplies(comment.id)}
                      className="ml-10 text-[9px] text-accent font-semibold hover:underline flex items-center gap-1"
                    >
                      <ChevronRight className={cn('h-2.5 w-2.5 transition-transform', expandedReplies.has(comment.id) && 'rotate-90')} />
                      {expandedReplies.has(comment.id) ? 'Hide' : 'View'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                    </button>
                    {expandedReplies.has(comment.id) && (
                      <div className="space-y-2 animate-in slide-in-from-top-1 duration-150">
                        {comment.replies.map(reply => (
                          <InlineComment
                            key={reply.id}
                            user={reply.user}
                            text={reply.text}
                            time={reply.time}
                            likes={reply.likes}
                            isReply
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            {post.comments > 3 && (
              <button className="w-full text-center text-[10px] text-accent font-medium py-2 hover:underline">
                View all {post.comments} comments
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Opportunity Card (standalone)
   ═══════════════════════════════════════════════════════════ */
const OpportunityCard: React.FC<{ type: 'job' | 'gig' | 'project'; title: string; company: string; meta: string; urgent?: boolean }> = ({ type, title, company, meta, urgent }) => (
  <div className="rounded-2xl border bg-card p-3.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
    <div className="flex items-start gap-3">
      <div className={cn(
        'h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
        type === 'job' ? 'bg-[hsl(var(--gigvora-blue)/0.1)]' : type === 'gig' ? 'bg-accent/10' : 'bg-[hsl(var(--gigvora-green)/0.1)]'
      )}>
        {type === 'job' ? <Briefcase className="h-4 w-4 text-[hsl(var(--gigvora-blue))]" /> :
         type === 'gig' ? <Layers className="h-4 w-4 text-accent" /> :
         <Target className="h-4 w-4 text-[hsl(var(--gigvora-green))]" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Badge className="text-[7px] h-3.5 rounded-lg bg-muted text-muted-foreground border-0 uppercase">{type}</Badge>
          {urgent && <Badge className="text-[7px] h-3.5 rounded-lg bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))] border-0">Urgent</Badge>}
        </div>
        <div className="text-[11px] font-bold mt-1 truncate group-hover:text-accent transition-colors">{title}</div>
        <div className="text-[10px] text-muted-foreground">{company}</div>
        <div className="text-[9px] text-muted-foreground mt-1">{meta}</div>
      </div>
    </div>
    <div className="flex items-center justify-between mt-2.5">
      <div className="flex -space-x-1">
        {['M', 'J'].map(l => (
          <div key={l} className="h-4 w-4 rounded-full bg-muted border border-card flex items-center justify-center text-[6px] font-bold text-muted-foreground">{l}</div>
        ))}
      </div>
      <Button variant="outline" size="sm" className="text-[9px] h-6 rounded-xl gap-1">
        {type === 'job' ? 'Apply' : type === 'gig' ? 'View Gig' : 'View'} <ChevronRight className="h-2.5 w-2.5" />
      </Button>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   State Banners
   ═══════════════════════════════════════════════════════════ */
const ModeratedPostBanner: React.FC = () => (
  <div className="rounded-2xl border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-3.5 flex items-center gap-3">
    <div className="h-8 w-8 rounded-xl bg-[hsl(var(--state-caution)/0.1)] flex items-center justify-center shrink-0">
      <Shield className="h-4 w-4 text-[hsl(var(--state-caution))]" />
    </div>
    <div className="flex-1">
      <div className="text-[11px] font-semibold">Post removed by moderation</div>
      <div className="text-[10px] text-muted-foreground">This content was flagged and removed for violating community guidelines.</div>
    </div>
    <Button variant="ghost" size="sm" className="text-[10px] h-7 rounded-xl">Appeal</Button>
  </div>
);

const EmptyFeedState: React.FC = () => (
  <div className="text-center py-14 rounded-3xl border bg-card">
    <div className="h-16 w-16 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
      <Activity className="h-7 w-7 text-muted-foreground/20" />
    </div>
    <div className="text-sm font-bold">Your feed is empty</div>
    <p className="text-[11px] text-muted-foreground mt-1.5 max-w-sm mx-auto leading-relaxed">
      Follow professionals, join groups, and create your first post to start building your feed.
    </p>
    <div className="flex justify-center gap-2 mt-5">
      <Button variant="outline" size="sm" className="text-[10px] h-8 rounded-xl gap-1.5"><Users className="h-3 w-3" />Find People</Button>
      <Button size="sm" className="text-[10px] h-8 rounded-xl gap-1.5"><Send className="h-3 w-3" />Create Post</Button>
    </div>
  </div>
);

const FeedErrorState: React.FC = () => (
  <div className="rounded-3xl border border-[hsl(var(--state-blocked)/0.3)] bg-[hsl(var(--state-blocked)/0.05)] p-6 text-center">
    <div className="h-14 w-14 rounded-2xl bg-[hsl(var(--state-blocked)/0.1)] flex items-center justify-center mx-auto mb-3">
      <AlertTriangle className="h-6 w-6 text-[hsl(var(--state-blocked))]/40" />
    </div>
    <div className="text-sm font-bold">Feed unavailable</div>
    <p className="text-[11px] text-muted-foreground mt-1">We're having trouble loading your feed. Please try again.</p>
    <Button variant="outline" size="sm" className="mt-4 text-[10px] h-8 rounded-xl gap-1.5"><RefreshCw className="h-3 w-3" />Retry</Button>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Post Detail Drawer
   ═══════════════════════════════════════════════════════════ */
const PostDetailDrawer: React.FC<{ post: FeedPost | null; open: boolean; onClose: () => void }> = ({ post, open, onClose }) => {
  if (!post) return null;
  const initials = post.author.name.split(' ').map(n => n[0]).join('');
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[440px] overflow-y-auto p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-sm font-bold">Post Detail</SheetTitle>
        </SheetHeader>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 ring-2 ring-accent/20">
              <AvatarFallback className="bg-accent/10 text-accent text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5">
                {post.author.name}
                {post.author.verified && <CheckCircle2 className="h-3.5 w-3.5 text-accent" />}
              </div>
              <div className="text-[10px] text-muted-foreground">{post.author.headline}</div>
              <div className="text-[9px] text-muted-foreground">{post.createdAt}</div>
            </div>
          </div>
          <p className="text-[11px] whitespace-pre-line leading-[1.6]">{post.content}</p>
          {post.sharedEntity && (
            <div className="rounded-2xl border bg-muted/30 p-3.5">
              <Badge className="text-[7px] h-3.5 rounded-lg bg-accent/10 text-accent border-0 uppercase mb-1">{post.sharedEntity.type}</Badge>
              <div className="text-xs font-bold">{post.sharedEntity.title}</div>
              <div className="text-[10px] text-muted-foreground">{post.sharedEntity.subtitle}</div>
            </div>
          )}
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground py-2 border-y">
            <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {post.likes}</span>
            <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {post.comments}</span>
            <span className="flex items-center gap-1"><Repeat2 className="h-3 w-3" /> {post.shares}</span>
          </div>

          {/* Comments */}
          <div>
            <div className="text-[11px] font-bold mb-2">Comments ({post.comments})</div>
            <div className="space-y-2.5">
              {MOCK_USERS.slice(0, 3).map(u => (
                <div key={u.id} className="flex gap-2.5">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="text-[8px] bg-muted font-bold">{u.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 rounded-2xl bg-muted/40 p-2.5">
                    <div className="text-[10px] font-semibold">{u.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Great insights! Thanks for sharing this perspective.</div>
                    <div className="flex items-center gap-3 mt-1.5 text-[9px] text-muted-foreground">
                      <button className="hover:text-accent transition-colors">Like</button>
                      <button className="hover:text-accent transition-colors">Reply</button>
                      <span>2h ago</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Avatar className="h-7 w-7 shrink-0"><AvatarFallback className="text-[8px] bg-accent/10 text-accent font-bold">DU</AvatarFallback></Avatar>
              <div className="flex-1 flex gap-1.5">
                <input placeholder="Write a comment..." className="flex-1 text-[10px] bg-muted/30 border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
                <Button size="sm" className="h-8 rounded-xl"><Send className="h-3 w-3" /></Button>
              </div>
            </div>
          </div>

          <div className="flex gap-1.5 pt-2">
            <Button variant="outline" size="sm" className="flex-1 text-[9px] h-7 rounded-xl gap-1"><Flag className="h-2.5 w-2.5" />Report</Button>
            <Button variant="outline" size="sm" className="flex-1 text-[9px] h-7 rounded-xl gap-1"><Bookmark className="h-2.5 w-2.5" />Save</Button>
            <Button size="sm" className="flex-1 text-[9px] h-7 rounded-xl gap-1"><ExternalLink className="h-2.5 w-2.5" />Open</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/* ═══════════════════════════════════════════════════════════
   LEFT RAIL — Identity & Shortcuts
   ═══════════════════════════════════════════════════════════ */
const FeedLeftRail: React.FC = () => (
  <div className="space-y-3">
    {/* Profile Card */}
    <div className="rounded-3xl border bg-card overflow-hidden shadow-sm">
      <div className="h-16 bg-gradient-to-r from-accent/10 via-[hsl(var(--gigvora-blue)/0.08)] to-accent/5" />
      <div className="px-3.5 pb-3.5 -mt-6">
        <Avatar className="h-12 w-12 ring-4 ring-card shadow-sm">
          <AvatarFallback className="bg-accent/10 text-accent text-sm font-bold">DU</AvatarFallback>
        </Avatar>
        <div className="mt-1.5">
          <div className="text-[11px] font-bold">Demo User</div>
          <div className="text-[10px] text-muted-foreground">Professional · Gigvora Member</div>
        </div>
        <div className="flex justify-between mt-3 px-1">
          <div className="text-center"><div className="text-[12px] font-bold">12</div><div className="text-[8px] text-muted-foreground uppercase tracking-wider">Posts</div></div>
          <div className="text-center"><div className="text-[12px] font-bold">247</div><div className="text-[8px] text-muted-foreground uppercase tracking-wider">Network</div></div>
          <div className="text-center"><div className="text-[12px] font-bold">1.2K</div><div className="text-[8px] text-muted-foreground uppercase tracking-wider">Views</div></div>
        </div>
        <Button variant="outline" size="sm" className="w-full mt-3 text-[10px] h-7 rounded-xl" asChild>
          <Link to="/profile">View Profile</Link>
        </Button>
      </div>
    </div>

    {/* Quick Links */}
    <div className="rounded-2xl border bg-card p-3 shadow-sm">
      <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Quick Links</div>
      <div className="space-y-0.5">
        {[
          { label: 'Saved Items', href: '/saved', icon: Bookmark, count: 8 },
          { label: 'My Groups', href: '/groups', icon: Users, count: 3 },
          { label: 'Calendar', href: '/calendar', icon: Calendar },
          { label: 'My Gigs', href: '/gigs', icon: Layers, count: 2 },
          { label: 'My Jobs', href: '/jobs', icon: Briefcase },
        ].map(l => (
          <Link key={l.label} to={l.href} className="flex items-center gap-2 py-1.5 px-2.5 rounded-xl text-[10px] hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all group">
            <l.icon className="h-3.5 w-3.5 group-hover:text-accent transition-colors" />
            <span className="flex-1">{l.label}</span>
            {l.count && <span className="text-[8px] bg-muted rounded-md px-1.5 py-0.5 font-medium">{l.count}</span>}
          </Link>
        ))}
      </div>
    </div>

    {/* Upcoming Events */}
    <div className="rounded-2xl border bg-card p-3 shadow-sm">
      <div className="flex items-center gap-1.5 mb-2">
        <Calendar className="h-3.5 w-3.5 text-accent" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Events</span>
      </div>
      <div className="space-y-2">
        {MOCK_UPCOMING_EVENTS.map(e => (
          <EventCountdown
            key={e.id}
            label={e.title}
            date={e.date}
            attendees={e.attendees}
            avatars={[
              { name: 'Sarah C.', src: 'https://i.pravatar.cc/150?u=sarah-chen' },
              { name: 'Alex K.', src: 'https://i.pravatar.cc/150?u=alex-kim' },
              { name: 'Priya P.', src: 'https://i.pravatar.cc/150?u=priya-patel' },
              { name: 'Marcus J.' },
              { name: 'Lisa W.' },
            ]}
          />
        ))}
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   RIGHT RAIL — Trending, Suggestions, Opportunities
   ═══════════════════════════════════════════════════════════ */
const FeedRightRail: React.FC = () => (
  <div className="space-y-3">
    {/* Trending */}
    <TrendingTagsWidget
      tags={MOCK_TRENDING}
      onTagClick={(tag) => toast.info(`Filtering by #${tag}`)}
    />
...
    {/* Topics */}
    <TopicCloud
      topics={['remotework', 'hiring2026', 'aitools', 'freelancing', 'startup', 'productdesign', 'leadership']}
      onTopicClick={(topic) => toast.info(`Browsing #${topic}`)}
    />

    {/* Live Now */}
    <div className="rounded-2xl border bg-card p-3.5 shadow-sm">
      <div className="flex items-center gap-1.5 mb-2.5">
        <Radio className="h-3.5 w-3.5 text-destructive" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Live Now</span>
        <LiveBadge variant="live" />
      </div>
      <div className="rounded-2xl border p-2.5 hover-lift cursor-pointer group">
        <div className="h-16 rounded-xl bg-gradient-to-r from-accent/10 to-[hsl(var(--gigvora-blue)/0.1)] flex items-center justify-center mb-2 relative overflow-hidden">
          <Play className="h-6 w-6 text-accent/40" />
          <div className="absolute bottom-1 left-1.5">
            <Waveform bars={16} active className="h-4" />
          </div>
        </div>
        <div className="text-[10px] font-bold group-hover:text-accent transition-colors">AI & Future of Work Panel</div>
        <div className="flex items-center justify-between mt-1.5">
          <StackedAvatars
            users={[
              { name: 'Sarah C.', src: 'https://i.pravatar.cc/150?u=sarah-chen' },
              { name: 'Alex K.', src: 'https://i.pravatar.cc/150?u=alex-kim' },
              { name: 'Lisa W.', src: 'https://i.pravatar.cc/150?u=lisa-wang' },
              { name: 'David T.' },
            ]}
            max={3}
            size="xs"
          />
          <span className="text-[9px] text-muted-foreground">42 watching</span>
        </div>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN FEED PAGE — 3-column layout
   ═══════════════════════════════════════════════════════════ */
const FeedPage: React.FC = () => {
  const [feedContext, setFeedContext] = useState<FeedContext>('for-you');
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [showModerated] = useState(true);
  const [showError] = useState(false);
  const [showEmpty] = useState(false);

  const feedPosts = feedContext === 'opportunities' ? OPPORTUNITY_POSTS :
                    feedContext === 'following' ? MOCK_FEED.slice(0, 4) :
                    feedContext === 'network' ? MOCK_FEED.slice(2) :
                    MOCK_FEED;

  return (
    <div className="max-w-[1440px] mx-auto w-full px-4 lg:px-6">
      {/* Top context bar */}
      <div className="flex items-center gap-2 flex-wrap mb-4 px-1">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center">
            <Activity className="h-4 w-4 text-accent" />
          </div>
          <span className="text-sm font-bold">Feed</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
          <div className="hidden sm:flex items-center gap-1.5 rounded-xl bg-[hsl(var(--state-healthy)/0.05)] px-2.5 py-1">
            <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--state-healthy))] animate-pulse" />
            <span>Live · synced 30s ago</span>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><RefreshCw className="h-3 w-3" />Refresh</Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1" asChild>
            <Link to="/create/post"><Send className="h-3 w-3" />Create</Link>
          </Button>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="flex gap-5 items-start">
        {/* LEFT RAIL */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-6">
            <FeedLeftRail />
          </div>
        </aside>

        {/* CENTER FEED */}
        <div className="flex-1 min-w-0 max-w-[640px] mx-auto lg:mx-0">
          {/* Context Tabs — sticky on mobile */}
          <div className="flex gap-1.5 overflow-x-auto pb-3 mb-3 scrollbar-none sticky top-0 z-10 bg-background/95 backdrop-blur-sm -mx-1 px-1 pt-1">
            {CONTEXT_TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setFeedContext(t.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-semibold whitespace-nowrap transition-all duration-200 shrink-0',
                  feedContext === t.id
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Composer */}
          <div className="mb-4">
            <PostComposer />
          </div>

          {/* Moderation Banner */}
          {showModerated && <div className="mb-3"><ModeratedPostBanner /></div>}

          {/* Feed Error */}
          {showError && <div className="mb-3"><FeedErrorState /></div>}

          {/* Feed Content */}
          {showEmpty ? <EmptyFeedState /> : (
            <>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[10px] text-muted-foreground font-medium">{feedPosts.length} posts · {feedContext.replace('-', ' ')}</span>
                <Button variant="ghost" size="sm" className="text-[9px] h-6 rounded-lg text-muted-foreground">
                  Sort: Relevant
                </Button>
              </div>
              <div className="space-y-4">
                {feedPosts.map((post, i) => (
                  <React.Fragment key={post.id}>
                    <PostCard post={post} onSelectDetail={() => setSelectedPost(post)} />
                    {/* Inject opportunity cards between posts */}
                    {i === 1 && feedContext === 'for-you' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1">
                          <Zap className="h-3 w-3 text-accent" />
                          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Opportunities for you</span>
                        </div>
                        <div className="grid gap-2">
                          <OpportunityCard type="job" title="Full Stack Developer" company="InnovateCo" meta="Hybrid · $130k–$170k" />
                          <OpportunityCard type="project" title="E-commerce Platform Rebuild" company="RetailPlus" meta="3 months · $25k budget" />
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Load more */}
              <div className="text-center py-6">
                <Button variant="outline" size="sm" className="text-[10px] h-8 rounded-xl gap-1.5">
                  <RefreshCw className="h-3 w-3" /> Load More
                </Button>
              </div>
            </>
          )}
        </div>

        {/* RIGHT RAIL */}
        <aside className="hidden xl:block w-64 shrink-0">
          <div className="sticky top-6">
            <FeedRightRail />
          </div>
        </aside>
      </div>

      {/* Detail Drawer */}
      <PostDetailDrawer post={selectedPost} open={!!selectedPost} onClose={() => setSelectedPost(null)} />
    </div>
  );
};

export default FeedPage;
