import React, { useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Briefcase, Plus, Trash2, Save, Eye, Send, CheckCircle2,
  ChevronRight, ChevronLeft, MapPin, DollarSign, Tag, HelpCircle,
  MessageSquare, Calendar, Globe, Phone, Video, X, Upload,
  AlertTriangle, Sparkles, Settings, FileText, Users, Star,
  Lock, ArrowLeft, Shield, Zap, Clock,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   Types & Constants
   ═══════════════════════════════════════════════════════════ */
type Step = 'identity' | 'description' | 'pricing' | 'tags' | 'addons' | 'faq' | 'contact' | 'customization' | 'review';

const STEPS: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: 'identity', label: 'Service Identity', icon: Briefcase },
  { key: 'description', label: 'Description', icon: FileText },
  { key: 'pricing', label: 'Pricing', icon: DollarSign },
  { key: 'tags', label: 'Tags', icon: Tag },
  { key: 'addons', label: 'Add-ons', icon: Zap },
  { key: 'faq', label: 'FAQ', icon: HelpCircle },
  { key: 'contact', label: 'Contact & Location', icon: MapPin },
  { key: 'customization', label: 'Customization', icon: Settings },
  { key: 'review', label: 'Review', icon: Eye },
];

const SERVICE_TYPES = ['Consulting', 'Development', 'Design', 'Marketing', 'Training', 'Legal', 'Finance', 'Coaching', 'Photography', 'Maintenance'];
const DELIVERY_MODELS = ['Remote', 'On-site', 'Hybrid', 'Recurring', 'One-off', 'Consultation-led'];
const CONTACT_MODES = ['Direct Inquiry', 'Booking Required', 'Instant Order', 'Request Quote'];
const PRICING_TYPES = ['Fixed Price', 'Hourly Rate', 'Custom Quote', 'Subscription', 'Retainer'];

