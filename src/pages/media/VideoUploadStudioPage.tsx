import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Upload, Film, ArrowLeft, ArrowRight, Check, X, ImageIcon, Tag,
  Users, Globe, Lock, Clock, Calendar, Sparkles, Eye, Play,
  FileVideo, ChevronRight, Save, Send, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STEPS = ['Upload', 'Details', 'Tags & Category', 'Thumbnail', 'Audience', 'Schedule', 'Review'];
const CATEGORIES = ['Business', 'Development', 'Design', 'Marketing', 'Career', 'Product', 'AI', 'Leadership', 'Education', 'Tutorial', 'Documentary', 'Case Study', 'Interview'];
const AUDIENCE_TYPES = ['Everyone', 'Followers Only', 'Connections Only', 'Professionals', 'Enterprise Members', 'Jobseekers', 'Students', 'Invite Only'];
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Japanese', 'Portuguese', 'Hindi', 'Mandarin'];

export default function VideoUploadStudioPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '', description: '', category: '', subcategory: '', tags: '',
    language: 'English', audience: 'Everyone', visibility: 'public',
    commentsAllowed: true, publishOption: 'now', scheduleDate: '', scheduledTime: '',
    ctaLabel: '', ctaUrl: '', playlist: '',
  });

  const update = (key: string, val: any) => setForm(p => ({ ...p, [key]: val }));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setUploading(true);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 15 + 5;
      if (p >= 100) { p = 100; clearInterval(iv); setUploading(false); setStep(1); toast.success('Video uploaded successfully'); }
      setUploadProgress(Math.min(100, p));
    }, 400);
  };

  const handleThumbSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const canNext = () => {
    if (step === 0) return !!videoFile && !uploading;
    if (step === 1) return form.title.length > 2;
    if (step === 2) return !!form.category;
    return true;
  };

  const handlePublish = () => {
    toast.success('Video published successfully!');
    navigate('/media/videos/studio');
  };

  return (
    <DashboardLayout topStrip={
      <>
        <button onClick={() => navigate(-1)} className="h-7 w-7 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted"><ArrowLeft className="h-3.5 w-3.5" /></button>
        <Upload className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold">Upload Video</span>
        <div className="flex-1" />
        <Badge variant="outline" className="text-[9px] rounded-xl">Step {step + 1} of {STEPS.length}</Badge>
      </>
    }>
      {/* Stepper */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => i < step && setStep(i)} className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-medium shrink-0 transition-all',
            i === step ? 'bg-accent text-accent-foreground shadow-sm' :
            i < step ? 'bg-accent/10 text-accent cursor-pointer' : 'bg-muted/40 text-muted-foreground'
          )}>
            {i < step ? <Check className="h-3 w-3" /> : <span className="h-4 w-4 rounded-full border text-[8px] flex items-center justify-center">{i + 1}</span>}
            {s}
          </button>
        ))}
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Step 0: Upload */}
        {step === 0 && (
          <div className="rounded-3xl border-2 border-dashed border-accent/30 bg-accent/5 p-10 text-center">
            <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
            {!videoFile ? (
              <>
                <div className="h-20 w-20 rounded-3xl bg-accent/10 mx-auto flex items-center justify-center mb-4">
                  <FileVideo className="h-10 w-10 text-accent" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Upload Your Video</h3>
                <p className="text-xs text-muted-foreground mb-4">MP4, MOV, AVI up to 4GB · Recommended 1080p or higher</p>
                <Button onClick={() => fileRef.current?.click()} className="rounded-2xl gap-2"><Upload className="h-4 w-4" /> Select File</Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 justify-center">
                  <FileVideo className="h-8 w-8 text-accent" />
                  <div className="text-left">
                    <div className="text-sm font-medium">{videoFile.name}</div>
                    <div className="text-[10px] text-muted-foreground">{(videoFile.size / 1024 / 1024).toFixed(1)} MB</div>
                  </div>
                </div>
                {uploading && (
                  <div className="max-w-md mx-auto space-y-2">
                    <Progress value={uploadProgress} className="h-2 rounded-full" />
                    <p className="text-[10px] text-muted-foreground">{Math.round(uploadProgress)}% uploaded...</p>
                  </div>
                )}
                {!uploading && <Badge className="rounded-xl bg-accent/10 text-accent border-0"><Check className="h-3 w-3 mr-1" /> Upload Complete</Badge>}
              </div>
            )}
          </div>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="rounded-2xl border bg-card p-5 shadow-card space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Film className="h-4 w-4 text-accent" /> Video Details</h3>
              <div><label className="text-[10px] font-medium text-muted-foreground mb-1 block">Title *</label><Input value={form.title} onChange={e => update('title', e.target.value)} placeholder="Enter a compelling title..." className="rounded-xl" /></div>
              <div><label className="text-[10px] font-medium text-muted-foreground mb-1 block">Description</label><Textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="Describe your video content..." className="rounded-xl min-h-[120px]" /></div>
              <div><label className="text-[10px] font-medium text-muted-foreground mb-1 block">Language</label>
                <Select value={form.language} onValueChange={v => update('language', v)}><SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Tags & Category */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="rounded-2xl border bg-card p-5 shadow-card space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Tag className="h-4 w-4 text-accent" /> Tags & Category</h3>
              <div><label className="text-[10px] font-medium text-muted-foreground mb-1 block">Category *</label>
                <Select value={form.category} onValueChange={v => update('category', v)}><SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><label className="text-[10px] font-medium text-muted-foreground mb-1 block">Tags</label><Input value={form.tags} onChange={e => update('tags', e.target.value)} placeholder="react, tutorial, webdev (comma separated)" className="rounded-xl" /></div>
              <div className="flex flex-wrap gap-1.5">
                {form.tags.split(',').filter(t => t.trim()).map(t => <Badge key={t} variant="secondary" className="rounded-xl text-[9px]">{t.trim()}</Badge>)}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Thumbnail */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="rounded-2xl border bg-card p-5 shadow-card space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2"><ImageIcon className="h-4 w-4 text-accent" /> Thumbnail</h3>
              <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={handleThumbSelect} />
              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => thumbRef.current?.click()} className="aspect-video rounded-2xl border-2 border-dashed border-accent/30 bg-accent/5 flex flex-col items-center justify-center gap-1 hover:bg-accent/10 transition-colors">
                  <Upload className="h-5 w-5 text-accent" /><span className="text-[9px] text-accent font-medium">Custom Upload</span>
                </button>
                {[1, 2].map(i => (
                  <div key={i} className="aspect-video rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border">
                    <Play className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                ))}
              </div>
              {thumbnailPreview && (
                <div className="mt-3">
                  <div className="text-[10px] text-muted-foreground mb-1">Selected Thumbnail</div>
                  <img src={thumbnailPreview} alt="Thumbnail" className="aspect-video rounded-2xl object-cover max-w-xs border shadow-sm" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Audience */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="rounded-2xl border bg-card p-5 shadow-card space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-accent" /> Audience & Visibility</h3>
              <div><label className="text-[10px] font-medium text-muted-foreground mb-1 block">Who can see this?</label>
                <Select value={form.audience} onValueChange={v => update('audience', v)}><SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{AUDIENCE_TYPES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="flex items-center justify-between py-2"><div><div className="text-xs font-medium">Allow Comments</div><div className="text-[10px] text-muted-foreground">Let viewers comment on this video</div></div><Switch checked={form.commentsAllowed} onCheckedChange={v => update('commentsAllowed', v)} /></div>
              <div className="grid grid-cols-3 gap-2">
                {[{ v: 'public', icon: Globe, label: 'Public' }, { v: 'unlisted', icon: Eye, label: 'Unlisted' }, { v: 'private', icon: Lock, label: 'Private' }].map(o => (
                  <button key={o.v} onClick={() => update('visibility', o.v)} className={cn('rounded-2xl border p-3 text-center transition-all', form.visibility === o.v ? 'border-accent bg-accent/5 shadow-sm' : 'hover:bg-muted/50')}>
                    <o.icon className={cn('h-5 w-5 mx-auto mb-1', form.visibility === o.v ? 'text-accent' : 'text-muted-foreground')} />
                    <div className="text-[10px] font-medium">{o.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Schedule */}
        {step === 5 && (
          <div className="space-y-5">
            <div className="rounded-2xl border bg-card p-5 shadow-card space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Calendar className="h-4 w-4 text-accent" /> Publishing</h3>
              <div className="grid grid-cols-3 gap-2">
                {[{ v: 'now', icon: Send, label: 'Publish Now' }, { v: 'schedule', icon: Clock, label: 'Schedule' }, { v: 'draft', icon: Save, label: 'Save Draft' }].map(o => (
                  <button key={o.v} onClick={() => update('publishOption', o.v)} className={cn('rounded-2xl border p-4 text-center transition-all', form.publishOption === o.v ? 'border-accent bg-accent/5 shadow-sm' : 'hover:bg-muted/50')}>
                    <o.icon className={cn('h-5 w-5 mx-auto mb-1.5', form.publishOption === o.v ? 'text-accent' : 'text-muted-foreground')} />
                    <div className="text-[10px] font-medium">{o.label}</div>
                  </button>
                ))}
              </div>
              {form.publishOption === 'schedule' && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div><label className="text-[10px] font-medium text-muted-foreground mb-1 block">Date</label><Input type="date" value={form.scheduleDate} onChange={e => update('scheduleDate', e.target.value)} className="rounded-xl text-xs" /></div>
                  <div><label className="text-[10px] font-medium text-muted-foreground mb-1 block">Time</label><Input type="time" value={form.scheduledTime} onChange={e => update('scheduledTime', e.target.value)} className="rounded-xl text-xs" /></div>
                </div>
              )}
            </div>
            <div className="rounded-2xl border bg-card p-5 shadow-card space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" /> Call to Action (Optional)</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-medium text-muted-foreground mb-1 block">CTA Label</label><Input value={form.ctaLabel} onChange={e => update('ctaLabel', e.target.value)} placeholder="Learn More" className="rounded-xl" /></div>
                <div><label className="text-[10px] font-medium text-muted-foreground mb-1 block">CTA URL</label><Input value={form.ctaUrl} onChange={e => update('ctaUrl', e.target.value)} placeholder="https://..." className="rounded-xl" /></div>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Review */}
        {step === 6 && (
          <div className="space-y-4">
            <div className="rounded-2xl border bg-card p-5 shadow-card space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Eye className="h-4 w-4 text-accent" /> Review & Publish</h3>
              {[
                { label: 'Title', value: form.title },
                { label: 'Category', value: form.category },
                { label: 'Tags', value: form.tags || '—' },
                { label: 'Audience', value: form.audience },
                { label: 'Visibility', value: form.visibility },
                { label: 'Comments', value: form.commentsAllowed ? 'Enabled' : 'Disabled' },
                { label: 'Publish', value: form.publishOption === 'now' ? 'Immediately' : form.publishOption === 'schedule' ? `Scheduled: ${form.scheduleDate} ${form.scheduledTime}` : 'Draft' },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <span className="text-[10px] text-muted-foreground">{r.label}</span>
                  <span className="text-[10px] font-medium">{r.value || <span className="text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Missing</span>}</span>
                </div>
              ))}
            </div>
            {thumbnailPreview && <img src={thumbnailPreview} alt="Thumbnail" className="rounded-2xl aspect-video object-cover max-w-xs border shadow-sm" />}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)} className="rounded-xl gap-1"><ArrowLeft className="h-3.5 w-3.5" /> {step === 0 ? 'Cancel' : 'Back'}</Button>
          <div className="flex gap-2">
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="rounded-xl gap-1">{STEPS[step + 1]} <ArrowRight className="h-3.5 w-3.5" /></Button>
            ) : (
              <Button onClick={handlePublish} className="rounded-xl gap-1 bg-accent hover:bg-accent/90"><Send className="h-3.5 w-3.5" /> {form.publishOption === 'draft' ? 'Save Draft' : form.publishOption === 'schedule' ? 'Schedule' : 'Publish'}</Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
