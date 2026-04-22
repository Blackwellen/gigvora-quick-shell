import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Upload, FileText, Image, Paperclip, Trash2, ChevronRight, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';

const EXISTING = [
  { name: 'contract_agreement.pdf', type: 'PDF', size: '2.4 MB', uploaded: 'Apr 10, 2026', category: 'Contract' },
  { name: 'chat_screenshot_01.png', type: 'Image', size: '480 KB', uploaded: 'Apr 11, 2026', category: 'Communication' },
  { name: 'deliverable_v1.zip', type: 'Archive', size: '12 MB', uploaded: 'Apr 11, 2026', category: 'Deliverable' },
];

const CATEGORIES = ['Communication', 'Contract', 'Deliverable', 'Payment', 'Screenshot', 'Other'];

export default function EvidenceUploadPage() {
  const [tab, setTab] = useState<'upload' | 'manage'>('upload');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-2 w-full">
          <Upload className="h-4 w-4 text-accent" />
          <span className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground">Dispute DSP-1001</span>
          <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />
          <span className="text-xs font-semibold">Evidence Upload</span>
          <div className="flex-1" />
          <div className="flex gap-1 bg-muted/40 rounded-xl p-0.5">
            {(['upload', 'manage'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-2.5 py-1 rounded-lg text-[8px] font-medium capitalize ${tab === t ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>{t}</button>
            ))}
          </div>
        </div>
      }
      rightRail={
        <div className="space-y-3">
          <SectionCard title="Guidelines">
            <div className="space-y-2 text-[8px] text-muted-foreground">
              <div className="flex gap-1.5"><CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))] shrink-0 mt-0.5" /><span>Screenshots of conversations</span></div>
              <div className="flex gap-1.5"><CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))] shrink-0 mt-0.5" /><span>Contract or agreement copies</span></div>
              <div className="flex gap-1.5"><CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))] shrink-0 mt-0.5" /><span>Delivered work files</span></div>
              <div className="flex gap-1.5"><CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))] shrink-0 mt-0.5" /><span>Payment receipts</span></div>
              <div className="flex gap-1.5"><AlertCircle className="h-3 w-3 text-[hsl(var(--state-critical))] shrink-0 mt-0.5" /><span>No personal info of third parties</span></div>
            </div>
          </SectionCard>
          <SectionCard title="Limits">
            <div className="space-y-1 text-[8px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Max files</span><span>20</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Max size each</span><span>25 MB</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Formats</span><span>PNG, JPG, PDF, ZIP, DOC</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Uploaded</span><span className="font-medium">{EXISTING.length}/20</span></div>
            </div>
          </SectionCard>
        </div>
      }
      rightRailWidth="w-44"
    >
      {tab === 'upload' && (
        <div className="space-y-3">
          <SectionCard className="!rounded-2xl">
            <div className="border-2 border-dashed border-border/40 rounded-xl p-8 text-center cursor-pointer hover:border-accent/30 transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-[10px] font-semibold mb-0.5">Drag and drop files here</p>
              <p className="text-[8px] text-muted-foreground mb-2">or click to browse your computer</p>
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />Browse Files</Button>
            </div>
          </SectionCard>
          <SectionCard title="Add Details" className="!rounded-2xl">
            <div className="space-y-2.5">
              <div><label className="text-[9px] font-medium mb-1 block">Category</label>
                <div className="flex flex-wrap gap-1">{CATEGORIES.map(c => <Badge key={c} variant="outline" className="text-[8px] rounded-lg cursor-pointer hover:bg-accent/10 hover:text-accent">{c}</Badge>)}</div>
              </div>
              <div><label className="text-[9px] font-medium mb-1 block">Description</label><Textarea placeholder="Explain what this evidence shows and why it's relevant..." className="min-h-[60px] text-xs" /></div>
              <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Upload className="h-3 w-3" />Upload & Submit</Button>
            </div>
          </SectionCard>
        </div>
      )}

      {tab === 'manage' && (
        <SectionCard title={`Uploaded Evidence (${EXISTING.length})`} className="!rounded-2xl">
          <div className="space-y-2">
            {EXISTING.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border border-border/30 hover:border-accent/20 transition-all">
                <div className="h-8 w-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
                  {f.type === 'Image' ? <Image className="h-4 w-4 text-muted-foreground/50" /> : <FileText className="h-4 w-4 text-muted-foreground/50" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5"><span className="text-[10px] font-semibold truncate">{f.name}</span><Badge variant="outline" className="text-[7px] rounded-md">{f.category}</Badge></div>
                  <div className="flex items-center gap-2 text-[8px] text-muted-foreground"><span>{f.type} · {f.size}</span><span>{f.uploaded}</span></div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg"><Paperclip className="h-2.5 w-2.5" /></Button>
                  <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg text-[hsl(var(--state-critical))]"><Trash2 className="h-2.5 w-2.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </DashboardLayout>
  );
}