interface PricingTier { name: string; price: string; description: string; features: string[]; }
interface AddOn { id: string; name: string; description: string; price: string; }
interface FAQ { q: string; a: string; }

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
export default function ServiceListingBuilderPage() {
  const [step, setStep] = useState<Step>('identity');

  // Identity
  const [title, setTitle] = useState('');
  const [serviceType, setServiceType] = useState('Consulting');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [deliveryModel, setDeliveryModel] = useState('Remote');
  const [contactMode, setContactMode] = useState('Direct Inquiry');

  // Description
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [scope, setScope] = useState('');
  const [whoFor, setWhoFor] = useState('');
  const [included, setIncluded] = useState('');
  const [excluded, setExcluded] = useState('');
  const [industries, setIndustries] = useState('');

  // Pricing
  const [pricingType, setPricingType] = useState('Fixed Price');
  const [basePrice, setBasePrice] = useState('');
  const [callForPricing, setCallForPricing] = useState(false);
  const [subscription, setSubscription] = useState(false);
  const [tiers, setTiers] = useState<PricingTier[]>([
    { name: 'Starter', price: '499', description: 'Perfect for small projects', features: ['Up to 5 pages', 'Basic support', '1 revision'] },
    { name: 'Growth', price: '999', description: 'For growing businesses', features: ['Up to 15 pages', 'Priority support', '3 revisions', 'Analytics setup'] },
    { name: 'Enterprise', price: '', description: 'Custom solutions', features: ['Unlimited pages', 'Dedicated manager', 'Unlimited revisions', 'Custom integrations', 'SLA'] },
  ]);

  // Tags
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [serviceTags, setServiceTags] = useState<string[]>([]);
  const [categoryTags, setCategoryTags] = useState<string[]>([]);
  const [industryTags, setIndustryTags] = useState<string[]>([]);
  const [locationTags, setLocationTags] = useState<string[]>([]);
  const [toolTags, setToolTags] = useState<string[]>([]);

  // Add-ons
  const [addons, setAddons] = useState<AddOn[]>([
    { id: '1', name: 'Priority Support', description: 'Dedicated support channel', price: '99/mo' },
    { id: '2', name: 'On-site Visit', description: 'In-person consultation', price: '500' },
  ]);

  // FAQ
  const [faqs, setFaqs] = useState<FAQ[]>([{ q: 'How long does the typical engagement take?', a: 'It depends on scope, but most projects complete within 2-6 weeks.' }]);

  // Contact & Location
  const [bookingEnabled, setBookingEnabled] = useState(true);
  const [messagingEnabled, setMessagingEnabled] = useState(true);
  const [phoneConsult, setPhoneConsult] = useState(false);
  const [videoConsult, setVideoConsult] = useState(true);
  const [serviceArea, setServiceArea] = useState('');
  const [workModel, setWorkModel] = useState('Remote');
  const [radius, setRadius] = useState('');

  // Customization
  const [customQuote, setCustomQuote] = useState(true);
  const [discoveryCall, setDiscoveryCall] = useState(true);
  const [briefUpload, setBriefUpload] = useState(true);
  const [calendarLink, setCalendarLink] = useState('');

  const currentIdx = STEPS.findIndex(s => s.key === step);
  const isLast = currentIdx === STEPS.length - 1;
  const isFirst = currentIdx === 0;
  const goNext = () => { if (!isLast) setStep(STEPS[currentIdx + 1].key); };
  const goPrev = () => { if (!isFirst) setStep(STEPS[currentIdx - 1].key); };
  const saveDraft = useCallback(() => toast.success('Draft saved'), []);

  return (
    <DashboardLayout topStrip={
      <>
        <ArrowLeft className="h-3 w-3 text-muted-foreground" />
        <Briefcase className="h-4 w-4 text-accent" />
        <span className="text-xs font-bold">Service Builder</span>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={saveDraft}><Save className="h-3 w-3" /> Draft</Button>
        <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => setStep('review')}><Eye className="h-3 w-3" /> Preview</Button>
      </>
    }>
      <div className="rounded-2xl border bg-card px-4 py-2.5 mb-4 shadow-card"><Stepper current={step} onGo={setStep} /></div>

      {/* ── Step 1: Identity ── */}
      {step === 'identity' && (
        <SectionCard title="Service Identity" icon={<Briefcase className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-4">
            <div><FieldLabel label="Service Title" required /><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Full-Stack Web Development Consulting" className="h-9 text-xs" /></div>
            <div><FieldLabel label="Service Type" /><ChipSelect options={SERVICE_TYPES} selected={serviceType} onChange={setServiceType} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><FieldLabel label="Category" /><Input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Technology" className="h-9 text-xs" /></div>
              <div><FieldLabel label="Subcategory" /><Input value={subcategory} onChange={e => setSubcategory(e.target.value)} placeholder="e.g. Web Development" className="h-9 text-xs" /></div>
            </div>
            <div><FieldLabel label="Delivery Model" /><ChipSelect options={DELIVERY_MODELS} selected={deliveryModel} onChange={setDeliveryModel} /></div>
            <div><FieldLabel label="Contact Mode" hint="How buyers initiate engagement" /><ChipSelect options={CONTACT_MODES} selected={contactMode} onChange={setContactMode} /></div>
          </div>
        </SectionCard>
      )}

      {/* ── Step 2: Description ── */}
      {step === 'description' && (
        <SectionCard title="Description & Scope" icon={<FileText className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-4">
            <div><FieldLabel label="Short Description" required hint="One-liner for cards and search" /><Input value={shortDesc} onChange={e => setShortDesc(e.target.value)} placeholder="Expert web development consulting for growing businesses" className="h-9 text-xs" /></div>
            <div><FieldLabel label="Full Description" required /><Textarea value={fullDesc} onChange={e => setFullDesc(e.target.value)} placeholder="Describe your service offering in detail..." className="text-xs min-h-[160px]" /></div>
            <div><FieldLabel label="Scope of Service" /><Textarea value={scope} onChange={e => setScope(e.target.value)} placeholder="What is covered under this service engagement..." className="text-xs min-h-[80px]" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><FieldLabel label="Who It's For" /><Textarea value={whoFor} onChange={e => setWhoFor(e.target.value)} placeholder="Target audience for this service" className="text-xs min-h-[60px]" /></div>
              <div><FieldLabel label="Industries Served" /><Textarea value={industries} onChange={e => setIndustries(e.target.value)} placeholder="e.g. FinTech, Healthcare, E-commerce" className="text-xs min-h-[60px]" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><FieldLabel label="What's Included" /><Textarea value={included} onChange={e => setIncluded(e.target.value)} placeholder="• Discovery call&#10;• Technical audit&#10;• Implementation" className="text-xs min-h-[80px]" /></div>
              <div><FieldLabel label="What's Not Included" /><Textarea value={excluded} onChange={e => setExcluded(e.target.value)} placeholder="• Ongoing maintenance&#10;• Third-party licenses" className="text-xs min-h-[80px]" /></div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── Step 3: Pricing ── */}
      {step === 'pricing' && (
        <SectionCard title="Pricing Structure" icon={<DollarSign className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-4">
            <div><FieldLabel label="Pricing Type" /><ChipSelect options={PRICING_TYPES} selected={pricingType} onChange={setPricingType} /></div>
            {pricingType !== 'Custom Quote' && (
              <div><FieldLabel label="Base Price" /><Input value={basePrice} onChange={e => setBasePrice(e.target.value)} placeholder="$499" className="h-9 text-xs" /></div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40">
                <Switch checked={callForPricing} onCheckedChange={setCallForPricing} />
                <div><div className="text-[10px] font-semibold">Call for Pricing</div><div className="text-[8px] text-muted-foreground">Show "Contact for quote" instead of price</div></div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40">
                <Switch checked={subscription} onCheckedChange={setSubscription} />
                <div><div className="text-[10px] font-semibold">Retainer Option</div><div className="text-[8px] text-muted-foreground">Offer monthly retainer pricing</div></div>
              </div>
            </div>

            <div>
              <FieldLabel label="Pricing Tiers" hint="Create up to 3 pricing tiers" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {tiers.map((t, idx) => (
                  <div key={idx} className={cn('p-4 rounded-2xl border transition-all', idx === 1 ? 'border-accent ring-1 ring-accent/20 bg-accent/5' : 'border-border/40')}>
                    {idx === 1 && <Badge className="text-[7px] h-4 mb-2 bg-accent/10 text-accent border-0">Recommended</Badge>}
                    <Input value={t.name} onChange={e => setTiers(ts => ts.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} className="h-8 text-xs font-bold mb-2" placeholder="Tier name" />
                    <Input value={t.price} onChange={e => setTiers(ts => ts.map((x, i) => i === idx ? { ...x, price: e.target.value } : x))} className="h-8 text-xs mb-2" placeholder={idx === 2 ? 'Custom' : '$499'} />
                    <Input value={t.description} onChange={e => setTiers(ts => ts.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} className="h-7 text-[10px] mb-2" placeholder="Short description" />
                    <div className="space-y-1">
                      {t.features.map((f, fi) => (
                        <div key={fi} className="flex items-center gap-1">
                          <CheckCircle2 className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))] shrink-0" />
                          <Input value={f} onChange={e => { const nf = [...t.features]; nf[fi] = e.target.value; setTiers(ts => ts.map((x, i) => i === idx ? { ...x, features: nf } : x)); }} className="h-6 text-[9px] flex-1" />
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" className="h-5 text-[7px] gap-0.5" onClick={() => setTiers(ts => ts.map((x, i) => i === idx ? { ...x, features: [...x.features, ''] } : x))}><Plus className="h-2 w-2" /> Add</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── Step 4: Tags ── */}
      {step === 'tags' && (
        <SectionCard title="Tags & Discoverability" icon={<Tag className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-4">
            <div><FieldLabel label="Skill Tags" /><TagInput tags={skillTags} onChange={setSkillTags} placeholder="e.g. React, Node.js" /></div>
            <div><FieldLabel label="Service Tags" /><TagInput tags={serviceTags} onChange={setServiceTags} placeholder="e.g. Web Development, API Design" /></div>
            <div><FieldLabel label="Category Tags" /><TagInput tags={categoryTags} onChange={setCategoryTags} placeholder="e.g. Technology, Software" /></div>
            <div><FieldLabel label="Industry Tags" /><TagInput tags={industryTags} onChange={setIndustryTags} placeholder="e.g. Healthcare, FinTech" /></div>
            <div><FieldLabel label="Location Tags" /><TagInput tags={locationTags} onChange={setLocationTags} placeholder="e.g. London, Remote, EU" /></div>
            <div><FieldLabel label="Tool Tags" /><TagInput tags={toolTags} onChange={setToolTags} placeholder="e.g. AWS, Figma, Jira" /></div>
          </div>
        </SectionCard>
      )}

      {/* ── Step 5: Add-ons ── */}
      {step === 'addons' && (
        <SectionCard title="Add-ons & Options" icon={<Zap className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-2 mb-3">
            {addons.map((a, idx) => (
              <div key={a.id} className="p-3 rounded-xl border border-border/40 space-y-2">
                <div className="flex items-center gap-2">
                  <Input value={a.name} onChange={e => setAddons(ad => ad.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} placeholder="Add-on name" className="h-8 text-xs flex-1" />
                  <Input value={a.price} onChange={e => setAddons(ad => ad.map((x, i) => i === idx ? { ...x, price: e.target.value } : x))} placeholder="$99" className="h-8 text-xs w-24" />
                  <button onClick={() => setAddons(ad => ad.filter((_, i) => i !== idx))}><Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" /></button>
                </div>
                <Input value={a.description} onChange={e => setAddons(ad => ad.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} placeholder="Description..." className="h-7 text-[10px]" />
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => setAddons(a => [...a, { id: String(Date.now()), name: '', description: '', price: '' }])}><Plus className="h-3 w-3" /> Add Option</Button>
        </SectionCard>
      )}

      {/* ── Step 6: FAQ ── */}
      {step === 'faq' && (
        <SectionCard title="FAQ & Objection Handling" icon={<HelpCircle className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-2 mb-3">
            {faqs.map((f, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-border/40 space-y-2">
                <div className="flex items-start gap-2"><span className="text-[9px] font-bold text-accent mt-1.5">Q</span><Input value={f.q} onChange={e => setFaqs(fq => fq.map((x, i) => i === idx ? { ...x, q: e.target.value } : x))} placeholder="Question..." className="h-8 text-xs flex-1" /><button onClick={() => setFaqs(fq => fq.filter((_, i) => i !== idx))}><Trash2 className="h-3 w-3 text-muted-foreground" /></button></div>
                <div className="flex items-start gap-2"><span className="text-[9px] font-bold text-muted-foreground mt-1.5">A</span><Textarea value={f.a} onChange={e => setFaqs(fq => fq.map((x, i) => i === idx ? { ...x, a: e.target.value } : x))} placeholder="Answer..." className="text-[10px] min-h-[60px] flex-1" /></div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => setFaqs(f => [...f, { q: '', a: '' }])}><Plus className="h-3 w-3" /> Add FAQ</Button>
        </SectionCard>
      )}

      {/* ── Step 7: Contact & Location ── */}
      {step === 'contact' && (
        <SectionCard title="Contact & Location" icon={<MapPin className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Booking', icon: Calendar, checked: bookingEnabled, onChange: setBookingEnabled },
                { label: 'Messaging', icon: MessageSquare, checked: messagingEnabled, onChange: setMessagingEnabled },
                { label: 'Phone Consult', icon: Phone, checked: phoneConsult, onChange: setPhoneConsult },
                { label: 'Video Consult', icon: Video, checked: videoConsult, onChange: setVideoConsult },
              ].map(c => (
                <div key={c.label} className="flex items-center gap-2 p-3 rounded-xl border border-border/40">
                  <Switch checked={c.checked} onCheckedChange={c.onChange} />
                  <div className="flex items-center gap-1"><c.icon className="h-3 w-3 text-muted-foreground" /><span className="text-[9px] font-medium">{c.label}</span></div>
                </div>
              ))}
            </div>
            <div><FieldLabel label="Working Model" /><ChipSelect options={['Remote', 'Hybrid', 'On-site']} selected={workModel} onChange={setWorkModel} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><FieldLabel label="Service Area" hint="City, region, or 'Worldwide'" /><Input value={serviceArea} onChange={e => setServiceArea(e.target.value)} placeholder="e.g. London, UK" className="h-9 text-xs" /></div>
              <div><FieldLabel label="Radius / Region Coverage" /><Input value={radius} onChange={e => setRadius(e.target.value)} placeholder="e.g. 50 miles / South East England" className="h-9 text-xs" /></div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── Step 8: Customization ── */}
      {step === 'customization' && (
        <SectionCard title="Customization & Intake" icon={<Settings className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Custom Quote Allowed', desc: 'Buyers can request tailored pricing', checked: customQuote, onChange: setCustomQuote },
                { label: 'Discovery Call Required', desc: 'Initial call before engagement begins', checked: discoveryCall, onChange: setDiscoveryCall },
                { label: 'Brief Upload Option', desc: 'Buyers can upload a project brief', checked: briefUpload, onChange: setBriefUpload },
              ].map(c => (
                <div key={c.label} className="flex items-center gap-3 p-3 rounded-xl border border-border/40">
                  <Switch checked={c.checked} onCheckedChange={c.onChange} />
                  <div><div className="text-[10px] font-semibold">{c.label}</div><div className="text-[8px] text-muted-foreground">{c.desc}</div></div>
                </div>
              ))}
            </div>
            <div><FieldLabel label="Calendar Link" hint="Link to your booking calendar (Calendly, Cal.com, etc.)" /><Input value={calendarLink} onChange={e => setCalendarLink(e.target.value)} placeholder="https://calendly.com/yourname" className="h-9 text-xs" /></div>
          </div>
        </SectionCard>
      )}

      {/* ── Step 9: Review ── */}
      {step === 'review' && (
        <div className="space-y-4">
          <SectionCard title="Review & Publish" icon={<Eye className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-3">
              {[
                { label: 'Title', value: title || '—', go: 'identity' as Step },
                { label: 'Type', value: `${serviceType} · ${deliveryModel}`, go: 'identity' as Step },
                { label: 'Pricing', value: callForPricing ? 'Call for pricing' : (basePrice ? `From $${basePrice}` : `${tiers.filter(t => t.price).length} tiers`), go: 'pricing' as Step },
                { label: 'Contact', value: `${[bookingEnabled && 'Booking', messagingEnabled && 'Messaging', videoConsult && 'Video'].filter(Boolean).join(', ')}`, go: 'contact' as Step },
                { label: 'Location', value: `${workModel}${serviceArea ? ` · ${serviceArea}` : ''}`, go: 'contact' as Step },
                { label: 'Add-ons', value: `${addons.length} extras`, go: 'addons' as Step },
                { label: 'FAQ', value: `${faqs.length} items`, go: 'faq' as Step },
              ].map((item, i) => (
                <button key={i} onClick={() => setStep(item.go)} className="w-full flex items-center justify-between p-3 rounded-xl border border-border/30 hover:border-accent/30 transition-all text-left">
                  <div><div className="text-[9px] text-muted-foreground">{item.label}</div><div className="text-[10px] font-semibold">{item.value}</div></div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </button>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Validation" className="!rounded-2xl">
            {!title ? (
              <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20 flex items-center gap-2 text-[9px] text-destructive"><AlertTriangle className="h-4 w-4" /> Missing: Service Title</div>
            ) : (
              <div className="p-3 rounded-xl bg-[hsl(var(--state-healthy))]/5 border border-[hsl(var(--state-healthy))]/20 flex items-center gap-2 text-[9px] text-[hsl(var(--state-healthy))]"><CheckCircle2 className="h-4 w-4" /> Ready to publish.</div>
            )}
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
              <Button size="sm" className="h-8 text-xs rounded-xl gap-1" disabled={!title} onClick={() => toast.success('Service published!')}><Sparkles className="h-3 w-3" /> Publish</Button>
            ) : (
              <Button size="sm" onClick={goNext} className="h-8 text-xs rounded-xl gap-1">Next <ChevronRight className="h-3 w-3" /></Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
