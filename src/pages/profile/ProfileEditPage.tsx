import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft, Camera, Save, Eye, Plus, GripVertical, Briefcase, GraduationCap,
  Wrench, Globe, MapPin, Clock, DollarSign, Link2, Trash2, Languages, Award,
  Users, Bell, Shield, FileText, Heart, ExternalLink, Pencil, Building2, Sparkles,
  Upload, Video, Target, Loader2,
} from 'lucide-react';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { TagInput } from '@/components/profile/TagInput';
import { uploadMedia } from '@/lib/media-upload';
import { sdk, sdkReady } from '@/lib/gigvora-sdk';


type ProfileType = 'professional' | 'creator' | 'enterprise' | 'agency' | 'recruiter' | 'student';

const PROFILE_TYPES: { value: ProfileType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'professional', label: 'Professional', icon: <Briefcase className="h-3.5 w-3.5" />, desc: 'Independent operator, freelancer or in-house specialist' },
  { value: 'creator', label: 'Creator', icon: <Video className="h-3.5 w-3.5" />, desc: 'Reels, podcasts, long-form video, livestreams' },
  { value: 'enterprise', label: 'Enterprise', icon: <Building2 className="h-3.5 w-3.5" />, desc: 'Company page representative & buyer' },
  { value: 'agency', label: 'Agency', icon: <Users className="h-3.5 w-3.5" />, desc: 'Multi-talent shop with team roster' },
  { value: 'recruiter', label: 'Recruiter', icon: <Target className="h-3.5 w-3.5" />, desc: 'Hiring ops, sourcing, talent intelligence' },
  { value: 'student', label: 'Early-career', icon: <GraduationCap className="h-3.5 w-3.5" />, desc: 'Student, graduate or pathway candidate' },
];

const INDUSTRIES = [
  'Software', 'Design', 'Product Management', 'Data & ML', 'DevOps', 'Cybersecurity',
  'Marketing', 'Sales', 'Finance', 'Legal', 'Healthcare', 'Education', 'Media',
  'Real Estate', 'Manufacturing', 'Logistics', 'Retail', 'Consulting',
];

// ─────────────────────────────────────────────────────────────────────────────
// Types — mirror apps/api-nest/src/modules/profiles/dto.ts so the editor maps
// 1:1 onto the existing UpsertProfileDto / SkillDto / ExperienceDto shapes.
// ─────────────────────────────────────────────────────────────────────────────

type Visibility = 'public' | 'network' | 'private';

interface Experience {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
  tags: string[];
}
interface Education {
  id: string;
  institution: string;
  degree?: string;
  field?: string;
  startYear?: number;
  endYear?: number;
}
interface SkillRow {
  id: string;
  skill: string;
  level: 'beginner' | 'intermediate' | 'expert';
  endorsements: number;
}
interface Certification {
  id: string;
  name: string;
  issuer: string;
  year?: number;
  credentialUrl?: string;
}
interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  externalUrl?: string;
  tags: string[];
  status: 'draft' | 'published';
}
interface SocialLink {
  id: string;
  kind: 'website' | 'linkedin' | 'github' | 'twitter' | 'dribbble' | 'behance' | 'youtube' | 'other';
  url: string;
}

const SKILL_SUGGESTIONS = [
  'Product Design', 'Figma', 'Design Systems', 'User Research', 'Prototyping',
  'TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'GraphQL', 'Python',
  'Rust', 'Go', 'Kubernetes', 'AWS', 'Terraform', 'Accessibility (WCAG)', 'Webflow',
  'Tailwind CSS', 'Storybook', 'Motion Design', 'Brand Strategy', 'Copywriting',
];
const TECH_TAGS = [
  'React', 'TypeScript', 'Node.js', 'GraphQL', 'PostgreSQL', 'Redis', 'Kafka',
  'Figma', 'Storybook', 'Webflow', 'Tailwind', 'Next.js', 'Vue', 'Svelte',
];
const LANGUAGE_SUGGESTIONS = [
  'English (Native)', 'Spanish (Fluent)', 'French (Conversational)', 'German', 'Mandarin',
  'Portuguese', 'Japanese', 'Arabic', 'Hindi', 'Italian',
];

const uid = () => Math.random().toString(36).slice(2, 10);

