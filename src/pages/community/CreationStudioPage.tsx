import React, { useState } from 'react';
import { TagInput as SharedTagInput } from '@/components/social/TagSystem';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import {
  Sparkles, Plus, FileText, Video, Mic, Image as ImageIcon,
  BarChart3, PenTool, Zap, Calendar, Eye, TrendingUp,
  Globe, Users, Layout, Wand2, Clock, Edit, Trash2,
  MoreHorizontal, Search, Filter, Download, Upload,
  Copy, ExternalLink, Shield, CheckCircle2, XCircle,
  AlertTriangle, Star, Bookmark, Heart, Share2,
  ArrowRight, ChevronRight, ChevronLeft, RotateCcw, Layers,
  Megaphone, Rocket, Building2, BookOpen, Hash,
  Monitor, Smartphone, Tablet, Bold, Italic,
  Underline, List, ListOrdered, Link as LinkIcon,
  AlignLeft, AlignCenter, AlignRight, Heading1,
  Heading2, Quote, Code, Minus, ImagePlus,
  Loader2, Send, Palette, Target, Mail,
  Podcast, Radio, Play, Pause, SkipForward,
  Settings, Lock, Unlock, History, GitBranch,
  MessageSquare, ThumbsUp, Flag, Accessibility,
  FileImage, Film, Music, Package, Briefcase,
  Headphones, Volume2, Sliders, Tv, Ticket,
  DollarSign, Tag, MapPin, LayoutGrid, Type,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAI } from '@/hooks/useAI';
import { toast } from 'sonner';

// ── Types ──
type ContentStatus = 'draft' | 'scheduled' | 'published' | 'in-review' | 'rejected' | 'archived';
type ContentType = 'post' | 'article' | 'podcast' | 'webinar' | 'live-room' | 'clip' | 'newsletter' | 'campaign' | 'showcase' | 'page' | 'template';

interface ContentItem {
  id: string; title: string; type: ContentType; status: ContentStatus;
  createdAt: string; scheduledAt?: string; publishedAt?: string;
  views: number; likes: number; comments: number; shares: number;
  destination: string; author: string; version: number;
  moderationStatus?: 'approved' | 'pending' | 'flagged';
  tags: string[];
}

// ── Mock Data ──
const MOCK_CONTENT: ContentItem[] = [
  { id: '1', title: 'How to Land Your First Freelance Client in 2026', type: 'article', status: 'published', createdAt: '2026-04-01', publishedAt: 'Apr 2', views: 12400, likes: 345, comments: 67, shares: 89, destination: 'Feed', author: 'Demo User', version: 3, moderationStatus: 'approved', tags: ['freelancing', 'careers'] },
  { id: '2', title: 'Design Systems Deep Dive', type: 'podcast', status: 'published', createdAt: '2026-03-25', publishedAt: 'Mar 28', views: 3200, likes: 123, comments: 28, shares: 45, destination: 'Media', author: 'Demo User', version: 2, moderationStatus: 'approved', tags: ['design', 'systems'] },
  { id: '3', title: 'Building Remote Teams Workshop', type: 'webinar', status: 'published', createdAt: '2026-03-15', publishedAt: 'Mar 20', views: 890, likes: 56, comments: 12, shares: 23, destination: 'Events', author: 'Demo User', version: 1, moderationStatus: 'approved', tags: ['remote', 'teams'] },
  { id: '4', title: 'AI Tools for Developers Guide', type: 'article', status: 'draft', createdAt: '2026-04-05', views: 0, likes: 0, comments: 0, shares: 0, destination: 'Feed', author: 'Demo User', version: 1, tags: ['ai', 'development'] },
  { id: '5', title: 'Portfolio Review Live Session', type: 'live-room', status: 'scheduled', createdAt: '2026-04-06', scheduledAt: 'Apr 12, 3:00 PM', views: 0, likes: 0, comments: 0, shares: 0, destination: 'Events', author: 'Demo User', version: 1, tags: ['design', 'portfolio'] },
  { id: '6', title: 'Weekly Tech Newsletter #42', type: 'newsletter', status: 'scheduled', createdAt: '2026-04-07', scheduledAt: 'Apr 10, 9:00 AM', views: 0, likes: 0, comments: 0, shares: 0, destination: 'Subscribers', author: 'Demo User', version: 2, tags: ['tech', 'newsletter'] },
  { id: '7', title: 'Q2 Brand Campaign: Future of Work', type: 'campaign', status: 'in-review', createdAt: '2026-04-04', views: 0, likes: 0, comments: 0, shares: 0, destination: 'Ads', author: 'Demo User', version: 4, moderationStatus: 'pending', tags: ['campaign', 'brand'] },
  { id: '8', title: 'React Best Practices Short', type: 'clip', status: 'in-review', createdAt: '2026-04-07', views: 0, likes: 0, comments: 0, shares: 0, destination: 'Feed', author: 'Demo User', version: 2, moderationStatus: 'pending', tags: ['react', 'development'] },
  { id: '9', title: 'LaunchPad AI Startup Showcase', type: 'showcase', status: 'draft', createdAt: '2026-04-06', views: 0, likes: 0, comments: 0, shares: 0, destination: 'Enterprise', author: 'Demo User', version: 1, tags: ['startup', 'ai'] },
  { id: '10', title: 'Hiring Announcement Template', type: 'template', status: 'published', createdAt: '2026-03-10', publishedAt: 'Mar 10', views: 2300, likes: 89, comments: 5, shares: 156, destination: 'Templates', author: 'Demo User', version: 1, moderationStatus: 'approved', tags: ['template', 'hiring'] },
];

const typeIcons: Record<ContentType, React.ElementType> = {
  post: FileText, article: PenTool, podcast: Podcast, webinar: Video,
  'live-room': Radio, clip: Film, newsletter: Mail, campaign: Megaphone,
  showcase: Rocket, page: Globe, template: Package,
};
const typeColors: Record<ContentType, string> = {
  post: 'text-accent', article: 'text-accent', podcast: 'text-primary',
  webinar: 'text-[hsl(var(--state-healthy))]', 'live-room': 'text-[hsl(var(--gigvora-amber))]', clip: 'text-destructive',
  newsletter: 'text-primary', campaign: 'text-[hsl(var(--gigvora-amber))]', showcase: 'text-[hsl(var(--state-healthy))]',
  page: 'text-muted-foreground', template: 'text-accent',
};
const statusStyles: Record<ContentStatus, { cls: string; label: string }> = {
  draft: { cls: 'bg-muted text-muted-foreground', label: 'Draft' },
  scheduled: { cls: 'bg-accent/10 text-accent', label: 'Scheduled' },
  published: { cls: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]', label: 'Published' },
  'in-review': { cls: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]', label: 'In Review' },
  rejected: { cls: 'bg-destructive/10 text-destructive', label: 'Rejected' },
  archived: { cls: 'bg-muted text-muted-foreground', label: 'Archived' },
};

// ═══════════════════════════════════════════════
// WIZARD STEP COMPONENT
// ═══════════════════════════════════════════════
interface WizardStep { id: string; label: string; icon: React.ElementType; }

const WizardStepper: React.FC<{ steps: WizardStep[]; current: number; onStep: (i: number) => void }> = ({ steps, current, onStep }) => (
  <div className="flex items-center gap-1 px-4 py-3 border-b bg-card overflow-x-auto">
    {steps.map((s, i) => {
      const done = i < current;
      const active = i === current;
      return (
        <React.Fragment key={s.id}>
          {i > 0 && <div className={cn('h-px w-6 shrink-0', done ? 'bg-accent' : 'bg-border')} />}
          <button onClick={() => onStep(i)} className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0',
            active ? 'bg-accent/10 text-accent ring-1 ring-accent/30' :
            done ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' :
            'text-muted-foreground hover:bg-muted/50'
          )}>
            {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <s.icon className="h-3.5 w-3.5" />}
            <span>{s.label}</span>
          </button>
        </React.Fragment>
      );
    })}
  </div>
);

