import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { KPICard, SectionCard } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  PenLine, Image, Video, FileText, BarChart3, Send, Save,
  Eye, Sparkles, Loader2, X, Plus, Hash, AtSign, Link2,
  Globe, Lock, Users, Building2, Calendar, Clock,
  AlertTriangle, CheckCircle2, RefreshCw, Trash2,
  Bold, Italic, List, ListOrdered, Quote, Code,
  Upload, GripVertical, MoreHorizontal, Megaphone,
  TrendingUp, BarChart2, Heart, MessageCircle, Share2,
  Shield, Flag, Archive, ExternalLink, Briefcase, Layers,
} from 'lucide-react';
import { useAI } from '@/hooks/useAI';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Types & Constants
   ═══════════════════════════════════════════════════════════ */
type PostType = 'text' | 'image' | 'video' | 'article' | 'poll' | 'promo';
type PostStatus = 'draft' | 'published' | 'scheduled' | 'review' | 'rejected';
type Visibility = 'public' | 'connections' | 'company' | 'private';

interface Draft {
  id: string;
  title: string;
  type: PostType;
  status: PostStatus;
  updatedAt: string;
  wordCount: number;
  excerpt: string;
}

const POST_TYPES: { id: PostType; label: string; icon: React.ElementType }[] = [
  { id: 'text', label: 'Text', icon: PenLine },
  { id: 'image', label: 'Image', icon: Image },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'article', label: 'Article', icon: FileText },
  { id: 'poll', label: 'Poll', icon: BarChart3 },
  { id: 'promo', label: 'Promo', icon: Megaphone },
];

const VISIBILITY_OPTIONS: { id: Visibility; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'public', label: 'Public', icon: Globe, desc: 'Visible to everyone' },
  { id: 'connections', label: 'Connections', icon: Users, desc: 'Your network only' },
  { id: 'company', label: 'Company', icon: Building2, desc: 'Organization members' },
  { id: 'private', label: 'Private', icon: Lock, desc: 'Only you' },
];

const MOCK_DRAFTS: Draft[] = [
  { id: 'd1', title: 'Building Scalable Design Systems', type: 'article', status: 'draft', updatedAt: '2h ago', wordCount: 1240, excerpt: 'A deep dive into modern design system architecture...' },
  { id: 'd2', title: 'Q2 Hiring Update', type: 'promo', status: 'draft', updatedAt: '1d ago', wordCount: 180, excerpt: 'We\'re excited to announce 12 new positions...' },
  { id: 'd3', title: 'Remote Work Best Practices', type: 'text', status: 'scheduled', updatedAt: '2d ago', wordCount: 340, excerpt: 'After 3 years fully remote, here\'s what works...' },
  { id: 'd4', title: 'Product Launch Announcement', type: 'image', status: 'review', updatedAt: '3d ago', wordCount: 95, excerpt: 'Introducing our newest feature...' },
  { id: 'd5', title: 'Industry Survey Results', type: 'poll', status: 'rejected', updatedAt: '5d ago', wordCount: 60, excerpt: 'What tools do you use for...' },
];

const MOCK_PUBLISHED = [
  { id: 'pub1', title: 'The Future of AI in Hiring', type: 'article' as PostType, publishedAt: '3d ago', views: 2340, likes: 89, comments: 23, shares: 12 },
  { id: 'pub2', title: 'Team Offsite Recap', type: 'image' as PostType, publishedAt: '1w ago', views: 1560, likes: 145, comments: 34, shares: 8 },
  { id: 'pub3', title: 'Developer Salary Survey 2026', type: 'poll' as PostType, publishedAt: '2w ago', views: 8900, likes: 456, comments: 167, shares: 89 },
];

const STATUS_STYLE: Record<PostStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  published: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
  scheduled: 'bg-accent/10 text-accent',
  review: 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]',
  rejected: 'bg-[hsl(var(--state-blocked)/0.1)] text-[hsl(var(--state-blocked))]',
};

/* ═══════════════════════════════════════════════════════════
   Rich Composer
   ═══════════════════════════════════════════════════════════ */
