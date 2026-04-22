import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import {
  Search, FileText, Upload, Download, Plus, Edit, Eye, Trash2,
  Filter, Folder, Lock, Share2, Clock, CheckCircle2, XCircle,
  Sparkles, Loader2, Copy, ExternalLink, MoreHorizontal,
  File, FileImage, FileSpreadsheet, BookOpen, Award,
  Briefcase, Users, Star, Shield, Archive, Tag,
  Layers, Settings, BarChart3, Globe, Pen, Calendar,
  ArrowRight, Link as LinkIcon, History, AlertTriangle,
  GraduationCap, Building2, UserCheck, Zap, FolderOpen,
  FolderPlus, ChevronRight, Image, FileVideo, FileArchive,
  RefreshCw, X, Signature, ThumbsUp, ThumbsDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAI } from '@/hooks/useAI';
import { toast } from 'sonner';

// ── Types ──
type DocStatus = 'draft' | 'active' | 'approved' | 'pending-review' | 'rejected' | 'archived' | 'shared' | 'expired';
type AccessLevel = 'private' | 'internal' | 'shared' | 'public';

interface DocFile {
  id: string;
  name: string;
  folder: string;
  status: DocStatus;
  access: AccessLevel;
  type: string;
  size: string;
  version: number;
  updatedAt: string;
  updatedBy: string;
  tags: string[];
  linkedTo?: string;
  approver?: string;
  approvalNote?: string;
}

interface FolderItem {
  id: string;
  name: string;
  count: number;
  icon: React.ElementType;
}

// ── Mock Data ──
const FOLDERS: FolderItem[] = [
  { id: 'all', name: 'All Files', count: 14, icon: Layers },
  { id: 'contracts', name: 'Contracts', count: 3, icon: FileText },
  { id: 'deliverables', name: 'Deliverables', count: 4, icon: FolderOpen },
  { id: 'proposals', name: 'Proposals', count: 2, icon: Briefcase },
  { id: 'credentials', name: 'Credentials', count: 2, icon: Award },
  { id: 'media', name: 'Media Assets', count: 2, icon: Image },
  { id: 'archive', name: 'Archive', count: 1, icon: Archive },
];