const WizardNav: React.FC<{ step: number; total: number; onPrev: () => void; onNext: () => void; onPublish: () => void; nextLabel?: string }> = ({ step, total, onPrev, onNext, onPublish, nextLabel }) => (
  <div className="flex items-center justify-between border-t px-6 py-3 bg-card">
    <Button variant="outline" size="sm" onClick={onPrev} disabled={step === 0} className="gap-1 text-xs"><ChevronLeft className="h-3.5 w-3.5" />Back</Button>
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-muted-foreground">Step {step + 1} of {total}</span>
      <Progress value={((step + 1) / total) * 100} className="h-1.5 w-20" />
    </div>
    <div className="flex gap-2">
      <Button variant="outline" size="sm" className="text-xs">Save Draft</Button>
      {step < total - 1 ? (
        <Button size="sm" onClick={onNext} className="gap-1 text-xs">{nextLabel || 'Next'}<ChevronRight className="h-3.5 w-3.5" /></Button>
      ) : (
        <Button size="sm" onClick={onPublish} className="gap-1 text-xs"><Send className="h-3.5 w-3.5" />Publish</Button>
      )}
    </div>
  </div>
);

// ── Shared form primitives ──
const FormField: React.FC<{ label: string; hint?: string; required?: boolean; children: React.ReactNode }> = ({ label, hint, required, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold flex items-center gap-1">{label}{required && <span className="text-destructive">*</span>}</label>
    {children}
    {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
  </div>
);

const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={cn('h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow', props.className)} />
);

const SelectInput: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }> = ({ options, ...props }) => (
  <select {...props} className={cn('h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30', props.className)}>
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

const TagInput: React.FC<{ value: string[]; onChange: (t: string[]) => void }> = ({ value, onChange }) => (
  <SharedTagInput tags={value} onChange={onChange} variant="compact" />
);

const UploadZone: React.FC<{ label: string; accept?: string; icon?: React.ElementType }> = ({ label, accept, icon: Icon = Upload }) => (
  <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-accent/50 transition-colors cursor-pointer group">
    <Icon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40 group-hover:text-accent/60 transition-colors" />
    <div className="text-sm font-medium text-muted-foreground">{label}</div>
    {accept && <div className="text-[10px] text-muted-foreground/60 mt-1">{accept}</div>}
  </div>
);

const OptionCard: React.FC<{ icon: React.ElementType; label: string; desc: string; selected: boolean; onClick: () => void }> = ({ icon: Icon, label, desc, selected, onClick }) => (
  <button onClick={onClick} className={cn('rounded-xl border p-4 text-left transition-all', selected ? 'border-accent bg-accent/5 ring-1 ring-accent/30' : 'hover:border-accent/30 hover:bg-muted/30')}>
    <Icon className={cn('h-6 w-6 mb-2', selected ? 'text-accent' : 'text-muted-foreground')} />
    <div className="text-sm font-semibold">{label}</div>
    <div className="text-[10px] text-muted-foreground mt-0.5">{desc}</div>
  </button>
);

// ═══════════════════════════════════════════════
// PODCAST WIZARD
// ═══════════════════════════════════════════════
const PodcastWizard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const [format, setFormat] = useState<'solo' | 'interview' | 'panel' | 'narrative'>('solo');
  const [tags, setTags] = useState<string[]>([]);
  const steps: WizardStep[] = [
    { id: 'format', label: 'Format', icon: LayoutGrid },
    { id: 'details', label: 'Episode Details', icon: FileText },
    { id: 'media', label: 'Audio & Media', icon: Headphones },
    { id: 'guests', label: 'Guests & Credits', icon: Users },
    { id: 'distribution', label: 'Distribution', icon: Globe },
    { id: 'review', label: 'Review & Publish', icon: CheckCircle2 },
  ];
  const handlePublish = () => { toast.success('Podcast episode published!'); onClose(); };
  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2"><Podcast className="h-4 w-4 text-primary" /><span className="text-sm font-semibold">Create Podcast Episode</span><Badge variant="secondary" className="text-[9px]">Draft</Badge></div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">✕ Close</Button>
      </div>
      <WizardStepper steps={steps} current={step} onStep={setStep} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          {step === 0 && (<>
            <h2 className="text-lg font-bold">Choose Episode Format</h2>
            <div className="grid grid-cols-2 gap-3">
              <OptionCard icon={Mic} label="Solo" desc="Single host monologue or topic deep-dive" selected={format === 'solo'} onClick={() => setFormat('solo')} />
              <OptionCard icon={Users} label="Interview" desc="Host with a guest conversation" selected={format === 'interview'} onClick={() => setFormat('interview')} />
              <OptionCard icon={MessageSquare} label="Panel" desc="Multiple speakers roundtable" selected={format === 'panel'} onClick={() => setFormat('panel')} />
              <OptionCard icon={BookOpen} label="Narrative" desc="Scripted storytelling format" selected={format === 'narrative'} onClick={() => setFormat('narrative')} />
            </div>
          </>)}
          {step === 1 && (<>
            <h2 className="text-lg font-bold">Episode Details</h2>
            <FormField label="Episode Title" required><TextInput placeholder="e.g. Building AI-First Products" /></FormField>
            <FormField label="Show / Series" required><SelectInput options={[{value:'',label:'Select a show...'},{value:'tech-talks',label:'Tech Talks'},{value:'design-deep',label:'Design Deep Dive'},{value:'new-show',label:'+ Create New Show'}]} /></FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Season"><TextInput type="number" placeholder="1" /></FormField>
              <FormField label="Episode Number"><TextInput type="number" placeholder="12" /></FormField>
            </div>
            <FormField label="Description"><Textarea placeholder="What is this episode about?" rows={4} /></FormField>
            <FormField label="Tags"><TagInput value={tags} onChange={setTags} /></FormField>
            <FormField label="Content Rating">
              <SelectInput options={[{value:'clean',label:'Clean — All audiences'},{value:'explicit',label:'Explicit — Mature content'}]} />
            </FormField>
          </>)}
          {step === 2 && (<>
            <h2 className="text-lg font-bold">Audio & Media Assets</h2>
            <FormField label="Episode Audio" required hint="MP3, WAV, or M4A. Max 500MB."><UploadZone label="Drop audio file or click to upload" accept="MP3, WAV, M4A — up to 500MB" icon={Headphones} /></FormField>
            <FormField label="Cover Art" hint="1400×1400px minimum. JPG or PNG."><UploadZone label="Drop cover art or click to upload" accept="JPG, PNG — 1400×1400px recommended" icon={ImageIcon} /></FormField>
            <div className="rounded-xl border bg-muted/30 p-4">
              <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5"><Sliders className="h-3.5 w-3.5 text-accent" />Audio Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Intro Music"><SelectInput options={[{value:'none',label:'None'},{value:'default',label:'Default jingle'},{value:'custom',label:'Custom upload'}]} /></FormField>
                <FormField label="Outro Music"><SelectInput options={[{value:'none',label:'None'},{value:'default',label:'Default jingle'},{value:'custom',label:'Custom upload'}]} /></FormField>
              </div>
              <div className="flex items-center justify-between mt-3 text-xs"><span>Enable noise reduction</span><Switch /></div>
              <div className="flex items-center justify-between mt-2 text-xs"><span>Auto-level audio</span><Switch defaultChecked /></div>
            </div>
            <FormField label="Transcript" hint="Upload a transcript or auto-generate one"><div className="flex gap-2"><Button variant="outline" size="sm" className="text-xs gap-1"><Upload className="h-3 w-3" />Upload SRT/VTT</Button><Button variant="outline" size="sm" className="text-xs gap-1"><Sparkles className="h-3 w-3" />Auto-Generate</Button></div></FormField>
          </>)}
          {step === 3 && (<>
            <h2 className="text-lg font-bold">Guests & Credits</h2>
            {format !== 'solo' && (
              <FormField label="Guest Speakers" hint="Add guests who appear in this episode">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <Avatar className="h-8 w-8"><AvatarFallback className="text-[9px]">GS</AvatarFallback></Avatar>
                    <div className="flex-1"><div className="text-sm font-medium">Guest Speaker</div><div className="text-[10px] text-muted-foreground">Invite or search platform users</div></div>
                    <Button variant="outline" size="sm" className="text-xs">Remove</Button>
                  </div>
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1"><Plus className="h-3 w-3" />Add Guest</Button>
                </div>
              </FormField>
            )}
            <FormField label="Producer / Editor"><TextInput placeholder="Credit the production team" /></FormField>
            <FormField label="Sponsors"><TextInput placeholder="Episode sponsors (optional)" /></FormField>
            <FormField label="Show Notes"><Textarea placeholder="Detailed show notes with links and references..." rows={5} /></FormField>
          </>)}
          {step === 4 && (<>
            <h2 className="text-lg font-bold">Distribution Settings</h2>
            <FormField label="Publish Destination">
              <div className="space-y-2">
                {[{id:'platform',label:'Gigvora Podcasts',desc:'Available on platform podcast player',icon:Podcast},{id:'rss',label:'RSS Feed',desc:'Distribute to Apple, Spotify, etc.',icon:Globe},{id:'embed',label:'Embeddable Player',desc:'Embed on external websites',icon:Code}].map(d => (
                  <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30">
                    <d.icon className="h-5 w-5 text-accent shrink-0" />
                    <div className="flex-1"><div className="text-sm font-medium">{d.label}</div><div className="text-[10px] text-muted-foreground">{d.desc}</div></div>
                    <Switch defaultChecked={d.id === 'platform'} />
                  </div>
                ))}
              </div>
            </FormField>
            <FormField label="Monetization">
              <SelectInput options={[{value:'free',label:'Free — Available to everyone'},{value:'premium',label:'Premium — Subscribers only'},{value:'early',label:'Early Access — Premium gets first, public after delay'}]} />
            </FormField>
            <FormField label="Schedule">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="text-xs gap-1"><Send className="h-3 w-3" />Publish Now</Button>
                <span className="text-xs text-muted-foreground">or</span>
                <TextInput type="datetime-local" className="max-w-[220px]" />
              </div>
            </FormField>
          </>)}
          {step === 5 && (<>
            <h2 className="text-lg font-bold">Review & Publish</h2>
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[{l:'Format',v:format},{l:'Show',v:'Tech Talks'},{l:'Season/Episode',v:'S1 E12'},{l:'Rating',v:'Clean'},{l:'Distribution',v:'Platform + RSS'},{l:'Monetization',v:'Free'}].map(r => (
                  <div key={r.l}><span className="text-[10px] text-muted-foreground">{r.l}</span><div className="font-medium capitalize">{r.v}</div></div>
                ))}
              </div>
              <div className="rounded-lg border p-3">
                <h3 className="text-xs font-semibold mb-2 flex items-center gap-1"><Shield className="h-3 w-3 text-accent" />Pre-publish Checklist</h3>
                <div className="space-y-1.5">
                  {['Audio file uploaded','Cover art set','Description added','Tags configured','Distribution selected'].map(c => (
                    <div key={c} className="flex items-center gap-1.5 text-[10px]"><CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]" /><span>{c}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </>)}
        </div>
      </div>
      <WizardNav step={step} total={steps.length} onPrev={() => setStep(Math.max(0, step - 1))} onNext={() => setStep(Math.min(steps.length - 1, step + 1))} onPublish={handlePublish} />
    </div>
  );
};

// ═══════════════════════════════════════════════
// WEBINAR WIZARD
// ═══════════════════════════════════════════════
const WebinarWizard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const [webinarType, setWebinarType] = useState<'live' | 'prerecorded' | 'hybrid'>('live');
  const [regType, setRegType] = useState<'open' | 'registration' | 'paid'>('open');
  const [tags, setTags] = useState<string[]>([]);
  const steps: WizardStep[] = [
    { id: 'type', label: 'Webinar Type', icon: Tv },
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'speakers', label: 'Speakers', icon: Users },
    { id: 'registration', label: 'Registration', icon: Ticket },
    { id: 'production', label: 'Production', icon: Settings },
    { id: 'review', label: 'Review', icon: CheckCircle2 },
  ];
  const handlePublish = () => { toast.success('Webinar created!'); onClose(); };
  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2"><Video className="h-4 w-4 text-[hsl(var(--state-healthy))]" /><span className="text-sm font-semibold">Create Webinar</span><Badge variant="secondary" className="text-[9px]">Draft</Badge></div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">✕ Close</Button>
      </div>
      <WizardStepper steps={steps} current={step} onStep={setStep} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          {step === 0 && (<>
            <h2 className="text-lg font-bold">Choose Webinar Type</h2>
            <div className="grid grid-cols-3 gap-3">
              <OptionCard icon={Radio} label="Live" desc="Real-time broadcast with live Q&A" selected={webinarType === 'live'} onClick={() => setWebinarType('live')} />
              <OptionCard icon={Play} label="Pre-recorded" desc="Upload video and simulate live" selected={webinarType === 'prerecorded'} onClick={() => setWebinarType('prerecorded')} />
              <OptionCard icon={Tv} label="Hybrid" desc="Live host with pre-recorded segments" selected={webinarType === 'hybrid'} onClick={() => setWebinarType('hybrid')} />
            </div>
          </>)}
          {step === 1 && (<>
            <h2 className="text-lg font-bold">Webinar Details</h2>
            <FormField label="Title" required><TextInput placeholder="e.g. Scaling Design Systems in 2026" /></FormField>
            <FormField label="Subtitle"><TextInput placeholder="Optional tagline" /></FormField>
            <FormField label="Description" required><Textarea placeholder="What will attendees learn?" rows={4} /></FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Date & Time" required><TextInput type="datetime-local" /></FormField>
              <FormField label="Duration"><SelectInput options={[{value:'30',label:'30 minutes'},{value:'45',label:'45 minutes'},{value:'60',label:'1 hour'},{value:'90',label:'90 minutes'},{value:'120',label:'2 hours'}]} /></FormField>
            </div>
            <FormField label="Time Zone"><SelectInput options={[{value:'utc',label:'UTC'},{value:'est',label:'Eastern (EST)'},{value:'pst',label:'Pacific (PST)'},{value:'gmt',label:'GMT'},{value:'cet',label:'Central European (CET)'}]} /></FormField>
            <FormField label="Category"><SelectInput options={[{value:'tech',label:'Technology'},{value:'design',label:'Design'},{value:'business',label:'Business'},{value:'marketing',label:'Marketing'},{value:'leadership',label:'Leadership'}]} /></FormField>
            <FormField label="Cover Image"><UploadZone label="Drop cover image" accept="JPG, PNG — 1920×1080px recommended" icon={ImageIcon} /></FormField>
            <FormField label="Tags"><TagInput value={tags} onChange={setTags} /></FormField>
          </>)}
          {step === 2 && (<>
            <h2 className="text-lg font-bold">Speakers & Hosts</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-accent/5">
                <Avatar className="h-10 w-10"><AvatarFallback>DU</AvatarFallback></Avatar>
                <div className="flex-1"><div className="text-sm font-medium">Demo User</div><div className="text-[10px] text-muted-foreground">Host · You</div></div>
                <Badge className="text-[9px] bg-accent/10 text-accent">Host</Badge>
              </div>
              <Button variant="outline" className="w-full text-xs gap-1"><Plus className="h-3 w-3" />Add Co-Host or Speaker</Button>
            </div>
            <FormField label="Moderator (optional)"><TextInput placeholder="Search for a moderator..." /></FormField>
            <div className="rounded-lg border p-3 space-y-2 text-xs">
              <h3 className="font-semibold flex items-center gap-1"><Settings className="h-3.5 w-3.5" />Speaker Controls</h3>
              <div className="flex items-center justify-between"><span>Speakers can share screen</span><Switch defaultChecked /></div>
              <div className="flex items-center justify-between"><span>Speakers can unmute themselves</span><Switch defaultChecked /></div>
              <div className="flex items-center justify-between"><span>Green room pre-session</span><Switch defaultChecked /></div>
            </div>
          </>)}
          {step === 3 && (<>
            <h2 className="text-lg font-bold">Registration & Access</h2>
            <FormField label="Registration Type">
              <div className="grid grid-cols-3 gap-3">
                <OptionCard icon={Unlock} label="Open" desc="Anyone can join" selected={regType === 'open'} onClick={() => setRegType('open')} />
                <OptionCard icon={Ticket} label="Registration" desc="Require RSVP" selected={regType === 'registration'} onClick={() => setRegType('registration')} />
                <OptionCard icon={DollarSign} label="Paid" desc="Ticketed event" selected={regType === 'paid'} onClick={() => setRegType('paid')} />
              </div>
            </FormField>
            <FormField label="Capacity"><TextInput type="number" placeholder="500" /></FormField>
            <FormField label="Registration Fields" hint="Choose what info to collect">
              <div className="space-y-1.5 text-xs">
                {['Full Name','Email','Company','Job Title','Industry','Custom Question'].map(f => (
                  <div key={f} className="flex items-center justify-between p-2 rounded-lg border"><span>{f}</span><Switch defaultChecked={['Full Name','Email'].includes(f)} /></div>
                ))}
              </div>
            </FormField>
            <FormField label="Reminder Emails">
              <div className="space-y-1.5 text-xs">
                {['24 hours before','1 hour before','15 minutes before'].map(r => (
                  <div key={r} className="flex items-center justify-between p-2 rounded-lg border"><span>{r}</span><Switch defaultChecked /></div>
                ))}
              </div>
            </FormField>
          </>)}
          {step === 4 && (<>
            <h2 className="text-lg font-bold">Production Settings</h2>
            <FormField label="Stream Quality"><SelectInput options={[{value:'720',label:'720p HD'},{value:'1080',label:'1080p Full HD'},{value:'4k',label:'4K Ultra HD'}]} /></FormField>
            {webinarType === 'prerecorded' && <FormField label="Upload Video"><UploadZone label="Upload pre-recorded video" accept="MP4, MOV, WEBM — up to 4GB" icon={Film} /></FormField>}
            <div className="rounded-lg border p-3 space-y-2 text-xs">
              <h3 className="font-semibold">Interactive Features</h3>
              <div className="flex items-center justify-between"><span>Live Q&A</span><Switch defaultChecked /></div>
              <div className="flex items-center justify-between"><span>Live Polls</span><Switch defaultChecked /></div>
              <div className="flex items-center justify-between"><span>Chat</span><Switch defaultChecked /></div>
              <div className="flex items-center justify-between"><span>Hand Raise</span><Switch defaultChecked /></div>
              <div className="flex items-center justify-between"><span>Reactions</span><Switch defaultChecked /></div>
            </div>
            <div className="rounded-lg border p-3 space-y-2 text-xs">
              <h3 className="font-semibold">Recording & Replay</h3>
              <div className="flex items-center justify-between"><span>Auto-record session</span><Switch defaultChecked /></div>
              <div className="flex items-center justify-between"><span>Enable replay after event</span><Switch defaultChecked /></div>
              <div className="flex items-center justify-between"><span>Auto-generate transcript</span><Switch /></div>
            </div>
          </>)}
          {step === 5 && (<>
            <h2 className="text-lg font-bold">Review & Create</h2>
            <div className="rounded-xl border bg-card p-5 space-y-3">
              {[{l:'Type',v:webinarType},{l:'Duration',v:'60 minutes'},{l:'Registration',v:'Open'},{l:'Stream Quality',v:'1080p'},{l:'Interactive',v:'Q&A, Polls, Chat'},{l:'Recording',v:'Auto-record enabled'}].map(r => (
                <div key={r.l} className="flex justify-between text-sm"><span className="text-muted-foreground">{r.l}</span><span className="font-medium capitalize">{r.v}</span></div>
              ))}
            </div>
          </>)}
        </div>
      </div>
      <WizardNav step={step} total={steps.length} onPrev={() => setStep(Math.max(0, step - 1))} onNext={() => setStep(Math.min(steps.length - 1, step + 1))} onPublish={handlePublish} />
    </div>
  );
};

