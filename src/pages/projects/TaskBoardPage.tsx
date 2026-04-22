import React, { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import {
  LayoutGrid, List, Calendar, MessageSquare, Plus, MoreHorizontal,
  GripVertical, ArrowRight, Flag, Target, ChevronRight, Clock,
  Timer, Play, Pause, Check, X, Search, Activity, Users,
  Filter, SortAsc, Columns, Eye, EyeOff, AlertTriangle,
  CheckCircle2, CircleDot, Archive, BarChart3, Layers,
  ExternalLink, History, Settings, Lock, Unlock, RefreshCw,
  GitBranch, Zap, Workflow, UserPlus, Download, Trash2,
  ArrowUpDown, Milestone, Link2, Shield, ChevronDown,
  Sparkles, TrendingUp, Flame, Hash, Move, Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ── Types ──
type TaskStatus = 'backlog' | 'todo' | 'in-progress' | 'review' | 'done' | 'blocked';
type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
type ViewMode = 'board' | 'list' | 'calendar' | 'swimlanes';
type ScopeMode = 'personal' | 'team' | 'client';

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  assigneeAvatar: string;
  due: string;
  estimate: string;
  logged: string;
  tags: string[];
  comments: number;
  subtasks: { done: number; total: number };
  locked?: boolean;
  blockedReason?: string;
  dependencies?: string[];
  milestone?: string;
}

// ── Mock Data ──
const TASKS: Task[] = [
  { id: 'tk1', title: 'Design system tokens', status: 'done', priority: 'high', assignee: 'Sarah C.', assigneeAvatar: 'SC', due: 'Apr 5', estimate: '8h', logged: '7.5h', tags: ['design'], comments: 3, subtasks: { done: 4, total: 4 }, milestone: 'Foundation' },
  { id: 'tk2', title: 'Auth module implementation', status: 'in-progress', priority: 'critical', assignee: 'Elena R.', assigneeAvatar: 'ER', due: 'Apr 12', estimate: '24h', logged: '18h', tags: ['backend', 'security'], comments: 8, subtasks: { done: 3, total: 5 }, dependencies: ['tk1'], milestone: 'Core Features' },
  { id: 'tk3', title: 'Dashboard wireframes v2', status: 'review', priority: 'high', assignee: 'Sarah C.', assigneeAvatar: 'SC', due: 'Apr 14', estimate: '16h', logged: '14h', tags: ['design', 'ux'], comments: 5, subtasks: { done: 6, total: 7 }, dependencies: ['tk1'], milestone: 'Core Features' },
  { id: 'tk4', title: 'API integration layer', status: 'todo', priority: 'high', assignee: 'Elena R.', assigneeAvatar: 'ER', due: 'Apr 18', estimate: '20h', logged: '0h', tags: ['backend'], comments: 2, subtasks: { done: 0, total: 4 }, dependencies: ['tk2'], milestone: 'Core Features' },
  { id: 'tk5', title: 'User testing round 1', status: 'todo', priority: 'medium', assignee: 'Priya P.', assigneeAvatar: 'PP', due: 'Apr 22', estimate: '12h', logged: '0h', tags: ['qa'], comments: 0, subtasks: { done: 0, total: 3 }, dependencies: ['tk3'], milestone: 'Testing' },
  { id: 'tk6', title: 'Performance audit', status: 'backlog', priority: 'low', assignee: 'Elena R.', assigneeAvatar: 'ER', due: 'Apr 28', estimate: '10h', logged: '0h', tags: ['backend'], comments: 1, subtasks: { done: 0, total: 2 }, milestone: 'Polish' },
  { id: 'tk7', title: 'Documentation', status: 'backlog', priority: 'low', assignee: 'Priya P.', assigneeAvatar: 'PP', due: 'May 2', estimate: '8h', logged: '0h', tags: ['docs'], comments: 0, subtasks: { done: 0, total: 5 }, milestone: 'Polish' },
  { id: 'tk8', title: 'Payment gateway integration', status: 'blocked', priority: 'critical', assignee: 'Elena R.', assigneeAvatar: 'ER', due: 'Apr 15', estimate: '16h', logged: '4h', tags: ['backend', 'finance'], comments: 6, subtasks: { done: 1, total: 4 }, locked: true, blockedReason: 'Awaiting payment provider API credentials', milestone: 'Core Features' },
  { id: 'tk9', title: 'Mobile responsive pass', status: 'in-progress', priority: 'medium', assignee: 'Sarah C.', assigneeAvatar: 'SC', due: 'Apr 16', estimate: '12h', logged: '6h', tags: ['frontend', 'design'], comments: 2, subtasks: { done: 2, total: 5 }, milestone: 'Core Features' },
  { id: 'tk10', title: 'Notification service', status: 'todo', priority: 'medium', assignee: 'Priya P.', assigneeAvatar: 'PP', due: 'Apr 20', estimate: '8h', logged: '0h', tags: ['backend'], comments: 1, subtasks: { done: 0, total: 3 }, dependencies: ['tk2'], milestone: 'Core Features' },
];

const TEAM = [
  { name: 'Sarah Chen', avatar: 'SC', role: 'Lead Designer', capacity: 40, logged: 27.5, tasks: 3, status: 'online' as const },
  { name: 'Elena Rodriguez', avatar: 'ER', role: 'Full-Stack Dev', capacity: 40, logged: 28, tasks: 4, status: 'online' as const },
  { name: 'Priya Patel', avatar: 'PP', role: 'QA & Testing', capacity: 40, logged: 0, tasks: 3, status: 'away' as const },
  { name: 'Alex Kim', avatar: 'AK', role: 'Project Manager', capacity: 40, logged: 12, tasks: 0, status: 'online' as const },
];

const AUTOMATION_RULES = [
  { id: 'ar1', name: 'Auto-assign reviewer when moved to Review', trigger: 'Status → Review', action: 'Assign Alex K. as reviewer', enabled: true, runs: 12 },
  { id: 'ar2', name: 'Notify client on milestone completion', trigger: 'All milestone tasks → Done', action: 'Send email to client', enabled: true, runs: 3 },
  { id: 'ar3', name: 'Auto-block when dependency incomplete', trigger: 'Task has unfinished dependency', action: 'Set status → Blocked', enabled: true, runs: 5 },
  { id: 'ar4', name: 'Overdue warning at 80% estimate', trigger: 'Logged hours > 80% estimate', action: 'Flag task + notify PM', enabled: false, runs: 0 },
  { id: 'ar5', name: 'Archive completed tasks after 7 days', trigger: '7 days after Done', action: 'Move to Archive', enabled: false, runs: 0 },
];

const ACTIVITY_LOG = [
  { actor: 'Elena R.', action: 'moved "Auth module" to In Progress', time: '10m ago', type: 'move' },
  { actor: 'Sarah C.', action: 'submitted "Dashboard wireframes v2" for review', time: '1h ago', type: 'review' },
  { actor: 'System', action: 'blocked "Payment gateway" — missing API credentials', time: '2h ago', type: 'blocked' },
  { actor: 'Priya P.', action: 'commented on "User testing round 1"', time: '3h ago', type: 'comment' },
  { actor: 'Alex K.', action: 'reassigned "Notification service" to Priya P.', time: '5h ago', type: 'assign' },
  { actor: 'System', action: 'Auto-assigned Alex K. as reviewer for wireframes', time: '6h ago', type: 'automation' },
];

const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: React.ElementType; color: string }> = {
  backlog: { label: 'Backlog', icon: Archive, color: 'text-muted-foreground' },
  todo: { label: 'To Do', icon: CircleDot, color: 'text-muted-foreground' },
  'in-progress': { label: 'In Progress', icon: Play, color: 'text-accent' },
  review: { label: 'In Review', icon: Eye, color: 'text-[hsl(var(--state-caution))]' },
  done: { label: 'Done', icon: CheckCircle2, color: 'text-[hsl(var(--state-healthy))]' },
  blocked: { label: 'Blocked', icon: Lock, color: 'text-destructive' },
};

