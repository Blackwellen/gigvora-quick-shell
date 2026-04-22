import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { KPICard, SectionCard } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  MapPin, CheckCircle2, UserPlus, MessageSquare, MoreHorizontal,
  Star, Briefcase, GraduationCap, Award, Edit, ExternalLink,
  Globe, Clock, Shield, Sparkles, TrendingUp,
  Eye, Heart, Share2, Camera, Plus, X, Save,
  Zap, Users, FileText,
  ThumbsUp, MessageCircle, ArrowRight,
  Lock, AlertTriangle, Flag, Bookmark, Calendar,
  Layers, Play, Mic, Radio, Headphones, BookOpen,
  DollarSign, Package, BarChart3, Target, Coffee,
  Gift, Bell, Video, Crown, Tv, Hash,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MOCK_PROFILE, MOCK_FEED } from '@/data/mock';
import type { FeedPost } from '@/data/mock';
import { RichAvatar, StackedAvatars, LiveBadge, ActivityTrace, ReactionBar, EventCountdown, Waveform } from '@/components/social/SocialPrimitives';

/* ═══════════════════════════════════════════════════════════
   Types & Constants
   ═══════════════════════════════════════════════════════════ */
type ProfileTab = 'overview' | 'activity' | 'services' | 'gigs' | 'projects' | 'reviews' | 'media' | 'events' | 'network' | 'about' | 'analytics';

const PROFILE_TABS: { id: ProfileTab; label: string; icon: React.ElementType; ownerOnly?: boolean }[] = [
  { id: 'overview', label: 'Overview', icon: Eye },
  { id: 'activity', label: 'Activity', icon: TrendingUp },
  { id: 'services', label: 'Services', icon: Package },
  { id: 'gigs', label: 'Gigs', icon: Layers },
  { id: 'projects', label: 'Projects', icon: Target },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'media', label: 'Media', icon: Play },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'network', label: 'Network', icon: Users },
  { id: 'about', label: 'About', icon: BookOpen },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, ownerOnly: true },
];

const MOCK_SERVICES = [
  { id: 's1', title: 'Brand Identity Design', description: 'Complete brand identity including logo, color palette, typography, and guidelines.', price: '$2,500', duration: '2-3 weeks', rating: 4.9, reviews: 47, booked: 12 },
  { id: 's2', title: 'Product Design Sprint', description: 'Intensive 5-day design sprint to solve complex product challenges.', price: '$5,000', duration: '1 week', rating: 5.0, reviews: 23, booked: 8 },
  { id: 's3', title: 'Design System Architecture', description: 'Build a scalable component library and design token system.', price: '$8,000', duration: '4-6 weeks', rating: 4.8, reviews: 31, booked: 5 },
  { id: 's4', title: 'UX Audit & Recommendations', description: 'Comprehensive audit of your product with actionable improvement plan.', price: '$1,500', duration: '1 week', rating: 4.9, reviews: 62, booked: 19 },
];

const MOCK_GIGS = [
  { id: 'g1', title: 'Mobile App UI Design', price: 'From $150', delivery: '3 days', orders: 89, rating: 4.9, image: 'from-accent/20 to-accent/5' },
  { id: 'g2', title: 'Landing Page Design', price: 'From $200', delivery: '2 days', orders: 156, rating: 5.0, image: 'from-primary/15 to-primary/5' },
  { id: 'g3', title: 'Logo Design', price: 'From $75', delivery: '1 day', orders: 312, rating: 4.8, image: 'from-accent/15 via-primary/10 to-muted' },
  { id: 'g4', title: 'Figma Prototype', price: 'From $300', delivery: '5 days', orders: 67, rating: 4.9, image: 'from-muted to-muted/30' },
];

const MOCK_PROJECTS = [
  { id: 'p1', title: 'E-commerce Platform Redesign', client: 'RetailPlus', status: 'completed', budget: '$25,000', duration: 'Jan - Mar 2026', rating: 5.0, skills: ['React', 'Figma', 'Design Systems'] },
  { id: 'p2', title: 'SaaS Dashboard MVP', client: 'DataFlow', status: 'in-progress', budget: '$18,000', duration: 'Mar 2026 - Present', skills: ['Product Design', 'User Research'] },
  { id: 'p3', title: 'Mobile Banking App', client: 'FinTech Corp', status: 'completed', budget: '$32,000', duration: 'Sep - Dec 2025', rating: 4.9, skills: ['Mobile Design', 'Accessibility'] },
];

const MOCK_MEDIA_ITEMS = [
  { id: 'm1', type: 'podcast', title: 'Design at Scale', role: 'Guest', show: 'The Product Show', date: 'Mar 2026', plays: '12.4K' },
  { id: 'm2', type: 'webinar', title: 'Design Systems in 2026', role: 'Host', date: 'Feb 2026', attendees: 456 },
  { id: 'm3', type: 'podcast', title: 'From Freelancer to Agency', role: 'Host', show: 'Build & Ship', date: 'Jan 2026', plays: '8.7K' },
  { id: 'm4', type: 'video', title: 'Building Component Libraries', date: 'Dec 2025', views: '23K' },
];

const MOCK_EVENTS = [
  { id: 'e1', title: 'Design Systems Summit 2026', role: 'Speaker', date: 'Apr 15, 2026', attendees: 1200, status: 'upcoming' as const },
  { id: 'e2', title: 'UX Research Masterclass', role: 'Host', date: 'Apr 22, 2026', attendees: 89, status: 'upcoming' as const },
  { id: 'e3', title: 'Figma Config 2025', role: 'Panelist', date: 'Jun 2025', attendees: 5000, status: 'past' as const },
  { id: 'e4', title: 'Product Hunt Launch', role: 'Presenter', date: 'May 2025', attendees: 340, status: 'past' as const },
];

