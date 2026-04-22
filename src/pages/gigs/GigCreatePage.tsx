import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Save, Eye, Send, Plus, Trash2, ChevronRight, ChevronLeft,
  CheckCircle2, DollarSign, Package, Sparkles, AlertTriangle,
  HelpCircle, FileText, List, Image, X, Gift, Globe, Calendar,
  Upload, Play, Tag, Clock, Star, Zap, ArrowLeft, TrendingUp,
  MessageSquare, Shield, Lock,
} from 'lucide-react';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Types & Constants
   ═══════════════════════════════════════════════════════════ */
type Step = 'identity' | 'description' | 'packages' | 'addons' | 'requirements' | 'tags' | 'faq' | 'media' | 'delivery' | 'review';
type GigStatus = 'draft' | 'published' | 'paused' | 'under_review' | 'archived';

const STEPS: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: 'identity', label: 'Gig Identity', icon: FileText },
  { key: 'description', label: 'Description', icon: MessageSquare },
  { key: 'packages', label: 'Packages', icon: Package },
  { key: 'addons', label: 'Add-ons', icon: Gift },
  { key: 'requirements', label: 'Requirements', icon: List },
  { key: 'tags', label: 'Tags', icon: Tag },
  { key: 'faq', label: 'FAQ', icon: HelpCircle },
  { key: 'media', label: 'Media', icon: Image },
  { key: 'delivery', label: 'Delivery', icon: Calendar },
  { key: 'review', label: 'Review', icon: Send },
];

const CATEGORIES = ['Design', 'Development', 'Marketing', 'Writing', 'Video & Animation', 'AI Services', 'Business', 'Music & Audio'];
const SUBCATEGORIES: Record<string, string[]> = {
  Design: ['Logo Design', 'Brand Identity', 'Web Design', 'App Design', 'Illustration', 'Packaging', 'Social Media'],
  Development: ['Web Development', 'Mobile Apps', 'WordPress', 'E-commerce', 'API & Integrations', 'Blockchain', 'Game Dev'],
  Marketing: ['SEO', 'Social Media', 'Content Marketing', 'Email Marketing', 'PPC', 'Influencer Marketing'],
  Writing: ['Copywriting', 'Blog Posts', 'Technical Writing', 'Creative Writing', 'Ghostwriting', 'UX Writing'],
  'Video & Animation': ['Explainer Videos', 'Motion Graphics', 'Video Editing', 'Animation', '3D', 'Whiteboard'],
  'AI Services': ['AI Development', 'Chatbots', 'Machine Learning', 'Data Science', 'Automation', 'Prompt Engineering'],
  Business: ['Business Plans', 'Financial Modeling', 'Market Research', 'Consulting', 'Data Analysis'],
  'Music & Audio': ['Music Production', 'Voiceover', 'Mixing', 'Sound Design', 'Podcast Editing'],
};
const GIG_MODES = ['Standard Listed Gig', 'Custom Request Enabled', 'Premium Expert Gig'];
const DELIVERY_TYPES = ['Digital Delivery', 'Consulting', 'Live Session', 'Booked Service', 'Hybrid Service', 'Local Service'];
const REQUIREMENT_TYPES = ['Text', 'File Upload', 'Multiple Choice', 'Link', 'Number', 'Date'];

interface GigPackage { name: string; price: string; delivery: string; revisions: string; features: string[]; consultIncl: boolean; }
interface AddOn { id: string; name: string; price: string; deliveryImpact: string; description: string; }
interface FAQ { q: string; a: string; }
interface Requirement { id: string; text: string; type: string; required: boolean; }

/* ═══════════════════════════════════════════════════════════
   Reusable components
   ═══════════════════════════════════════════════════════════ */
const FieldLabel: React.FC<{ label: string; required?: boolean; hint?: string }> = ({ label, required, hint }) => (
  <div className="mb-1"><label className="text-[10px] font-semibold">{label}{required && <span className="text-destructive ml-0.5">*</span>}</label>{hint && <p className="text-[8px] text-muted-foreground">{hint}</p>}</div>
);

