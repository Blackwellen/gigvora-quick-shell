import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Plus, Trash2, GripVertical } from 'lucide-react';

const REQUIREMENTS = [
  { question: 'What is your brand name?', type: 'text', required: true },
  { question: 'Do you have existing brand colors?', type: 'multiple-choice', required: false },
  { question: 'Please upload any reference images or inspiration', type: 'file', required: false },
  { question: 'Describe the style you are looking for', type: 'textarea', required: true },
];

export default function GigRequirementsBuilderPage() {
  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-3 w-full">
          <ClipboardList className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold">Requirements Builder</h1>
          <Badge variant="secondary" className="text-[9px]">{REQUIREMENTS.length} questions</Badge>
          <div className="flex-1" />
          <Button size="sm" className="h-7 text-[10px]">Save</Button>
        </div>
      }
    >
      <SectionCard title="Order Requirements" subtitle="Questions buyers must answer when placing an order" action={<Button size="sm" className="h-7 text-[10px] gap-1"><Plus className="h-3 w-3" /> Add Question</Button>}>
        {REQUIREMENTS.map((r, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-border/40 mb-2">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0 mt-1" />
            <div className="flex-1 space-y-2">
              <Input defaultValue={r.question} placeholder="Question..." className="h-8 text-xs" />
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[8px] h-4">{r.type}</Badge>
                <label className="flex items-center gap-1 text-[9px] cursor-pointer">
                  <input type="checkbox" defaultChecked={r.required} className="accent-accent" /> Required
                </label>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Trash2 className="h-3 w-3 text-muted-foreground" /></Button>
          </div>
        ))}
      </SectionCard>

      <SectionCard title="Auto-Responses" className="mt-4">
        <div className="space-y-3">
          <div><label className="text-[10px] font-medium block mb-1">Order confirmation message</label><Textarea defaultValue="Thank you for your order! I'll review your requirements and get started within 24 hours." className="min-h-[60px] text-xs" /></div>
          <div><label className="text-[10px] font-medium block mb-1">Incomplete requirements reminder</label><Textarea defaultValue="Please complete all required questions so I can begin your order." className="min-h-[60px] text-xs" /></div>
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