const RichComposer: React.FC<{
  postType: PostType;
  content: string;
  onChange: (v: string) => void;
}> = ({ postType, content, onChange }) => {
  const { loading: aiLoading, invoke: aiInvoke } = useAI({ type: 'writing-assist' });
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);

  const handleAI = async (action: string) => {
    if (!content.trim()) { toast.info('Write something first.'); return; }
    const result = await aiInvoke({ text: content, action });
    if (result) onChange(result);
  };

  return (
    <div className="space-y-3">
      {/* Formatting Toolbar */}
      <div className="flex items-center gap-0.5 p-1.5 rounded-xl border bg-muted/30">
        {[Bold, Italic, List, ListOrdered, Quote, Code, Link2].map((Icon, i) => (
          <button key={i} className="p-1.5 rounded-xl hover:bg-muted transition-colors"><Icon className="h-3.5 w-3.5 text-muted-foreground" /></button>
        ))}
        <div className="h-4 w-px bg-border mx-1" />
        <button className="p-1.5 rounded-xl hover:bg-muted transition-colors"><AtSign className="h-3.5 w-3.5 text-muted-foreground" /></button>
        <button className="p-1.5 rounded-xl hover:bg-muted transition-colors"><Hash className="h-3.5 w-3.5 text-muted-foreground" /></button>
        <div className="flex-1" />
        <button onClick={() => handleAI('Polish this for a professional audience. Make it engaging and clear.')} disabled={aiLoading} className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[9px] text-accent hover:bg-accent/10 transition-colors font-medium">
          {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} AI Polish
        </button>
        <button onClick={() => handleAI('Make this shorter and more concise.')} disabled={aiLoading} className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[9px] text-muted-foreground hover:bg-muted transition-colors font-medium">
          Shorten
        </button>
      </div>

      {/* Editor */}
      <textarea
        value={content}
        onChange={e => onChange(e.target.value)}
        placeholder={postType === 'article' ? 'Write your article...' : postType === 'promo' ? 'Compose your promotional message...' : 'What would you like to share?'}
        className="w-full bg-transparent border rounded-2xl resize-none text-[12px] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/30 p-4 min-h-[180px] leading-relaxed transition-all"
      />

      {/* Media Upload Zone */}
      {(postType === 'image' || postType === 'video') && (
        <div className="rounded-2xl border-2 border-dashed border-muted-foreground/20 p-5 text-center hover:border-accent/30 transition-all cursor-pointer">
          <Upload className="h-7 w-7 mx-auto mb-2 text-muted-foreground/30" />
          <div className="text-[11px] font-semibold">Drop {postType === 'image' ? 'images' : 'video'} here or click to upload</div>
          <div className="text-[9px] text-muted-foreground mt-0.5">
            {postType === 'image' ? 'PNG, JPG, GIF up to 10MB each · Max 10 files' : 'MP4, MOV up to 500MB'}
          </div>
          {mediaFiles.length > 0 && (
            <div className="flex gap-1.5 mt-3 justify-center">
              {mediaFiles.map((f, i) => (
                <div key={i} className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center relative group">
                  <Image className="h-4 w-4 text-muted-foreground" />
                  <button onClick={() => setMediaFiles(prev => prev.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[hsl(var(--state-blocked))] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
              <button onClick={() => setMediaFiles(prev => [...prev, 'file'])} className="h-14 w-14 rounded-xl border-2 border-dashed flex items-center justify-center hover:border-accent/30 transition-colors">
                <Plus className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Poll Builder */}
      {postType === 'poll' && (
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-muted-foreground">Poll Options</div>
          {['Option 1', 'Option 2', 'Option 3'].map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <GripVertical className="h-3 w-3 text-muted-foreground/30 cursor-grab" />
              <input defaultValue="" placeholder={o} className="flex-1 h-8 text-[11px] rounded-xl border bg-background px-3 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
              <button className="text-muted-foreground hover:text-[hsl(var(--state-blocked))] transition-colors"><X className="h-3 w-3" /></button>
            </div>
          ))}
          <Button variant="ghost" size="sm" className="text-[10px] h-7 rounded-xl gap-1"><Plus className="h-3 w-3" />Add Option</Button>
        </div>
      )}

      {/* Word Count */}
      <div className="flex items-center justify-between text-[9px] text-muted-foreground">
        <span>{content.split(/\s+/).filter(Boolean).length} words · {content.length} characters</span>
        {content.length > 3000 && <span className="text-[hsl(var(--state-caution))] font-medium">Approaching limit (3000 chars)</span>}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Preview Panel
   ═══════════════════════════════════════════════════════════ */
const PreviewPanel: React.FC<{ content: string; postType: PostType; topics: string[] }> = ({ content, postType, topics }) => (
  <SectionCard title="Preview" subtitle="How your post will appear" className="!rounded-2xl">
    <div className="rounded-2xl border bg-background p-4">
      <div className="flex items-center gap-2.5 mb-3">
        <Avatar className="h-9 w-9 ring-2 ring-accent/20"><AvatarFallback className="bg-accent/10 text-accent text-[10px] font-bold">DU</AvatarFallback></Avatar>
        <div>
          <div className="text-[11px] font-bold">Demo User</div>
          <div className="text-[9px] text-muted-foreground">Professional · Just now</div>
        </div>
      </div>
      <p className="text-[11px] whitespace-pre-line leading-[1.6]">{content || 'Your post content will appear here...'}</p>
      {topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {topics.map(t => <span key={t} className="text-[10px] text-accent font-medium">#{t}</span>)}
        </div>
      )}
      {postType !== 'text' && (
        <div className="mt-3 rounded-2xl bg-muted/30 border p-4 text-center text-[10px] text-muted-foreground">
          [{postType === 'image' ? 'Image' : postType === 'video' ? 'Video' : postType === 'poll' ? 'Poll' : postType === 'article' ? 'Article' : 'Promo'} attachment preview]
        </div>
      )}
      <div className="flex items-center gap-4 mt-3 pt-2.5 border-t text-[9px] text-muted-foreground">
        <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> Like</span>
        <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> Comment</span>
        <span className="flex items-center gap-1"><Share2 className="h-3 w-3" /> Repost</span>
      </div>
    </div>
  </SectionCard>
);

/* ═══════════════════════════════════════════════════════════
   State Banners
   ═══════════════════════════════════════════════════════════ */
const UploadFailedBanner: React.FC = () => (
  <div className="rounded-2xl border border-[hsl(var(--state-blocked)/0.3)] bg-[hsl(var(--state-blocked)/0.05)] p-3.5 flex items-center gap-3">
    <div className="h-8 w-8 rounded-xl bg-[hsl(var(--state-blocked)/0.1)] flex items-center justify-center shrink-0">
      <AlertTriangle className="h-4 w-4 text-[hsl(var(--state-blocked))]" />
    </div>
    <div className="flex-1">
      <div className="text-[11px] font-semibold">Upload failed</div>
      <div className="text-[10px] text-muted-foreground">2 files could not be uploaded. Check file size and format.</div>
    </div>
    <Button variant="ghost" size="sm" className="text-[10px] h-7 rounded-xl gap-1"><RefreshCw className="h-3 w-3" />Retry</Button>
  </div>
);

const ValidationBlockedBanner: React.FC<{ reason: string }> = ({ reason }) => (
  <div className="rounded-2xl border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-3.5 flex items-center gap-3">
    <div className="h-8 w-8 rounded-xl bg-[hsl(var(--state-caution)/0.1)] flex items-center justify-center shrink-0">
      <Shield className="h-4 w-4 text-[hsl(var(--state-caution))]" />
    </div>
    <div className="flex-1">
      <div className="text-[11px] font-semibold">Publishing blocked</div>
      <div className="text-[10px] text-muted-foreground">{reason}</div>
    </div>
  </div>
);

const DraftRestoredBanner: React.FC = () => (
  <div className="rounded-2xl border border-accent/30 bg-accent/5 p-3.5 flex items-center gap-3">
    <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
      <CheckCircle2 className="h-4 w-4 text-accent" />
    </div>
    <div className="flex-1">
      <div className="text-[11px] font-semibold">Draft restored</div>
      <div className="text-[10px] text-muted-foreground">Your unsaved draft from 2h ago has been recovered.</div>
    </div>
    <Button variant="ghost" size="sm" className="text-[10px] h-7 rounded-xl">Dismiss</Button>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const PostComposerPage: React.FC = () => {
  const [postType, setPostType] = useState<PostType>('text');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [topics, setTopics] = useState<string[]>(['gigvora']);
  const [topicInput, setTopicInput] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [tab, setTab] = useState<'compose' | 'drafts' | 'published'>('compose');
  const [showDraftRestored] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);

  const addTopic = () => {
    if (topicInput.trim() && !topics.includes(topicInput.trim())) {
      setTopics(prev => [...prev, topicInput.trim()]);
      setTopicInput('');
    }
  };

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const canPublish = content.trim().length > 0 && content.length <= 3000;

  /* ── Top Strip ── */
  const topStrip = (
    <>
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center">
          <PenLine className="h-3.5 w-3.5 text-accent" />
        </div>
        <span className="text-xs font-bold">Publishing Studio</span>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1" onClick={() => setShowPreview(!showPreview)}>
          <Eye className="h-3 w-3" />{showPreview ? 'Hide' : 'Show'} Preview
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1">
          <Save className="h-3 w-3" />Save Draft
        </Button>
        <Button size="sm" className="h-7 text-[10px] rounded-xl gap-1" disabled={!canPublish}>
          <Send className="h-3 w-3" />{scheduleEnabled ? 'Schedule' : 'Publish'}
        </Button>
      </div>
    </>
  );

  /* ── Right Rail ── */
  const rightRail = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <KPICard label="Drafts" value={MOCK_DRAFTS.filter(d => d.status === 'draft').length} className="!rounded-2xl" />
        <KPICard label="Published" value={MOCK_PUBLISHED.length} className="!rounded-2xl" />
      </div>

      {/* Post Type Selector */}
      <SectionCard title="Post Type" className="!rounded-2xl">
        <div className="grid grid-cols-3 gap-1.5">
          {POST_TYPES.map(t => (
            <button key={t.id} onClick={() => setPostType(t.id)} className={cn(
              'flex flex-col items-center gap-1 p-2.5 rounded-xl text-[9px] font-semibold transition-all',
              postType === t.id ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            )}>
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Visibility */}
      <SectionCard title="Visibility" className="!rounded-2xl">
        <div className="space-y-1">
          {VISIBILITY_OPTIONS.map(v => (
            <button key={v.id} onClick={() => setVisibility(v.id)} className={cn(
              'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-[10px] transition-all',
              visibility === v.id ? 'bg-accent/10 text-accent' : 'hover:bg-muted/50'
            )}>
              <v.icon className="h-3.5 w-3.5" />
              <div className="text-left flex-1">
                <div className="font-semibold">{v.label}</div>
                <div className="text-[8px] text-muted-foreground">{v.desc}</div>
              </div>
              {visibility === v.id && <CheckCircle2 className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Topics */}
      <SectionCard title="Topics" subtitle={`${topics.length} added`} className="!rounded-2xl">
        <div className="flex flex-wrap gap-1 mb-2">
          {topics.map(t => (
            <span key={t} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-xl bg-accent/10 text-accent text-[9px] font-medium">
              #{t}
              <button onClick={() => setTopics(prev => prev.filter(x => x !== t))}><X className="h-2 w-2" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-1.5">
          <input value={topicInput} onChange={e => setTopicInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTopic()} placeholder="Add topic..." className="flex-1 h-7 text-[10px] rounded-xl border bg-background px-2.5 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
          <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl" onClick={addTopic}><Plus className="h-2.5 w-2.5" /></Button>
        </div>
      </SectionCard>

      {/* Schedule */}
      <SectionCard title="Schedule" className="!rounded-2xl">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-medium">Schedule for later</div>
          <Switch checked={scheduleEnabled} onCheckedChange={setScheduleEnabled} />
        </div>
        {scheduleEnabled && (
          <div className="mt-2.5 flex gap-1.5">
            <input type="date" className="flex-1 h-7 text-[10px] rounded-xl border bg-background px-2.5 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
            <input type="time" className="w-20 h-7 text-[10px] rounded-xl border bg-background px-2.5 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
          </div>
        )}
      </SectionCard>

      {/* Distribution */}
      <SectionCard title="Distribution" subtitle="Boost options" className="!rounded-2xl">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-medium">Cross-post to company page</span>
            <Switch />
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-medium">Share to groups</span>
            <Switch />
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1 font-medium">Boost reach <Badge variant="secondary" className="text-[7px] h-3.5 rounded-lg">Premium</Badge></span>
            <Switch disabled />
          </div>
        </div>
      </SectionCard>
    </div>
  );

  /* ── Bottom Section ── */
  const bottomSection = (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-accent" />Your Content Performance</span>
        <span className="text-[10px] text-muted-foreground">Last 30 days</span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Impressions', value: '12.8K' },
          { label: 'Engagements', value: '1,247' },
          { label: 'Profile Visits', value: '389' },
          { label: 'Follower Growth', value: '+45' },
        ].map(s => (
          <div key={s.label} className="text-center rounded-2xl border p-3 hover:shadow-sm transition-shadow">
            <div className="text-sm font-bold">{s.value}</div>
            <div className="text-[9px] text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-64" bottomSection={bottomSection}>
      {/* Sub Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-3">
        {([
          { id: 'compose', label: 'Compose', icon: PenLine },
          { id: 'drafts', label: `Drafts (${MOCK_DRAFTS.filter(d => d.status === 'draft').length})`, icon: Save },
          { id: 'published', label: `Published (${MOCK_PUBLISHED.length})`, icon: CheckCircle2 },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-semibold whitespace-nowrap transition-all shrink-0',
            tab === t.id ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/60 text-muted-foreground hover:bg-muted'
          )}>
            <t.icon className="h-3 w-3" />{t.label}
          </button>
        ))}
      </div>

      {/* ── COMPOSE TAB ── */}
      {tab === 'compose' && (
        <div className="space-y-3">
          {showDraftRestored && <DraftRestoredBanner />}
          <RichComposer postType={postType} content={content} onChange={setContent} />
          {showPreview && <PreviewPanel content={content} postType={postType} topics={topics} />}
          {content.length > 3000 && <ValidationBlockedBanner reason="Post exceeds 3000 character limit. Shorten your content to publish." />}
        </div>
      )}

      {/* ── DRAFTS TAB ── */}
      {tab === 'drafts' && (
        <SectionCard title="Drafts & Scheduled" subtitle={`${MOCK_DRAFTS.length} items`} className="!rounded-2xl">
          {MOCK_DRAFTS.length === 0 ? (
            <div className="text-center py-10">
              <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <Save className="h-5 w-5 text-muted-foreground/30" />
              </div>
              <div className="text-[11px] text-muted-foreground">No drafts yet. Start composing to create one.</div>
            </div>
          ) : (
            <div className="space-y-2">
              {MOCK_DRAFTS.map(d => {
                const TypeIcon = POST_TYPES.find(t => t.id === d.type)?.icon || PenLine;
                return (
                  <div key={d.id} onClick={() => setSelectedDraft(d)} className="flex items-center gap-3 p-3 rounded-2xl border hover:bg-muted/30 hover:shadow-sm transition-all cursor-pointer group">
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                      <TypeIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold truncate">{d.title}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{d.excerpt}</div>
                      <div className="flex items-center gap-2 mt-1 text-[9px] text-muted-foreground">
                        <span>{d.wordCount} words</span>
                        <span>·</span>
                        <span>Updated {d.updatedAt}</span>
                      </div>
                    </div>
                    <Badge className={cn('text-[8px] h-4 capitalize rounded-lg border-0', STATUS_STYLE[d.status])}>{d.status}</Badge>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl"><PenLine className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl text-[hsl(var(--state-blocked))]"><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      )}

      {/* ── PUBLISHED TAB ── */}
      {tab === 'published' && (
        <SectionCard title="Published Content" subtitle={`${MOCK_PUBLISHED.length} posts`} className="!rounded-2xl">
          {MOCK_PUBLISHED.length === 0 ? (
            <div className="text-center py-10">
              <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground/30" />
              </div>
              <div className="text-[11px] text-muted-foreground">No published content yet.</div>
            </div>
          ) : (
            <div className="space-y-2">
              {MOCK_PUBLISHED.map(p => {
                const TypeIcon = POST_TYPES.find(t => t.id === p.type)?.icon || PenLine;
                return (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-2xl border hover:bg-muted/30 hover:shadow-sm transition-all cursor-pointer group">
                    <div className="h-10 w-10 rounded-xl bg-[hsl(var(--state-healthy)/0.1)] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                      <TypeIcon className="h-4 w-4 text-[hsl(var(--state-healthy))]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold truncate">{p.title}</div>
                      <div className="flex items-center gap-3 mt-1 text-[9px] text-muted-foreground">
                        <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{p.views.toLocaleString()}</span>
                        <span className="flex items-center gap-0.5"><Heart className="h-2.5 w-2.5" />{p.likes}</span>
                        <span className="flex items-center gap-0.5"><MessageCircle className="h-2.5 w-2.5" />{p.comments}</span>
                        <span className="flex items-center gap-0.5"><Share2 className="h-2.5 w-2.5" />{p.shares}</span>
                      </div>
                    </div>
                    <div className="text-[9px] text-muted-foreground shrink-0">{p.publishedAt}</div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0 rounded-xl"><MoreHorizontal className="h-3 w-3" /></Button>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      )}

      {/* Draft Detail Drawer */}
      <Sheet open={!!selectedDraft} onOpenChange={() => setSelectedDraft(null)}>
        <SheetContent className="w-[400px] sm:w-[440px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-sm font-bold">Draft Detail</SheetTitle>
          </SheetHeader>
          {selectedDraft && (
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={cn('text-[9px] capitalize rounded-lg border-0', STATUS_STYLE[selectedDraft.status])}>{selectedDraft.status}</Badge>
                <Badge variant="secondary" className="text-[9px] capitalize rounded-lg">{selectedDraft.type}</Badge>
              </div>
              <div className="text-sm font-bold">{selectedDraft.title}</div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{selectedDraft.excerpt}</p>
              <div className="space-y-1.5 text-[10px]">
                <div className="flex justify-between py-1.5 border-b"><span className="text-muted-foreground">Word Count</span><span className="font-semibold">{selectedDraft.wordCount}</span></div>
                <div className="flex justify-between py-1.5"><span className="text-muted-foreground">Last Updated</span><span className="font-semibold">{selectedDraft.updatedAt}</span></div>
              </div>
              {selectedDraft.status === 'rejected' && (
                <div className="rounded-2xl border border-[hsl(var(--state-blocked)/0.3)] bg-[hsl(var(--state-blocked)/0.05)] p-3">
                  <div className="text-[10px] font-semibold text-[hsl(var(--state-blocked))]">Rejection Reason</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Content flagged for promotional language without disclosure. Update and resubmit.</div>
                </div>
              )}
              <div className="flex gap-1.5 pt-2">
                <Button variant="outline" size="sm" className="flex-1 text-[9px] h-7 rounded-xl gap-1" onClick={() => { setContent(selectedDraft.excerpt); setTab('compose'); setSelectedDraft(null); }}><PenLine className="h-2.5 w-2.5" />Edit</Button>
                <Button variant="outline" size="sm" className="flex-1 text-[9px] h-7 rounded-xl gap-1"><Archive className="h-2.5 w-2.5" />Archive</Button>
                <Button size="sm" className="flex-1 text-[9px] h-7 rounded-xl gap-1" disabled={selectedDraft.status === 'rejected'}><Send className="h-2.5 w-2.5" />Publish</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default PostComposerPage;