// ═══════════════════════════════════════════════
// LIVE ROOM WIZARD
// ═══════════════════════════════════════════════
const LiveRoomWizard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const [roomType, setRoomType] = useState<'audio' | 'video' | 'stage'>('audio');
  const [visibility, setVisibility] = useState<'public' | 'connections' | 'private'>('public');
  const [tags, setTags] = useState<string[]>([]);
  const steps: WizardStep[] = [
    { id: 'type', label: 'Room Type', icon: Radio },
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'access', label: 'Access & Rules', icon: Shield },
    { id: 'review', label: 'Launch', icon: Rocket },
  ];
  const handlePublish = () => { toast.success('Live room created!'); onClose(); };
  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2"><Radio className="h-4 w-4 text-[hsl(var(--gigvora-amber))]" /><span className="text-sm font-semibold">Create Live Room</span></div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">✕ Close</Button>
      </div>
      <WizardStepper steps={steps} current={step} onStep={setStep} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          {step === 0 && (<>
            <h2 className="text-lg font-bold">Choose Room Type</h2>
            <div className="grid grid-cols-3 gap-3">
              <OptionCard icon={Headphones} label="Audio Room" desc="Voice-only conversation space" selected={roomType === 'audio'} onClick={() => setRoomType('audio')} />
              <OptionCard icon={Video} label="Video Room" desc="Face-to-face group session" selected={roomType === 'video'} onClick={() => setRoomType('video')} />
              <OptionCard icon={Tv} label="Stage" desc="One-to-many broadcast with audience" selected={roomType === 'stage'} onClick={() => setRoomType('stage')} />
            </div>
          </>)}
          {step === 1 && (<>
            <h2 className="text-lg font-bold">Room Details</h2>
            <FormField label="Room Title" required><TextInput placeholder="e.g. Friday Design Critique" /></FormField>
            <FormField label="Topic / Description"><Textarea placeholder="What will be discussed?" rows={3} /></FormField>
            <FormField label="Start Time">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="text-xs gap-1"><Zap className="h-3 w-3" />Start Now</Button>
                <span className="text-xs text-muted-foreground">or schedule</span>
                <TextInput type="datetime-local" className="max-w-[220px]" />
              </div>
            </FormField>
            <FormField label="Tags"><TagInput value={tags} onChange={setTags} /></FormField>
            <FormField label="Cover Image (optional)"><UploadZone label="Drop image or skip" accept="JPG, PNG" icon={ImageIcon} /></FormField>
          </>)}
          {step === 2 && (<>
            <h2 className="text-lg font-bold">Access & Moderation</h2>
            <FormField label="Visibility">
              <div className="grid grid-cols-3 gap-3">
                <OptionCard icon={Globe} label="Public" desc="Anyone can join" selected={visibility === 'public'} onClick={() => setVisibility('public')} />
                <OptionCard icon={Users} label="Connections" desc="Only your connections" selected={visibility === 'connections'} onClick={() => setVisibility('connections')} />
                <OptionCard icon={Lock} label="Private" desc="Invite-only access" selected={visibility === 'private'} onClick={() => setVisibility('private')} />
              </div>
            </FormField>
            <FormField label="Max Participants"><TextInput type="number" placeholder="50" /></FormField>
            <div className="rounded-lg border p-3 space-y-2 text-xs">
              <h3 className="font-semibold">Moderation Rules</h3>
              <div className="flex items-center justify-between"><span>Require hand raise to speak</span><Switch defaultChecked /></div>
              <div className="flex items-center justify-between"><span>Auto-mute on join</span><Switch defaultChecked /></div>
              <div className="flex items-center justify-between"><span>Allow recording</span><Switch /></div>
              <div className="flex items-center justify-between"><span>Enable chat</span><Switch defaultChecked /></div>
            </div>
            <FormField label="Co-hosts"><TextInput placeholder="Search users to add as co-hosts..." /></FormField>
          </>)}
          {step === 3 && (<>
            <h2 className="text-lg font-bold">Ready to Launch</h2>
            <div className="rounded-xl border bg-card p-5 space-y-3 text-sm">
              {[{l:'Type',v:roomType},{l:'Visibility',v:'Public'},{l:'Max Participants',v:'50'},{l:'Recording',v:'Disabled'},{l:'Moderation',v:'Hand raise required'}].map(r => (
                <div key={r.l} className="flex justify-between"><span className="text-muted-foreground">{r.l}</span><span className="font-medium capitalize">{r.v}</span></div>
              ))}
            </div>
            <Button size="lg" className="w-full gap-2 mt-4" onClick={handlePublish}><Rocket className="h-4 w-4" />Launch Room</Button>
          </>)}
        </div>
      </div>
      <WizardNav step={step} total={steps.length} onPrev={() => setStep(Math.max(0, step - 1))} onNext={() => setStep(Math.min(steps.length - 1, step + 1))} onPublish={handlePublish} />
    </div>
  );
};

