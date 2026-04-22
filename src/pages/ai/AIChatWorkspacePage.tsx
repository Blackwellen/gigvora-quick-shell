import React, { useState } from 'react';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  Bot, Send, Plus, Settings, Trash2, Share2, Bookmark, Copy, RotateCcw,
  Paperclip, Sparkles, StopCircle, ChevronDown, Pin, Archive, Download,
  MessageSquare, Clock, Zap, FileText, MoreHorizontal
} from 'lucide-react';

const CONVERSATIONS = [
  { id: '1', title: 'React architecture review', time: '2h ago', messages: 12, pinned: true },
  { id: '2', title: 'Marketing copy draft', time: '5h ago', messages: 8, pinned: false },
  { id: '3', title: 'Data analysis help', time: 'Yesterday', messages: 24, pinned: false },
  { id: '4', title: 'API integration planning', time: '2d ago', messages: 16, pinned: false },
  { id: '5', title: 'Product roadmap brainstorm', time: '3d ago', messages: 31, pinned: false },
];

const MESSAGES = [
  { role: 'user' as const, content: 'How should I structure a React app with 50+ routes?', time: '10:23 AM' },
  { role: 'assistant' as const, content: 'For a large-scale React application with 50+ routes, I recommend a **domain-driven folder structure** with these key principles:\n\n1. **Group by feature domain** — not by file type\n2. **Use lazy loading** for route-level code splitting\n3. **Create shared layout shells** for common UI patterns\n4. **Implement a route registry** for type-safe navigation\n\nWould you like me to generate a detailed folder structure?', time: '10:23 AM', tokens: 120 },
  { role: 'user' as const, content: 'Yes, please generate the folder structure with examples.', time: '10:25 AM' },
  { role: 'assistant' as const, content: 'Here\'s a production-ready folder structure for a 50+ route React application:\n\n```\nsrc/\n├── features/\n│   ├── dashboard/\n│   │   ├── routes/\n│   │   ├── components/\n│   │   ├── hooks/\n│   │   └── index.ts\n│   ├── settings/\n│   ├── billing/\n│   └── analytics/\n├── shared/\n│   ├── layouts/\n│   ├── components/\n│   └── hooks/\n├── routes/\n│   └── index.tsx  (route registry)\n└── app.tsx\n```\n\nEach feature module is self-contained with its own routes, components, and hooks. The route registry imports lazily from each feature.', time: '10:25 AM', tokens: 180 },
];

const PRESETS = [
  { label: 'Code Assistant', desc: 'Technical coding help' },
  { label: 'Content Writer', desc: 'Creative writing mode' },
  { label: 'Data Analyst', desc: 'Data interpretation' },
  { label: 'Brainstorm', desc: 'Ideation mode' },
];

const MODELS = ['GPT-5', 'Gemini 2.5 Pro', 'Claude 4', 'GPT-5 Mini'];