const FILES: DocFile[] = [
  { id: 'f1', name: 'Master Service Agreement.pdf', folder: 'contracts', status: 'approved', access: 'shared', type: 'pdf', size: '245 KB', version: 3, updatedAt: 'Apr 7', updatedBy: 'Alex K.', tags: ['legal', 'signed'], linkedTo: 'Project — SaaS Platform', approver: 'Legal Team', approvalNote: 'Approved with standard terms' },
  { id: 'f2', name: 'NDA — TechCorp.pdf', folder: 'contracts', status: 'approved', access: 'private', type: 'pdf', size: '88 KB', version: 1, updatedAt: 'Apr 3', updatedBy: 'Elena R.', tags: ['legal', 'nda'], linkedTo: 'Client — TechCorp' },
  { id: 'f3', name: 'SOW Amendment v2.docx', folder: 'contracts', status: 'pending-review', access: 'internal', type: 'docx', size: '120 KB', version: 2, updatedAt: 'Apr 9', updatedBy: 'Alex K.', tags: ['legal'], approver: 'Client Signoff', approvalNote: 'Awaiting client review' },
  { id: 'f4', name: 'Dashboard Wireframes v2.fig', folder: 'deliverables', status: 'pending-review', access: 'shared', type: 'fig', size: '6.1 MB', version: 2, updatedAt: 'Apr 10', updatedBy: 'Sarah C.', tags: ['design', 'ux'], linkedTo: 'Milestone 2 — Core Features', approver: 'Alex K.' },
  { id: 'f5', name: 'Auth Module Spec.pdf', folder: 'deliverables', status: 'approved', access: 'shared', type: 'pdf', size: '1.8 MB', version: 1, updatedAt: 'Apr 8', updatedBy: 'Elena R.', tags: ['backend', 'spec'], linkedTo: 'Milestone 2 — Core Features', approver: 'Alex K.', approvalNote: 'Meets requirements' },
  { id: 'f6', name: 'API Documentation.md', folder: 'deliverables', status: 'active', access: 'shared', type: 'md', size: '245 KB', version: 4, updatedAt: 'Apr 5', updatedBy: 'Elena R.', tags: ['backend', 'docs'] },
  { id: 'f7', name: 'Test Plan.xlsx', folder: 'deliverables', status: 'draft', access: 'internal', type: 'xlsx', size: '320 KB', version: 1, updatedAt: 'Apr 11', updatedBy: 'Priya P.', tags: ['qa'] },
  { id: 'f8', name: 'Project Proposal — Enterprise.pdf', folder: 'proposals', status: 'approved', access: 'shared', type: 'pdf', size: '1.5 MB', version: 5, updatedAt: 'Mar 28', updatedBy: 'Alex K.', tags: ['proposal'], linkedTo: 'Client — Acme Corp', approver: 'Client', approvalNote: 'Accepted' },
  { id: 'f9', name: 'Budget Estimate Draft.xlsx', folder: 'proposals', status: 'draft', access: 'private', type: 'xlsx', size: '92 KB', version: 1, updatedAt: 'Apr 6', updatedBy: 'Alex K.', tags: ['finance'] },
  { id: 'f10', name: 'AWS Certificate.pdf', folder: 'credentials', status: 'approved', access: 'public', type: 'pdf', size: '180 KB', version: 1, updatedAt: 'Mar 15', updatedBy: 'Elena R.', tags: ['cert', 'aws'], approver: 'System', approvalNote: 'Verified via issuer' },
  { id: 'f11', name: 'Google Cloud Cert.pdf', folder: 'credentials', status: 'approved', access: 'public', type: 'pdf', size: '195 KB', version: 1, updatedAt: 'Feb 20', updatedBy: 'Elena R.', tags: ['cert', 'gcp'] },
  { id: 'f12', name: 'Brand Kit.zip', folder: 'media', status: 'active', access: 'shared', type: 'zip', size: '12.4 MB', version: 2, updatedAt: 'Apr 1', updatedBy: 'Sarah C.', tags: ['design', 'brand'] },
  { id: 'f13', name: 'Demo Recording.mp4', folder: 'media', status: 'active', access: 'internal', type: 'mp4', size: '48.2 MB', version: 1, updatedAt: 'Apr 4', updatedBy: 'Priya P.', tags: ['video', 'demo'] },
  { id: 'f14', name: 'Old Proposal — Deprecated.pdf', folder: 'archive', status: 'archived', access: 'private', type: 'pdf', size: '1.1 MB', version: 3, updatedAt: 'Jan 10', updatedBy: 'Alex K.', tags: ['legacy'] },
];

const APPROVAL_QUEUE = FILES.filter(f => f.status === 'pending-review');

const ACTIVITY = [
  { actor: 'Sarah C.', action: 'uploaded "Dashboard Wireframes v2.fig"', time: '1h ago', type: 'upload' },
  { actor: 'Alex K.', action: 'approved "Auth Module Spec.pdf"', time: '3h ago', type: 'approve' },
  { actor: 'Elena R.', action: 'updated "API Documentation.md" to v4', time: '5h ago', type: 'update' },
  { actor: 'System', action: '"SOW Amendment v2" sent for client review', time: '1d ago', type: 'review' },
  { actor: 'Priya P.', action: 'created "Test Plan.xlsx"', time: '2d ago', type: 'create' },
];

const STATUS_CONFIG: Record<DocStatus, { color: string; state: 'healthy' | 'live' | 'pending' | 'blocked' | 'caution' | 'degraded' | 'review' }> = {
  draft: { color: 'text-muted-foreground', state: 'pending' },
  active: { color: 'text-accent', state: 'live' },
  approved: { color: 'text-[hsl(var(--state-healthy))]', state: 'healthy' },
  'pending-review': { color: 'text-[hsl(var(--gigvora-amber))]', state: 'caution' },
  rejected: { color: 'text-destructive', state: 'blocked' },
  archived: { color: 'text-muted-foreground', state: 'degraded' },
  shared: { color: 'text-[hsl(var(--gigvora-purple))]', state: 'review' },
  expired: { color: 'text-destructive', state: 'blocked' },
};