// ═══════════════════════════════════════════════
// CAMPAIGN CREATIVE WIZARD
// ═══════════════════════════════════════════════
const CampaignWizard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const [objective, setObjective] = useState<'awareness' | 'leads' | 'engagement' | 'conversions'>('awareness');
  const [budgetType, setBudgetType] = useState<'daily' | 'lifetime'>('daily');
  const [tags, setTags] = useState<string[]>([]);
  const steps: WizardStep[] = [
    { id: 'objective', label: 'Objective', icon: Target },
    { id: 'creative', label: 'Creative Assets', icon: Palette },
    { id: 'audience', label: 'Audience', icon: Users },
    { id: 'budget', label: 'Budget & Schedule', icon: DollarSign },
    { id: 'review', label: 'Review & Submit', icon: CheckCircle2 },
  ];
  const handlePublish = () => { toast.success('Campaign submitted for review!'); onClose(); };
  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-[hsl(var(--gigvora-amber))]" /><span className="text-sm font-semibold">Create Campaign Creative</span></div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">✕ Close</Button>
      </div>
      <WizardStepper steps={steps} current={step} onStep={setStep} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          {step === 0 && (<>
            <h2 className="text-lg font-bold">Campaign Objective</h2>
            <div className="grid grid-cols-2 gap-3">
              <OptionCard icon={Eye} label="Brand Awareness" desc="Maximize reach and impressions" selected={objective === 'awareness'} onClick={() => setObjective('awareness')} />
              <OptionCard icon={Users} label="Lead Generation" desc="Capture qualified leads" selected={objective === 'leads'} onClick={() => setObjective('leads')} />
              <OptionCard icon={Heart} label="Engagement" desc="Drive likes, comments, and shares" selected={objective === 'engagement'} onClick={() => setObjective('engagement')} />
              <OptionCard icon={TrendingUp} label="Conversions" desc="Drive signups, purchases, or actions" selected={objective === 'conversions'} onClick={() => setObjective('conversions')} />
            </div>
          </>)}
          {step === 1 && (<>
            <h2 className="text-lg font-bold">Creative Assets</h2>
            <FormField label="Campaign Name" required><TextInput placeholder="e.g. Q2 Future of Work Campaign" /></FormField>
            <FormField label="Headline" required><TextInput placeholder="Main ad headline" /></FormField>
            <FormField label="Body Copy"><Textarea placeholder="Supporting copy text..." rows={3} /></FormField>
            <FormField label="Call to Action"><SelectInput options={[{value:'learn',label:'Learn More'},{value:'signup',label:'Sign Up'},{value:'apply',label:'Apply Now'},{value:'download',label:'Download'},{value:'contact',label:'Contact Us'},{value:'shop',label:'Shop Now'}]} /></FormField>
            <FormField label="Landing Page URL"><TextInput placeholder="https://..." /></FormField>
            <h3 className="text-sm font-semibold pt-2">Media Assets</h3>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Banner Image (1200×628)"><UploadZone label="Upload banner" accept="JPG, PNG" icon={ImageIcon} /></FormField>
              <FormField label="Square Image (1080×1080)"><UploadZone label="Upload square" accept="JPG, PNG" icon={ImageIcon} /></FormField>
            </div>
            <FormField label="Video Ad (optional)"><UploadZone label="Upload video creative" accept="MP4, MOV — max 120s" icon={Film} /></FormField>
            <FormField label="Tags"><TagInput value={tags} onChange={setTags} /></FormField>
          </>)}
          {step === 2 && (<>
            <h2 className="text-lg font-bold">Target Audience</h2>
            <FormField label="Location"><TextInput placeholder="e.g. United States, United Kingdom" /></FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Age Range"><div className="flex gap-2"><TextInput placeholder="18" className="w-20" /><span className="self-center text-xs">to</span><TextInput placeholder="65" className="w-20" /></div></FormField>
              <FormField label="Gender"><SelectInput options={[{value:'all',label:'All'},{value:'male',label:'Male'},{value:'female',label:'Female'}]} /></FormField>
            </div>
            <FormField label="Industries"><TextInput placeholder="Technology, Design, Marketing..." /></FormField>
            <FormField label="Job Titles"><TextInput placeholder="CTO, Product Manager, Designer..." /></FormField>
            <FormField label="Seniority"><SelectInput options={[{value:'all',label:'All Levels'},{value:'entry',label:'Entry Level'},{value:'mid',label:'Mid Level'},{value:'senior',label:'Senior'},{value:'exec',label:'Executive'}]} /></FormField>
            <div className="rounded-lg border p-3 text-xs">
              <div className="flex justify-between mb-1"><span className="font-semibold">Estimated Reach</span><span className="font-bold text-accent">45K — 120K</span></div>
              <Progress value={55} className="h-1.5" />
            </div>
          </>)}
          {step === 3 && (<>
            <h2 className="text-lg font-bold">Budget & Schedule</h2>
            <FormField label="Budget Type">
              <div className="grid grid-cols-2 gap-3">
                <OptionCard icon={Calendar} label="Daily Budget" desc="Spend a set amount per day" selected={budgetType === 'daily'} onClick={() => setBudgetType('daily')} />
                <OptionCard icon={DollarSign} label="Lifetime Budget" desc="Total budget for campaign duration" selected={budgetType === 'lifetime'} onClick={() => setBudgetType('lifetime')} />
              </div>
            </FormField>
            <FormField label="Daily Budget" required><div className="flex items-center gap-2"><span className="text-sm font-medium">$</span><TextInput type="number" placeholder="50.00" /></div></FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Start Date" required><TextInput type="date" /></FormField>
              <FormField label="End Date"><TextInput type="date" /></FormField>
            </div>
            <FormField label="Bid Strategy"><SelectInput options={[{value:'auto',label:'Automatic (recommended)'},{value:'cpc',label:'Max CPC'},{value:'cpm',label:'Target CPM'}]} /></FormField>
          </>)}
          {step === 4 && (<>
            <h2 className="text-lg font-bold">Review & Submit</h2>
            <div className="rounded-xl border bg-card p-5 space-y-3 text-sm">
              {[{l:'Objective',v:objective},{l:'CTA',v:'Learn More'},{l:'Audience',v:'US, 18-65, Tech'},{l:'Budget',v:'$50/day'},{l:'Duration',v:'Apr 15 — May 15'},{l:'Bid Strategy',v:'Automatic'}].map(r => (
                <div key={r.l} className="flex justify-between"><span className="text-muted-foreground">{r.l}</span><span className="font-medium capitalize">{r.v}</span></div>
              ))}
            </div>
            <div className="rounded-lg border border-[hsl(var(--gigvora-amber))]/30 bg-[hsl(var(--gigvora-amber))]/5 p-3 flex items-start gap-2">
              <Shield className="h-4 w-4 text-[hsl(var(--gigvora-amber))] shrink-0 mt-0.5" />
              <div className="text-xs"><span className="font-semibold">Review Required.</span> Campaign creatives are reviewed before going live. Typical review time: 2–4 hours.</div>
            </div>
          </>)}
        </div>
      </div>
      <WizardNav step={step} total={steps.length} onPrev={() => setStep(Math.max(0, step - 1))} onNext={() => setStep(Math.min(steps.length - 1, step + 1))} onPublish={handlePublish} nextLabel={step === steps.length - 2 ? 'Submit for Review' : undefined} />
    </div>
  );
};

