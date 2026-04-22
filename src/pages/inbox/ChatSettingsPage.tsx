import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Button } from '@/components/ui/button';
import { Settings, Bell, BellOff, Shield, Eye, EyeOff, Globe, Lock, Trash2, Archive, MessageSquare, Users, Volume2, VolumeX } from 'lucide-react';

const SECTIONS = [
  {
    title: 'Notifications',
    items: [
      { label: 'Desktop Notifications', description: 'Show browser notifications for new messages', icon: <Bell className="h-3.5 w-3.5" />, enabled: true },
      { label: 'Sound Alerts', description: 'Play a sound for incoming messages', icon: <Volume2 className="h-3.5 w-3.5" />, enabled: true },
      { label: 'Email Notifications', description: 'Receive email for unread messages after 15 minutes', icon: <MessageSquare className="h-3.5 w-3.5" />, enabled: false },
      { label: 'Mention Alerts', description: 'Always notify when you are @mentioned', icon: <Bell className="h-3.5 w-3.5" />, enabled: true },
    ],
  },
  {
    title: 'Privacy',
    items: [
      { label: 'Read Receipts', description: 'Let others see when you have read their messages', icon: <Eye className="h-3.5 w-3.5" />, enabled: true },
      { label: 'Online Status', description: 'Show your online/offline status to contacts', icon: <Globe className="h-3.5 w-3.5" />, enabled: true },
      { label: 'Typing Indicators', description: 'Show when you are typing a message', icon: <MessageSquare className="h-3.5 w-3.5" />, enabled: true },
    ],
  },
  {
    title: 'Chat Management',
    items: [
      { label: 'Auto-Archive', description: 'Automatically archive threads with no activity for 30 days', icon: <Archive className="h-3.5 w-3.5" />, enabled: false },
      { label: 'Message Retention', description: 'Keep all messages forever', icon: <Shield className="h-3.5 w-3.5" />, enabled: true },
      { label: 'Block List', description: 'Manage blocked contacts (2 blocked)', icon: <Lock className="h-3.5 w-3.5" />, enabled: true },
    ],
  },
];

export default function ChatSettingsPage() {
  return (
    <DashboardLayout topStrip={<><Settings className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Chat Settings</span><div className="flex-1" /></>}>
      <div className="space-y-3">
        {SECTIONS.map((section, si) => (
          <SectionCard key={si} title={section.title} className="!rounded-2xl">
            <div className="space-y-0">
              {section.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border/20 last:border-0">
                  <div className="h-8 w-8 rounded-xl bg-muted/30 flex items-center justify-center shrink-0 text-muted-foreground">{item.icon}</div>
                  <div className="flex-1">
                    <div className="text-[10px] font-semibold">{item.label}</div>
                    <div className="text-[8px] text-muted-foreground">{item.description}</div>
                  </div>
                  <button className={`relative w-9 h-5 rounded-full transition-colors ${item.enabled ? 'bg-accent' : 'bg-muted'}`}>
                    <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${item.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>
        ))}

        <SectionCard title="Danger Zone" className="!rounded-2xl border-[hsl(var(--state-critical)/0.2)]">
          <div className="flex items-center justify-between">
            <div><div className="text-[10px] font-semibold text-[hsl(var(--state-critical))]">Delete All Chat History</div><div className="text-[8px] text-muted-foreground">Permanently delete all messages and files. This cannot be undone.</div></div>
            <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl text-[hsl(var(--state-critical))] border-[hsl(var(--state-critical)/0.3)] gap-0.5"><Trash2 className="h-3 w-3" />Delete All</Button>
          </div>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}