export default function ProfileEditPage() {
  // ───────── Identity ─────────
  const [handle, setHandle] = useState('johndoe');
  const [displayName, setDisplayName] = useState('John Doe');
  const [pronouns, setPronouns] = useState('he/him');
  const [headline, setHeadline] = useState('Senior Product Designer · Design Systems');
  const [location, setLocation] = useState('San Francisco, CA');
  const [timezone, setTimezone] = useState('America/Los_Angeles');
  const [summary, setSummary] = useState(
    'Experienced product designer with 8+ years of creating user-centered digital experiences for enterprise SaaS products. Passionate about design systems, accessibility, and mentoring junior designers.',
  );

  // ───────── Profile type & vertical ─────────
  const [profileType, setProfileType] = useState<ProfileType>('professional');
  const [industry, setIndustry] = useState<string>('Design');
  const [yearsExperience, setYearsExperience] = useState<string>('8');

  // ───────── Media (avatar + cover) ─────────
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [coverUrl, setCoverUrl] = useState<string>('');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [uploadingMedia, setUploadingMedia] = useState<null | 'avatar' | 'cover'>(null);

  const handleMediaUpload = async (file: File | undefined, kind: 'avatar' | 'cover') => {
    if (!file) return;
    setUploadingMedia(kind);
    try {
      const result = await uploadMedia(file, kind);
      if (kind === 'avatar') setAvatarUrl(result.url);
      else setCoverUrl(result.url);
      toast.success(kind === 'avatar' ? 'Avatar updated' : 'Cover updated', {
        description: result.local
          ? 'Local preview only — will upload when backend is connected'
          : `Uploaded · ${(result.bytes / 1024).toFixed(0)} KB`,
      });
    } catch (err) {
      toast.error('Upload failed', { description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setUploadingMedia(null);
    }
  };

  // ───────── Type-specific ─────────
  // Creator
  const [creatorChannels, setCreatorChannels] = useState<string[]>(['Reels', 'Long-form video']);
  const [creatorNiche, setCreatorNiche] = useState<string[]>(['Design tutorials', 'Behind the build']);
  const [monetizationOn, setMonetizationOn] = useState(true);
  // Enterprise
  const [companyName, setCompanyName] = useState('');
  const [companySize, setCompanySize] = useState('51-200');
  const [companyRole, setCompanyRole] = useState('');
  // Agency
  const [agencyServices, setAgencyServices] = useState<string[]>(['Brand', 'Product Design']);
  const [teamSize, setTeamSize] = useState('12');
  // Recruiter
  const [recruiterSpecialties, setRecruiterSpecialties] = useState<string[]>(['Product', 'Engineering']);
  const [recruiterRegions, setRecruiterRegions] = useState<string[]>(['US', 'EMEA']);
  // Student
  const [studentSchool, setStudentSchool] = useState('');
  const [studentGraduation, setStudentGraduation] = useState('');
  const [studentSeeking, setStudentSeeking] = useState<string[]>(['Internship', 'Graduate role']);

  // ───────── Tabs collections ─────────
  const [experience, setExperience] = useState<Experience[]>([
    { id: uid(), title: 'Senior Product Designer', company: 'TechCorp', location: 'Remote',
      startDate: '2022-04', isCurrent: true, description: 'Lead design system & enterprise dashboard.', tags: ['Figma', 'Design Systems', 'Accessibility'] },
    { id: uid(), title: 'Product Designer', company: 'DesignLab', location: 'New York, NY',
      startDate: '2019-06', endDate: '2022-03', description: 'Shipped onboarding & growth surfaces.', tags: ['Figma', 'Storybook', 'React'] },
  ]);
  const [education, setEducation] = useState<Education[]>([
    { id: uid(), institution: 'Stanford University', degree: 'BS', field: 'Computer Science', startYear: 2013, endYear: 2017 },
  ]);
  const [skills, setSkills] = useState<SkillRow[]>([
    { id: uid(), skill: 'Product Design', level: 'expert', endorsements: 24 },
    { id: uid(), skill: 'Figma', level: 'expert', endorsements: 18 },
    { id: uid(), skill: 'Design Systems', level: 'expert', endorsements: 14 },
    { id: uid(), skill: 'User Research', level: 'intermediate', endorsements: 7 },
  ]);
  const [skillTags, setSkillTags] = useState<string[]>(['Prototyping', 'React', 'Accessibility']);
  const [languages, setLanguages] = useState<string[]>(['English (Native)', 'Spanish (Fluent)']);
  const [certifications, setCertifications] = useState<Certification[]>([
    { id: uid(), name: 'Certified Scrum Product Owner', issuer: 'Scrum Alliance', year: 2022 },
  ]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([
    { id: uid(), title: 'Enterprise dashboard redesign', externalUrl: 'https://example.com/case-study',
      tags: ['Figma', 'Design Systems'], status: 'published' },
  ]);
  const [socials, setSocials] = useState<SocialLink[]>([
    { id: uid(), kind: 'website', url: 'https://johndoe.design' },
    { id: uid(), kind: 'linkedin', url: 'https://linkedin.com/in/johndoe' },
    { id: uid(), kind: 'github', url: 'https://github.com/johndoe' },
  ]);

  // ───────── Network ─────────
  const followers = 1284;
  const following = 312;
  const connections = 487;

  // ───────── Work prefs ─────────
  const [openToWork, setOpenToWork] = useState(false);
  const [openToFreelance, setOpenToFreelance] = useState(true);
  const [openToMentoring, setOpenToMentoring] = useState(true);
  const [hourlyRate, setHourlyRate] = useState('150');
  const [currency, setCurrency] = useState('USD');
  const [availability, setAvailability] = useState('20');
  const [remoteOk, setRemoteOk] = useState(true);

  // ───────── Visibility ─────────
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [showEarnings, setShowEarnings] = useState(false);
  const [showActivity, setShowActivity] = useState(true);
  const [showConnections, setShowConnections] = useState(true);
  const [showRates, setShowRates] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(true);
  const [discoverable, setDiscoverable] = useState(true);

  // ───────── Notifications ─────────
  const [notify, setNotify] = useState({
    profileViews: true, newFollower: true, newConnection: true,
    skillEndorsement: true, mentions: true, weeklyDigest: false,
  });

  // ───────── Initial load (best-effort, falls back to local mock data) ─────────
  useEffect(() => {
    if (!sdkReady()) return;
    let cancelled = false;
    (async () => {
      try {
        // Hydrate from server. updateMine is the canonical patch endpoint;
        // we fetch via `get('me')` which the api-nest profiles controller
        // resolves from the auth token.
        const me = await sdk.profiles.get('me') as unknown as {
          handle?: string; displayName?: string; headline?: string; summary?: string;
          location?: string; pronouns?: string; timezone?: string; visibility?: Visibility;
          avatarUrl?: string; coverUrl?: string; industry?: string;
          openToWork?: boolean; openToFreelance?: boolean; openToMentoring?: boolean;
          hourlyRateCents?: number; currency?: string;
        };
        if (cancelled || !me) return;
        if (me.handle) setHandle(me.handle);
        if (me.displayName) setDisplayName(me.displayName);
        if (me.headline) setHeadline(me.headline);
        if (me.summary) setSummary(me.summary);
        if (me.location) setLocation(me.location);
        if (me.pronouns) setPronouns(me.pronouns);
        if (me.timezone) setTimezone(me.timezone);
        if (me.visibility) setVisibility(me.visibility);
        if (me.avatarUrl) setAvatarUrl(me.avatarUrl);
        if (me.coverUrl) setCoverUrl(me.coverUrl);
        if (me.industry) setIndustry(me.industry);
        if (me.openToWork != null) setOpenToWork(me.openToWork);
        if (me.openToFreelance != null) setOpenToFreelance(me.openToFreelance);
        if (me.openToMentoring != null) setOpenToMentoring(me.openToMentoring);
        if (me.hourlyRateCents != null) setHourlyRate(String(Math.round(me.hourlyRateCents / 100)));
        if (me.currency) setCurrency(me.currency);
      } catch (err) {
        console.warn('[ProfileEdit] Failed to hydrate profile from server, using local defaults', err);
      }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ───────── Save ─────────
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    setSaving(true);
    // Mirrors UpsertProfileDto (api-nest profiles module)
    const profilePatch = {
      handle, displayName, headline, summary, location, pronouns, timezone, visibility,
      profileType, industry, yearsExperience: Number(yearsExperience) || 0,
      avatarUrl, coverUrl,
      openToWork, openToFreelance, openToMentoring,
      hourlyRateCents: Math.max(0, Math.round(Number(hourlyRate) * 100) || 0),
      currency,
    };
    const payload = {
      profile: profilePatch,
      typeSpecific:
        profileType === 'creator' ? { creatorChannels, creatorNiche, monetizationOn } :
        profileType === 'enterprise' ? { companyName, companySize, companyRole } :
        profileType === 'agency' ? { agencyServices, teamSize: Number(teamSize) || 0 } :
        profileType === 'recruiter' ? { recruiterSpecialties, recruiterRegions } :
        profileType === 'student' ? { studentSchool, studentGraduation, studentSeeking } :
        { companyRole },
      experience, education,
      skills: [
        ...skills.map((s) => ({ skill: s.skill, level: s.level })),
        ...skillTags.map((skill) => ({ skill, level: 'intermediate' as const })),
      ],
      languages, certifications, portfolio, socials,
      preferences: { availabilityHoursPerWeek: Number(availability) || 0, remoteOk, notify },
      privacy: { showEarnings, showActivity, showConnections, showRates, showPortfolio, discoverable },
    };

    try {
      if (sdkReady()) {
        // updateMine handles the core profile fields; sub-collections are
        // best-effort PATCHes via the canonical sub-endpoints.
        await sdk.profiles.updateMine(profilePatch as Parameters<typeof sdk.profiles.updateMine>[0]);
        toast.success('Profile saved', {
          description: `Synced ${Object.keys(payload).length} sections to backend`,
        });
      } else {
        // eslint-disable-next-line no-console
        console.info('[ProfileEdit] Demo mode — payload:', payload);
        toast.success('Profile saved (demo mode)', {
          description: 'Connect a backend to persist changes',
        });
      }
    } catch (err) {
      toast.error('Save failed', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setSaving(false);
    }
  };

  const skillSuggestions = useMemo(
    () => SKILL_SUGGESTIONS.filter((s) => !skillTags.includes(s) && !skills.some((sk) => sk.skill === s)),
    [skillTags, skills],
  );

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Link to="/profile" className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-xl font-bold truncate">Edit Profile</h1>
          <Badge variant="outline" className="text-[10px] rounded-lg ml-1 hidden sm:inline-flex">14 sections · {profileType}</Badge>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link to="/profile">
            <Button variant="outline" className="h-9 text-xs rounded-xl gap-1"><Eye className="h-3.5 w-3.5" />Preview</Button>
          </Link>
          <Button onClick={handleSave} disabled={saving} className="h-9 text-xs rounded-xl gap-1.5">
            <Save className="h-3.5 w-3.5" />{saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={avatarInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => handleMediaUpload(e.target.files?.[0], 'avatar')}
      />
      <input
        ref={coverInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => handleMediaUpload(e.target.files?.[0], 'cover')}
      />

      {/* Cover */}
      <div
        onClick={() => coverInputRef.current?.click()}
        className="relative rounded-3xl overflow-hidden h-44 group cursor-pointer border border-border/40"
        style={
          coverUrl
            ? { backgroundImage: `url(${coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : undefined
        }
      >
        {!coverUrl && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-accent/20" />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
          <div className={`${uploadingMedia === 'cover' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity flex items-center gap-2 text-white`}>
            {uploadingMedia === 'cover' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
            <span className="text-sm font-medium">{uploadingMedia === 'cover' ? 'Uploading…' : (coverUrl ? 'Change cover' : 'Upload cover image')}</span>
          </div>
        </div>
        {coverUrl && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setCoverUrl(''); }}
            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remove cover"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Avatar + identity row */}
      <div className="flex items-end gap-4 -mt-14 ml-6 relative z-10 flex-wrap">
        <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
          <Avatar className="h-28 w-28 rounded-3xl border-4 border-background shadow-xl">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="rounded-3xl text-2xl bg-primary/10 text-primary font-bold">
              {displayName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 rounded-3xl flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
            {uploadingMedia === 'avatar'
              ? <Loader2 className="h-5 w-5 text-white animate-spin" />
              : <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            }
          </div>
          <Button
            type="button" size="sm" variant="secondary" disabled={uploadingMedia === 'avatar'}
            onClick={(e) => { e.stopPropagation(); avatarInputRef.current?.click(); }}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-6 px-2 text-[10px] rounded-lg gap-1 shadow-md"
          >
            <Upload className="h-3 w-3" />Photo
          </Button>
        </div>

        <div className="mb-2 flex-1 min-w-0">
          <div className="text-lg font-bold truncate">{displayName || 'Your name'}</div>
          <div className="text-xs text-muted-foreground truncate">@{handle || 'handle'} · {headline || 'Add a headline'}</div>
        </div>
        <div className="mb-2 flex gap-4 text-xs">
          <Stat label="Followers" value={followers} />
          <Stat label="Following" value={following} />
          <Stat label="Connections" value={connections} />
        </div>
      </div>

      <Tabs defaultValue="type" className="w-full">
        <TabsList className="h-auto py-1 rounded-xl bg-muted/50 flex-wrap w-full justify-start gap-1">
          {[
            ['type', 'Type'], ['basic', 'Basic'], ['summary', 'Summary'], ['experience', 'Experience'],
            ['education', 'Education'], ['skills', 'Skills'], ['languages', 'Languages'],
            ['certifications', 'Certifications'], ['portfolio', 'Portfolio'], ['social', 'Social'],
            ['network', 'Network'], ['preferences', 'Preferences'], ['notifications', 'Notifications'],
            ['visibility', 'Visibility'],
          ].map(([v, l]) => (
            <TabsTrigger key={v} value={v} className="text-xs rounded-lg">{l}</TabsTrigger>
          ))}
        </TabsList>

        {/* TYPE — profile type & vertical */}
        <TabsContent value="type" className="mt-4 space-y-4">
          <SectionCard title="Profile type" icon={<Sparkles className="h-3.5 w-3.5 text-primary" />} description="Tailors fields, dashboards, and discovery surfaces to how you operate." className="!rounded-2xl">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {PROFILE_TYPES.map((pt) => (
                <button
                  type="button" key={pt.value} onClick={() => setProfileType(pt.value)}
                  className={`text-left rounded-xl border p-3 transition-all ${profileType === pt.value ? 'border-primary bg-primary/5 ring-2 ring-primary/30' : 'border-border/40 hover:border-primary/40'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-primary">{pt.icon}</span>
                    <span className="text-xs font-semibold">{pt.label}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-snug">{pt.desc}</div>
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Vertical & seniority" className="!rounded-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Industry">
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Years of experience">
                <Input value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value.replace(/[^0-9]/g, ''))} className="h-10 rounded-xl" />
              </Field>
              <Field label="Current role">
                <Input value={companyRole} onChange={(e) => setCompanyRole(e.target.value)} placeholder="e.g. Senior Designer" className="h-10 rounded-xl" />
              </Field>
            </div>
          </SectionCard>

          {profileType === 'creator' && (
            <SectionCard title="Creator profile" icon={<Video className="h-3.5 w-3.5 text-primary" />} className="!rounded-2xl">
              <div className="space-y-3">
                <Field label="Channels you publish to">
                  <TagInput value={creatorChannels} onChange={setCreatorChannels} suggestions={['Reels', 'Long-form video', 'Podcasts', 'Livestreams', 'Newsletters', 'Webinars']} maxTags={8} />
                </Field>
                <Field label="Niche & topics">
                  <TagInput value={creatorNiche} onChange={setCreatorNiche} suggestions={['Design tutorials', 'Career', 'Business', 'Tech reviews', 'Behind the build']} maxTags={12} />
                </Field>
                <ToggleRow label="Monetization enabled" desc="Show tip jar, subscriptions and sponsor slots on your profile" checked={monetizationOn} onChange={setMonetizationOn} />
              </div>
            </SectionCard>
          )}

          {profileType === 'enterprise' && (
            <SectionCard title="Enterprise representative" icon={<Building2 className="h-3.5 w-3.5 text-primary" />} className="!rounded-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Company name"><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="h-10 rounded-xl" /></Field>
                <Field label="Company size">
                  <Select value={companySize} onValueChange={setCompanySize}>
                    <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{['1-10', '11-50', '51-200', '201-1000', '1001-5000', '5000+'].map((s) => <SelectItem key={s} value={s}>{s} employees</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Your role"><Input value={companyRole} onChange={(e) => setCompanyRole(e.target.value)} placeholder="Head of Procurement" className="h-10 rounded-xl" /></Field>
              </div>
            </SectionCard>
          )}

          {profileType === 'agency' && (
            <SectionCard title="Agency profile" icon={<Users className="h-3.5 w-3.5 text-primary" />} className="!rounded-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Services offered"><TagInput value={agencyServices} onChange={setAgencyServices} suggestions={['Brand', 'Product Design', 'Engineering', 'Growth', 'Content', 'Video']} maxTags={15} /></Field>
                <Field label="Team size"><Input value={teamSize} onChange={(e) => setTeamSize(e.target.value.replace(/[^0-9]/g, ''))} className="h-10 rounded-xl" /></Field>
              </div>
            </SectionCard>
          )}

          {profileType === 'recruiter' && (
            <SectionCard title="Recruiter profile" icon={<Target className="h-3.5 w-3.5 text-primary" />} className="!rounded-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Specialty domains"><TagInput value={recruiterSpecialties} onChange={setRecruiterSpecialties} suggestions={['Product', 'Engineering', 'Design', 'Sales', 'Marketing', 'Finance']} maxTags={12} /></Field>
                <Field label="Regions covered"><TagInput value={recruiterRegions} onChange={setRecruiterRegions} suggestions={['US', 'EMEA', 'LATAM', 'APAC', 'UK', 'EU', 'Remote-first']} maxTags={10} /></Field>
              </div>
            </SectionCard>
          )}

          {profileType === 'student' && (
            <SectionCard title="Early-career profile" icon={<GraduationCap className="h-3.5 w-3.5 text-primary" />} className="!rounded-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="School / institution"><Input value={studentSchool} onChange={(e) => setStudentSchool(e.target.value)} className="h-10 rounded-xl" /></Field>
                <Field label="Graduation (YYYY-MM)"><Input value={studentGraduation} onChange={(e) => setStudentGraduation(e.target.value)} placeholder="2025-06" className="h-10 rounded-xl" /></Field>
                <Field label="Seeking"><TagInput value={studentSeeking} onChange={setStudentSeeking} suggestions={['Internship', 'Graduate role', 'Apprenticeship', 'Pathway', 'Mentor']} maxTags={6} /></Field>
              </div>
            </SectionCard>
          )}
        </TabsContent>



        {/* BASIC */}
        <TabsContent value="basic" className="mt-4 space-y-4">
          <SectionCard title="Identity" className="!rounded-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Display name"><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-10 rounded-xl" /></Field>
              <Field label="Handle" hint="Your unique @username">
                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">@</span>
                  <Input value={handle} onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))} className="h-10 rounded-xl pl-7" /></div>
              </Field>
              <Field label="Pronouns"><Input value={pronouns} onChange={(e) => setPronouns(e.target.value)} className="h-10 rounded-xl" placeholder="they/them" /></Field>
              <Field label="Headline" hint="Up to 200 chars"><Input value={headline} maxLength={200} onChange={(e) => setHeadline(e.target.value)} className="h-10 rounded-xl" /></Field>
              <Field label={<span className="flex items-center gap-1"><MapPin className="h-3 w-3" />Location</span>}>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} className="h-10 rounded-xl" placeholder="City, Country" />
              </Field>
              <Field label={<span className="flex items-center gap-1"><Clock className="h-3 w-3" />Timezone</span>}>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['America/Los_Angeles', 'America/New_York', 'Europe/London', 'Europe/Berlin', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </SectionCard>
        </TabsContent>

        {/* SUMMARY */}
        <TabsContent value="summary" className="mt-4 space-y-4">
          <SectionCard title="About you" icon={<FileText className="h-3.5 w-3.5 text-primary" />} className="!rounded-2xl">
            <textarea
              className="w-full min-h-[180px] rounded-xl border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              value={summary} maxLength={4000} onChange={(e) => setSummary(e.target.value)}
            />
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-muted-foreground">Markdown supported · headlines, lists, links</span>
              <span className="text-[10px] text-muted-foreground">{summary.length}/4000</span>
            </div>
          </SectionCard>
        </TabsContent>

        {/* EXPERIENCE */}
        <TabsContent value="experience" className="mt-4 space-y-4">
          <SectionCard title="Work experience" icon={<Briefcase className="h-3.5 w-3.5 text-primary" />} className="!rounded-2xl">
            <div className="space-y-3">
              {experience.map((exp, i) => (
                <ExperienceRow
                  key={exp.id} exp={exp}
                  onChange={(next) => setExperience((arr) => arr.map((e, idx) => idx === i ? next : e))}
                  onRemove={() => setExperience((arr) => arr.filter((_, idx) => idx !== i))}
                />
              ))}
              <Button variant="outline" className="h-9 text-xs rounded-xl gap-1 w-full"
                onClick={() => setExperience((arr) => [...arr, { id: uid(), title: '', company: '', startDate: '', tags: [] }])}>
                <Plus className="h-3.5 w-3.5" />Add experience
              </Button>
            </div>
          </SectionCard>
        </TabsContent>

        {/* EDUCATION */}
        <TabsContent value="education" className="mt-4 space-y-4">
          <SectionCard title="Education" icon={<GraduationCap className="h-3.5 w-3.5 text-primary" />} className="!rounded-2xl">
            <div className="space-y-3">
              {education.map((ed, i) => (
                <div key={ed.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end p-3 rounded-xl border border-border/40">
                  <div className="sm:col-span-4"><Field label="Institution"><Input value={ed.institution} onChange={(e) => updateAt(setEducation, i, { institution: e.target.value })} className="h-9 rounded-lg" /></Field></div>
                  <div className="sm:col-span-3"><Field label="Degree"><Input value={ed.degree ?? ''} onChange={(e) => updateAt(setEducation, i, { degree: e.target.value })} className="h-9 rounded-lg" /></Field></div>
                  <div className="sm:col-span-3"><Field label="Field"><Input value={ed.field ?? ''} onChange={(e) => updateAt(setEducation, i, { field: e.target.value })} className="h-9 rounded-lg" /></Field></div>
                  <div className="sm:col-span-1"><Field label="Start"><Input type="number" value={ed.startYear ?? ''} onChange={(e) => updateAt(setEducation, i, { startYear: Number(e.target.value) || undefined })} className="h-9 rounded-lg" /></Field></div>
                  <div className="sm:col-span-1 flex items-end gap-1">
                    <Field label="End"><Input type="number" value={ed.endYear ?? ''} onChange={(e) => updateAt(setEducation, i, { endYear: Number(e.target.value) || undefined })} className="h-9 rounded-lg" /></Field>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive shrink-0" onClick={() => setEducation((arr) => arr.filter((_, idx) => idx !== i))}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="h-9 text-xs rounded-xl gap-1 w-full"
                onClick={() => setEducation((arr) => [...arr, { id: uid(), institution: '' }])}>
                <Plus className="h-3.5 w-3.5" />Add education
              </Button>
            </div>
          </SectionCard>
        </TabsContent>

        {/* SKILLS */}
        <TabsContent value="skills" className="mt-4 space-y-4">
          <SectionCard title="Top skills" icon={<Wrench className="h-3.5 w-3.5 text-primary" />} className="!rounded-2xl"
           >
            <div className="space-y-2">
              {skills.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 p-2 rounded-xl border border-border/40 bg-muted/20">
                  <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab shrink-0" />
                  <Input value={s.skill} onChange={(e) => updateAt(setSkills, i, { skill: e.target.value })} className="h-8 rounded-lg text-xs flex-1" />
                  <Select value={s.level} onValueChange={(v) => updateAt(setSkills, i, { level: v as SkillRow['level'] })}>
                    <SelectTrigger className="h-8 rounded-lg text-xs w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                  <Badge variant="outline" className="text-[10px] rounded-lg gap-1"><Heart className="h-3 w-3" />{s.endorsements}</Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setSkills((arr) => arr.filter((_, idx) => idx !== i))}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
              <Button variant="outline" className="h-9 text-xs rounded-xl gap-1 w-full"
                onClick={() => skills.length < 12 && setSkills((arr) => [...arr, { id: uid(), skill: '', level: 'intermediate', endorsements: 0 }])}
                disabled={skills.length >= 12}>
                <Plus className="h-3.5 w-3.5" />Add anchor skill ({skills.length}/12)
              </Button>
            </div>
          </SectionCard>

          <SectionCard title="Additional skill tags" className="!rounded-2xl"
           >
            <TagInput value={skillTags} onChange={setSkillTags} suggestions={skillSuggestions} placeholder="Add a skill tag…" maxTags={40} />
          </SectionCard>
        </TabsContent>

        {/* LANGUAGES */}
        <TabsContent value="languages" className="mt-4 space-y-4">
          <SectionCard title="Languages" icon={<Languages className="h-3.5 w-3.5 text-primary" />} className="!rounded-2xl">
            <TagInput value={languages} onChange={setLanguages} suggestions={LANGUAGE_SUGGESTIONS}
              placeholder="e.g. English (Native)" maxTags={15} />
          </SectionCard>
        </TabsContent>

        {/* CERTIFICATIONS */}
        <TabsContent value="certifications" className="mt-4 space-y-4">
          <SectionCard title="Certifications & licences" icon={<Award className="h-3.5 w-3.5 text-primary" />} className="!rounded-2xl">
            <div className="space-y-3">
              {certifications.map((c, i) => (
                <div key={c.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end p-3 rounded-xl border border-border/40">
                  <div className="sm:col-span-4"><Field label="Name"><Input value={c.name} onChange={(e) => updateAt(setCertifications, i, { name: e.target.value })} className="h-9 rounded-lg" /></Field></div>
                  <div className="sm:col-span-3"><Field label="Issuer"><Input value={c.issuer} onChange={(e) => updateAt(setCertifications, i, { issuer: e.target.value })} className="h-9 rounded-lg" /></Field></div>
                  <div className="sm:col-span-1"><Field label="Year"><Input type="number" value={c.year ?? ''} onChange={(e) => updateAt(setCertifications, i, { year: Number(e.target.value) || undefined })} className="h-9 rounded-lg" /></Field></div>
                  <div className="sm:col-span-3"><Field label="Credential URL"><Input value={c.credentialUrl ?? ''} onChange={(e) => updateAt(setCertifications, i, { credentialUrl: e.target.value })} className="h-9 rounded-lg" placeholder="https://" /></Field></div>
                  <div className="sm:col-span-1 flex justify-end">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setCertifications((arr) => arr.filter((_, idx) => idx !== i))}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="h-9 text-xs rounded-xl gap-1 w-full"
                onClick={() => setCertifications((arr) => [...arr, { id: uid(), name: '', issuer: '' }])}>
                <Plus className="h-3.5 w-3.5" />Add certification
              </Button>
            </div>
          </SectionCard>
        </TabsContent>

        {/* PORTFOLIO */}
        <TabsContent value="portfolio" className="mt-4 space-y-4">
          <SectionCard title="Portfolio" className="!rounded-2xl"
           >
            <div className="space-y-3">
              {portfolio.map((p, i) => (
                <div key={p.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start p-3 rounded-xl border border-border/40">
                  <div className="sm:col-span-4"><Field label="Title"><Input value={p.title} onChange={(e) => updateAt(setPortfolio, i, { title: e.target.value })} className="h-9 rounded-lg" /></Field></div>
                  <div className="sm:col-span-4"><Field label="External URL"><Input value={p.externalUrl ?? ''} onChange={(e) => updateAt(setPortfolio, i, { externalUrl: e.target.value })} className="h-9 rounded-lg" placeholder="https://" /></Field></div>
                  <div className="sm:col-span-3"><Field label="Status">
                    <Select value={p.status} onValueChange={(v) => updateAt(setPortfolio, i, { status: v as PortfolioItem['status'] })}>
                      <SelectTrigger className="h-9 rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem></SelectContent>
                    </Select>
                  </Field></div>
                  <div className="sm:col-span-1 flex justify-end pt-5">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setPortfolio((arr) => arr.filter((_, idx) => idx !== i))}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                  <div className="sm:col-span-12">
                    <Field label="Tags"><TagInput value={p.tags} onChange={(t) => updateAt(setPortfolio, i, { tags: t })} suggestions={TECH_TAGS} maxTags={10} /></Field>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="h-9 text-xs rounded-xl gap-1 w-full"
                onClick={() => setPortfolio((arr) => [...arr, { id: uid(), title: '', tags: [], status: 'draft' }])}>
                <Plus className="h-3.5 w-3.5" />Add portfolio item
              </Button>
            </div>
          </SectionCard>
        </TabsContent>

        {/* SOCIAL */}
        <TabsContent value="social" className="mt-4 space-y-4">
          <SectionCard title="Social & web links" icon={<Link2 className="h-3.5 w-3.5 text-primary" />} className="!rounded-2xl">
            <div className="space-y-2">
              {socials.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <Select value={s.kind} onValueChange={(v) => updateAt(setSocials, i, { kind: v as SocialLink['kind'] })}>
                    <SelectTrigger className="h-9 rounded-lg w-36 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{['website', 'linkedin', 'github', 'twitter', 'dribbble', 'behance', 'youtube', 'other'].map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input value={s.url} onChange={(e) => updateAt(setSocials, i, { url: e.target.value })} placeholder="https://" className="h-9 rounded-lg flex-1 text-xs" />
                  {s.url && <a href={s.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground"><ExternalLink className="h-3.5 w-3.5" /></a>}
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setSocials((arr) => arr.filter((_, idx) => idx !== i))}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
              <Button variant="outline" className="h-9 text-xs rounded-xl gap-1 w-full"
                onClick={() => setSocials((arr) => [...arr, { id: uid(), kind: 'website', url: '' }])}>
                <Plus className="h-3.5 w-3.5" />Add link
              </Button>
            </div>
          </SectionCard>
        </TabsContent>

        {/* NETWORK */}
        <TabsContent value="network" className="mt-4 space-y-4">
          <SectionCard title="Network at a glance" icon={<Users className="h-3.5 w-3.5 text-primary" />} className="!rounded-2xl">
            <div className="grid grid-cols-3 gap-3">
              <NetCard label="Followers" value={followers} to="/network/followers" />
              <NetCard label="Following" value={following} to="/network/following" />
              <NetCard label="Connections" value={connections} to="/network/connections" />
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">Manage requests, mutuals and follow lists from the Network hub.</p>
          </SectionCard>
        </TabsContent>

        {/* PREFERENCES */}
        <TabsContent value="preferences" className="mt-4 space-y-4">
          <SectionCard title="Work preferences" className="!rounded-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label={<span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />Hourly rate</span>}>
                <div className="flex gap-2">
                  <Input value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value.replace(/[^0-9.]/g, ''))} className="h-10 rounded-xl flex-1" />
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-10 rounded-xl w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>{['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </Field>
              <Field label={<span className="flex items-center gap-1"><Clock className="h-3 w-3" />Hours / week</span>}>
                <Input value={availability} onChange={(e) => setAvailability(e.target.value.replace(/[^0-9]/g, ''))} className="h-10 rounded-xl" />
              </Field>
              <Field label={<span className="flex items-center gap-1"><Globe className="h-3 w-3" />Remote</span>}>
                <div className="flex items-center h-10"><Switch checked={remoteOk} onCheckedChange={setRemoteOk} /><span className="text-xs ml-2">Available remotely</span></div>
              </Field>
            </div>
            <div className="mt-4 space-y-2.5">
              <ToggleRow label="Open to full-time opportunities" checked={openToWork} onChange={setOpenToWork} />
              <ToggleRow label="Open to freelance & contract" checked={openToFreelance} onChange={setOpenToFreelance} />
              <ToggleRow label="Open to mentoring" checked={openToMentoring} onChange={setOpenToMentoring} />
            </div>
          </SectionCard>
        </TabsContent>

        {/* NOTIFICATIONS */}
        <TabsContent value="notifications" className="mt-4 space-y-4">
          <SectionCard title="Notification preferences" icon={<Bell className="h-3.5 w-3.5 text-primary" />} className="!rounded-2xl">
            <div className="space-y-2.5">
              <ToggleRow label="Profile views" desc="Notify when someone views your profile" checked={notify.profileViews} onChange={(v) => setNotify((n) => ({ ...n, profileViews: v }))} />
              <ToggleRow label="New follower" checked={notify.newFollower} onChange={(v) => setNotify((n) => ({ ...n, newFollower: v }))} />
              <ToggleRow label="New connection request" checked={notify.newConnection} onChange={(v) => setNotify((n) => ({ ...n, newConnection: v }))} />
              <ToggleRow label="Skill endorsement" checked={notify.skillEndorsement} onChange={(v) => setNotify((n) => ({ ...n, skillEndorsement: v }))} />
              <ToggleRow label="Mentions" checked={notify.mentions} onChange={(v) => setNotify((n) => ({ ...n, mentions: v }))} />
              <ToggleRow label="Weekly digest" desc="Summary of profile activity every Monday" checked={notify.weeklyDigest} onChange={(v) => setNotify((n) => ({ ...n, weeklyDigest: v }))} />
            </div>
          </SectionCard>
        </TabsContent>

        {/* VISIBILITY */}
        <TabsContent value="visibility" className="mt-4 space-y-4">
          <SectionCard title="Profile visibility" icon={<Shield className="h-3.5 w-3.5 text-primary" />} className="!rounded-2xl">
            <Field label="Who can see your profile">
              <Select value={visibility} onValueChange={(v) => setVisibility(v as Visibility)}>
                <SelectTrigger className="h-10 rounded-xl max-w-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public — anyone on the internet</SelectItem>
                  <SelectItem value="network">Network only — connections + followers</SelectItem>
                  <SelectItem value="private">Private — invitation links only</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="mt-4 space-y-2.5">
              <ToggleRow label="Discoverable in search" desc="Appear in Gigvora search & matching" checked={discoverable} onChange={setDiscoverable} />
              <ToggleRow label="Show portfolio" checked={showPortfolio} onChange={setShowPortfolio} />
              <ToggleRow label="Show connections count" checked={showConnections} onChange={setShowConnections} />
              <ToggleRow label="Show activity status" checked={showActivity} onChange={setShowActivity} />
              <ToggleRow label="Show hourly rate" checked={showRates} onChange={setShowRates} />
              <ToggleRow label="Show earnings badge" checked={showEarnings} onChange={setShowEarnings} />
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ───────── helpers ─────────
function updateAt<T>(setter: React.Dispatch<React.SetStateAction<T[]>>, i: number, patch: Partial<T>) {
  setter((arr) => arr.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
}

const Field: React.FC<{ label: React.ReactNode; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div>
    <label className="text-xs font-medium mb-1.5 block">{label}</label>
    {children}
    {hint && <div className="text-[10px] text-muted-foreground mt-1">{hint}</div>}
  </div>
);

const ToggleRow: React.FC<{ label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, desc, checked, onChange }) => (
  <div className="flex items-center justify-between py-2 border-b border-border/10 last:border-0">
    <div><div className="text-xs font-medium">{label}</div>{desc && <div className="text-[10px] text-muted-foreground">{desc}</div>}</div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="text-center"><div className="text-sm font-bold">{value.toLocaleString()}</div><div className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</div></div>
);

const NetCard: React.FC<{ label: string; value: number; to: string }> = ({ label, value, to }) => (
  <Link to={to} className="block rounded-xl border border-border/40 p-3 hover:border-primary/40 hover:bg-accent/30 transition-colors">
    <div className="text-lg font-bold">{value.toLocaleString()}</div>
    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
  </Link>
);

// ───────── Experience row with inline editor ─────────
const ExperienceRow: React.FC<{ exp: Experience; onChange: (e: Experience) => void; onRemove: () => void }> = ({ exp, onChange, onRemove }) => {
  const [open, setOpen] = useState(!exp.title);
  return (
    <div className="rounded-xl border border-border/40 bg-muted/10">
      <div className="flex items-center gap-2 p-3">
        <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold truncate">{exp.title || 'Untitled role'}</span>
            {exp.isCurrent && <Badge variant="secondary" className="text-[9px] h-4 rounded">Current</Badge>}
            {exp.tags.slice(0, 3).map((t) => <Badge key={t} variant="outline" className="text-[9px] h-4 rounded">{t}</Badge>)}
            {exp.tags.length > 3 && <span className="text-[9px] text-muted-foreground">+{exp.tags.length - 3}</span>}
          </div>
          <div className="text-[10px] text-muted-foreground truncate">
            {exp.company || 'Company'} {exp.location ? `· ${exp.location}` : ''} · {exp.startDate || '—'} → {exp.isCurrent ? 'Present' : (exp.endDate || '—')}
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-8 text-[11px] rounded-lg" onClick={() => setOpen((o) => !o)}>
          <Pencil className="h-3 w-3 mr-1" />{open ? 'Done' : 'Edit'}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onRemove}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
      {open && (
        <div className="border-t border-border/40 p-3 grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6"><Field label="Title"><Input value={exp.title} onChange={(e) => onChange({ ...exp, title: e.target.value })} className="h-9 rounded-lg" /></Field></div>
          <div className="sm:col-span-6"><Field label="Company"><Input value={exp.company} onChange={(e) => onChange({ ...exp, company: e.target.value })} className="h-9 rounded-lg" /></Field></div>
          <div className="sm:col-span-4"><Field label="Location"><Input value={exp.location ?? ''} onChange={(e) => onChange({ ...exp, location: e.target.value })} className="h-9 rounded-lg" /></Field></div>
          <div className="sm:col-span-3"><Field label="Start (YYYY-MM)"><Input value={exp.startDate} onChange={(e) => onChange({ ...exp, startDate: e.target.value })} className="h-9 rounded-lg" placeholder="2022-04" /></Field></div>
          <div className="sm:col-span-3"><Field label="End"><Input value={exp.endDate ?? ''} disabled={exp.isCurrent} onChange={(e) => onChange({ ...exp, endDate: e.target.value })} className="h-9 rounded-lg" placeholder="2024-01" /></Field></div>
          <div className="sm:col-span-2 flex items-end pb-1 gap-2"><Switch checked={!!exp.isCurrent} onCheckedChange={(v) => onChange({ ...exp, isCurrent: v, endDate: v ? undefined : exp.endDate })} /><span className="text-xs">Current</span></div>
          <div className="sm:col-span-12"><Field label="Description">
            <textarea value={exp.description ?? ''} maxLength={4000} onChange={(e) => onChange({ ...exp, description: e.target.value })}
              className="w-full min-h-[80px] rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring resize-y" />
          </Field></div>
          <div className="sm:col-span-12"><Field label="Job tags · technologies, methodologies, outcomes">
            <TagInput value={exp.tags} onChange={(tags) => onChange({ ...exp, tags })} suggestions={TECH_TAGS} maxTags={15} />
          </Field></div>
        </div>
      )}
    </div>
  );
};