const ChipSelect: React.FC<{ options: string[]; selected: string; onChange: (v: string) => void }> = ({ options, selected, onChange }) => (
  <div className="flex flex-wrap gap-1.5">{options.map(o => (
    <button key={o} onClick={() => onChange(o)} className={cn('px-2.5 py-1 rounded-xl text-[9px] font-medium border transition-all', selected === o ? 'bg-accent text-accent-foreground border-accent shadow-sm' : 'border-border/40 hover:border-accent/50 text-muted-foreground')}>{o}</button>
  ))}</div>
);

const TagInput: React.FC<{ tags: string[]; onChange: (t: string[]) => void; placeholder?: string }> = ({ tags, onChange, placeholder }) => {
  const [input, setInput] = useState('');
  const add = () => { if (input.trim() && !tags.includes(input.trim())) { onChange([...tags, input.trim()]); setInput(''); } };
  return (
    <div>
      <div className="flex gap-1.5 mb-1.5 flex-wrap">{tags.map(t => (<Badge key={t} variant="secondary" className="text-[8px] h-5 gap-0.5 rounded-lg">{t}<button onClick={() => onChange(tags.filter(x => x !== t))}><X className="h-2.5 w-2.5" /></button></Badge>))}</div>
      <div className="flex gap-1.5"><Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())} placeholder={placeholder} className="h-8 text-xs flex-1" /><Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl" onClick={add}><Plus className="h-3 w-3" /></Button></div>
    </div>
  );
};