const PRIORITY_CONFIG: Record<TaskPriority, { color: string; bg: string }> = {
  critical: { color: 'text-destructive', bg: 'bg-destructive/10' },
  high: { color: 'text-[hsl(var(--state-caution))]', bg: 'bg-[hsl(var(--state-caution))]/10' },
  medium: { color: 'text-accent', bg: 'bg-accent/10' },
  low: { color: 'text-muted-foreground', bg: 'bg-muted' },
};

const COLUMNS: TaskStatus[] = ['backlog', 'todo', 'in-progress', 'review', 'done', 'blocked'];
const STATUS_RING = { online: 'ring-[hsl(var(--state-healthy))]', away: 'ring-[hsl(var(--state-caution))]', offline: 'ring-muted-foreground' };

// ── Kanban Card ──
const TaskCard: React.FC<{ task: Task; onSelect: (t: Task) => void; selected: boolean; bulkMode: boolean; bulkSelected: boolean; onBulkToggle: (id: string) => void }> = ({ task, onSelect, selected, bulkMode, bulkSelected, onBulkToggle }) => (
  <div
    onClick={() => bulkMode ? onBulkToggle(task.id) : onSelect(task)}
    className={cn(
      'rounded-2xl border bg-card p-2.5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group',
      selected && 'border-accent ring-1 ring-accent/30',
      bulkSelected && 'border-accent bg-accent/5',
      task.locked && 'opacity-75 border-destructive/30'
    )}
  >
    {bulkMode && (
      <div className="flex justify-end mb-1">
        <Checkbox checked={bulkSelected} className="h-3.5 w-3.5" />
      </div>
    )}
    {task.locked && (
      <div className="flex items-center gap-1 text-[7px] text-destructive font-medium mb-1.5 bg-destructive/5 rounded-lg px-1.5 py-0.5">
        <Lock className="h-2.5 w-2.5" />{task.blockedReason}
      </div>
    )}
    <div className="flex items-start justify-between mb-1.5">
      <span className="text-[10px] font-medium leading-tight line-clamp-2">{task.title}</span>
      <GripVertical className="h-3 w-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 shrink-0 ml-1 cursor-grab" />
    </div>
    <div className="flex flex-wrap gap-1 mb-1.5">
      {task.tags.map(t => (
        <Badge key={t} variant="secondary" className="text-[6px] px-1 py-0 h-3.5 rounded-lg">{t}</Badge>
      ))}
    </div>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        <Badge className={cn('text-[7px] px-1 h-3.5 rounded-lg', PRIORITY_CONFIG[task.priority].bg, PRIORITY_CONFIG[task.priority].color)}>{task.priority}</Badge>
        {task.subtasks.total > 0 && (
          <span className="text-[7px] text-muted-foreground">{task.subtasks.done}/{task.subtasks.total}</span>
        )}
        {task.comments > 0 && (
          <span className="text-[7px] text-muted-foreground flex items-center gap-0.5"><MessageSquare className="h-2 w-2" />{task.comments}</span>
        )}
        {task.dependencies && task.dependencies.length > 0 && (
          <span className="text-[7px] text-muted-foreground flex items-center gap-0.5"><GitBranch className="h-2 w-2" />{task.dependencies.length}</span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[7px] text-muted-foreground">{task.due}</span>
        <Avatar className="h-4 w-4"><AvatarFallback className="text-[5px] bg-accent/10 text-accent">{task.assigneeAvatar}</AvatarFallback></Avatar>
      </div>
    </div>
    {task.subtasks.total > 0 && (
      <Progress value={(task.subtasks.done / task.subtasks.total) * 100} className="h-0.5 mt-1.5" />
    )}
  </div>
);

// ── Kanban Board ──
const KanbanView: React.FC<{ tasks: Task[]; selectedId: string | null; onSelect: (t: Task) => void; bulkMode: boolean; bulkIds: Set<string>; onBulkToggle: (id: string) => void }> = ({ tasks, selectedId, onSelect, bulkMode, bulkIds, onBulkToggle }) => (
  <div className="flex gap-2.5 overflow-x-auto pb-2">
    {COLUMNS.map(status => {
      const colTasks = tasks.filter(t => t.status === status);
      const cfg = STATUS_CONFIG[status];
      return (
        <div key={status} className="flex-shrink-0 w-60">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5">
              <cfg.icon className={cn('h-3 w-3', cfg.color)} />
              <span className="text-[10px] font-semibold">{cfg.label}</span>
              <span className="text-[8px] text-muted-foreground bg-muted rounded-full px-1.5">{colTasks.length}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => toast.info(`Add task to ${cfg.label}`)}><Plus className="h-3 w-3" /></Button>
          </div>
          <div className="space-y-1.5 min-h-[200px] rounded-2xl bg-muted/20 p-1.5">
            {colTasks.map(task => (
              <TaskCard key={task.id} task={task} onSelect={onSelect} selected={selectedId === task.id} bulkMode={bulkMode} bulkSelected={bulkIds.has(task.id)} onBulkToggle={onBulkToggle} />
            ))}
            {colTasks.length === 0 && (
              <div className="flex items-center justify-center h-20 text-[8px] text-muted-foreground border border-dashed rounded-xl">
                Drop tasks here
              </div>
            )}
          </div>
        </div>
      );
    })}
  </div>
);

// ── List View ──
const ListView: React.FC<{ tasks: Task[]; selectedId: string | null; onSelect: (t: Task) => void; bulkMode: boolean; bulkIds: Set<string>; onBulkToggle: (id: string) => void }> = ({ tasks, selectedId, onSelect, bulkMode, bulkIds, onBulkToggle }) => (
  <div className="rounded-2xl border overflow-hidden">
    <table className="w-full">
      <thead className="bg-muted/50">
        <tr className="text-[9px] text-muted-foreground font-medium">
          {bulkMode && <th className="px-2 py-2 w-8" />}
          <th className="text-left px-3 py-2">Task</th>
          <th className="text-left px-3 py-2">Status</th>
          <th className="text-left px-3 py-2">Priority</th>
          <th className="text-left px-3 py-2">Assignee</th>
          <th className="text-left px-3 py-2">Due</th>
          <th className="text-left px-3 py-2">Progress</th>
          <th className="text-left px-3 py-2">Time</th>
          <th className="text-left px-3 py-2">Deps</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map(task => {
          const cfg = STATUS_CONFIG[task.status];
          return (
            <tr key={task.id} onClick={() => bulkMode ? onBulkToggle(task.id) : onSelect(task)} className={cn('border-t hover:bg-muted/30 transition-colors cursor-pointer text-[9px]', selectedId === task.id && 'bg-accent/5', bulkIds.has(task.id) && 'bg-accent/10')}>
              {bulkMode && <td className="px-2 py-2"><Checkbox checked={bulkIds.has(task.id)} className="h-3 w-3" /></td>}
              <td className="px-3 py-2">
                <div className="flex items-center gap-1.5">
                  {task.locked && <Lock className="h-2.5 w-2.5 text-destructive shrink-0" />}
                  <span className="font-medium">{task.title}</span>
                  {task.tags.slice(0, 2).map(t => <Badge key={t} variant="secondary" className="text-[6px] px-1 h-3 rounded-lg">{t}</Badge>)}
                </div>
              </td>
              <td className="px-3 py-2"><div className={cn('flex items-center gap-1', cfg.color)}><cfg.icon className="h-2.5 w-2.5" /><span>{cfg.label}</span></div></td>
              <td className="px-3 py-2"><Badge className={cn('text-[7px] rounded-lg', PRIORITY_CONFIG[task.priority].bg, PRIORITY_CONFIG[task.priority].color)}>{task.priority}</Badge></td>
              <td className="px-3 py-2"><div className="flex items-center gap-1"><Avatar className="h-4 w-4"><AvatarFallback className="text-[5px] bg-accent/10 text-accent">{task.assigneeAvatar}</AvatarFallback></Avatar><span className="text-muted-foreground">{task.assignee}</span></div></td>
              <td className="px-3 py-2 text-muted-foreground">{task.due}</td>
              <td className="px-3 py-2"><div className="flex items-center gap-1.5"><Progress value={(task.subtasks.done / Math.max(task.subtasks.total, 1)) * 100} className="h-1 w-12" /><span className="text-[7px] text-muted-foreground">{task.subtasks.done}/{task.subtasks.total}</span></div></td>
              <td className="px-3 py-2 text-muted-foreground">{task.logged}/{task.estimate}</td>
              <td className="px-3 py-2">{task.dependencies && task.dependencies.length > 0 ? <Badge variant="secondary" className="text-[6px]"><GitBranch className="h-2 w-2 mr-0.5" />{task.dependencies.length}</Badge> : <span className="text-muted-foreground">—</span>}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

// ── Calendar View ──
const CalendarView: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
  const weeks = [
    ['Apr 7', 'Apr 8', 'Apr 9', 'Apr 10', 'Apr 11', 'Apr 12', 'Apr 13'],
    ['Apr 14', 'Apr 15', 'Apr 16', 'Apr 17', 'Apr 18', 'Apr 19', 'Apr 20'],
    ['Apr 21', 'Apr 22', 'Apr 23', 'Apr 24', 'Apr 25', 'Apr 26', 'Apr 27'],
  ];
  const taskByDue: Record<string, Task[]> = {};
  tasks.forEach(t => { if (!taskByDue[t.due]) taskByDue[t.due] = []; taskByDue[t.due].push(t); });

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="grid grid-cols-7 bg-muted/50">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="text-center text-[8px] font-medium text-muted-foreground py-1.5 border-r last:border-r-0">{d}</div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-t">
          {week.map(day => {
            const dayTasks = taskByDue[day] || [];
            return (
              <div key={day} className="border-r last:border-r-0 p-1.5 min-h-[80px]">
                <div className="text-[7px] text-muted-foreground mb-1">{day.split(' ')[1]}</div>
                {dayTasks.map(t => (
                  <div key={t.id} className={cn('rounded-lg px-1 py-0.5 mb-0.5 text-[7px] font-medium truncate cursor-pointer hover:opacity-80', PRIORITY_CONFIG[t.priority].bg, PRIORITY_CONFIG[t.priority].color)}>
                    {t.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// ── Swimlane View (grouped by assignee) ──
const SwimlanesView: React.FC<{ tasks: Task[]; selectedId: string | null; onSelect: (t: Task) => void }> = ({ tasks, selectedId, onSelect }) => {
  const assignees = [...new Set(tasks.map(t => t.assignee))];
  return (
    <div className="space-y-3">
      {assignees.map(assignee => {
        const assigneeTasks = tasks.filter(t => t.assignee === assignee);
        const team = TEAM.find(t => t.name.startsWith(assignee.split('.')[0]?.split(' ')[0] || ''));
        return (
          <div key={assignee} className="rounded-2xl border bg-card/80 overflow-hidden">
            <div className="flex items-center gap-2.5 px-3 py-2 bg-muted/30 border-b">
              <Avatar className={cn('h-6 w-6 ring-2', STATUS_RING[team?.status || 'offline'])}>
                <AvatarFallback className="text-[7px] bg-accent/10 text-accent">{assignee.split(' ').map(n => n[0]).join('').slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <span className="text-[10px] font-semibold">{assignee}</span>
                {team && <span className="text-[8px] text-muted-foreground ml-1.5">{team.role}</span>}
              </div>
              <Badge variant="secondary" className="text-[7px] ml-auto">{assigneeTasks.length} tasks</Badge>
            </div>
            <div className="flex gap-2 overflow-x-auto p-2.5">
              {COLUMNS.filter(s => assigneeTasks.some(t => t.status === s)).map(status => {
                const colTasks = assigneeTasks.filter(t => t.status === status);
                const cfg = STATUS_CONFIG[status];
                return (
                  <div key={status} className="flex-shrink-0 min-w-[180px]">
                    <div className="flex items-center gap-1 mb-1.5 text-[8px]">
                      <cfg.icon className={cn('h-2.5 w-2.5', cfg.color)} />
                      <span className="font-medium">{cfg.label}</span>
                      <span className="text-muted-foreground">({colTasks.length})</span>
                    </div>
                    <div className="space-y-1">
                      {colTasks.map(t => (
                        <div key={t.id} onClick={() => onSelect(t)} className={cn('rounded-xl border p-2 cursor-pointer hover:shadow-sm hover:-translate-y-px transition-all text-[8px]', selectedId === t.id && 'border-accent bg-accent/5')}>
                          <div className="font-medium mb-0.5 line-clamp-1">{t.title}</div>
                          <div className="flex items-center gap-1">
                            <Badge className={cn('text-[6px] px-1 h-3 rounded-lg', PRIORITY_CONFIG[t.priority].bg, PRIORITY_CONFIG[t.priority].color)}>{t.priority}</Badge>
                            <span className="text-muted-foreground">{t.due}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Dependency Inspector ──
const DependencyInspector: React.FC = () => {
  const deps = TASKS.filter(t => t.dependencies && t.dependencies.length > 0);
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <GitBranch className="h-4 w-4 text-accent" />
        <h3 className="text-[11px] font-semibold">Dependency Map</h3>
        <Badge variant="secondary" className="text-[7px]">{deps.length} chains</Badge>
      </div>
      <div className="space-y-2">
        {deps.map(task => {
          const depTasks = task.dependencies!.map(d => TASKS.find(t => t.id === d)).filter(Boolean);
          const allDepsDone = depTasks.every(d => d?.status === 'done');
          return (
            <div key={task.id} className={cn('rounded-xl border p-3 transition-all', !allDepsDone && task.status !== 'blocked' && 'border-[hsl(var(--state-caution))]/30')}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-medium">{task.title}</span>
                <StatusBadge status={allDepsDone ? 'healthy' : 'caution'} label={allDepsDone ? 'Unblocked' : 'Waiting'} />
              </div>
              <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground ml-4">
                <span>depends on:</span>
                {depTasks.map(d => d && (
                  <div key={d.id} className="flex items-center gap-1 rounded-lg border px-1.5 py-0.5">
                    {d.status === 'done' ? <CheckCircle2 className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))]" /> : <CircleDot className="h-2.5 w-2.5 text-muted-foreground" />}
                    <span className={cn(d.status === 'done' && 'line-through')}>{d.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Automation / Rules ──
const AutomationRulesView: React.FC = () => {
  const [rules, setRules] = useState(AUTOMATION_RULES);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-accent" />
          <h3 className="text-[11px] font-semibold">Board Automations</h3>
          <Badge variant="secondary" className="text-[7px]">{rules.filter(r => r.enabled).length} active</Badge>
        </div>
        <Button size="sm" className="h-7 text-[10px] gap-1 rounded-xl"><Plus className="h-3 w-3" />New Rule</Button>
      </div>
      <div className="space-y-2">
        {rules.map(rule => (
          <div key={rule.id} className={cn('rounded-2xl border p-3 transition-all', rule.enabled ? 'bg-card' : 'bg-muted/20 opacity-70')}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className={cn('h-3.5 w-3.5', rule.enabled ? 'text-accent' : 'text-muted-foreground')} />
                <span className="text-[10px] font-semibold">{rule.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {rule.runs > 0 && <span className="text-[8px] text-muted-foreground">{rule.runs} runs</span>}
                <button onClick={() => setRules(prev => prev.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r))} className={cn('h-5 w-9 rounded-full transition-colors flex items-center', rule.enabled ? 'bg-accent justify-end' : 'bg-muted justify-start')}>
                  <div className="h-3.5 w-3.5 rounded-full bg-white shadow mx-0.5" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[8px]">
              <div className="rounded-xl bg-muted/30 px-2.5 py-1.5">
                <span className="text-muted-foreground">When: </span><span className="font-medium">{rule.trigger}</span>
              </div>
              <div className="rounded-xl bg-muted/30 px-2.5 py-1.5">
                <span className="text-muted-foreground">Then: </span><span className="font-medium">{rule.action}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Resource Allocation ──
const ResourceAllocation: React.FC = () => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 mb-1">
      <Users className="h-4 w-4 text-accent" />
      <h3 className="text-[11px] font-semibold">Resource Allocation</h3>
    </div>
    <div className="space-y-2.5">
      {TEAM.map(m => {
        const memberTasks = TASKS.filter(t => t.assignee.startsWith(m.name.split(' ')[0]));
        const totalEst = memberTasks.reduce((a, t) => a + parseInt(t.estimate), 0);
        const totalLogged = memberTasks.reduce((a, t) => a + parseFloat(t.logged), 0);
        const util = Math.round((totalEst / m.capacity) * 100);
        const byStatus = COLUMNS.reduce((acc, s) => { acc[s] = memberTasks.filter(t => t.status === s).length; return acc; }, {} as Record<string, number>);

        return (
          <div key={m.name} className="rounded-2xl border p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <Avatar className={cn('h-8 w-8 ring-2', STATUS_RING[m.status])}>
                  <AvatarFallback className="text-[8px] bg-accent/10 text-accent font-bold">{m.avatar}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-[10px] font-semibold">{m.name}</div>
                  <div className="text-[8px] text-muted-foreground">{m.role}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={cn('text-sm font-bold', util > 100 ? 'text-destructive' : util > 80 ? 'text-[hsl(var(--state-caution))]' : 'text-[hsl(var(--state-healthy))]')}>{util}%</div>
                <div className="text-[7px] text-muted-foreground">utilization</div>
              </div>
            </div>
            <Progress value={Math.min(util, 100)} className="h-1.5 mb-2" />
            <div className="flex gap-1.5 text-[7px] mb-2">
              <span className="text-muted-foreground">{memberTasks.length} tasks</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{totalEst}h est.</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{totalLogged}h logged</span>
            </div>
            <div className="flex gap-1">
              {COLUMNS.filter(s => byStatus[s] > 0).map(s => (
                <Badge key={s} variant="secondary" className={cn('text-[6px] rounded-lg', STATUS_CONFIG[s].color)}>
                  {STATUS_CONFIG[s].label}: {byStatus[s]}
                </Badge>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// ── Task Detail Drawer ──
const TaskDetailDrawer: React.FC<{ task: Task | null; open: boolean; onClose: () => void }> = ({ task, open, onClose }) => {
  if (!task) return null;
  const cfg = STATUS_CONFIG[task.status];
  const depTasks = (task.dependencies || []).map(d => TASKS.find(t => t.id === d)).filter(Boolean);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[480px] overflow-y-auto p-0">
        <SheetHeader className="p-5 border-b">
          <SheetTitle className="text-sm flex items-center gap-2">
            {task.locked && <Lock className="h-3.5 w-3.5 text-destructive" />}
            {task.title}
          </SheetTitle>
        </SheetHeader>
        <div className="p-4 space-y-4">
          {task.locked && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3">
              <div className="text-[10px] font-semibold text-destructive flex items-center gap-1.5 mb-1"><AlertTriangle className="h-3.5 w-3.5" />Blocked</div>
              <p className="text-[9px] text-muted-foreground">{task.blockedReason}</p>
              <Button variant="outline" size="sm" className="h-6 text-[9px] mt-2 gap-1 rounded-xl"><Unlock className="h-3 w-3" />Resolve Block</Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Status', value: <span className={cn('flex items-center gap-1', cfg.color)}><cfg.icon className="h-3 w-3" />{cfg.label}</span> },
              { label: 'Priority', value: <Badge className={cn('text-[8px] rounded-lg', PRIORITY_CONFIG[task.priority].bg, PRIORITY_CONFIG[task.priority].color)}>{task.priority}</Badge> },
              { label: 'Assignee', value: <span className="flex items-center gap-1"><Avatar className="h-4 w-4"><AvatarFallback className="text-[5px] bg-accent/10 text-accent">{task.assigneeAvatar}</AvatarFallback></Avatar>{task.assignee}</span> },
              { label: 'Due', value: task.due },
              { label: 'Estimate', value: task.estimate },
              { label: 'Logged', value: task.logged },
            ].map(m => (
              <div key={m.label} className="rounded-xl border p-2">
                <div className="text-[7px] text-muted-foreground mb-0.5">{m.label}</div>
                <div className="text-[9px] font-medium">{m.value}</div>
              </div>
            ))}
          </div>

          {task.milestone && (
            <div className="rounded-xl bg-accent/5 border border-accent/20 p-2 flex items-center gap-2">
              <Milestone className="h-3.5 w-3.5 text-accent" />
              <span className="text-[9px] font-medium">Milestone: {task.milestone}</span>
            </div>
          )}

          {depTasks.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold mb-1.5 flex items-center gap-1"><GitBranch className="h-3 w-3 text-accent" />Dependencies</div>
              <div className="space-y-1">
                {depTasks.map(d => d && (
                  <div key={d.id} className="flex items-center gap-2 px-2 py-1.5 rounded-xl border text-[9px]">
                    {d.status === 'done' ? <CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]" /> : <CircleDot className="h-3 w-3 text-muted-foreground" />}
                    <span className={cn('flex-1', d.status === 'done' && 'line-through text-muted-foreground')}>{d.title}</span>
                    <Badge variant="secondary" className="text-[6px]">{STATUS_CONFIG[d.status].label}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-[10px] font-semibold mb-1.5">Subtasks ({task.subtasks.done}/{task.subtasks.total})</div>
            <Progress value={(task.subtasks.done / Math.max(task.subtasks.total, 1)) * 100} className="h-1.5 mb-2" />
            <div className="space-y-1">
              {Array.from({ length: task.subtasks.total }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted/30 text-[9px]">
                  {i < task.subtasks.done ? <CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]" /> : <CircleDot className="h-3 w-3 text-muted-foreground" />}
                  <span className={cn(i < task.subtasks.done && 'line-through text-muted-foreground')}>Subtask {i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-semibold mb-1">Tags</div>
            <div className="flex flex-wrap gap-1">
              {task.tags.map(t => <Badge key={t} variant="secondary" className="text-[8px] rounded-lg">{t}</Badge>)}
              <Button variant="ghost" size="sm" className="h-5 text-[8px] px-1.5 rounded-lg"><Plus className="h-2.5 w-2.5" /></Button>
            </div>
          </div>

          <div className="border-t pt-3">
            <div className="text-[10px] font-semibold mb-2 flex items-center gap-1"><Timer className="h-3 w-3 text-accent" />Log Time</div>
            <div className="flex gap-2">
              <input type="number" placeholder="Hours" className="flex-1 h-7 rounded-xl border bg-background px-2 text-[9px]" />
              <input type="date" className="flex-1 h-7 rounded-xl border bg-background px-2 text-[9px]" />
              <Button size="sm" className="h-7 text-[9px] rounded-xl" onClick={() => toast.success('Time logged')}>Log</Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 border-t pt-3">
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><ArrowRight className="h-2.5 w-2.5" />Move Stage</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Users className="h-2.5 w-2.5" />Reassign</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Flag className="h-2.5 w-2.5" />Flag</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Copy className="h-2.5 w-2.5" />Duplicate</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Archive className="h-2.5 w-2.5" />Archive</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl text-destructive"><Trash2 className="h-2.5 w-2.5" />Delete</Button>
          </div>

          <div className="border-t pt-3">
            <div className="text-[10px] font-semibold mb-2 flex items-center gap-1"><MessageSquare className="h-3 w-3 text-accent" />Comments ({task.comments})</div>
            <div className="rounded-xl border p-2 text-[8px] text-muted-foreground italic mb-2">Comment thread renders here</div>
            <div className="flex gap-2">
              <input placeholder="Add a comment..." className="flex-1 h-7 rounded-xl border bg-background px-2 text-[9px]" />
              <Button size="sm" className="h-7 text-[9px] rounded-xl">Send</Button>
            </div>
          </div>

          <div className="border-t pt-3">
            <div className="text-[10px] font-semibold mb-2 flex items-center gap-1"><Link2 className="h-3 w-3 text-accent" />Linked</div>
            <div className="space-y-1 text-[8px]">
              <Link to="/contracts/sow" className="flex items-center gap-1.5 p-1.5 rounded-xl hover:bg-muted/30"><Shield className="h-3 w-3 text-accent" />Contract #CT-2024-12</Link>
              <Link to={`/projects/p1/workspace`} className="flex items-center gap-1.5 p-1.5 rounded-xl hover:bg-muted/30"><Layers className="h-3 w-3 text-accent" />Project Workspace</Link>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ── Create Task Drawer ──
const CreateTaskDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => (
  <Sheet open={open} onOpenChange={onClose}>
    <SheetContent className="w-[440px] overflow-y-auto p-0">
      <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm">Create Task</SheetTitle></SheetHeader>
      <div className="p-4 space-y-3">
        <div>
          <label className="text-[9px] font-medium mb-1 block">Title *</label>
          <input className="w-full h-8 rounded-xl border bg-background px-3 text-[10px]" placeholder="Task title..." />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] font-medium mb-1 block">Status</label>
            <select className="w-full h-8 rounded-xl border bg-background px-3 text-[10px]">
              {COLUMNS.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[9px] font-medium mb-1 block">Priority</label>
            <select className="w-full h-8 rounded-xl border bg-background px-3 text-[10px]">
              {(['critical', 'high', 'medium', 'low'] as TaskPriority[]).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] font-medium mb-1 block">Assignee</label>
            <select className="w-full h-8 rounded-xl border bg-background px-3 text-[10px]">
              {TEAM.map(t => <option key={t.name}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[9px] font-medium mb-1 block">Due Date</label>
            <input type="date" className="w-full h-8 rounded-xl border bg-background px-3 text-[10px]" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] font-medium mb-1 block">Estimate</label>
            <input className="w-full h-8 rounded-xl border bg-background px-3 text-[10px]" placeholder="e.g. 8h" />
          </div>
          <div>
            <label className="text-[9px] font-medium mb-1 block">Milestone</label>
            <select className="w-full h-8 rounded-xl border bg-background px-3 text-[10px]">
              <option>Foundation</option><option>Core Features</option><option>Testing</option><option>Polish</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-[9px] font-medium mb-1 block">Tags</label>
          <input className="w-full h-8 rounded-xl border bg-background px-3 text-[10px]" placeholder="e.g. backend, ux" />
        </div>
        <div>
          <label className="text-[9px] font-medium mb-1 block">Dependencies</label>
          <input className="w-full h-8 rounded-xl border bg-background px-3 text-[10px]" placeholder="Search tasks to link..." />
        </div>
        <div>
          <label className="text-[9px] font-medium mb-1 block">Description</label>
          <textarea className="w-full h-20 rounded-xl border bg-background px-3 py-2 text-[10px] resize-none" placeholder="Task details..." />
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" className="h-8 text-[10px] flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="h-8 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { onClose(); toast.success('Task created'); }}><Plus className="h-3 w-3" />Create</Button>
        </div>
      </div>
    </SheetContent>
  </Sheet>
);

// ── Bulk Edit Tray ──
const BulkEditTray: React.FC<{ count: number; onClear: () => void }> = ({ count, onClear }) => (
  <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-card border shadow-lg rounded-2xl px-4 py-2.5">
    <span className="text-[10px] font-semibold">{count} selected</span>
    <div className="h-4 w-px bg-border" />
    <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Bulk move…')}><Move className="h-3 w-3" />Move</Button>
    <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Bulk assign…')}><Users className="h-3 w-3" />Assign</Button>
    <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Bulk priority…')}><Flag className="h-3 w-3" />Priority</Button>
    <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Bulk archive…')}><Archive className="h-3 w-3" />Archive</Button>
    <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl text-destructive" onClick={() => toast.info('Bulk delete…')}><Trash2 className="h-3 w-3" />Delete</Button>
    <div className="h-4 w-px bg-border" />
    <Button variant="ghost" size="sm" className="h-6 text-[9px] rounded-xl" onClick={onClear}><X className="h-3 w-3" />Clear</Button>
  </div>
);

// ── Main Page ──
const TaskBoardPage: React.FC = () => {
  const { projectId } = useParams();
  const [view, setView] = useState<ViewMode>('board');
  const [scope, setScope] = useState<ScopeMode>('team');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkIds, setBulkIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = useMemo(() => {
    let result = TASKS;
    if (filterPriority !== 'all') result = result.filter(t => t.priority === filterPriority);
    if (searchQuery) result = result.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.tags.some(tag => tag.includes(searchQuery.toLowerCase())));
    return result;
  }, [filterPriority, searchQuery]);

  const toggleBulk = (id: string) => {
    setBulkIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const totalTasks = TASKS.length;
  const doneTasks = TASKS.filter(t => t.status === 'done').length;
  const blockedTasks = TASKS.filter(t => t.status === 'blocked').length;
  const totalLogged = TASKS.reduce((a, t) => a + parseFloat(t.logged), 0);

  const topStrip = (
    <>
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center"><Layers className="h-3.5 w-3.5 text-accent" /></div>
        <span className="text-xs font-bold">Task Board</span>
        <StatusBadge status="live" label="Sprint 3" />
      </div>
      <div className="flex-1" />

      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search tasks..." className="h-6 pl-6 pr-2 rounded-xl border bg-background text-[8px] w-32 focus:w-44 transition-all" />
      </div>

      <div className="flex items-center gap-0.5 bg-muted/50 rounded-xl p-0.5">
        {([
          { key: 'board' as ViewMode, icon: LayoutGrid, label: 'Board' },
          { key: 'list' as ViewMode, icon: List, label: 'List' },
          { key: 'swimlanes' as ViewMode, icon: Columns, label: 'Swim' },
          { key: 'calendar' as ViewMode, icon: Calendar, label: 'Cal' },
        ]).map(v => (
          <button key={v.key} onClick={() => setView(v.key)} className={cn('flex items-center gap-1 px-2 py-0.5 rounded-lg text-[8px] font-medium transition-all', view === v.key ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            <v.icon className="h-3 w-3" />{v.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-0.5 bg-muted/50 rounded-xl p-0.5">
        {(['personal', 'team', 'client'] as ScopeMode[]).map(s => (
          <button key={s} onClick={() => setScope(s)} className={cn('px-2 py-0.5 rounded-lg text-[8px] font-medium transition-all capitalize', scope === s ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{s}</button>
        ))}
      </div>

      <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="h-6 rounded-xl border bg-background px-1.5 text-[8px]">
        <option value="all">All priorities</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      <Button variant={bulkMode ? 'default' : 'outline'} size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => { setBulkMode(!bulkMode); setBulkIds(new Set()); }}>
        <CheckCircle2 className="h-3 w-3" />{bulkMode ? 'Exit Bulk' : 'Bulk'}
      </Button>

      <Button size="sm" className="h-7 text-[10px] gap-1 rounded-xl" onClick={() => setCreateOpen(true)}><Plus className="h-3 w-3" />Create</Button>
      <Badge variant="secondary" className="text-[7px] gap-0.5"><Clock className="h-2.5 w-2.5" />Live</Badge>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      {selectedTask && (
        <SectionCard title="Selected" icon={<Target className="h-3.5 w-3.5 text-accent" />} action={<Button variant="ghost" size="sm" className="h-4 text-[7px]" onClick={() => setSelectedTask(null)}><X className="h-2.5 w-2.5" /></Button>} className="!rounded-2xl">
          <div className="space-y-1.5">
            <div className="text-[9px] font-semibold">{selectedTask.title}</div>
            <div className="grid grid-cols-2 gap-1 text-[7px]">
              <div className="rounded-lg border p-1"><span className="text-muted-foreground block">Status</span><span className={cn('font-medium', STATUS_CONFIG[selectedTask.status].color)}>{STATUS_CONFIG[selectedTask.status].label}</span></div>
              <div className="rounded-lg border p-1"><span className="text-muted-foreground block">Priority</span><span className="font-medium capitalize">{selectedTask.priority}</span></div>
            </div>
            <Button variant="outline" size="sm" className="h-5 text-[8px] w-full gap-1 rounded-lg" onClick={() => setSelectedTask(selectedTask)}><Eye className="h-2.5 w-2.5" />Open Detail</Button>
          </div>
        </SectionCard>
      )}

      <SectionCard title="Resources" icon={<Users className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5">
          {TEAM.map(m => {
            const util = Math.round((m.logged / m.capacity) * 100);
            return (
              <div key={m.name} className="rounded-xl border p-1.5">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <Avatar className={cn('h-5 w-5 ring-1', STATUS_RING[m.status])}><AvatarFallback className="text-[5px] bg-accent/10 text-accent">{m.avatar}</AvatarFallback></Avatar>
                    <span className="text-[7px] font-medium">{m.name.split(' ')[0]}</span>
                  </div>
                  <span className={cn('text-[7px] font-bold', util > 90 ? 'text-destructive' : 'text-[hsl(var(--state-healthy))]')}>{util}%</span>
                </div>
                <Progress value={Math.min(util, 100)} className="h-0.5" />
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Quick Actions" className="!rounded-2xl">
        <div className="space-y-0.5">
          {[
            { l: 'Workspace', icon: Layers, href: `/projects/${projectId || 'p1'}/workspace` },
            { l: 'Contracts', icon: Shield, href: '/contracts/sow' },
            { l: 'Proposals', icon: Target, href: `/projects/${projectId || 'p1'}/review` },
            { l: 'Export CSV', icon: Download, href: '#' },
            { l: 'Board Settings', icon: Settings, href: '#' },
          ].map(a => (
            <Link key={a.l} to={a.href} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent/5 transition-colors w-full text-[8px] font-medium">
              <a.icon className="h-3 w-3 text-accent" />{a.l}
            </Link>
          ))}
        </div>
      </SectionCard>

      <div className="rounded-2xl border p-2">
        <div className="flex items-center justify-between text-[8px]">
          <span className="flex items-center gap-1 text-[hsl(var(--state-healthy))]"><CheckCircle2 className="h-2.5 w-2.5" />Synced</span>
          <Button variant="ghost" size="sm" className="h-4 text-[7px] gap-0.5 rounded-lg"><RefreshCw className="h-2 w-2" />Refresh</Button>
        </div>
        <div className="text-[6px] text-muted-foreground mt-0.5">Last sync: 2 min ago</div>
      </div>
    </div>
  );

  const bottomSection = (
    <div className="p-3">
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><History className="h-3.5 w-3.5 text-accent" />Activity Log</div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {ACTIVITY_LOG.map((a, i) => (
          <div key={i} className="shrink-0 rounded-xl border bg-card px-3 py-2 min-w-[220px] hover:shadow-sm transition-shadow">
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
      <KPIBand className="mb-3">
        <KPICard label="Total Tasks" value={String(totalTasks)} change={`${doneTasks} done`} trend="up" />
        <KPICard label="In Progress" value={String(TASKS.filter(t => t.status === 'in-progress').length)} change="On track" />
        <KPICard label="Blocked" value={String(blockedTasks)} change={blockedTasks > 0 ? 'Action needed' : 'None'} trend={blockedTasks > 0 ? 'down' : 'up'} />
        <KPICard label="Hours Logged" value={`${totalLogged}h`} change="This sprint" />
      </KPIBand>

      <Tabs defaultValue="main">
        <TabsList className="mb-3 flex-wrap h-auto gap-0.5">
          <TabsTrigger value="main" className="gap-1 text-[10px] h-6 px-2"><LayoutGrid className="h-3 w-3" />Board</TabsTrigger>
          <TabsTrigger value="dependencies" className="gap-1 text-[10px] h-6 px-2"><GitBranch className="h-3 w-3" />Dependencies</TabsTrigger>
          <TabsTrigger value="resources" className="gap-1 text-[10px] h-6 px-2"><Users className="h-3 w-3" />Resources</TabsTrigger>
          <TabsTrigger value="automations" className="gap-1 text-[10px] h-6 px-2"><Workflow className="h-3 w-3" />Automations</TabsTrigger>
        </TabsList>

        <TabsContent value="main">
          <div className="rounded-2xl border bg-card p-3">
            {view === 'board' && <KanbanView tasks={filteredTasks} selectedId={selectedTask?.id || null} onSelect={setSelectedTask} bulkMode={bulkMode} bulkIds={bulkIds} onBulkToggle={toggleBulk} />}
            {view === 'list' && <ListView tasks={filteredTasks} selectedId={selectedTask?.id || null} onSelect={setSelectedTask} bulkMode={bulkMode} bulkIds={bulkIds} onBulkToggle={toggleBulk} />}
            {view === 'swimlanes' && <SwimlanesView tasks={filteredTasks} selectedId={selectedTask?.id || null} onSelect={setSelectedTask} />}
            {view === 'calendar' && <CalendarView tasks={filteredTasks} />}
          </div>
        </TabsContent>

        <TabsContent value="dependencies"><DependencyInspector /></TabsContent>
        <TabsContent value="resources"><ResourceAllocation /></TabsContent>
        <TabsContent value="automations"><AutomationRulesView /></TabsContent>
      </Tabs>

      <TaskDetailDrawer task={selectedTask} open={!!selectedTask} onClose={() => setSelectedTask(null)} />
      <CreateTaskDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
      {bulkMode && bulkIds.size > 0 && <BulkEditTray count={bulkIds.size} onClear={() => setBulkIds(new Set())} />}
    </DashboardLayout>
  );
};

export default TaskBoardPage;
