import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NetworkShell } from '@/components/shell/NetworkShell';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Radio, Users, Clock, Globe, Lock, Shield, ChevronRight,
  ChevronLeft, Mic, Calendar, Settings, Eye, Sparkles,
  Crown, Tag, Image, CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 'basics' | 'format' | 'participants' | 'schedule' | 'moderation' | 'review';
const STEPS: { key: Step; label: string }[] = [
  { key: 'basics', label: 'Basics' },
  { key: 'format', label: 'Format' },
  { key: 'participants', label: 'Participants' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'moderation', label: 'Moderation' },
  { key: 'review', label: 'Review' },
];

const FORMATS = [
  { id: 'discussion', label: 'Discussion', desc: 'Open group conversation', icon: '💬' },
  { id: 'panel', label: 'Panel', desc: 'Moderated panel with speakers', icon: '🎤' },
  { id: 'fireside', label: 'Fireside Chat', desc: 'Intimate conversation format', icon: '🔥' },
  { id: 'workshop', label: 'Workshop', desc: 'Hands-on collaborative session', icon: '🛠️' },
  { id: 'ama', label: 'AMA', desc: 'Ask Me Anything session', icon: '❓' },
  { id: 'speed', label: 'Speed Rounds', desc: 'Timed 1:1 introductions', icon: '⚡' },
];

const ACCESS_OPTIONS = [
  { id: 'public', label: 'Public', desc: 'Anyone can join', icon: Globe },
  { id: 'invite', label: 'Invite Only', desc: 'Requires invitation or approval', icon: Lock },
  { id: 'enterprise', label: 'Enterprise', desc: 'Organization members only', icon: Shield },
];