const Stepper: React.FC<{ current: Step; onGo: (s: Step) => void }> = ({ current, onGo }) => (
  <div className="flex items-center gap-0.5 overflow-x-auto pb-1">{STEPS.map((s, i) => {
    const isCurrent = s.key === current; const isPast = STEPS.findIndex(st => st.key === current) > i; const Icon = s.icon;
    return (<React.Fragment key={s.key}>
      <button onClick={() => onGo(s.key)} className={cn('flex items-center gap-1 px-2 py-1.5 rounded-xl text-[9px] font-semibold transition-all shrink-0', isCurrent ? 'bg-accent text-accent-foreground shadow-sm' : isPast ? 'text-[hsl(var(--state-healthy))] hover:bg-muted/50' : 'text-muted-foreground hover:bg-muted/50')}>{isPast ? <CheckCircle2 className="h-3 w-3" /> : <Icon className="h-3 w-3" />}<span className="hidden md:inline">{s.label}</span></button>
      {i < STEPS.length - 1 && <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/40 shrink-0" />}
    </React.Fragment>);
  })}</div>
);

/* ═══════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════ */
const GigCreatePage: React.FC = () => {
  const [step, setStep] = useState<Step>('identity');
  const [status, setStatus] = useState<GigStatus>('draft');

  // Identity
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [gigMode, setGigMode] = useState('Standard Listed Gig');
  const [deliveryType, setDeliveryType] = useState('Digital Delivery');

  // Description
  const [shortSummary, setShortSummary] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [whatsIncluded, setWhatsIncluded] = useState('');
  const [whatsExcluded, setWhatsExcluded] = useState('');
  const [idealBuyer, setIdealBuyer] = useState('');
  const [useCases, setUseCases] = useState('');

  // Packages
  const [packages, setPackages] = useState<GigPackage[]>([
    { name: 'Basic', price: '50', delivery: '3 days', revisions: '1', features: ['1 concept', 'Source file'], consultIncl: false },
    { name: 'Standard', price: '100', delivery: '5 days', revisions: '3', features: ['3 concepts', 'Source file', 'High resolution', 'Social media kit'], consultIncl: false },
    { name: 'Premium', price: '250', delivery: '7 days', revisions: '5', features: ['5 concepts', 'Source file', 'High resolution', 'Social media kit', 'Brand guidelines', 'Stationery'], consultIncl: true },
  ]);

  // Add-ons
  const [addons, setAddons] = useState<AddOn[]>([
    { id: '1', name: 'Rush Delivery (24h)', price: '50', deliveryImpact: '-2 days', description: 'Get your order in 24 hours' },
    { id: '2', name: 'Extra Revision', price: '15', deliveryImpact: '+1 day', description: 'Additional revision round' },
  ]);

  // Requirements
  const [requirements, setRequirements] = useState<Requirement[]>([
    { id: '1', text: 'Describe your brand and target audience', type: 'Text', required: true },
    { id: '2', text: 'Upload any reference files or inspiration', type: 'File Upload', required: false },
  ]);

  // Tags
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [typeTags, setTypeTags] = useState<string[]>([]);
  const [categoryTags, setCategoryTags] = useState<string[]>([]);
  const [toolTags, setToolTags] = useState<string[]>([]);
  const [industryTags, setIndustryTags] = useState<string[]>([]);
  const [searchKeywords, setSearchKeywords] = useState<string[]>([]);

  // FAQ
  const [faqs, setFaqs] = useState<FAQ[]>([{ q: 'How many revisions are included?', a: 'Revisions depend on the package you choose. Basic includes 1, Standard 3, and Premium 5 revisions.' }]);

  // Delivery
  const [stdDelivery, setStdDelivery] = useState('5 days');
  const [customDelivery, setCustomDelivery] = useState(true);
  const [availableNow, setAvailableNow] = useState(true);
  const [capacityLimit, setCapacityLimit] = useState('');
  const [vacationMode, setVacationMode] = useState(false);

  const currentIdx = STEPS.findIndex(s => s.key === step);
  const isLast = currentIdx === STEPS.length - 1;
  const isFirst = currentIdx === 0;
  const goNext = () => { if (!isLast) setStep(STEPS[currentIdx + 1].key); };
  const goPrev = () => { if (!isFirst) setStep(STEPS[currentIdx - 1].key); };

  const saveDraft = useCallback(() => { toast.success('Draft saved'); }, []);

  const updatePackage = (idx: number, field: keyof GigPackage, value: any) => {
    setPackages(p => p.map((pk, i) => i === idx ? { ...pk, [field]: value } : pk));
  };

  const addFeatureToPackage = (idx: number) => {
    setPackages(p => p.map((pk, i) => i === idx ? { ...pk, features: [...pk.features, ''] } : pk));
  };

  return (
    <DashboardLayout topStrip={
      <>
        <Link to="/gigs/workspace" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="h-3 w-3" /><span className="text-[10px]">Gigs</span></Link>
        <div className="h-4 w-px bg-border mx-1" />
        <Package className="h-4 w-4 text-accent" />
        <span className="text-xs font-bold">Create Gig</span>
        <div className="flex-1" />
        <Badge variant="outline" className="text-[8px] h-5 capitalize">{status}</Badge>
        <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={saveDraft}><Save className="h-3 w-3" /> Draft</Button>
        <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => setStep('review')}><Eye className="h-3 w-3" /> Preview</Button>
      </>
    }>
      {/* Stepper */}
      <div className="rounded-2xl border bg-card px-4 py-2.5 mb-4 shadow-card">
        <Stepper current={step} onGo={setStep} />
      </div>

      {/* ── Step 1: Identity ── */}
      {step === 'identity' && (
        <SectionCard title="Gig Identity" icon={<FileText className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-4">
            <div><FieldLabel label="Gig Title" required hint="Clear, descriptive title that tells buyers exactly what you offer" /><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. I will design a professional logo for your brand" className="h-9 text-xs" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel label="Category" required />
                <select value={category} onChange={e => { setCategory(e.target.value); setSubcategory(''); }} className="w-full h-9 rounded-xl border text-xs px-3 bg-background">{!category && <option value="">Select...</option>}{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
              </div>
              <div>
                <FieldLabel label="Subcategory" />
                <select value={subcategory} onChange={e => setSubcategory(e.target.value)} className="w-full h-9 rounded-xl border text-xs px-3 bg-background" disabled={!category}>{!subcategory && <option value="">Select...</option>}{(SUBCATEGORIES[category] || []).map(c => <option key={c}>{c}</option>)}</select>
              </div>
            </div>
            <div><FieldLabel label="Gig Mode" /><ChipSelect options={GIG_MODES} selected={gigMode} onChange={setGigMode} /></div>
            <div><FieldLabel label="Delivery Type" /><ChipSelect options={DELIVERY_TYPES} selected={deliveryType} onChange={setDeliveryType} /></div>
          </div>
        </SectionCard>
      )}

      {/* ── Step 2: Description ── */}
      {step === 'description' && (
        <SectionCard title="Description & Offer Positioning" icon={<MessageSquare className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-4">
            <div><FieldLabel label="Short Summary" required hint="One-liner for search results and cards" /><Input value={shortSummary} onChange={e => setShortSummary(e.target.value)} placeholder="Professional logo design with unlimited concepts" className="h-9 text-xs" /></div>
            <div><FieldLabel label="Full Description" required /><Textarea value={fullDesc} onChange={e => setFullDesc(e.target.value)} placeholder="Describe your gig in detail. What makes it unique? What's your process?" className="text-xs min-h-[160px]" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><FieldLabel label="What's Included" /><Textarea value={whatsIncluded} onChange={e => setWhatsIncluded(e.target.value)} placeholder="• Source files (AI, PSD, SVG)&#10;• High resolution export&#10;• Commercial rights" className="text-xs min-h-[100px]" /></div>
              <div><FieldLabel label="What's Excluded" /><Textarea value={whatsExcluded} onChange={e => setWhatsExcluded(e.target.value)} placeholder="• Brand strategy&#10;• Print production&#10;• Stationery design (see Premium)" className="text-xs min-h-[100px]" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><FieldLabel label="Ideal Buyer" hint="Who is this gig perfect for?" /><Textarea value={idealBuyer} onChange={e => setIdealBuyer(e.target.value)} placeholder="Startups, small businesses, personal brands looking for professional identity" className="text-xs min-h-[60px]" /></div>
              <div><FieldLabel label="Use Cases" /><Textarea value={useCases} onChange={e => setUseCases(e.target.value)} placeholder="Brand launch, rebrand, social media presence, merchandise" className="text-xs min-h-[60px]" /></div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── Step 3: Packages ── */}
      {step === 'packages' && (
        <SectionCard title="Packages" icon={<Package className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <p className="text-[9px] text-muted-foreground mb-4">Create 3 package tiers to offer buyers clear choices.</p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {packages.map((pkg, idx) => (
              <div key={pkg.name} className={cn('p-4 rounded-2xl border transition-all', idx === 1 ? 'border-accent ring-1 ring-accent/20 bg-accent/5' : 'border-border/40')}>
                {idx === 1 && <Badge className="text-[7px] h-4 mb-2 bg-accent/10 text-accent border-0">Most Popular</Badge>}
                <div className="text-[11px] font-bold mb-3">{pkg.name}</div>
                <div className="space-y-2.5">
                  <div><FieldLabel label="Price" required /><Input value={pkg.price} onChange={e => updatePackage(idx, 'price', e.target.value)} placeholder="$50" className="h-8 text-xs" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><FieldLabel label="Delivery" /><Input value={pkg.delivery} onChange={e => updatePackage(idx, 'delivery', e.target.value)} placeholder="3 days" className="h-8 text-xs" /></div>
                    <div><FieldLabel label="Revisions" /><Input value={pkg.revisions} onChange={e => updatePackage(idx, 'revisions', e.target.value)} placeholder="1" className="h-8 text-xs" /></div>
                  </div>
                  <div>
                    <FieldLabel label="Included Items" />
                    {pkg.features.map((f, fi) => (
                      <div key={fi} className="flex items-center gap-1.5 mb-1">
                        <CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))] shrink-0" />
                        <Input value={f} onChange={e => { const nf = [...pkg.features]; nf[fi] = e.target.value; updatePackage(idx, 'features', nf); }} className="h-7 text-[10px] flex-1" />
                        <button onClick={() => updatePackage(idx, 'features', pkg.features.filter((_, i) => i !== fi))}><X className="h-2.5 w-2.5 text-muted-foreground" /></button>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5 mt-1" onClick={() => addFeatureToPackage(idx)}><Plus className="h-2.5 w-2.5" /> Add Item</Button>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Switch checked={pkg.consultIncl} onCheckedChange={v => updatePackage(idx, 'consultIncl', v)} />
                    <span className="text-[9px]">Consultation included</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Step 4: Add-ons ── */}
      {step === 'addons' && (
        <SectionCard title="Add-ons & Extras" icon={<Gift className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <p className="text-[9px] text-muted-foreground mb-3">Offer extras buyers can add to any package.</p>
          <div className="space-y-2 mb-3">
            {addons.map((a, idx) => (
              <div key={a.id} className="p-3 rounded-xl border border-border/40 space-y-2">
                <div className="flex items-center gap-2">
                  <Input value={a.name} onChange={e => setAddons(ad => ad.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} placeholder="Add-on name" className="h-8 text-xs flex-1" />
                  <Input value={a.price} onChange={e => setAddons(ad => ad.map((x, i) => i === idx ? { ...x, price: e.target.value } : x))} placeholder="$25" className="h-8 text-xs w-20" />
                  <Input value={a.deliveryImpact} onChange={e => setAddons(ad => ad.map((x, i) => i === idx ? { ...x, deliveryImpact: e.target.value } : x))} placeholder="+1 day" className="h-8 text-xs w-20" />
                  <button onClick={() => setAddons(ad => ad.filter((_, i) => i !== idx))}><Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" /></button>
                </div>
                <Input value={a.description} onChange={e => setAddons(ad => ad.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} placeholder="Description..." className="h-7 text-[10px]" />
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => setAddons(a => [...a, { id: String(Date.now()), name: '', price: '', deliveryImpact: '', description: '' }])}><Plus className="h-3 w-3" /> Add Extra</Button>
        </SectionCard>
      )}

      {/* ── Step 5: Requirements ── */}
      {step === 'requirements' && (
        <SectionCard title="Buyer Requirements" icon={<List className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <p className="text-[9px] text-muted-foreground mb-3">What info do you need from buyers before starting?</p>
          <div className="space-y-2 mb-3">
            {requirements.map((r, idx) => (
              <div key={r.id} className="p-3 rounded-xl border border-border/40 flex items-start gap-2">
                <span className="text-[9px] font-bold text-muted-foreground mt-1.5 shrink-0">{idx + 1}</span>
                <div className="flex-1 space-y-1.5">
                  <Input value={r.text} onChange={e => setRequirements(rq => rq.map((x, i) => i === idx ? { ...x, text: e.target.value } : x))} placeholder="What do you need?" className="h-8 text-xs" />
                  <div className="flex items-center gap-2">
                    <select value={r.type} onChange={e => setRequirements(rq => rq.map((x, i) => i === idx ? { ...x, type: e.target.value } : x))} className="h-6 rounded-lg border text-[8px] px-1.5 bg-background">{REQUIREMENT_TYPES.map(t => <option key={t}>{t}</option>)}</select>
                    <label className="flex items-center gap-1 text-[8px]"><input type="checkbox" checked={r.required} onChange={e => setRequirements(rq => rq.map((x, i) => i === idx ? { ...x, required: e.target.checked } : x))} className="accent-accent" /> Required</label>
                  </div>
                </div>
                <button onClick={() => setRequirements(rq => rq.filter((_, i) => i !== idx))} className="mt-1"><Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" /></button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => setRequirements(r => [...r, { id: String(Date.now()), text: '', type: 'Text', required: false }])}><Plus className="h-3 w-3" /> Add Requirement</Button>
        </SectionCard>
      )}

      {/* ── Step 6: Tags ── */}
      {step === 'tags' && (
        <SectionCard title="Tags & Search Optimization" icon={<Tag className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <p className="text-[9px] text-muted-foreground mb-4">Tags help buyers find your gig. Add relevant tags for better visibility.</p>
          <div className="space-y-4">
            <div><FieldLabel label="Skill Tags" /><TagInput tags={skillTags} onChange={setSkillTags} placeholder="e.g. Logo Design, Branding" /></div>
            <div><FieldLabel label="Type Tags" /><TagInput tags={typeTags} onChange={setTypeTags} placeholder="e.g. Minimalist, Modern, Vintage" /></div>
            <div><FieldLabel label="Category Tags" /><TagInput tags={categoryTags} onChange={setCategoryTags} placeholder="e.g. Graphic Design, Identity" /></div>
            <div><FieldLabel label="Tool Tags" /><TagInput tags={toolTags} onChange={setToolTags} placeholder="e.g. Adobe Illustrator, Figma" /></div>
            <div><FieldLabel label="Industry Tags" /><TagInput tags={industryTags} onChange={setIndustryTags} placeholder="e.g. Tech, Real Estate, Fashion" /></div>
            <div><FieldLabel label="Search Keywords" hint="Additional keywords for SEO" /><TagInput tags={searchKeywords} onChange={setSearchKeywords} placeholder="e.g. logo maker, brand designer" /></div>
          </div>
        </SectionCard>
      )}

      {/* ── Step 7: FAQ ── */}
      {step === 'faq' && (
        <SectionCard title="FAQ & Policies" icon={<HelpCircle className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-2 mb-3">
            {faqs.map((f, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-border/40 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-[9px] font-bold text-accent mt-1.5">Q</span>
                  <Input value={f.q} onChange={e => setFaqs(fq => fq.map((x, i) => i === idx ? { ...x, q: e.target.value } : x))} placeholder="Question..." className="h-8 text-xs flex-1" />
                  <button onClick={() => setFaqs(fq => fq.filter((_, i) => i !== idx))}><Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" /></button>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[9px] font-bold text-muted-foreground mt-1.5">A</span>
                  <Textarea value={f.a} onChange={e => setFaqs(fq => fq.map((x, i) => i === idx ? { ...x, a: e.target.value } : x))} placeholder="Answer..." className="text-[10px] min-h-[60px] flex-1" />
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => setFaqs(f => [...f, { q: '', a: '' }])}><Plus className="h-3 w-3" /> Add FAQ</Button>
        </SectionCard>
      )}

      {/* ── Step 8: Media ── */}
      {step === 'media' && (
        <SectionCard title="Media & Presentation" icon={<Image className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-4">
            <div>
              <FieldLabel label="Thumbnail" required hint="Main image shown on cards (1200x800px recommended)" />
              <div className="h-32 rounded-2xl border-2 border-dashed border-border/50 flex items-center justify-center cursor-pointer hover:bg-accent/5 transition-all">
                <div className="text-center"><Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" /><p className="text-[9px] text-muted-foreground">Drop image or click to upload</p></div>
              </div>
            </div>
            <div>
              <FieldLabel label="Gallery Images" hint="Up to 10 images showcasing your work" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-24 rounded-xl border-2 border-dashed border-border/40 flex items-center justify-center cursor-pointer hover:bg-accent/5 transition-all">
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel label="Video Intro" hint="A short video introducing your gig (optional but recommended)" />
              <div className="h-24 rounded-2xl border-2 border-dashed border-border/40 flex items-center justify-center cursor-pointer hover:bg-accent/5 transition-all">
                <div className="text-center"><Play className="h-5 w-5 mx-auto text-muted-foreground mb-1" /><p className="text-[9px] text-muted-foreground">Upload video intro</p></div>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── Step 9: Delivery ── */}
      {step === 'delivery' && (
        <SectionCard title="Delivery & Availability" icon={<Calendar className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-4">
            <div><FieldLabel label="Standard Delivery Time" /><Input value={stdDelivery} onChange={e => setStdDelivery(e.target.value)} placeholder="5 days" className="h-9 text-xs" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40">
                <Switch checked={customDelivery} onCheckedChange={setCustomDelivery} />
                <div><div className="text-[10px] font-semibold">Custom Delivery Time</div><div className="text-[8px] text-muted-foreground">Allow buyers to request custom timelines</div></div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40">
                <Switch checked={availableNow} onCheckedChange={setAvailableNow} />
                <div><div className="text-[10px] font-semibold">Available Now</div><div className="text-[8px] text-muted-foreground">Ready to accept orders immediately</div></div>
              </div>
            </div>
            <div><FieldLabel label="Capacity Limit" hint="Maximum concurrent orders" /><Input value={capacityLimit} onChange={e => setCapacityLimit(e.target.value)} placeholder="e.g. 5 orders max" className="h-9 text-xs" /></div>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40">
              <Switch checked={vacationMode} onCheckedChange={setVacationMode} />
              <div><div className="text-[10px] font-semibold">Vacation Mode</div><div className="text-[8px] text-muted-foreground">Temporarily pause this gig</div></div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── Step 10: Review ── */}
      {step === 'review' && (
        <div className="space-y-4">
          <SectionCard title="Review & Publish" icon={<Eye className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-3">
              {[
                { label: 'Title', value: title || '—', go: 'identity' as Step },
                { label: 'Category', value: category ? `${category}${subcategory ? ` > ${subcategory}` : ''}` : '—', go: 'identity' as Step },
                { label: 'Mode', value: `${gigMode} · ${deliveryType}`, go: 'identity' as Step },
                { label: 'Packages', value: packages.map(p => `${p.name}: $${p.price}`).join(' · '), go: 'packages' as Step },
                { label: 'Add-ons', value: `${addons.length} extras`, go: 'addons' as Step },
                { label: 'Requirements', value: `${requirements.length} questions`, go: 'requirements' as Step },
                { label: 'FAQ', value: `${faqs.length} items`, go: 'faq' as Step },
                { label: 'Delivery', value: stdDelivery, go: 'delivery' as Step },
              ].map((item, i) => (
                <button key={i} onClick={() => setStep(item.go)} className="w-full flex items-center justify-between p-3 rounded-xl border border-border/30 hover:border-accent/30 transition-all text-left">
                  <div><div className="text-[9px] text-muted-foreground">{item.label}</div><div className="text-[10px] font-semibold truncate max-w-md">{item.value}</div></div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </button>
              ))}
            </div>
          </SectionCard>

          {/* Validation */}
          <SectionCard title="Validation" className="!rounded-2xl">
            {(!title || !category) ? (
              <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20 flex items-center gap-2 text-[9px] text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <div><strong>Missing:</strong> {!title && 'Gig Title, '}{!category && 'Category'}. Complete these before publishing.</div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[hsl(var(--state-healthy))]/5 border border-[hsl(var(--state-healthy))]/20 flex items-center gap-2 text-[9px] text-[hsl(var(--state-healthy))]">
                <CheckCircle2 className="h-4 w-4 shrink-0" /> Ready to publish.
              </div>
            )}
          </SectionCard>

          {/* Package Comparison */}
          <SectionCard title="Package Comparison Preview" className="!rounded-2xl">
            <div className="grid grid-cols-3 gap-2">
              {packages.map((p, i) => (
                <div key={i} className={cn('p-3 rounded-xl border text-center', i === 1 ? 'border-accent bg-accent/5' : 'border-border/30')}>
                  <div className="text-[10px] font-bold">{p.name}</div>
                  <div className="text-sm font-bold text-accent mt-1">${p.price}</div>
                  <div className="text-[8px] text-muted-foreground">{p.delivery} · {p.revisions} revisions</div>
                  <div className="mt-2 space-y-0.5">{p.features.slice(0, 3).map((f, fi) => <div key={fi} className="text-[7px] text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-2 w-2 text-[hsl(var(--state-healthy))]" />{f}</div>)}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── Sticky Navigation ── */}
      <div className="sticky bottom-0 z-10 mt-4 -mx-1 px-1 pb-1">
        <div className="flex items-center justify-between rounded-2xl border bg-card/95 backdrop-blur-sm px-5 py-3 shadow-lg">
          <Button variant="outline" size="sm" disabled={isFirst} onClick={goPrev} className="h-8 text-xs rounded-xl gap-1"><ChevronLeft className="h-3 w-3" /> Back</Button>
          <div className="text-[9px] text-muted-foreground">{currentIdx + 1} of {STEPS.length}</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl gap-1" onClick={saveDraft}><Save className="h-3 w-3" /> Save</Button>
            {isLast ? (
              <Button size="sm" className="h-8 text-xs rounded-xl gap-1" disabled={!title || !category} onClick={() => toast.success('Gig published!')}><Sparkles className="h-3 w-3" /> Publish Gig</Button>
            ) : (
              <Button size="sm" onClick={goNext} className="h-8 text-xs rounded-xl gap-1">Next <ChevronRight className="h-3 w-3" /></Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GigCreatePage;