export default function AIChatWorkspacePage() {
  const [input, setInput] = useState('');
  const [selectedConvo, setSelectedConvo] = useState('1');
  const [showHistory, setShowHistory] = useState(false);
  const [model, setModel] = useState('GPT-5');
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <div className="flex gap-4 h-[calc(100vh-180px)]">
      {/* Conversation history panel */}
      <div className={cn('w-[240px] shrink-0 rounded-2xl border bg-card overflow-hidden flex flex-col', showHistory ? 'block' : 'hidden lg:flex')}>
        <div className="p-3 border-b flex items-center justify-between">
          <span className="text-[11px] font-bold">Conversations</span>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><Plus className="h-3.5 w-3.5" /></Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {CONVERSATIONS.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedConvo(c.id)}
              className={cn(
                'w-full text-left rounded-xl px-2.5 py-2 transition-all',
                selectedConvo === c.id ? 'bg-accent/10 shadow-sm' : 'hover:bg-muted/40'
              )}
            >
              <div className="flex items-center gap-1.5">
                {c.pinned && <Pin className="h-2.5 w-2.5 text-accent shrink-0" />}
                <span className={cn('text-[10px] font-medium truncate', selectedConvo === c.id && 'text-accent')}>{c.title}</span>
              </div>
              <div className="text-[8px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <Clock className="h-2 w-2" />{c.time}
                <span>·</span>
                <MessageSquare className="h-2 w-2" />{c.messages}
              </div>
            </button>
          ))}
        </div>
        <div className="p-2 border-t">
          <Button variant="ghost" size="sm" className="w-full h-7 text-[9px] rounded-xl gap-1 justify-start text-muted-foreground">
            <Archive className="h-3 w-3" />View archived
          </Button>
        </div>
      </div>

      {/* Main chat canvas */}
      <div className="flex-1 flex flex-col rounded-2xl border bg-card overflow-hidden min-w-0">
        {/* Chat top bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b bg-card">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="sm" className="lg:hidden h-7 w-7 p-0 rounded-lg" onClick={() => setShowHistory(!showHistory)}>
              <MessageSquare className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[12px] font-bold truncate">React architecture review</span>
            <Badge variant="outline" className="text-[7px] rounded-lg shrink-0">12 messages</Badge>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Model selector */}
            <div className="flex items-center gap-1 bg-muted/40 rounded-xl px-2 py-1 cursor-pointer hover:bg-muted/60 transition-colors">
              <Bot className="h-3 w-3 text-accent" />
              <span className="text-[9px] font-medium">{model}</span>
              <ChevronDown className="h-2.5 w-2.5 text-muted-foreground" />
            </div>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg"><Settings className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {MESSAGES.map((m, i) => (
            <div key={i} className={cn('flex gap-3', m.role === 'user' && 'justify-end')}>
              {m.role === 'assistant' && (
                <Avatar className="h-8 w-8 rounded-xl shrink-0 shadow-sm">
                  <AvatarFallback className="rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 text-accent text-[9px]">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={cn(
                'max-w-[80%] rounded-2xl p-3.5 text-[11px] leading-relaxed',
                m.role === 'user'
                  ? 'bg-accent text-accent-foreground rounded-br-md'
                  : 'bg-muted/40 rounded-bl-md'
              )}>
                <div className="whitespace-pre-wrap">{m.content}</div>
                {m.role === 'assistant' && (
                  <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-border/20">
                    <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5 px-1.5 rounded-lg"><Copy className="h-2.5 w-2.5" />Copy</Button>
                    <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5 px-1.5 rounded-lg"><Bookmark className="h-2.5 w-2.5" />Save</Button>
                    <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5 px-1.5 rounded-lg"><Share2 className="h-2.5 w-2.5" />Share</Button>
                    <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5 px-1.5 rounded-lg"><RotateCcw className="h-2.5 w-2.5" />Retry</Button>
                    <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5 px-1.5 rounded-lg"><FileText className="h-2.5 w-2.5" />→ Draft</Button>
                    <div className="flex-1" />
                    <span className="text-[7px] text-muted-foreground">{m.tokens} tokens · {m.time}</span>
                  </div>
                )}
                {m.role === 'user' && (
                  <div className="text-[7px] text-accent-foreground/50 mt-1 text-right">{m.time}</div>
                )}
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 rounded-xl shrink-0"><AvatarFallback className="rounded-xl bg-accent/10 text-accent"><Bot className="h-4 w-4 animate-pulse" /></AvatarFallback></Avatar>
              <div className="rounded-2xl rounded-bl-md bg-muted/40 p-4">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-accent/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 rounded-full bg-accent/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 rounded-full bg-accent/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Presets strip */}
        <div className="px-4 py-1.5 border-t border-border/20 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] text-muted-foreground/50 shrink-0">Presets:</span>
            {PRESETS.map(p => (
              <Badge key={p.label} variant="outline" className="text-[8px] rounded-lg cursor-pointer hover:bg-accent/10 transition-colors shrink-0 gap-0.5">
                <Sparkles className="h-2 w-2" />{p.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Composer */}
        <div className="px-4 py-3 border-t bg-card">
          <div className="flex items-end gap-2">
            <div className="flex-1 rounded-2xl border bg-muted/20 px-4 py-2.5 focus-within:ring-1 focus-within:ring-accent transition-all">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                rows={1}
                className="w-full bg-transparent text-[11px] resize-none focus:outline-none min-h-[24px] max-h-[120px]"
                placeholder="Ask anything... Use / for commands, @ for mentions"
                style={{ height: 'auto' }}
              />
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg text-muted-foreground"><Paperclip className="h-3.5 w-3.5" /></Button>
                  <span className="text-[7px] text-muted-foreground/40">~2 credits</span>
                </div>
                <span className="text-[7px] text-muted-foreground/40">{model} · BYOK</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              {isGenerating ? (
                <Button variant="destructive" className="h-10 w-10 p-0 rounded-xl" onClick={() => setIsGenerating(false)}>
                  <StopCircle className="h-4 w-4" />
                </Button>
              ) : (
                <Button className="h-10 w-10 p-0 rounded-xl" onClick={() => setIsGenerating(true)}>
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right rail — model & context */}
      <div className="hidden xl:flex flex-col w-[200px] shrink-0 space-y-3">
        <SectionCard title="Model Settings" className="!rounded-2xl">
          <div className="space-y-2">
            {[
              { label: 'Provider', value: 'OpenAI (BYOK)' },
              { label: 'Model', value: 'GPT-5' },
              { label: 'Temperature', value: '0.7' },
              { label: 'Max Tokens', value: '4,096' },
              { label: 'Top P', value: '1.0' },
            ].map(s => (
              <div key={s.label} className="flex justify-between text-[9px]">
                <span className="text-muted-foreground">{s.label}</span>
                <span className="font-medium">{s.value}</span>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl gap-1 mt-1">
              <Settings className="h-3 w-3" />Configure
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="System Prompt" className="!rounded-2xl">
          <p className="text-[8px] text-muted-foreground leading-relaxed mb-2">You are a helpful coding assistant focused on React, TypeScript, and modern web development...</p>
          <Button variant="outline" size="sm" className="w-full h-6 text-[8px] rounded-lg">Edit Prompt</Button>
        </SectionCard>

        <SectionCard title="Quick Prompts" className="!rounded-2xl">
          <div className="space-y-1">
            {['Explain this code', 'Find bugs', 'Write tests', 'Refactor', 'Add types'].map(p => (
              <button key={p} className="w-full text-left text-[9px] px-2 py-1.5 rounded-lg hover:bg-muted/40 transition-colors text-muted-foreground hover:text-foreground">{p}</button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Session" className="!rounded-2xl">
          <div className="space-y-1.5 text-[8px] text-muted-foreground">
            <div className="flex justify-between"><span>Total tokens</span><span className="font-medium text-foreground">640</span></div>
            <div className="flex justify-between"><span>Est. cost</span><span className="font-medium text-foreground">$0.12</span></div>
            <div className="flex justify-between"><span>Duration</span><span className="font-medium text-foreground">14 min</span></div>
          </div>
          <div className="flex gap-1 mt-2">
            <Button variant="outline" size="sm" className="flex-1 h-6 text-[8px] rounded-lg gap-0.5"><Download className="h-2.5 w-2.5" />Export</Button>
            <Button variant="outline" size="sm" className="flex-1 h-6 text-[8px] rounded-lg gap-0.5"><Bookmark className="h-2.5 w-2.5" />Save</Button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