const ACCESS_ICONS: Record<AccessLevel, { icon: React.ElementType; label: string }> = {
  private: { icon: Lock, label: 'Private' },
  internal: { icon: Users, label: 'Internal' },
  shared: { icon: Share2, label: 'Shared' },
  public: { icon: Globe, label: 'Public' },
};

const FILE_ICONS: Record<string, React.ElementType> = {
  pdf: FileText, docx: FileText, md: FileText, fig: Image,
  xlsx: FileSpreadsheet, zip: FileArchive, mp4: FileVideo,
};

// ── File Detail Drawer ──
const FileDetailDrawer: React.FC<{ file: DocFile | null; open: boolean; onClose: () => void }> = ({ file, open, onClose }) => {
  if (!file) return null;
  const sc = STATUS_CONFIG[file.status];
  const acc = ACCESS_ICONS[file.access];
  const Icon = FILE_ICONS[file.type] || File;
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[480px] overflow-y-auto">
        <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><Icon className="h-4 w-4 text-accent" />{file.name}</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Status', value: <StatusBadge status={sc.state} label={file.status.replace('-', ' ')} /> },
              { label: 'Access', value: <span className="flex items-center gap-1 text-[9px]"><acc.icon className="h-3 w-3" />{acc.label}</span> },
              { label: 'Version', value: `v${file.version}` },
              { label: 'Size', value: file.size },
              { label: 'Updated', value: `${file.updatedAt} by ${file.updatedBy}` },
              { label: 'Folder', value: file.folder },
            ].map(m => (
              <div key={m.label} className="rounded-md border p-2">
                <div className="text-[7px] text-muted-foreground mb-0.5">{m.label}</div>
                <div className="text-[9px] font-medium">{m.value}</div>
              </div>
            ))}
          </div>

          {file.linkedTo && (
            <div className="rounded-md border p-2">
              <div className="text-[7px] text-muted-foreground mb-0.5">Linked To</div>
              <div className="text-[9px] font-medium text-accent flex items-center gap-1"><LinkIcon className="h-2.5 w-2.5" />{file.linkedTo}</div>
            </div>
          )}

          {/* Tags */}
          <div>
            <div className="text-[10px] font-semibold mb-1">Tags</div>
            <div className="flex flex-wrap gap-1">
              {file.tags.map(t => <Badge key={t} variant="secondary" className="text-[8px]">{t}</Badge>)}
              <Button variant="ghost" size="sm" className="h-5 text-[8px] px-1.5"><Plus className="h-2.5 w-2.5" /></Button>
            </div>
          </div>

          {/* Approval */}
          {(file.status === 'approved' || file.status === 'pending-review' || file.status === 'rejected') && (
            <div className="border-t pt-3">
              <div className="text-[10px] font-semibold mb-2 flex items-center gap-1"><Shield className="h-3 w-3 text-accent" />Approval</div>
              {file.approver && <div className="text-[9px] mb-1"><span className="text-muted-foreground">Approver:</span> {file.approver}</div>}
              {file.approvalNote && <p className="text-[8px] text-muted-foreground bg-muted/30 rounded-md p-2">{file.approvalNote}</p>}
              {file.status === 'pending-review' && (
                <div className="flex gap-1.5 mt-2">
                  <Button size="sm" className="h-6 text-[9px] gap-1" onClick={() => toast.success('Approved')}><ThumbsUp className="h-2.5 w-2.5" />Approve</Button>
                  <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 text-destructive" onClick={() => toast.error('Rejected')}><ThumbsDown className="h-2.5 w-2.5" />Reject</Button>
                  <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><Edit className="h-2.5 w-2.5" />Request Changes</Button>
                </div>
              )}
            </div>
          )}

          {/* Preview placeholder */}
          <div className="border-t pt-3">
            <div className="text-[10px] font-semibold mb-2">Preview</div>
            <div className="rounded-lg border bg-muted/30 h-40 flex items-center justify-center text-[9px] text-muted-foreground">
              <div className="text-center">
                <Icon className="h-8 w-8 mx-auto mb-1 text-muted-foreground/30" />
                <span>{file.type.toUpperCase()} preview</span>
              </div>
            </div>
          </div>

          {/* Version History */}
          <div className="border-t pt-3">
            <div className="text-[10px] font-semibold mb-2 flex items-center gap-1"><History className="h-3 w-3 text-accent" />Versions</div>
            <div className="space-y-1">
              {Array.from({ length: Math.min(file.version, 3) }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-1.5 rounded-md hover:bg-muted/30 text-[8px]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">v{file.version - i}</span>
                    <span className="text-muted-foreground">{i === 0 ? 'Current' : i === 1 ? '2 days ago' : '1 week ago'}</span>
                  </div>
                  {i > 0 && <Button variant="ghost" size="sm" className="h-4 text-[7px]">Restore</Button>}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-1.5 border-t pt-3">
            <Button size="sm" className="h-6 text-[9px] gap-1"><Eye className="h-2.5 w-2.5" />Preview</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><Download className="h-2.5 w-2.5" />Download</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><Share2 className="h-2.5 w-2.5" />Share</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><Copy className="h-2.5 w-2.5" />Duplicate</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><Archive className="h-2.5 w-2.5" />Archive</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 text-destructive"><Trash2 className="h-2.5 w-2.5" />Delete</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ── Upload Drawer ──
const UploadDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => (
  <Sheet open={open} onOpenChange={onClose}>
    <SheetContent className="w-[440px] overflow-y-auto">
      <SheetHeader><SheetTitle className="text-sm">Upload File</SheetTitle></SheetHeader>
      <div className="mt-4 space-y-3">
        <div className="rounded-lg border-2 border-dashed p-8 text-center cursor-pointer hover:border-accent/50 transition-colors">
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <div className="text-[10px] font-medium mb-1">Drop files here or click to browse</div>
          <div className="text-[8px] text-muted-foreground">PDF, DOCX, XLSX, FIG, ZIP, MP4 · Max 50 MB</div>
        </div>
        <div>
          <label className="text-[9px] font-medium mb-1 block">Folder</label>
          <select className="w-full h-7 rounded-md border bg-background px-2 text-[9px]">
            {FOLDERS.filter(f => f.id !== 'all').map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[9px] font-medium mb-1 block">Access Level</label>
          <select className="w-full h-7 rounded-md border bg-background px-2 text-[9px]">
            <option value="private">Private</option>
            <option value="internal">Internal Only</option>
            <option value="shared">Shared</option>
            <option value="public">Public</option>
          </select>
        </div>
        <div>
          <label className="text-[9px] font-medium mb-1 block">Tags</label>
          <input className="w-full h-7 rounded-md border bg-background px-2 text-[9px]" placeholder="e.g. legal, design, spec" />
        </div>
        <div>
          <label className="text-[9px] font-medium mb-1 block">Link to Project / Contract (optional)</label>
          <input className="w-full h-7 rounded-md border bg-background px-2 text-[9px]" placeholder="Search..." />
        </div>
        <div className="flex items-center gap-2 text-[9px]">
          <input type="checkbox" className="rounded" />
          <span>Request approval after upload</span>
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="h-7 text-[10px] flex-1 gap-1" onClick={() => { onClose(); toast.success('File uploaded'); }}><Upload className="h-3 w-3" />Upload</Button>
        </div>
      </div>
    </SheetContent>
  </Sheet>
);

// ── File Table ──
const FileTable: React.FC<{ files: DocFile[]; selectedId: string | null; onSelect: (f: DocFile) => void }> = ({ files, selectedId, onSelect }) => (
  <div className="rounded-lg border overflow-hidden">
    <table className="w-full">
      <thead className="bg-muted/50">
        <tr className="text-[9px] text-muted-foreground font-medium">
          <th className="text-left px-3 py-2">Name</th>
          <th className="text-left px-3 py-2">Status</th>
          <th className="text-left px-3 py-2">Access</th>
          <th className="text-left px-3 py-2">Size</th>
          <th className="text-left px-3 py-2">Updated</th>
          <th className="text-left px-3 py-2">Version</th>
          <th className="text-left px-3 py-2 w-24">Actions</th>
        </tr>
      </thead>
      <tbody>
        {files.map(f => {
          const Icon = FILE_ICONS[f.type] || File;
          const sc = STATUS_CONFIG[f.status];
          const acc = ACCESS_ICONS[f.access];
          return (
            <tr key={f.id} onClick={() => onSelect(f)} className={cn('border-t hover:bg-muted/30 transition-colors cursor-pointer text-[9px]', selectedId === f.id && 'bg-accent/5')}>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{f.name}</div>
                    <div className="flex gap-1 mt-0.5">
                      {f.tags.slice(0, 2).map(t => <Badge key={t} variant="secondary" className="text-[6px] px-1 h-3">{t}</Badge>)}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-3 py-2"><StatusBadge status={sc.state} label={f.status.replace('-', ' ')} /></td>
              <td className="px-3 py-2"><span className="flex items-center gap-1"><acc.icon className="h-2.5 w-2.5" />{acc.label}</span></td>
              <td className="px-3 py-2 text-muted-foreground">{f.size}</td>
              <td className="px-3 py-2 text-muted-foreground">{f.updatedAt}</td>
              <td className="px-3 py-2 text-muted-foreground">v{f.version}</td>
              <td className="px-3 py-2">
                <div className="flex gap-0.5" onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-5 w-5"><Eye className="h-2.5 w-2.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-5 w-5"><Download className="h-2.5 w-2.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-5 w-5"><MoreHorizontal className="h-2.5 w-2.5" /></Button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

// ── Approvals Tab ──
const ApprovalsTab: React.FC<{ onSelect: (f: DocFile) => void }> = ({ onSelect }) => (
  <div className="space-y-3">
    {APPROVAL_QUEUE.length === 0 && <div className="text-center py-8 text-[10px] text-muted-foreground">No pending approvals</div>}
    {APPROVAL_QUEUE.map(f => {
      const Icon = FILE_ICONS[f.type] || File;
      return (
        <div key={f.id} className="rounded-lg border bg-card p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-[hsl(var(--gigvora-amber))]" />
              <div>
                <div className="text-[10px] font-semibold">{f.name}</div>
                <div className="text-[8px] text-muted-foreground">Uploaded by {f.updatedBy} · {f.updatedAt} · v{f.version}</div>
              </div>
            </div>
            <StatusBadge status="caution" label="Pending Review" />
          </div>
          {f.linkedTo && <div className="text-[8px] text-accent flex items-center gap-1 mb-2"><LinkIcon className="h-2.5 w-2.5" />{f.linkedTo}</div>}
          {f.approver && <div className="text-[8px] text-muted-foreground mb-2">Assigned to: {f.approver}</div>}
          <div className="flex gap-1.5">
            <Button size="sm" className="h-6 text-[9px] gap-1" onClick={() => toast.success('Approved!')}><ThumbsUp className="h-2.5 w-2.5" />Approve</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 text-destructive"><ThumbsDown className="h-2.5 w-2.5" />Reject</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><Edit className="h-2.5 w-2.5" />Request Changes</Button>
            <Button variant="ghost" size="sm" className="h-6 text-[9px] gap-1 ml-auto" onClick={() => onSelect(f)}><Eye className="h-2.5 w-2.5" />Details</Button>
          </div>
        </div>
      );
    })}
  </div>
);

// ── Main Page ──
const DocumentStudioPage: React.FC = () => {
  const [activeFolder, setActiveFolder] = useState('all');
  const [selectedFile, setSelectedFile] = useState<DocFile | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [accessFilter, setAccessFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = FILES.filter(f => {
    const matchFolder = activeFolder === 'all' || f.folder === activeFolder;
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.tags.some(t => t.includes(search.toLowerCase()));
    const matchAccess = accessFilter === 'all' || f.access === accessFilter;
    const matchStatus = statusFilter === 'all' || f.status === statusFilter;
    return matchFolder && matchSearch && matchAccess && matchStatus;
  });

  const totalSize = FILES.reduce((a, f) => {
    const num = parseFloat(f.size);
    const unit = f.size.includes('MB') ? 1024 : 1;
    return a + num * unit;
  }, 0);
  const pendingCount = FILES.filter(f => f.status === 'pending-review').length;
  const approvedCount = FILES.filter(f => f.status === 'approved').length;

  /* ── Top Strip ── */
  const topStrip = (
    <>
      <FileText className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold">Files & Documents</span>
      <div className="flex-1" />

      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files..." className="h-6 rounded-md border bg-background pl-7 pr-2 text-[8px] w-40 focus:outline-none focus:ring-1 focus:ring-ring" />
      </div>

      <select value={accessFilter} onChange={e => setAccessFilter(e.target.value)} className="h-6 rounded-md border bg-background px-1.5 text-[8px]">
        <option value="all">All access</option>
        <option value="private">Private</option>
        <option value="internal">Internal</option>
        <option value="shared">Shared</option>
        <option value="public">Public</option>
      </select>

      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-6 rounded-md border bg-background px-1.5 text-[8px]">
        <option value="all">All status</option>
        <option value="draft">Draft</option>
        <option value="active">Active</option>
        <option value="approved">Approved</option>
        <option value="pending-review">Pending</option>
        <option value="archived">Archived</option>
      </select>

      <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => setUploadOpen(true)}><Upload className="h-3 w-3" />Upload</Button>
      <Button size="sm" className="h-7 text-[10px] gap-1"><FolderPlus className="h-3 w-3" />New Folder</Button>
      <Badge variant="secondary" className="text-[7px] gap-0.5"><Clock className="h-2.5 w-2.5" />Live</Badge>
    </>
  );

  /* ── Right Rail ── */
  const rightRail = (
    <div className="space-y-3">
      {/* Folder Tree */}
      <SectionCard title="Folders" icon={<Folder className="h-3.5 w-3.5 text-accent" />}>
        <div className="space-y-0.5">
          {FOLDERS.map(f => (
            <button key={f.id} onClick={() => setActiveFolder(f.id)} className={cn('flex items-center gap-2 p-1.5 rounded-md w-full text-left transition-colors text-[8px]', activeFolder === f.id ? 'bg-accent/10 text-accent font-medium' : 'hover:bg-muted/30 text-muted-foreground')}>
              <f.icon className="h-3 w-3" />
              <span className="flex-1">{f.name}</span>
              <span className="text-[7px]">{f.count}</span>
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Selected File Quick Info */}
      {selectedFile && (
        <SectionCard title="Selected" icon={<Eye className="h-3.5 w-3.5 text-accent" />} action={<Button variant="ghost" size="sm" className="h-4 text-[7px]" onClick={() => setSelectedFile(null)}><X className="h-2.5 w-2.5" /></Button>}>
          <div className="space-y-1.5">
            <div className="text-[9px] font-medium truncate">{selectedFile.name}</div>
            <div className="grid grid-cols-2 gap-1 text-[7px]">
              <div className="rounded border p-1"><span className="text-muted-foreground block">Status</span><StatusBadge status={STATUS_CONFIG[selectedFile.status].state} label={selectedFile.status} /></div>
              <div className="rounded border p-1"><span className="text-muted-foreground block">Size</span><span className="font-medium">{selectedFile.size}</span></div>
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-5 text-[7px] flex-1"><Eye className="h-2 w-2" />View</Button>
              <Button variant="outline" size="sm" className="h-5 text-[7px] flex-1"><Download className="h-2 w-2" />Get</Button>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Approval Queue */}
      <SectionCard title="Pending Approvals" icon={<Shield className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />} action={<Badge variant="secondary" className="text-[6px]">{pendingCount}</Badge>}>
        {APPROVAL_QUEUE.length === 0 ? (
          <div className="text-[8px] text-muted-foreground text-center py-2">All clear</div>
        ) : (
          <div className="space-y-1">
            {APPROVAL_QUEUE.map(f => (
              <div key={f.id} onClick={() => setSelectedFile(f)} className="flex items-center gap-1.5 p-1.5 rounded-md hover:bg-muted/30 cursor-pointer">
                <AlertTriangle className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))] shrink-0" />
                <span className="text-[8px] font-medium truncate flex-1">{f.name}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Storage */}
      <SectionCard title="Storage">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[8px]">
            <span>Used</span>
            <span className="font-medium">72.4 MB / 5 GB</span>
          </div>
          <Progress value={1.5} className="h-1" />
          <div className="text-[7px] text-muted-foreground">{FILES.length} files · {FOLDERS.length - 1} folders</div>
        </div>
      </SectionCard>

      {/* Sync */}
      <div className="rounded-lg border p-2">
        <div className="flex items-center justify-between text-[8px]">
          <span className="flex items-center gap-1 text-[hsl(var(--state-healthy))]"><CheckCircle2 className="h-2.5 w-2.5" />Synced</span>
          <Button variant="ghost" size="sm" className="h-4 text-[7px] gap-0.5"><RefreshCw className="h-2 w-2" />Refresh</Button>
        </div>
      </div>
    </div>
  );

  /* ── Bottom: Activity ── */
  const bottomSection = (
    <div className="p-3">
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><History className="h-3.5 w-3.5 text-accent" />File Activity</div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {ACTIVITY.map((a, i) => (
          <div key={i} className="shrink-0 rounded-lg border bg-card px-3 py-2 min-w-[220px]">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Avatar className="h-4 w-4"><AvatarFallback className="text-[5px]">{a.actor[0]}</AvatarFallback></Avatar>
              <span className="text-[9px] font-medium">{a.actor}</span>
              <Badge variant="secondary" className="text-[6px] capitalize">{a.type}</Badge>
            </div>
            <p className="text-[8px] text-muted-foreground line-clamp-2">{a.action}</p>
            <div className="text-[7px] text-muted-foreground mt-0.5">{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-52" bottomSection={bottomSection}>
      {/* KPI Band */}
      <KPIBand className="mb-3">
        <KPICard label="Total Files" value={String(FILES.length)} change={`${FOLDERS.length - 1} folders`} />
        <KPICard label="Approved" value={String(approvedCount)} change="verified" trend="up" />
        <KPICard label="Pending" value={String(pendingCount)} change="awaiting review" trend={pendingCount > 0 ? 'down' : 'up'} />
        <KPICard label="Storage" value="72 MB" change="of 5 GB" />
      </KPIBand>

      <Tabs defaultValue="files">
        <TabsList className="mb-3 flex-wrap h-auto gap-0.5">
          <TabsTrigger value="files" className="gap-1 text-[10px] h-6 px-2"><Layers className="h-3 w-3" />All Files</TabsTrigger>
          <TabsTrigger value="approvals" className="gap-1 text-[10px] h-6 px-2"><Shield className="h-3 w-3" />Approvals{pendingCount > 0 && <span className="ml-0.5 bg-[hsl(var(--gigvora-amber))]/20 text-[hsl(var(--gigvora-amber))] rounded-full px-1 text-[7px]">{pendingCount}</span>}</TabsTrigger>
          <TabsTrigger value="shared" className="gap-1 text-[10px] h-6 px-2"><Share2 className="h-3 w-3" />Shared</TabsTrigger>
          <TabsTrigger value="archived" className="gap-1 text-[10px] h-6 px-2"><Archive className="h-3 w-3" />Archive</TabsTrigger>
        </TabsList>

        <TabsContent value="files">
          <FileTable files={filtered} selectedId={selectedFile?.id || null} onSelect={setSelectedFile} />
        </TabsContent>

        <TabsContent value="approvals">
          <ApprovalsTab onSelect={setSelectedFile} />
        </TabsContent>

        <TabsContent value="shared">
          <FileTable files={FILES.filter(f => f.access === 'shared' || f.access === 'public')} selectedId={selectedFile?.id || null} onSelect={setSelectedFile} />
        </TabsContent>

        <TabsContent value="archived">
          <FileTable files={FILES.filter(f => f.status === 'archived')} selectedId={selectedFile?.id || null} onSelect={setSelectedFile} />
        </TabsContent>
      </Tabs>

      {/* Drawers */}
      <FileDetailDrawer file={selectedFile} open={!!selectedFile} onClose={() => setSelectedFile(null)} />
      <UploadDrawer open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </DashboardLayout>
  );
};

export default DocumentStudioPage;