const MOCK_NETWORK = [
  { id: 'n1', name: 'Jennifer Park', headline: 'Lead Designer at Notion', mutual: 24, avatar: 'https://i.pravatar.cc/150?u=jennifer-park' },
  { id: 'n2', name: 'Ryan Mitchell', headline: 'Principal Designer at Linear', mutual: 18, avatar: 'https://i.pravatar.cc/150?u=ryan-mitchell' },
  { id: 'n3', name: 'Amy Zhang', headline: 'Design Systems at Vercel', mutual: 31, avatar: 'https://i.pravatar.cc/150?u=amy-zhang' },
  { id: 'n4', name: 'Carlos Rivera', headline: 'UX Lead at Spotify', mutual: 15, avatar: 'https://i.pravatar.cc/150?u=carlos-rivera' },
  { id: 'n5', name: 'Sarah Kim', headline: 'Product Designer at Stripe', mutual: 22, avatar: 'https://i.pravatar.cc/150?u=sarah-kim2' },
  { id: 'n6', name: 'David Chen', headline: 'Design Director at Meta', mutual: 9, avatar: 'https://i.pravatar.cc/150?u=david-chen' },
];

const MOCK_RECOMMENDATIONS = [
  { author: 'Lisa Wang', role: 'VP Design at Google', text: 'One of the most talented designers I have worked with. Their ability to translate complex requirements into elegant interfaces is remarkable.', date: 'Mar 2026', avatar: 'https://i.pravatar.cc/150?u=lisa-wang' },
  { author: 'Alex Kim', role: 'CEO at LaunchPad AI', text: 'Exceptional work ethic and design thinking. Delivered our entire product redesign ahead of schedule with outstanding quality.', date: 'Jan 2026', avatar: 'https://i.pravatar.cc/150?u=alex-kim' },
];

const MOCK_CERTIFICATIONS = [
  { name: 'AWS Solutions Architect', issuer: 'Amazon Web Services', date: 'Mar 2025', badge: '🏅' },
  { name: 'Google UX Design Certificate', issuer: 'Google', date: 'Jan 2024', badge: '🎖️' },
  { name: 'Certified Scrum Master', issuer: 'Scrum Alliance', date: 'Nov 2023', badge: '📜' },
];

const PORTFOLIO_ITEMS = [
  { title: 'Design System 3.0', type: 'UI/UX Design', views: '2.4K', color: 'from-accent/20 to-accent/5' },
  { title: 'E-commerce Redesign', type: 'Product Design', views: '1.8K', color: 'from-primary/15 to-primary/5' },
  { title: 'Mobile Banking App', type: 'App Design', views: '3.1K', color: 'from-accent/15 via-primary/10 to-muted' },
  { title: 'SaaS Dashboard', type: 'Web Design', views: '945', color: 'from-muted to-muted/30' },
  { title: 'Brand Identity', type: 'Branding', views: '1.2K', color: 'from-primary/20 to-accent/10' },
  { title: 'AI Chat Interface', type: 'UI Design', views: '4.7K', color: 'from-accent/25 to-primary/15' },
];

const VERIFICATION_BADGES = [
  { name: 'Identity Verified', status: true, icon: Shield },
  { name: 'Email Verified', status: true, icon: CheckCircle2 },
  { name: 'Skills Assessed', status: true, icon: Award },
  { name: 'Background Check', status: false, icon: FileText },
];

/* ═══════════════════════════════════════════════════════════
   Profile Edit Drawer
   ═══════════════════════════════════════════════════════════ */