export default function RoomCreationWizardPage() {
  const [step, setStep] = useState<Step>('basics');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [format, setFormat] = useState('');
  const [access, setAccess] = useState('public');
  const [maxParticipants, setMaxParticipants] = useState('30');
  const [roundDuration, setRoundDuration] = useState('5');
  const [requireApproval, setRequireApproval] = useState(false);
  const [autoRecord, setAutoRecord] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const navigate = useNavigate();

  const stepIdx = STEPS.findIndex(s => s.key === step);
  const progress = ((stepIdx + 1) / STEPS.length) * 100;

  const next = () => { if (stepIdx < STEPS.length - 1) setStep(STEPS[stepIdx + 1].key); };
  const prev = () => { if (stepIdx > 0) setStep(STEPS[stepIdx - 1].key); };

  return (
    <NetworkShell backLabel="Create Room" backRoute="/networking/rooms">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Radio className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold">Create Networking Room</h1>
        </div>
        <Progress value={progress} className="h-1.5 mb-2" />
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <button key={s.key} onClick={() => setStep(s.key)}
              className={cn('text-[9px] font-medium px-2 py-0.5 rounded-lg transition-colors',
                step === s.key ? 'bg-accent/10 text-accent' : i < stepIdx ? 'text-accent/60' : 'text-muted-foreground'
              )}>
              {i + 1}. {s.label}
            </button>
          ))}
        </div>
      </div>

      {step === 'basics' && (
        <SectionCard title="Room Details" icon={<Settings className="h-3.5 w-3.5 text-accent" />}>
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Room Title *</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., AI in Product Management" className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Description</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what this room is about..." className="text-xs min-h-[80px]" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Topic / Category</label>
              <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., Technology, Design, Startups" className="h-9 text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Tags</label>
              <div className="flex flex-wrap gap-1 mb-2">
                {tags.map(t => (
                  <Badge key={t} variant="secondary" className="text-[8px] h-4 gap-0.5 cursor-pointer" onClick={() => setTags(tags.filter(x => x !== t))}>{t} ×</Badge>
                ))}
              </div>
              <Input placeholder="Add tag and press Enter" className="h-8 text-xs" onKeyDown={e => {
                if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                  setTags([...tags, (e.target as HTMLInputElement).value]);
                  (e.target as HTMLInputElement).value = '';
                }
              }} />
            </div>
          </div>
        </SectionCard>
      )}

      {step === 'format' && (
        <SectionCard title="Room Format" icon={<Mic className="h-3.5 w-3.5 text-accent" />}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl">
            {FORMATS.map(f => (
              <button key={f.id} onClick={() => setFormat(f.id)}
                className={cn('text-left p-4 rounded-xl border transition-all',
                  format === f.id ? 'border-accent bg-accent/5 shadow-sm' : 'hover:border-accent/50 hover:bg-muted/30'
                )}>
                <div className="text-xl mb-2">{f.icon}</div>
                <div className="text-xs font-semibold">{f.label}</div>
                <div className="text-[9px] text-muted-foreground mt-0.5">{f.desc}</div>
              </button>
            ))}
          </div>
          {format === 'speed' && (
            <div className="mt-4 max-w-xs">
              <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Round Duration (minutes)</label>
              <Input type="number" value={roundDuration} onChange={e => setRoundDuration(e.target.value)} className="h-8 text-xs" min="1" max="15" />
            </div>
          )}
        </SectionCard>
      )}

      {step === 'participants' && (
        <SectionCard title="Participant Settings" icon={<Users className="h-3.5 w-3.5 text-accent" />}>
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Access Type</label>
              <div className="grid grid-cols-3 gap-2">
                {ACCESS_OPTIONS.map(a => (
                  <button key={a.id} onClick={() => setAccess(a.id)}
                    className={cn('text-left p-3 rounded-xl border transition-all',
                      access === a.id ? 'border-accent bg-accent/5' : 'hover:border-accent/50'
                    )}>
                    <a.icon className={cn('h-4 w-4 mb-1', access === a.id ? 'text-accent' : 'text-muted-foreground')} />
                    <div className="text-[10px] font-semibold">{a.label}</div>
                    <div className="text-[8px] text-muted-foreground">{a.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Max Participants</label>
              <Input type="number" value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} className="h-8 text-xs" min="2" max="500" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={requireApproval} onChange={e => setRequireApproval(e.target.checked)} className="rounded" />
              <span className="text-xs">Require approval to join</span>
            </label>
          </div>
        </SectionCard>
      )}

      {step === 'schedule' && (
        <SectionCard title="Schedule" icon={<Calendar className="h-3.5 w-3.5 text-accent" />}>
          <div className="space-y-4 max-w-xl">
            <div className="grid grid-cols-2 gap-3">
              <button className={cn('p-4 rounded-xl border text-left transition-all border-accent bg-accent/5')}>
                <Radio className="h-4 w-4 text-accent mb-1" />
                <div className="text-xs font-semibold">Start Now</div>
                <div className="text-[9px] text-muted-foreground">Go live immediately</div>
              </button>
              <button className="p-4 rounded-xl border text-left hover:border-accent/50 transition-all">
                <Calendar className="h-4 w-4 text-muted-foreground mb-1" />
                <div className="text-xs font-semibold">Schedule</div>
                <div className="text-[9px] text-muted-foreground">Pick a date and time</div>
              </button>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Expected Duration</label>
              <div className="flex gap-2">
                {['30 min', '1 hour', '1.5 hours', '2 hours', 'Open-ended'].map(d => (
                  <Badge key={d} variant="outline" className="text-[9px] h-5 cursor-pointer hover:bg-accent/10">{d}</Badge>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {step === 'moderation' && (
        <SectionCard title="Moderation & Rules" icon={<Shield className="h-3.5 w-3.5 text-accent" />}>
          <div className="space-y-3 max-w-xl">
            {[
              { label: 'Auto-record session', desc: 'Record for participants who miss it', checked: autoRecord, onChange: () => setAutoRecord(!autoRecord) },
              { label: 'Mute participants on join', desc: 'Participants join muted by default', checked: true, onChange: () => {} },
              { label: 'Allow hand raise', desc: 'Participants can request to speak', checked: true, onChange: () => {} },
              { label: 'Enable chat', desc: 'Allow text chat during session', checked: true, onChange: () => {} },
              { label: 'Allow screen sharing', desc: 'Speakers can share their screen', checked: true, onChange: () => {} },
              { label: 'Profanity filter', desc: 'Auto-filter inappropriate language in chat', checked: false, onChange: () => {} },
            ].map(opt => (
              <label key={opt.label} className="flex items-start gap-3 p-2.5 rounded-xl border border-border/30 hover:bg-muted/30 cursor-pointer transition-colors">
                <input type="checkbox" checked={opt.checked} onChange={opt.onChange} className="rounded mt-0.5" />
                <div>
                  <div className="text-xs font-medium">{opt.label}</div>
                  <div className="text-[9px] text-muted-foreground">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </SectionCard>
      )}

      {step === 'review' && (
        <SectionCard title="Review & Create" icon={<Eye className="h-3.5 w-3.5 text-accent" />}>
          <div className="space-y-3 max-w-xl">
            {[
              { label: 'Title', value: title || '—' },
              { label: 'Format', value: format || '—' },
              { label: 'Access', value: access },
              { label: 'Max Participants', value: maxParticipants },
              { label: 'Topic', value: topic || '—' },
              { label: 'Tags', value: tags.length > 0 ? tags.join(', ') : '—' },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <span className="text-[10px] text-muted-foreground">{r.label}</span>
                <span className="text-[10px] font-semibold capitalize">{r.value}</span>
              </div>
            ))}
            <p className="text-[9px] text-muted-foreground">{description || 'No description provided.'}</p>
          </div>
        </SectionCard>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-2 mt-6 pt-4 border-t border-border/30">
        {stepIdx > 0 && (
          <Button variant="outline" size="sm" onClick={prev} className="h-8 text-xs rounded-xl gap-1"><ChevronLeft className="h-3 w-3" /> Back</Button>
        )}
        <div className="flex-1" />
        {stepIdx < STEPS.length - 1 ? (
          <Button size="sm" onClick={next} className="h-8 text-xs rounded-xl gap-1">Next <ChevronRight className="h-3 w-3" /></Button>
        ) : (
          <Button size="sm" className="h-8 text-xs rounded-xl gap-1" onClick={() => navigate('/networking/rooms')}>
            <CheckCircle2 className="h-3 w-3" /> Create Room
          </Button>
        )}
      </div>
    </NetworkShell>
  );
}
