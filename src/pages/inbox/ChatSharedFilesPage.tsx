/**
 * Domain 17 — Shared files index. Aggregates attachments across the viewer's
 * active threads via /api/v1/inbox/threads/:id/files. UI preserved 1:1.
 */
import React from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Image, Video, File, Download, Eye, Search, SlidersHorizontal, Clock } from 'lucide-react';
import { DataState, deriveStatus } from '@/components/state/DataState';
import { sdk, sdkReady } from '@/lib/gigvora-sdk';

type FileRow = { id: string; name: string; type: string; size: string; sender: string; date: string; thread: string };

const FALLBACK: FileRow[] = [
  { id: 'f1', name: 'Homepage_Wireframes_v2.fig', type: 'Design', size: '4.2 MB', sender: 'Sarah C.', date: 'Apr 14', thread: 'Sarah Chen' },
  { id: 'f2', name: 'Brand_Guidelines.pdf', type: 'PDF', size: '1.8 MB', sender: 'Sarah C.', date: 'Apr 12', thread: 'Sarah Chen' },
  { id: 'f3', name: 'Project_SOW_Final.docx', type: 'Document', size: '320 KB', sender: 'James W.', date: 'Apr 10', thread: 'James Wilson' },
  { id: 'f4', name: 'hero_mockup.png', type: 'Image', size: '2.1 MB', sender: 'Sarah C.', date: 'Apr 9', thread: 'Sarah Chen' },
];

const typeIcons: Record<string, React.ReactNode> = {
  Design: <FileText className="h-4 w-4 text-accent" />,
  PDF: <FileText className="h-4 w-4 text-[hsl(var(--state-critical))]" />,
  Document: <FileText className="h-4 w-4 text-[hsl(var(--gigvora-blue))]" />,
  Image: <Image className="h-4 w-4 text-[hsl(var(--gigvora-amber))]" />,
  Video: <Video className="h-4 w-4 text-[hsl(var(--state-healthy))]" />,
};

function classifyMime(mime: string): string {
  if (mime.startsWith('image/')) return 'Image';
  if (mime.startsWith('video/')) return 'Video';
  if (mime.includes('pdf')) return 'PDF';
  if (mime.includes('figma')) return 'Design';
  return 'Document';
}
function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

export default function ChatSharedFilesPage() {
  const live = sdkReady();
  const threadsQ = useQuery({
    queryKey: ['inbox', 'threads', 'for-files'],
    queryFn: () => sdk.inbox.listThreads({ pageSize: 25 }),
    enabled: live,
    staleTime: 60_000,
  });

  const filesQs = useQueries({
    queries: (threadsQ.data?.items ?? []).slice(0, 10).map(t => ({
      queryKey: ['inbox', 'shared-files', t.id],
      queryFn: () => sdk.inbox.sharedFiles(t.id),
      enabled: live,
      staleTime: 60_000,
    })),
  });

  const fallback = !live || threadsQ.isError;
  const liveFiles: FileRow[] = (threadsQ.data?.items ?? []).slice(0, 10).flatMap((t, idx) => {
    const data = filesQs[idx]?.data ?? [];
    return data.map(a => ({
      id: a.id,
      name: a.name,
      type: classifyMime(a.mime),
      size: fmtSize(a.size),
      sender: a.byUserId,
      date: new Date(a.sharedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      thread: t.title ?? t.id,
    }));
  });
  const files = fallback ? FALLBACK : liveFiles;

  const status = deriveStatus({
    isLoading: live && (threadsQ.isLoading || filesQs.some(q => q.isLoading)),
    isError: false,
    isEmpty: files.length === 0,
  });

  const totalBytes = files.reduce((acc, f) => {
    const m = f.size.match(/([\d.]+)\s*(B|KB|MB)/);
    if (!m) return acc;
    const v = Number(m[1]); const u = m[2];
    return acc + (u === 'MB' ? v * 1_048_576 : u === 'KB' ? v * 1024 : v);
  }, 0);

  return (
    <DashboardLayout topStrip={<><File className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Shared Files</span><div className="flex-1" /><Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><SlidersHorizontal className="h-3 w-3" />Filter</Button></>}>
      <div className="flex gap-2 mb-3"><div className="relative flex-1"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Search shared files..." className="pl-8 h-8 text-xs rounded-xl" /></div></div>
      <div className="flex flex-wrap gap-1 mb-3">{['All', 'Documents', 'Images', 'Videos', 'Design'].map(f => <Button key={f} variant="outline" size="sm" className="h-6 text-[8px] rounded-lg">{f}</Button>)}</div>
      <KPIBand className="mb-3">
        <KPICard label="Total Files" value={String(files.length)} className="!rounded-2xl" />
        <KPICard label="Documents" value={String(files.filter(f => f.type === 'Document' || f.type === 'PDF').length)} className="!rounded-2xl" />
        <KPICard label="Images" value={String(files.filter(f => f.type === 'Image').length)} className="!rounded-2xl" />
        <KPICard label="Total Size" value={fmtSize(totalBytes)} className="!rounded-2xl" />
      </KPIBand>
      <DataState status={status} empty={<div className="py-12 text-center text-xs text-muted-foreground">No shared files yet — attach a file in any thread to populate this index.</div>}>
        <div className="space-y-2">
          {files.map((f) => (
            <SectionCard key={f.id} className="!rounded-2xl" data-testid={`shared-file-${f.id}`}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted/30 flex items-center justify-center shrink-0">{typeIcons[f.type] || <File className="h-4 w-4 text-muted-foreground" />}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5"><span className="text-[10px] font-bold truncate">{f.name}</span><Badge variant="outline" className="text-[7px] rounded-md">{f.type}</Badge></div>
                  <div className="flex items-center gap-2 text-[8px] text-muted-foreground"><span>{f.size}</span><span>from {f.sender}</span><span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{f.date}</span><span>in "{f.thread}"</span></div>
                </div>
                <div className="flex gap-1 shrink-0"><Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg"><Eye className="h-2.5 w-2.5" /></Button><Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg"><Download className="h-2.5 w-2.5" /></Button></div>
              </div>
            </SectionCard>
          ))}
        </div>
      </DataState>
    </DashboardLayout>
  );
}
