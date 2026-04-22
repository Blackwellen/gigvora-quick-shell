import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { List, Plus, Filter, Search, ArrowUpDown } from 'lucide-react';

const TASKS = [
  { id: 'T-101', title: 'Setup CI/CD pipeline', assignee: 'Sarah K.', status: 'done' as const, priority: 'High', due: 'Apr 10', estimate: '4h' },
  { id: 'T-102', title: 'Design landing page', assignee: 'Lisa P.', status: 'in-progress' as const, priority: 'High', due: 'Apr 16', estimate: '8h' },
  { id: 'T-103', title: 'Implement auth flow', assignee: 'Mike L.', status: 'in-progress' as const, priority: 'Critical', due: 'Apr 15', estimate: '12h' },
  { id: 'T-104', title: 'Write API docs', assignee: 'James R.', status: 'todo' as const, priority: 'Medium', due: 'Apr 20', estimate: '6h' },
  { id: 'T-105', title: 'Database migration', assignee: 'Sarah K.', status: 'todo' as const, priority: 'High', due: 'Apr 18', estimate: '3h' },
  { id: 'T-106', title: 'Mobile responsive fixes', assignee: 'Lisa P.', status: 'blocked' as const, priority: 'Medium', due: 'Apr 22', estimate: '5h' },
];

const statusMap = { 'done': 'healthy', 'in-progress': 'caution', 'todo': 'pending', 'blocked': 'blocked' } as const;

export default function ProjectTaskTablePage() {
  const [search, setSearch] = useState('');
  const filtered = TASKS.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-3 w-full">
          <List className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold">Task Table</h1>
          <Badge variant="secondary" className="text-[9px]">{TASKS.length} tasks</Badge>
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><Filter className="h-3 w-3" /> Filter</Button>
          <Button size="sm" className="h-7 text-[10px] gap-1"><Plus className="h-3 w-3" /> Add Task</Button>
        </div>
      }
    >
      <SectionCard>
        <div className="relative max-w-sm mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px] h-8">ID</TableHead>
              <TableHead className="text-[10px] h-8">Task</TableHead>
              <TableHead className="text-[10px] h-8">Assignee</TableHead>
              <TableHead className="text-[10px] h-8">Status</TableHead>
              <TableHead className="text-[10px] h-8">Priority</TableHead>
              <TableHead className="text-[10px] h-8">Due</TableHead>
              <TableHead className="text-[10px] h-8">Est.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(t => (
              <TableRow key={t.id} className="cursor-pointer">
                <TableCell className="text-[10px] font-mono py-2">{t.id}</TableCell>
                <TableCell className="text-[10px] font-medium py-2">{t.title}</TableCell>
                <TableCell className="text-[10px] py-2">{t.assignee}</TableCell>
                <TableCell className="py-2"><StatusBadge status={statusMap[t.status]} label={t.status} /></TableCell>
                <TableCell className="py-2"><Badge variant={t.priority === 'Critical' ? 'destructive' : 'outline'} className="text-[8px] h-3.5">{t.priority}</Badge></TableCell>
                <TableCell className="text-[10px] py-2">{t.due}</TableCell>
                <TableCell className="text-[10px] py-2">{t.estimate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </DashboardLayout>
  );
}