// ═══════════════════════════════════════════════
// SHORT CLIP WIZARD
// ═══════════════════════════════════════════════
const ClipWizard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const steps: WizardStep[] = [
    { id: 'upload', label: 'Upload Video', icon: Film },
    { id: 'edit', label: 'Edit & Trim', icon: Sliders },
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'publish', label: 'Publish', icon: Send },
  ];
  const handlePublish = () => { toast.success('Clip published!'); onClose(); };
  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2"><Film className="h-4 w-4 text-destructive" /><span className="text-sm font-semibold">Create Short Clip</span></div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">✕ Close</Button>
      </div>
      <WizardStepper steps={steps} current={step} onStep={setStep} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          {step === 0 && (<>
            <h2 className="text-lg font-bold">Upload Your Video</h2>
            <UploadZone label="Drop video file or click to upload" accept="MP4, MOV, WEBM — max 60 seconds, up to 500MB" icon={Film} />
            <div className="text-center text-xs text-muted-foreground">or</div>
            <div className="flex justify-center gap-3">
              <Button variant="outline" className="gap-1.5 text-xs"><Video className="h-3.5 w-3.5" />Record with Camera</Button>
              <Button variant="outline" className="gap-1.5 text-xs"><Monitor className="h-3.5 w-3.5" />Screen Recording</Button>
            </div>
            <div className="rounded-lg border p-3 space-y-2 text-xs">
              <h3 className="font-semibold">Video Requirements</h3>
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <div>• Max duration: 60 seconds</div>
                <div>• Aspect ratio: 9:16 or 16:9</div>
                <div>• Min resolution: 720p</div>
                <div>• Max size: 500MB</div>
              </div>
            </div>
          </>)}
          {step === 1 && (<>
            <h2 className="text-lg font-bold">Edit & Trim</h2>
            <div className="rounded-xl border bg-muted/30 aspect-video flex items-center justify-center">
              <div className="text-center"><Film className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" /><div className="text-sm text-muted-foreground">Video preview will appear here</div></div>
            </div>
            <div className="rounded-lg border p-3">
              <h3 className="text-xs font-semibold mb-3">Timeline</h3>
              <div className="h-8 bg-muted/50 rounded-md flex items-center px-2"><div className="h-4 w-1/2 bg-accent/30 rounded" /></div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>0:00</span><span>0:30</span><span>0:60</span></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Button variant="outline" className="gap-1 text-xs"><Type className="h-3 w-3" />Add Text</Button>
              <Button variant="outline" className="gap-1 text-xs"><Music className="h-3 w-3" />Add Music</Button>
              <Button variant="outline" className="gap-1 text-xs"><Palette className="h-3 w-3" />Filters</Button>
            </div>
            <FormField label="Thumbnail"><div className="flex gap-2"><Button variant="outline" size="sm" className="text-xs">Auto-generate</Button><Button variant="outline" size="sm" className="text-xs gap-1"><Upload className="h-3 w-3" />Upload custom</Button></div></FormField>
          </>)}
          {step === 2 && (<>
            <h2 className="text-lg font-bold">Clip Details</h2>
            <FormField label="Title" required><TextInput placeholder="e.g. 5 CSS Tricks You Didn't Know" /></FormField>
            <FormField label="Description"><Textarea placeholder="What's your clip about?" rows={3} /></FormField>
            <FormField label="Tags"><TagInput value={tags} onChange={setTags} /></FormField>
            <FormField label="Visibility"><SelectInput options={[{value:'public',label:'Public — Everyone can see'},{value:'connections',label:'Connections Only'},{value:'unlisted',label:'Unlisted — Link only'}]} /></FormField>
            <div className="flex items-center justify-between text-xs p-3 rounded-lg border"><span>Allow comments</span><Switch defaultChecked /></div>
            <div className="flex items-center justify-between text-xs p-3 rounded-lg border"><span>Allow duets / remixes</span><Switch /></div>
          </>)}
          {step === 3 && (<>
            <h2 className="text-lg font-bold">Ready to Publish</h2>
            <div className="rounded-xl border bg-card p-5 space-y-3 text-sm">
              {[{l:'Duration',v:'0:28'},{l:'Resolution',v:'1080×1920 (9:16)'},{l:'Visibility',v:'Public'},{l:'Comments',v:'Enabled'}].map(r => (
                <div key={r.l} className="flex justify-between"><span className="text-muted-foreground">{r.l}</span><span className="font-medium">{r.v}</span></div>
              ))}
            </div>
            <FormField label="Schedule">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="text-xs gap-1"><Send className="h-3 w-3" />Publish Now</Button>
                <span className="text-xs text-muted-foreground">or</span>
                <TextInput type="datetime-local" className="max-w-[220px]" />
              </div>
            </FormField>
          </>)}
        </div>
      </div>
      <WizardNav step={step} total={steps.length} onPrev={() => setStep(Math.max(0, step - 1))} onNext={() => setStep(Math.min(steps.length - 1, step + 1))} onPublish={handlePublish} />
    </div>
  );
};