const ProfileEditDrawer: React.FC<{
  open: boolean; onClose: () => void; profile: any; onSave: (data: any) => void;
}> = ({ open, onClose, profile, onSave }) => {
  const [form, setForm] = useState({
    display_name: profile?.display_name || '',
    headline: profile?.headline || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
    website: profile?.website || '',
    skills: (profile?.skills || []).join(', '),
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ ...form, skills: form.skills.split(',').map(s => s.trim()).filter(Boolean) });
    setSaving(false);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-[420px] sm:w-[460px] overflow-y-auto p-0">
        <SheetHeader className="p-5 border-b">
          <SheetTitle className="text-sm font-bold">Edit Profile</SheetTitle>
        </SheetHeader>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-4 ring-accent/20">
              <AvatarFallback className="bg-accent/10 text-accent text-lg font-bold">
                {(form.display_name || 'U').split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Camera className="h-3 w-3" />Change Photo</Button>
              <p className="text-[9px] text-muted-foreground mt-1">JPG, PNG or GIF. Max 5MB.</p>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold mb-1.5 block">Display Name</label>
            <input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
          </div>
          <div>
            <label className="text-[11px] font-semibold mb-1.5 block">Headline</label>
            <input value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" placeholder="Senior Product Designer at Figma" />
          </div>
          <div>
            <label className="text-[11px] font-semibold mb-1.5 block">Bio</label>
            <Textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={4} placeholder="Tell your story..." className="rounded-xl text-[11px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold mb-1.5 block">Location</label>
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" placeholder="San Francisco, CA" />
            </div>
            <div>
              <label className="text-[11px] font-semibold mb-1.5 block">Website</label>
              <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" placeholder="https://..." />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold mb-1.5 block">Skills (comma separated)</label>
            <input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" placeholder="React, TypeScript, Design Systems" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t">
          <Button variant="outline" size="sm" className="rounded-xl text-[10px]" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="rounded-xl text-[10px] gap-1" onClick={handleSave} disabled={saving}>
            <Save className="h-3 w-3" /> {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/* ═══════════════════════════════════════════════════════════
   State Banners
   ═══════════════════════════════════════════════════════════ */
const IncompleteProfileBanner: React.FC<{ score: number }> = ({ score }) => (
  <div className="rounded-2xl border border-accent/30 bg-accent/5 p-3.5 flex items-center gap-3 mb-3">
    <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
      <AlertTriangle className="h-4 w-4 text-accent" />
    </div>
    <div className="flex-1">
      <div className="text-[11px] font-semibold">Profile {score}% Complete</div>
      <div className="text-[10px] text-muted-foreground">Complete your profile to increase visibility and attract more opportunities.</div>
    </div>
    <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl">Complete Now</Button>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Activity Post Mini Card
   ═══════════════════════════════════════════════════════════ */
const ActivityPost: React.FC<{ post: FeedPost }> = ({ post }) => (
  <div className="flex gap-2.5 p-2.5 rounded-2xl border hover:bg-muted/30 hover:shadow-sm cursor-pointer transition-all duration-200 group">
    <Avatar className="h-7 w-7 shrink-0 ring-2 ring-muted/50 transition-transform group-hover:scale-105">
      <AvatarFallback className="text-[8px] bg-accent/10 text-accent font-bold">{post.author.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] line-clamp-2 leading-relaxed">{post.content.slice(0, 120)}...</p>
      <div className="flex items-center gap-2 mt-0.5 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-0.5"><ThumbsUp className="h-2.5 w-2.5" /> {post.likes}</span>
        <span className="flex items-center gap-0.5"><MessageCircle className="h-2.5 w-2.5" /> {post.comments}</span>
        <span>{post.createdAt}</span>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const ProfilePage: React.FC = () => {
  const { userId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const isOwnProfile = !userId || userId === user?.id;
  const [editOpen, setEditOpen] = useState(false);
  const [dbProfile, setDbProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [showActions, setShowActions] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCoverImage(url);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLocalAvatar(url);
  };

  useEffect(() => {
    // Profile data is sourced from the NestJS backend / mock data.
    // The legacy Supabase `profiles` table has been removed.
    if (!isAuthenticated || !user) return;
    setDbProfile(null);
  }, [userId, user, isAuthenticated]);

  const p = MOCK_PROFILE;
  const displayName = dbProfile?.display_name || p.name;
  const headline = dbProfile?.headline || p.headline;
  const bio = dbProfile?.bio || p.about;
  const location = dbProfile?.location || p.location;
  const skills = dbProfile?.skills || p.skills.map(s => s.name);
  const avatarUrl = dbProfile?.avatar_url || '';
  const isVerified = dbProfile?.is_verified ?? p.verified;
  const website = dbProfile?.website || '';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('');

  const checks = [
    { label: 'Profile photo', done: !!avatarUrl },
    { label: 'Headline', done: !!headline },
    { label: 'Bio', done: !!bio && bio.length > 20 },
    { label: 'Location', done: !!location },
    { label: 'Skills', done: (skills?.length || 0) >= 3 },
    { label: 'Website', done: !!website },
  ];
  const profileScore = Math.round((checks.filter(c => c.done).length / checks.length) * 100);

  const handleSaveProfile = async (formData: any) => {
    if (!user) return;
    // TODO: wire to NestJS `/identity/me` once profile module is exposed.
    setDbProfile((prev: any) => ({ ...(prev ?? {}), ...formData }));
    toast.success('Profile updated!');
  };

  const visibleTabs = PROFILE_TABS.filter(t => !t.ownerOnly || isOwnProfile);

  /* ── Top Strip ── */
  const topStrip = (
    <>
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center">
          <Users className="h-3.5 w-3.5 text-accent" />
        </div>
        <span className="text-xs font-bold">Profile</span>
        {isOwnProfile && <Badge variant="secondary" className="text-[8px] h-4 rounded-lg">Your Profile</Badge>}
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">
        {isOwnProfile ? (
          <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => setEditOpen(true)}>
            <Edit className="h-2.5 w-2.5" />Edit Profile
          </Button>
        ) : (
          <>
            <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><UserPlus className="h-2.5 w-2.5" />Connect</Button>
            <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><MessageSquare className="h-2.5 w-2.5" />Message</Button>
            <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Bookmark className="h-2.5 w-2.5" />Save</Button>
          </>
        )}
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl" onClick={() => setShowActions(!showActions)}>
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </div>
    </>
  );

  /* ── Right Rail ── */
  const rightRail = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <KPICard label="Profile Views" value="1,247" change="+23%" trend="up" className="!rounded-2xl" />
        <KPICard label="Connections" value={p.connections.toLocaleString()} change="+8" trend="up" className="!rounded-2xl" />
      </div>

      {isOwnProfile && (
        <SectionCard title="Profile Strength" className="!rounded-2xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className={cn('text-[11px] font-bold', profileScore >= 80 ? 'text-[hsl(var(--state-healthy))]' : profileScore >= 50 ? 'text-[hsl(var(--state-caution))]' : 'text-[hsl(var(--state-blocked))]')}>{profileScore}%</span>
          </div>
          <Progress value={profileScore} className="h-1.5 mb-2.5" />
          <div className="space-y-1">
            {checks.map(c => (
              <div key={c.label} className="flex items-center gap-1.5 text-[9px]">
                <CheckCircle2 className={cn('h-3 w-3', c.done ? 'text-[hsl(var(--state-healthy))]' : 'text-muted-foreground/30')} />
                <span className={c.done ? 'text-muted-foreground' : 'font-medium'}>{c.label}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Availability" className="!rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--state-healthy))] animate-pulse" />
          <span className="text-[10px] font-medium">Available for work</span>
        </div>
        <div className="space-y-1 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Response time</span><span className="font-semibold">~2 hours</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Timezone</span><span className="font-semibold">PST (UTC-8)</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Rate</span><span className="font-semibold">$150/hr</span></div>
        </div>
        <div className="flex gap-1.5 mt-2.5">
          <Button size="sm" className="flex-1 h-7 text-[9px] rounded-xl gap-1"><Calendar className="h-2.5 w-2.5" />Book</Button>
          <Button variant="outline" size="sm" className="flex-1 h-7 text-[9px] rounded-xl gap-1"><MessageSquare className="h-2.5 w-2.5" />Inquire</Button>
        </div>
      </SectionCard>

      <SectionCard title="Trust & Verification" className="!rounded-2xl">
        <div className="space-y-1">
          {VERIFICATION_BADGES.map(b => (
            <div key={b.name} className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] transition-colors', b.status ? 'bg-[hsl(var(--state-healthy)/0.05)]' : 'bg-muted/30')}>
              <b.icon className={cn('h-3 w-3', b.status ? 'text-[hsl(var(--state-healthy))]' : 'text-muted-foreground/40')} />
              <span className={b.status ? 'font-medium' : 'text-muted-foreground'}>{b.name}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Highlights / Badges */}
      <SectionCard title="Badges & Achievements" className="!rounded-2xl">
        <div className="flex flex-wrap gap-1.5">
          {[
            { emoji: '🏆', label: 'Top Rated' },
            { emoji: '⚡', label: 'Fast Delivery' },
            { emoji: '🎯', label: '100% Job Success' },
            { emoji: '💎', label: 'Premium Member' },
            { emoji: '🔥', label: '10 Streak' },
            { emoji: '📚', label: 'Mentor' },
          ].map(b => (
            <div key={b.label} className="flex items-center gap-1 px-2 py-1 rounded-xl bg-muted/50 text-[8px] font-medium hover:bg-accent/10 hover:text-accent cursor-pointer transition-all">
              <span>{b.emoji}</span>{b.label}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Creator / Subscribe */}
      {!isOwnProfile && (
        <SectionCard title="Support This Creator" className="!rounded-2xl">
          <p className="text-[10px] text-muted-foreground mb-2">Get exclusive content, early access, and direct support.</p>
          <div className="space-y-1.5">
            <Button className="w-full h-8 text-[10px] rounded-xl gap-1.5"><Crown className="h-3 w-3" />Subscribe - $9/mo</Button>
            <Button variant="outline" className="w-full h-8 text-[10px] rounded-xl gap-1.5"><Coffee className="h-3 w-3" />Buy a Coffee - $5</Button>
            <Button variant="outline" className="w-full h-8 text-[10px] rounded-xl gap-1.5"><Gift className="h-3 w-3" />Send a Tip</Button>
          </div>
        </SectionCard>
      )}

      <SectionCard title="Similar Professionals" subtitle="AI-matched" className="!rounded-2xl">
        <div className="space-y-1.5">
          {MOCK_NETWORK.slice(0, 3).map(sp => (
            <div key={sp.id} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted/30 cursor-pointer transition-all duration-200 group">
              <RichAvatar name={sp.name} src={sp.avatar} size="sm" status="online" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold truncate group-hover:text-accent transition-colors">{sp.name}</div>
                <div className="text-[8px] text-muted-foreground truncate">{sp.headline}</div>
              </div>
              <Badge variant="secondary" className="text-[7px] h-3.5 shrink-0 rounded-lg">{sp.mutual} mutual</Badge>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  /* ── Bottom Section ── */
  const bottomSection = isOwnProfile ? (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-accent" />Profile Analytics</span>
        <span className="text-[10px] text-muted-foreground">Last 30 days</span>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Profile Views', value: '1,247' },
          { label: 'Search Appearances', value: '892' },
          { label: 'Content Impressions', value: '45.2K' },
          { label: 'Inbound Messages', value: '34' },
          { label: 'Connection Requests', value: '12' },
        ].map(s => (
          <div key={s.label} className="text-center rounded-2xl border p-3 hover:shadow-sm transition-shadow">
            <div className="text-sm font-bold">{s.value}</div>
            <div className="text-[9px] text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-60" bottomSection={bottomSection}>
      {isOwnProfile && profileScore < 80 && <IncompleteProfileBanner score={profileScore} />}

      {/* ── PROFILE HERO ── */}
      <div className="mb-4 rounded-3xl overflow-hidden border shadow-sm">
        <div className="h-36 relative overflow-hidden">
          {coverImage ? (
            <img src={coverImage} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-accent/15 via-[hsl(var(--gigvora-blue)/0.12)] to-primary/10" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzAtOS45NC04LjA2LTE4LTE4LTE4UzAgOC4wNiAwIDE4czguMDYgMTggMTggMTggMTgtOC4wNiAxOC0xOHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
            </>
          )}
          {isOwnProfile && (
            <>
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
              <button
                onClick={() => coverInputRef.current?.click()}
                className="absolute bottom-2.5 right-2.5 h-7 px-2.5 rounded-xl bg-background/80 backdrop-blur-sm text-[9px] font-medium flex items-center gap-1 hover:bg-background transition-all shadow-sm"
              >
                <Camera className="h-3 w-3" /> Edit cover
              </button>
            </>
          )}
        </div>

        <div className="bg-card px-5 pb-5 relative">
          <div className="flex items-end gap-4 -mt-10">
            <div className="relative">
              <Avatar className="h-20 w-20 ring-4 ring-card shadow-lg">
                {(localAvatar || avatarUrl) ? <AvatarImage src={localAvatar || avatarUrl} /> : null}
                <AvatarFallback className="bg-accent/10 text-accent text-xl font-bold">{initials}</AvatarFallback>
              </Avatar>
              {isVerified && (
                <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-[hsl(var(--state-healthy))] flex items-center justify-center ring-2 ring-card">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </div>
              )}
              {isOwnProfile && (
                <>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-0 left-0 h-6 w-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-md ring-2 ring-card hover:scale-110 transition-transform"
                  >
                    <Camera className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold truncate">{displayName}</h1>
                {isVerified && <Badge className="bg-accent/10 text-accent text-[8px] h-4 rounded-lg">Verified</Badge>}
              </div>
              <p className="text-[12px] text-muted-foreground truncate">{headline}</p>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground flex-wrap">
                {location && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" /> {location}</span>}
                <span className="flex items-center gap-0.5"><Users className="h-3 w-3" /> {p.connections.toLocaleString()} connections</span>
                <span className="text-muted-foreground/40">·</span>
                <span>1.2K followers</span>
                <span className="text-muted-foreground/40">·</span>
                <span>89 following</span>
                {website && <a href={website} target="_blank" rel="noopener" className="flex items-center gap-0.5 text-accent hover:underline"><Globe className="h-3 w-3" /> Website</a>}
              </div>
            </div>
          </div>

          {/* Highlights strip */}
          <div className="flex items-center gap-3 mt-3 overflow-x-auto scrollbar-none">
            <div className="flex gap-1.5 shrink-0">
              <Badge className="bg-accent/10 text-accent text-[8px] h-5 rounded-xl">Professional</Badge>
              <Badge variant="secondary" className="text-[8px] h-5 rounded-xl">Freelancer</Badge>
              <Badge variant="secondary" className="text-[8px] h-5 rounded-xl flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-current" />4.9</Badge>
              <Badge variant="secondary" className="text-[8px] h-5 rounded-xl flex items-center gap-0.5"><Zap className="h-2.5 w-2.5" />Top Rated</Badge>
              <Badge variant="secondary" className="text-[8px] h-5 rounded-xl flex items-center gap-0.5"><Award className="h-2.5 w-2.5" />47 Reviews</Badge>
            </div>
            <div className="h-4 w-px bg-border shrink-0" />
            <div className="flex items-center gap-2 shrink-0 text-[9px] text-muted-foreground">
              <span className="flex items-center gap-0.5"><Package className="h-3 w-3" />4 Services</span>
              <span className="flex items-center gap-0.5"><Layers className="h-3 w-3" />4 Gigs</span>
              <span className="flex items-center gap-0.5"><Target className="h-3 w-3" />3 Projects</span>
            </div>
          </div>

          {/* Quick CTA row for visitor */}
          {!isOwnProfile && (
            <div className="flex gap-2 mt-3">
              <Button size="sm" className="h-8 text-[10px] rounded-xl gap-1.5 flex-1 max-w-[140px]"><UserPlus className="h-3 w-3" />Connect</Button>
              <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-xl gap-1.5 flex-1 max-w-[140px]"><MessageSquare className="h-3 w-3" />Message</Button>
              <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-xl gap-1.5"><Calendar className="h-3 w-3" />Book</Button>
              <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-xl gap-1.5"><Bell className="h-3 w-3" />Follow</Button>
              <Button variant="ghost" size="sm" className="h-8 text-[10px] rounded-xl gap-1"><Share2 className="h-3 w-3" /></Button>
            </div>
          )}
        </div>
      </div>

      {/* ── TAB NAV ── */}
      <div className="flex gap-1 overflow-x-auto pb-2.5 mb-3 scrollbar-none sticky top-0 z-10 bg-background/95 backdrop-blur-sm -mx-1 px-1 pt-1">
        {visibleTabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={cn(
            'flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold whitespace-nowrap transition-all duration-200 shrink-0',
            activeTab === t.id ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
          )}>
            <t.icon className="h-3 w-3" />{t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
         TAB CONTENT
         ══════════════════════════════════════════════════════ */}

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div className="space-y-3">
          {/* About snippet */}
          <SectionCard title="About" className="!rounded-2xl" action={<Button variant="ghost" size="sm" className="h-5 text-[9px] rounded-lg" onClick={() => setActiveTab('about')}>See more</Button>}>
            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">{bio}</p>
          </SectionCard>

          {/* Highlighted Services */}
          <SectionCard title="Featured Services" className="!rounded-2xl" action={<Button variant="ghost" size="sm" className="h-5 text-[9px] rounded-lg" onClick={() => setActiveTab('services')}>View all</Button>}>
            <div className="grid grid-cols-2 gap-2">
              {MOCK_SERVICES.slice(0, 2).map(s => (
                <div key={s.id} className="rounded-2xl border p-3 hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all group">
                  <div className="text-[11px] font-bold group-hover:text-accent transition-colors">{s.title}</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5 line-clamp-2">{s.description}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] font-bold text-accent">{s.price}</span>
                    <div className="flex items-center gap-1 text-[8px] text-muted-foreground">
                      <Star className="h-2.5 w-2.5 fill-accent text-accent" />{s.rating} ({s.reviews})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Featured Gigs */}
          <SectionCard title="Popular Gigs" className="!rounded-2xl" action={<Button variant="ghost" size="sm" className="h-5 text-[9px] rounded-lg" onClick={() => setActiveTab('gigs')}>View all</Button>}>
            <div className="grid grid-cols-2 gap-2">
              {MOCK_GIGS.slice(0, 2).map(g => (
                <div key={g.id} className="rounded-2xl border overflow-hidden hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all group">
                  <div className={cn('h-20 bg-gradient-to-br flex items-center justify-center', g.image)}>
                    <Layers className="h-6 w-6 text-muted-foreground/20" />
                  </div>
                  <div className="p-2.5">
                    <div className="text-[10px] font-bold group-hover:text-accent transition-colors">{g.title}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] font-bold text-accent">{g.price}</span>
                      <span className="text-[8px] text-muted-foreground">{g.orders} orders</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Recent Projects */}
          <SectionCard title="Recent Projects" className="!rounded-2xl" action={<Button variant="ghost" size="sm" className="h-5 text-[9px] rounded-lg" onClick={() => setActiveTab('projects')}>View all</Button>}>
            {MOCK_PROJECTS.slice(0, 2).map(proj => (
              <div key={proj.id} className="flex items-start gap-3 p-2.5 rounded-2xl border hover:bg-muted/30 cursor-pointer transition-all mb-1.5 last:mb-0 group">
                <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', proj.status === 'completed' ? 'bg-[hsl(var(--state-healthy)/0.1)]' : 'bg-accent/10')}>
                  <Target className={cn('h-4 w-4', proj.status === 'completed' ? 'text-[hsl(var(--state-healthy))]' : 'text-accent')} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold group-hover:text-accent transition-colors">{proj.title}</div>
                  <div className="text-[9px] text-muted-foreground">{proj.client} · {proj.duration}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge className={cn('text-[7px] h-3.5 rounded-lg border-0', proj.status === 'completed' ? 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' : 'bg-accent/10 text-accent')}>{proj.status === 'completed' ? 'Completed' : 'In Progress'}</Badge>
                    {proj.rating && <span className="text-[8px] flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-accent text-accent" />{proj.rating}</span>}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground">{proj.budget}</span>
              </div>
            ))}
          </SectionCard>

          {/* Portfolio preview */}
          <SectionCard title="Portfolio" className="!rounded-2xl">
            <div className="grid grid-cols-3 gap-2">
              {PORTFOLIO_ITEMS.slice(0, 3).map((proj, i) => (
                <div key={i} className="group rounded-2xl border overflow-hidden hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all duration-200">
                  <div className={cn("aspect-video bg-gradient-to-br flex items-center justify-center", proj.color)}>
                    <FileText className="h-5 w-5 text-muted-foreground/20" />
                  </div>
                  <div className="p-2">
                    <div className="text-[9px] font-semibold group-hover:text-accent transition-colors truncate">{proj.title}</div>
                    <div className="text-[8px] text-muted-foreground">{proj.type}</div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Recommendations preview */}
          <SectionCard title="Recommendations" className="!rounded-2xl">
            {MOCK_RECOMMENDATIONS.slice(0, 1).map((rec, i) => (
              <div key={i} className="flex gap-3 p-2.5 rounded-2xl bg-muted/20">
                <RichAvatar name={rec.author} src={rec.avatar} size="sm" verified />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold">{rec.author}</div>
                  <div className="text-[9px] text-muted-foreground">{rec.role}</div>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed line-clamp-2 italic">&ldquo;{rec.text}&rdquo;</p>
                </div>
              </div>
            ))}
          </SectionCard>

          {/* Recent Activity */}
          <SectionCard title="Recent Activity" className="!rounded-2xl" action={<Button variant="ghost" size="sm" className="h-5 text-[9px] rounded-lg" onClick={() => setActiveTab('activity')}>View all</Button>}>
            <div className="space-y-1.5">
              {MOCK_FEED.slice(0, 2).map(post => <ActivityPost key={post.id} post={post} />)}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── ACTIVITY TAB ── */}
      {activeTab === 'activity' && (
        <SectionCard title="Recent Activity" className="!rounded-2xl">
          <div className="space-y-1.5">
            {MOCK_FEED.slice(0, 6).map(post => <ActivityPost key={post.id} post={post} />)}
          </div>
          <Button variant="ghost" className="w-full mt-2.5 text-[10px] h-7 rounded-xl gap-1"><ArrowRight className="h-3 w-3" />View All Activity</Button>
        </SectionCard>
      )}

      {/* ── SERVICES TAB ── */}
      {activeTab === 'services' && (
        <div className="space-y-3">
          <SectionCard title="Services" className="!rounded-2xl" action={isOwnProfile ? <Button variant="outline" size="sm" className="h-6 text-[9px] rounded-xl gap-1"><Plus className="h-2.5 w-2.5" />Add Service</Button> : undefined}>
            <div className="space-y-2">
              {MOCK_SERVICES.map(s => (
                <div key={s.id} className="rounded-2xl border p-4 hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-[12px] font-bold group-hover:text-accent transition-colors">{s.title}</div>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{s.description}</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <div className="text-[13px] font-bold text-accent">{s.price}</div>
                      <div className="text-[9px] text-muted-foreground">{s.duration}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t">
                    <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                      <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-accent text-accent" />{s.rating} ({s.reviews} reviews)</span>
                      <span>{s.booked} booked this month</span>
                    </div>
                    <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Calendar className="h-2.5 w-2.5" />Book Now</Button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── GIGS TAB ── */}
      {activeTab === 'gigs' && (
        <SectionCard title="Gigs" className="!rounded-2xl" action={isOwnProfile ? <Button variant="outline" size="sm" className="h-6 text-[9px] rounded-xl gap-1"><Plus className="h-2.5 w-2.5" />Create Gig</Button> : undefined}>
          <div className="grid grid-cols-2 gap-2.5">
            {MOCK_GIGS.map(g => (
              <div key={g.id} className="rounded-2xl border overflow-hidden hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all group">
                <div className={cn('h-28 bg-gradient-to-br flex items-center justify-center relative', g.image)}>
                  <Layers className="h-8 w-8 text-muted-foreground/20" />
                  <div className="absolute top-2 right-2">
                    <Badge className="text-[7px] h-3.5 rounded-lg bg-card/80 backdrop-blur-sm text-foreground border-0">{g.delivery}</Badge>
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-[11px] font-bold group-hover:text-accent transition-colors">{g.title}</div>
                  <div className="flex items-center gap-2 mt-1.5 text-[9px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-accent text-accent" />{g.rating}</span>
                    <span>{g.orders} orders</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <span className="text-[11px] font-bold text-accent">{g.price}</span>
                    <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-xl">Order Now</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── PROJECTS TAB ── */}
      {activeTab === 'projects' && (
        <SectionCard title="Projects" className="!rounded-2xl" action={isOwnProfile ? <Button variant="outline" size="sm" className="h-6 text-[9px] rounded-xl gap-1"><Plus className="h-2.5 w-2.5" />Add Project</Button> : undefined}>
          <div className="space-y-2">
            {MOCK_PROJECTS.map(proj => (
              <div key={proj.id} className="rounded-2xl border p-4 hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all group">
                <div className="flex items-start gap-3">
                  <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', proj.status === 'completed' ? 'bg-[hsl(var(--state-healthy)/0.1)]' : 'bg-accent/10')}>
                    <Target className={cn('h-4 w-4', proj.status === 'completed' ? 'text-[hsl(var(--state-healthy))]' : 'text-accent')} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[12px] font-bold group-hover:text-accent transition-colors">{proj.title}</div>
                    <div className="text-[10px] text-muted-foreground">{proj.client} · {proj.duration}</div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Badge className={cn('text-[7px] h-3.5 rounded-lg border-0', proj.status === 'completed' ? 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' : 'bg-accent/10 text-accent')}>{proj.status === 'completed' ? 'Completed' : 'In Progress'}</Badge>
                      {proj.rating && <span className="text-[9px] flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-accent text-accent" />{proj.rating}</span>}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {proj.skills.map(s => (
                        <Badge key={s} variant="secondary" className="text-[7px] h-3.5 rounded-lg">{s}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[12px] font-bold">{proj.budget}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Portfolio Grid */}
          <div className="mt-4 pt-4 border-t">
            <div className="text-[11px] font-bold mb-2.5">Portfolio</div>
            <div className="grid grid-cols-3 gap-2">
              {PORTFOLIO_ITEMS.map((proj, i) => (
                <div key={i} className="group rounded-2xl border overflow-hidden hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all duration-200">
                  <div className={cn("aspect-video bg-gradient-to-br flex items-center justify-center relative", proj.color)}>
                    <FileText className="h-6 w-6 text-muted-foreground/20" />
                  </div>
                  <div className="p-2.5">
                    <div className="text-[10px] font-semibold group-hover:text-accent transition-colors">{proj.title}</div>
                    <div className="flex items-center justify-between text-[8px] text-muted-foreground mt-0.5">
                      <span>{proj.type}</span>
                      <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" /> {proj.views}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── REVIEWS TAB ── */}
      {activeTab === 'reviews' && (
        <div className="space-y-3">
          <SectionCard title="Reviews" className="!rounded-2xl">
            <div className="flex items-center gap-4 mb-3.5 pb-3.5 border-b">
              <div className="text-center">
                <div className="text-2xl font-bold">4.9</div>
                <div className="flex gap-0.5 mt-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-accent text-accent" />)}</div>
                <div className="text-[9px] text-muted-foreground mt-0.5">{p.reviews.length} reviews</div>
              </div>
              <div className="flex-1 space-y-0.5">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = p.reviews.filter(r => r.rating === star).length;
                  const pct = p.reviews.length > 0 ? (count / p.reviews.length) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-1.5 text-[9px]">
                      <span className="w-2">{star}</span>
                      <Star className="h-2.5 w-2.5 text-accent" />
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} /></div>
                      <span className="w-4 text-right text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2.5">
              {p.reviews.map((r, i) => (
                <div key={i} className="border-b last:border-0 pb-2.5 last:pb-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Avatar className="h-6 w-6 ring-2 ring-muted/50"><AvatarFallback className="text-[8px] bg-muted font-bold">{r.author[0]}</AvatarFallback></Avatar>
                    <span className="text-[10px] font-semibold">{r.author}</span>
                    <span className="text-[9px] text-muted-foreground">· {r.date}</span>
                    <div className="flex gap-0.5 ml-auto">{[...Array(5)].map((_, j) => <Star key={j} className={cn('h-2.5 w-2.5', j < r.rating ? 'fill-accent text-accent' : 'text-muted')} />)}</div>
                  </div>
                  <p className="text-[10px] text-muted-foreground pl-8">{r.text}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Recommendations */}
          <SectionCard title="Recommendations" className="!rounded-2xl">
            <div className="space-y-3">
              {MOCK_RECOMMENDATIONS.map((rec, i) => (
                <div key={i} className="rounded-2xl bg-muted/20 p-3.5">
                  <div className="flex items-center gap-2.5 mb-2">
                    <RichAvatar name={rec.author} src={rec.avatar} size="sm" verified />
                    <div>
                      <div className="text-[11px] font-bold">{rec.author}</div>
                      <div className="text-[9px] text-muted-foreground">{rec.role} · {rec.date}</div>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed italic">&ldquo;{rec.text}&rdquo;</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── MEDIA TAB ── */}
      {activeTab === 'media' && (
        <div className="space-y-3">
          <SectionCard title="Media Appearances" className="!rounded-2xl">
            <div className="space-y-2">
              {MOCK_MEDIA_ITEMS.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-2xl border hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all group">
                  <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center shrink-0',
                    m.type === 'podcast' ? 'bg-[hsl(var(--gigvora-purple)/0.1)]' :
                    m.type === 'webinar' ? 'bg-accent/10' :
                    'bg-[hsl(var(--gigvora-blue)/0.1)]'
                  )}>
                    {m.type === 'podcast' ? <Mic className="h-5 w-5 text-[hsl(var(--gigvora-purple))]" /> :
                     m.type === 'webinar' ? <Tv className="h-5 w-5 text-accent" /> :
                     <Video className="h-5 w-5 text-[hsl(var(--gigvora-blue))]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Badge className="text-[7px] h-3.5 rounded-lg bg-muted text-muted-foreground border-0 uppercase">{m.type}</Badge>
                      <Badge variant="secondary" className="text-[7px] h-3.5 rounded-lg">{m.role}</Badge>
                    </div>
                    <div className="text-[11px] font-bold mt-0.5 group-hover:text-accent transition-colors">{m.title}</div>
                    <div className="text-[9px] text-muted-foreground">
                      {'show' in m && m.show && `${m.show} · `}{m.date}
                      {' · '}
                      {'plays' in m && m.plays && `${m.plays} plays`}
                      {'attendees' in m && m.attendees && `${m.attendees} attendees`}
                      {'views' in m && m.views && `${m.views} views`}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1 shrink-0">
                    <Play className="h-2.5 w-2.5" />{m.type === 'podcast' ? 'Listen' : 'Watch'}
                  </Button>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Mini Audio Player */}
          <SectionCard title="Latest Episode" className="!rounded-2xl">
            <div className="rounded-2xl bg-gradient-to-r from-[hsl(var(--gigvora-purple)/0.08)] to-accent/5 p-3.5">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-xl bg-[hsl(var(--gigvora-purple)/0.15)] flex items-center justify-center shrink-0">
                  <Headphones className="h-6 w-6 text-[hsl(var(--gigvora-purple))]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold">Design at Scale</div>
                  <div className="text-[9px] text-muted-foreground">The Product Show · Episode 42</div>
                  <Waveform bars={20} active className="mt-2 h-5" />
                </div>
                <Button size="sm" className="h-9 w-9 p-0 rounded-xl shrink-0">
                  <Play className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── EVENTS TAB ── */}
      {activeTab === 'events' && (
        <div className="space-y-3">
          <SectionCard title="Upcoming Events" className="!rounded-2xl">
            <div className="space-y-2">
              {MOCK_EVENTS.filter(e => e.status === 'upcoming').map(e => (
                <div key={e.id} className="rounded-2xl border p-3.5 hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                        <Calendar className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold group-hover:text-accent transition-colors">{e.title}</div>
                        <div className="text-[9px] text-muted-foreground">{e.date} · {e.attendees.toLocaleString()} attending</div>
                        <Badge variant="secondary" className="text-[7px] h-3.5 rounded-lg mt-1">{e.role}</Badge>
                      </div>
                    </div>
                    <LiveBadge variant="upcoming" />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Past Events" className="!rounded-2xl">
            <div className="space-y-1.5">
              {MOCK_EVENTS.filter(e => e.status === 'past').map(e => (
                <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 cursor-pointer transition-all group">
                  <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold group-hover:text-accent transition-colors">{e.title}</div>
                    <div className="text-[8px] text-muted-foreground">{e.date} · {e.role} · {e.attendees.toLocaleString()} attended</div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── NETWORK TAB ── */}
      {activeTab === 'network' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-center rounded-2xl border p-3 flex-1">
              <div className="text-lg font-bold">{p.connections.toLocaleString()}</div>
              <div className="text-[9px] text-muted-foreground">Connections</div>
            </div>
            <div className="text-center rounded-2xl border p-3 flex-1">
              <div className="text-lg font-bold">1.2K</div>
              <div className="text-[9px] text-muted-foreground">Followers</div>
            </div>
            <div className="text-center rounded-2xl border p-3 flex-1">
              <div className="text-lg font-bold">89</div>
              <div className="text-[9px] text-muted-foreground">Following</div>
            </div>
          </div>
          <SectionCard title="Connections" className="!rounded-2xl">
            <div className="grid grid-cols-2 gap-2">
              {MOCK_NETWORK.map(n => (
                <div key={n.id} className="flex items-center gap-2.5 p-2.5 rounded-2xl border hover:shadow-sm cursor-pointer transition-all group">
                  <RichAvatar name={n.name} src={n.avatar} size="sm" status="online" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold truncate group-hover:text-accent transition-colors">{n.name}</div>
                    <div className="text-[8px] text-muted-foreground truncate">{n.headline}</div>
                    <div className="text-[8px] text-muted-foreground">{n.mutual} mutual</div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── ABOUT TAB ── */}
      {activeTab === 'about' && (
        <div className="space-y-3">
          <SectionCard title="About" className="!rounded-2xl">
            <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-line">{bio}</p>
          </SectionCard>

          <SectionCard title="Skills & Endorsements" className="!rounded-2xl" action={isOwnProfile ? <Button variant="ghost" size="sm" className="h-5 text-[9px] rounded-lg"><Plus className="h-2.5 w-2.5 mr-0.5" />Add</Button> : undefined}>
            <div className="flex flex-wrap gap-1.5">
              {(Array.isArray(skills) ? skills : []).map((s: any, i: number) => {
                const name = typeof s === 'string' ? s : s.name;
                const endorsements = typeof s === 'object' ? s.endorsements : Math.floor(Math.random() * 80) + 10;
                return (
                  <Badge key={i} variant="secondary" className="text-[9px] py-1 px-2.5 gap-1 rounded-xl hover:bg-accent/10 hover:text-accent cursor-pointer transition-all">
                    {name} <span className="text-muted-foreground">· {endorsements}</span>
                  </Badge>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Experience" className="!rounded-2xl" action={isOwnProfile ? <Button variant="ghost" size="sm" className="h-5 text-[9px] rounded-lg"><Plus className="h-2.5 w-2.5 mr-0.5" />Add</Button> : undefined}>
            <div className="space-y-3">
              {p.experience.map((exp, i) => (
                <div key={i} className="flex gap-2.5 group">
                  <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[11px] font-semibold">{exp.title}</div>
                    <div className="text-[10px] text-muted-foreground">{exp.company}</div>
                    <div className="text-[9px] text-muted-foreground flex items-center gap-1.5">
                      <span>{exp.period}</span>
                      {exp.current && <Badge className="text-[7px] h-3.5 rounded-lg bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] border-0">Current</Badge>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Education" className="!rounded-2xl">
            <div className="space-y-2.5">
              {p.education.map((e, i) => (
                <div key={i} className="flex gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <GraduationCap className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold">{e.school}</div>
                    <div className="text-[10px] text-muted-foreground">{e.degree}</div>
                    <div className="text-[9px] text-muted-foreground">{e.period}</div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Certifications" className="!rounded-2xl">
            <div className="space-y-1.5">
              {MOCK_CERTIFICATIONS.map((cert, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-2xl border hover:bg-muted/30 transition-all group">
                  <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center text-base shrink-0">{cert.badge}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold group-hover:text-accent transition-colors">{cert.name}</div>
                    <div className="text-[9px] text-muted-foreground">{cert.issuer} · Issued {cert.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── ANALYTICS TAB (owner only) ── */}
      {activeTab === 'analytics' && isOwnProfile && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Profile Views', value: '1,247', change: '+23%' },
              { label: 'Search Appearances', value: '892', change: '+15%' },
              { label: 'Content Impressions', value: '45.2K', change: '+31%' },
              { label: 'Inbound Messages', value: '34', change: '+8%' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border bg-card p-3.5 text-center">
                <div className="text-lg font-bold">{s.value}</div>
                <div className="text-[9px] text-muted-foreground mt-0.5">{s.label}</div>
                <Badge className="text-[7px] h-3.5 rounded-lg bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] border-0 mt-1">{s.change}</Badge>
              </div>
            ))}
          </div>

          <SectionCard title="Top Performing Content" className="!rounded-2xl">
            <div className="space-y-1.5">
              {MOCK_FEED.slice(0, 3).map((post, i) => (
                <div key={post.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-all">
                  <span className="text-[10px] font-bold text-muted-foreground/40 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] truncate">{post.content.slice(0, 80)}...</div>
                    <div className="text-[9px] text-muted-foreground">{post.createdAt}</div>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] text-muted-foreground shrink-0">
                    <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />2.4K</span>
                    <span className="flex items-center gap-0.5"><ThumbsUp className="h-2.5 w-2.5" />{post.likes}</span>
                    <span className="flex items-center gap-0.5"><MessageCircle className="h-2.5 w-2.5" />{post.comments}</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Visitor Demographics" className="!rounded-2xl">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Recruiters', pct: 34 },
                { label: 'Clients', pct: 28 },
                { label: 'Professionals', pct: 22 },
              ].map(d => (
                <div key={d.label} className="text-center">
                  <div className="text-sm font-bold">{d.pct}%</div>
                  <div className="text-[9px] text-muted-foreground">{d.label}</div>
                  <Progress value={d.pct} className="h-1 mt-1" />
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Revenue Summary" className="!rounded-2xl">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'This Month', value: '$4,800' },
                { label: 'Last 90 Days', value: '$18,200' },
                { label: 'Lifetime', value: '$124,500' },
              ].map(r => (
                <div key={r.label} className="text-center rounded-2xl border p-3">
                  <div className="text-sm font-bold text-accent">{r.value}</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">{r.label}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Actions Sheet */}
      <Sheet open={showActions} onOpenChange={setShowActions}>
        <SheetContent className="w-[340px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm font-bold">Profile Actions</SheetTitle></SheetHeader>
          <div className="p-3 space-y-0.5">
            {[
              { icon: Share2, label: 'Share Profile' },
              { icon: Flag, label: 'Report Profile' },
              { icon: Shield, label: 'Block User' },
              { icon: Bookmark, label: 'Save to List' },
              { icon: Calendar, label: 'Invite to Project' },
              { icon: MessageSquare, label: 'Request Introduction' },
            ].map(a => (
              <button key={a.label} className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-[11px] hover:bg-muted/50 transition-colors" onClick={() => { toast.info(a.label); setShowActions(false); }}>
                <a.icon className="h-3.5 w-3.5 text-muted-foreground" />{a.label}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Drawer */}
      <ProfileEditDrawer open={editOpen} onClose={() => setEditOpen(false)} profile={dbProfile} onSave={handleSaveProfile} />
    </DashboardLayout>
  );
};

export default ProfilePage;