// ═══════════════════════════════════════════════
// GENERIC BLOCK EDITOR (for post, article, newsletter, showcase, page, template)
// ═══════════════════════════════════════════════
const BlockEditor: React.FC<{ type: ContentType; onClose: () => void }> = ({ type, onClose }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const Icon = typeIcons[type];
  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2"><Icon className={cn('h-4 w-4', typeColors[type])} /><span className="text-sm font-semibold capitalize">{type.replace('-', ' ')} Editor</span><Badge variant="secondary" className="text-[9px]">Draft · v1</Badge></div>
        <div className="flex gap-2"><Button variant="outline" size="sm" className="text-xs">Save Draft</Button><Button size="sm" className="text-xs gap-1"><Send className="h-3.5 w-3.5" />Publish</Button><Button variant="ghost" size="sm" onClick={onClose} className="text-xs">✕</Button></div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-8">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Untitled" className="w-full text-3xl font-bold bg-transparent border-none focus:outline-none placeholder:text-muted-foreground/40 mb-4" />
            <div className="flex items-center gap-0.5 mb-4 p-1 border rounded-lg bg-muted/30 flex-wrap">
              {[Heading1, Heading2, Bold, Italic, Underline].map((I, i) => <button key={i} className="p-1.5 rounded hover:bg-muted"><I className="h-4 w-4" /></button>)}
              <div className="h-5 w-px bg-border mx-1" />
              {[List, ListOrdered, Quote, Code].map((I, i) => <button key={i} className="p-1.5 rounded hover:bg-muted"><I className="h-4 w-4" /></button>)}
              <div className="h-5 w-px bg-border mx-1" />
              {[LinkIcon, ImagePlus, Film].map((I, i) => <button key={i} className="p-1.5 rounded hover:bg-muted"><I className="h-4 w-4" /></button>)}
              <div className="h-5 w-px bg-border mx-1" />
              <button className="p-1.5 rounded hover:bg-muted flex items-center gap-1 text-xs"><Sparkles className="h-4 w-4" /> AI</button>
            </div>
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Start writing..." className="w-full min-h-[400px] bg-transparent border-none resize-none text-sm leading-relaxed focus:outline-none placeholder:text-muted-foreground/40" />
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold">Attachments</span>
                <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1"><Upload className="h-3 w-3" />Upload</Button>
                <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1"><Sparkles className="h-3 w-3" />AI Image</Button>
              </div>
              <UploadZone label="Drop files here or click to upload" icon={Upload} />
            </div>
          </div>
        </div>
        <div className="w-64 border-l overflow-y-auto p-4 space-y-4 hidden lg:block">
          <FormField label="Destination"><SelectInput options={[{value:'feed',label:'Feed'},{value:'page',label:'Company Page'},{value:'group',label:'Group'},{value:'newsletter',label:'Newsletter'}]} /></FormField>
          <FormField label="Audience"><SelectInput options={[{value:'everyone',label:'Everyone'},{value:'connections',label:'Connections'},{value:'subscribers',label:'Subscribers'}]} /></FormField>
          <FormField label="Tags"><TextInput placeholder="Add tags..." /></FormField>
          <div className="rounded-lg border p-3"><h3 className="text-xs font-semibold mb-2 flex items-center gap-1"><Shield className="h-3.5 w-3.5" />Approval</h3><div className="space-y-1.5 text-[10px]"><div className="flex justify-between"><span>Brand compliance</span><Badge variant="secondary" className="text-[9px]">Pending</Badge></div><div className="flex justify-between"><span>Manager approval</span><Badge variant="secondary" className="text-[9px]">Pending</Badge></div></div></div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════
const CreationStudioPage: React.FC = () => {
  const [activeWizard, setActiveWizard] = useState<ContentType | null>(null);
  const [contentFilter, setContentFilter] = useState<ContentStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = MOCK_CONTENT.filter(c => {
    if (contentFilter !== 'all' && c.status !== contentFilter) return false;
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const createItems: { type: ContentType; name: string; desc: string; icon: React.ElementType }[] = [
    { type: 'post', name: 'Post', desc: 'Quick text, image, or poll', icon: FileText },
    { type: 'article', name: 'Article', desc: 'Long-form content with rich formatting', icon: PenTool },
    { type: 'newsletter', name: 'Newsletter', desc: 'Email newsletter to subscribers', icon: Mail },
    { type: 'podcast', name: 'Podcast Episode', desc: 'Record or upload audio content', icon: Podcast },
    { type: 'webinar', name: 'Webinar', desc: 'Host a live or recorded webinar', icon: Video },
    { type: 'live-room', name: 'Live Room', desc: 'Start a live audio or video room', icon: Radio },
    { type: 'clip', name: 'Short Clip', desc: 'Create a short-form video', icon: Film },
    { type: 'campaign', name: 'Campaign Creative', desc: 'Ad campaign assets and copy', icon: Megaphone },
    { type: 'showcase', name: 'Startup Showcase', desc: 'Present your startup or product', icon: Rocket },
    { type: 'page', name: 'Page', desc: 'Publish a standalone page', icon: Globe },
    { type: 'template', name: 'Template', desc: 'Create a reusable content template', icon: Package },
  ];

  const topStrip = (
    <>
      <Sparkles className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold">Creation Studio</span>
      <Badge variant="secondary" className="text-[8px]">{MOCK_CONTENT.length} items</Badge>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search content..." className="h-6 rounded-md border bg-background pl-7 pr-2 text-[8px] w-40 focus:outline-none focus:ring-1 focus:ring-ring" />
      </div>
      <Button size="sm" className="h-6 text-[9px] gap-1" onClick={() => setActiveWizard('post')}><Plus className="h-2.5 w-2.5" />Create</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Quick Stats" icon={<BarChart3 className="h-3.5 w-3.5 text-accent" />}>
        <div className="space-y-1 text-[8px]">
          {[
            { l: 'Published', v: MOCK_CONTENT.filter(c => c.status === 'published').length, c: 'text-[hsl(var(--state-healthy))]' },
            { l: 'In Review', v: MOCK_CONTENT.filter(c => c.status === 'in-review').length, c: 'text-[hsl(var(--gigvora-amber))]' },
            { l: 'Drafts', v: MOCK_CONTENT.filter(c => c.status === 'draft').length, c: 'text-muted-foreground' },
            { l: 'Scheduled', v: MOCK_CONTENT.filter(c => c.status === 'scheduled').length, c: 'text-accent' },
          ].map(s => <div key={s.l} className="flex justify-between"><span className="text-muted-foreground">{s.l}</span><span className={cn('font-semibold', s.c)}>{s.v}</span></div>)}
        </div>
      </SectionCard>

      <SectionCard title="Top Performing" icon={<TrendingUp className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" />}>
        <div className="space-y-1.5">
          {MOCK_CONTENT.filter(c => c.views > 0).sort((a, b) => b.views - a.views).slice(0, 3).map(c => {
            const I = typeIcons[c.type];
            return (
              <div key={c.id} className="flex items-center gap-1.5 text-[7px]">
                <I className={cn('h-3 w-3 shrink-0', typeColors[c.type])} />
                <span className="truncate flex-1">{c.title}</span>
                <span className="font-semibold shrink-0">{c.views >= 1000 ? `${(c.views / 1000).toFixed(1)}K` : c.views}</span>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Quick Create">
        <div className="space-y-0.5">
          {[
            { label: 'New Article', icon: PenTool, type: 'article' as ContentType },
            { label: 'Record Podcast', icon: Podcast, type: 'podcast' as ContentType },
            { label: 'Start Webinar', icon: Video, type: 'webinar' as ContentType },
            { label: 'Launch Live Room', icon: Radio, type: 'live-room' as ContentType },
            { label: 'Create Campaign', icon: Megaphone, type: 'campaign' as ContentType },
          ].map(a => (
            <button key={a.label} onClick={() => setActiveWizard(a.type)} className="flex items-center gap-2 p-1.5 rounded-md w-full text-left hover:bg-muted/30 transition-colors text-[8px]">
              <a.icon className="h-3 w-3 text-muted-foreground" /><span>{a.label}</span>
              <ChevronRight className="h-2.5 w-2.5 ml-auto text-muted-foreground" />
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <>
      <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
        <KPIBand className="mb-3">
          <KPICard label="Total Content" value={String(MOCK_CONTENT.length)} change="+5 this week" trend="up" />
          <KPICard label="Total Views" value="18.8K" change="+23%" trend="up" />
          <KPICard label="Engagement" value="8.3%" change="+1.2%" trend="up" />
          <KPICard label="Revenue" value="$2,890" change="+$340" trend="up" />
        </KPIBand>

        <Tabs defaultValue="content">
          <TabsList className="mb-3 flex-wrap h-auto gap-0.5">
            <TabsTrigger value="content" className="gap-1 text-[10px] h-6 px-2"><Layers className="h-3 w-3" />All Content</TabsTrigger>
            <TabsTrigger value="create" className="gap-1 text-[10px] h-6 px-2"><Plus className="h-3 w-3" />Create</TabsTrigger>
            <TabsTrigger value="schedule" className="gap-1 text-[10px] h-6 px-2"><Calendar className="h-3 w-3" />Schedule</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1 text-[10px] h-6 px-2"><BarChart3 className="h-3 w-3" />Analytics</TabsTrigger>
          </TabsList>

          {/* All Content */}
          <TabsContent value="content">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <div className="flex gap-0.5">
                {(['all', 'draft', 'scheduled', 'in-review', 'published'] as const).map(s => (
                  <button key={s} onClick={() => setContentFilter(s)} className={cn('px-2 py-1 rounded-md text-[9px] capitalize transition-colors', contentFilter === s ? 'bg-accent/10 text-accent font-medium' : 'text-muted-foreground hover:bg-muted/50')}>{s === 'all' ? 'All' : s.replace('-', ' ')}</button>
                ))}
              </div>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-6 rounded-md border bg-background px-1.5 text-[8px]">
                <option value="all">All Types</option>
                {createItems.map(i => <option key={i.type} value={i.type}>{i.name}</option>)}
              </select>
            </div>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="text-[8px] text-muted-foreground font-medium">
                    <th className="text-left px-3 py-1.5">Content</th>
                    <th className="text-center px-2 py-1.5">Type</th>
                    <th className="text-center px-2 py-1.5">Status</th>
                    <th className="text-right px-2 py-1.5">Views</th>
                    <th className="text-right px-2 py-1.5">Engagement</th>
                    <th className="text-left px-2 py-1.5 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => {
                    const Icon = typeIcons[item.type];
                    const sb = statusStyles[item.status];
                    return (
                      <tr key={item.id} onClick={() => setActiveWizard(item.type)} className="border-t text-[8px] hover:bg-muted/30 cursor-pointer">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Icon className={cn('h-4 w-4 shrink-0', typeColors[item.type])} />
                            <div>
                              <div className="font-medium text-[9px]">{item.title}</div>
                              <div className="text-[7px] text-muted-foreground">{item.destination} · v{item.version} · {item.publishedAt || item.scheduledAt || item.createdAt}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center"><Badge variant="secondary" className="text-[6px] capitalize">{item.type.replace('-', ' ')}</Badge></td>
                        <td className="px-2 py-2 text-center"><Badge className={cn('text-[6px]', sb.cls)}>{sb.label}</Badge></td>
                        <td className="px-2 py-2 text-right font-mono">{item.views > 0 ? (item.views >= 1000 ? `${(item.views / 1000).toFixed(1)}K` : item.views) : '—'}</td>
                        <td className="px-2 py-2 text-right">
                          {item.likes > 0 ? <span className="flex items-center justify-end gap-0.5"><Heart className="h-2 w-2" />{item.likes} <MessageSquare className="h-2 w-2 ml-1" />{item.comments}</span> : '—'}
                        </td>
                        <td className="px-2 py-2"><Button variant="ghost" size="sm" className="h-4 w-4 p-0"><MoreHorizontal className="h-3 w-3" /></Button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Create */}
          <TabsContent value="create">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {createItems.map(item => (
                <button key={item.type} onClick={() => setActiveWizard(item.type)} className="rounded-xl border bg-card p-4 text-left hover:border-accent hover:bg-accent/5 transition-all group">
                  <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center mb-2.5 group-hover:bg-accent/20 transition-colors">
                    <item.icon className="h-4.5 w-4.5 text-accent" />
                  </div>
                  <div className="font-semibold text-xs mb-0.5">{item.name}</div>
                  <div className="text-[10px] text-muted-foreground">{item.desc}</div>
                </button>
              ))}
            </div>
          </TabsContent>

          {/* Schedule */}
          <TabsContent value="schedule">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold flex items-center gap-1.5 mb-3"><Calendar className="h-3.5 w-3.5 text-accent" />Scheduled Queue</h3>
              {MOCK_CONTENT.filter(c => c.status === 'scheduled').map(item => {
                const Icon = typeIcons[item.type];
                return (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    <Icon className={cn('h-4 w-4 shrink-0', typeColors[item.type])} />
                    <div className="flex-1 min-w-0"><div className="text-xs font-medium truncate">{item.title}</div><div className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{item.scheduledAt}</div></div>
                    <div className="flex gap-1 shrink-0"><Button variant="ghost" size="sm" className="h-6 text-[10px]"><Edit className="h-3 w-3" /></Button><Button variant="ghost" size="sm" className="h-6 text-[10px]"><Trash2 className="h-3 w-3" /></Button></div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border bg-card p-4">
                <h3 className="text-xs font-semibold mb-3">Top Content</h3>
                <div className="space-y-2.5">
                  {MOCK_CONTENT.filter(c => c.views > 0).sort((a, b) => b.views - a.views).slice(0, 5).map(c => (
                    <div key={c.id} className="flex items-center gap-2 text-[9px]">
                      <div className="flex-1 truncate font-medium">{c.title}</div>
                      <span className="font-semibold">{c.views >= 1000 ? `${(c.views / 1000).toFixed(1)}K` : c.views} views</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <h3 className="text-xs font-semibold mb-3">Engagement</h3>
                <div className="space-y-2.5">
                  {[
                    { label: 'Likes', value: 613, icon: Heart, color: 'text-destructive' },
                    { label: 'Comments', value: 112, icon: MessageSquare, color: 'text-accent' },
                    { label: 'Shares', value: 313, icon: Share2, color: 'text-[hsl(var(--state-healthy))]' },
                    { label: 'Bookmarks', value: 89, icon: Bookmark, color: 'text-[hsl(var(--gigvora-amber))]' },
                  ].map(e => (
                    <div key={e.label} className="flex items-center gap-2 text-[9px]">
                      <e.icon className={cn('h-3.5 w-3.5', e.color)} />
                      <div className="flex-1">{e.label}</div>
                      <span className="font-semibold">{e.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DashboardLayout>

      {/* Wizards */}
      {activeWizard === 'podcast' && <PodcastWizard onClose={() => setActiveWizard(null)} />}
      {activeWizard === 'webinar' && <WebinarWizard onClose={() => setActiveWizard(null)} />}
      {activeWizard === 'live-room' && <LiveRoomWizard onClose={() => setActiveWizard(null)} />}
      {activeWizard === 'campaign' && <CampaignWizard onClose={() => setActiveWizard(null)} />}
      {activeWizard === 'clip' && <ClipWizard onClose={() => setActiveWizard(null)} />}
      {activeWizard && !['podcast', 'webinar', 'live-room', 'campaign', 'clip'].includes(activeWizard) && (
        <BlockEditor type={activeWizard} onClose={() => setActiveWizard(null)} />
      )}
    </>
  );
};

export default CreationStudioPage;
