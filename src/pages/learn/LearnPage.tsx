import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import {
  BookOpen, GraduationCap, Play, Clock, Search, Plus, Award,
  Star, Users, BarChart3, CheckCircle2, AlertTriangle, Lock,
  ChevronRight, History, Bookmark, BookmarkCheck, Eye,
  FileText, Sparkles, Target, Layers, Video, PauseCircle,
  TrendingUp, Calendar, ArrowUpRight, MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

// ── Types ──
type CourseType = 'free' | 'paid' | 'pathway' | 'certificate';
type CourseStatus = 'not_started' | 'in_progress' | 'completed' | 'locked';
type LessonStatus = 'completed' | 'current' | 'upcoming' | 'locked';

interface Course {
  id: string; title: string; instructor: string; instructorAvatar: string;
  type: CourseType; category: string; duration: string; lessons: number;
  completedLessons: number; rating: number; enrolled: number; progress: number;
  status: CourseStatus; description: string; saved: boolean; price?: string;
  tags: string[];
}

interface Lesson {
  id: string; title: string; duration: string; type: 'video' | 'reading' | 'quiz' | 'project';
  status: LessonStatus; order: number;
}

interface Certificate {
  id: string; course: string; issued: string; credential: string; verified: boolean;
}

// ── Mock Data ──
const COURSES: Course[] = [
  { id: 'C-001', title: 'Advanced React Patterns & Architecture', instructor: 'Dr. Sarah Chen', instructorAvatar: 'SC', type: 'paid', category: 'Engineering', duration: '12h 30m', lessons: 24, completedLessons: 18, rating: 4.9, enrolled: 3420, progress: 75, status: 'in_progress', description: 'Master advanced React patterns including compound components, render props, hooks composition, and performance optimization.', saved: true, price: '$49', tags: ['React', 'Architecture', 'Advanced'] },
  { id: 'C-002', title: 'Product Management Fundamentals', instructor: 'Marcus Thompson', instructorAvatar: 'MT', type: 'certificate', category: 'Product', duration: '8h 45m', lessons: 16, completedLessons: 16, rating: 4.8, enrolled: 5210, progress: 100, status: 'completed', description: 'Complete guide to product management from discovery to delivery.', saved: false, tags: ['Product', 'Strategy', 'Agile'] },
  { id: 'C-003', title: 'Data Science with Python', instructor: 'Priya Gupta', instructorAvatar: 'PG', type: 'pathway', category: 'Data', duration: '20h', lessons: 36, completedLessons: 0, rating: 4.7, enrolled: 8900, progress: 0, status: 'not_started', description: 'End-to-end data science pathway from Python basics to ML deployment.', saved: false, tags: ['Python', 'ML', 'Data'] },
  { id: 'C-004', title: 'UX Research Methods', instructor: 'James O\'Brien', instructorAvatar: 'JO', type: 'free', category: 'Design', duration: '5h 15m', lessons: 10, completedLessons: 4, rating: 4.6, enrolled: 2100, progress: 40, status: 'in_progress', description: 'Learn user research methods including interviews, surveys, and usability testing.', saved: true, tags: ['UX', 'Research', 'Design'] },
  { id: 'C-005', title: 'Leadership for Tech Managers', instructor: 'Lina Park', instructorAvatar: 'LP', type: 'paid', category: 'Leadership', duration: '6h', lessons: 12, completedLessons: 0, rating: 4.5, enrolled: 1850, progress: 0, status: 'locked', description: 'Essential leadership skills for engineering managers and tech leads.', saved: false, price: '$39', tags: ['Leadership', 'Management'] },
  { id: 'C-006', title: 'Cloud Architecture on AWS', instructor: 'Alex Rivera', instructorAvatar: 'AR', type: 'certificate', category: 'DevOps', duration: '15h', lessons: 28, completedLessons: 7, rating: 4.8, enrolled: 4300, progress: 25, status: 'in_progress', description: 'Design and deploy scalable cloud architectures using AWS services.', saved: false, tags: ['AWS', 'Cloud', 'DevOps'] },
];

const LESSONS: Lesson[] = [
  { id: 'L-1', title: 'Introduction to Compound Components', duration: '18m', type: 'video', status: 'completed', order: 1 },
  { id: 'L-2', title: 'Render Props Pattern Deep Dive', duration: '24m', type: 'video', status: 'completed', order: 2 },
  { id: 'L-3', title: 'Custom Hooks Composition', duration: '30m', type: 'video', status: 'completed', order: 3 },
  { id: 'L-4', title: 'Knowledge Check: Patterns', duration: '10m', type: 'quiz', status: 'completed', order: 4 },
  { id: 'L-5', title: 'Performance Optimization Techniques', duration: '35m', type: 'video', status: 'current', order: 5 },
  { id: 'L-6', title: 'Memoization Strategies', duration: '20m', type: 'reading', status: 'upcoming', order: 6 },
  { id: 'L-7', title: 'Build a Component Library', duration: '45m', type: 'project', status: 'upcoming', order: 7 },
  { id: 'L-8', title: 'State Management at Scale', duration: '28m', type: 'video', status: 'locked', order: 8 },
];

const CERTIFICATES: Certificate[] = [
  { id: 'CERT-1', course: 'Product Management Fundamentals', issued: 'Mar 2025', credential: 'GIGV-PM-2025-0891', verified: true },
  { id: 'CERT-2', course: 'Intro to Machine Learning', issued: 'Jan 2025', credential: 'GIGV-ML-2025-0234', verified: true },
];

const TYPE_COLORS: Record<CourseType, string> = {
  free: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  paid: 'bg-primary/10 text-primary',
  pathway: 'bg-accent/10 text-accent',
  certificate: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
};

const STATUS_COLORS: Record<CourseStatus, string> = {
  not_started: 'bg-muted text-muted-foreground',
  in_progress: 'bg-accent/10 text-accent',
  completed: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  locked: 'bg-destructive/10 text-destructive',
};

const LESSON_ICONS: Record<string, React.ElementType> = {
  video: Video, reading: FileText, quiz: Target, project: Layers,
};

// ── Course Detail Drawer ──
const CourseDrawer: React.FC<{ course: Course | null; open: boolean; onClose: () => void }> = ({ course, open, onClose }) => {
  if (!course) return null;
  const isLocked = course.status === 'locked';
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[480px] overflow-y-auto">
        <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4 text-accent" />Course Detail</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="pb-3 border-b">
            <div className="text-sm font-bold mb-1">{course.title}</div>
            <div className="flex items-center gap-2 text-[8px] text-muted-foreground">
              <Avatar className="h-5 w-5"><AvatarFallback className="text-[5px]">{course.instructorAvatar}</AvatarFallback></Avatar>
              <span>{course.instructor}</span>
              <span>·</span>
              <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />{course.rating}</span>
              <span>·</span>
              <span>{course.enrolled.toLocaleString()} enrolled</span>
            </div>
          </div>
          <p className="text-[9px] text-muted-foreground">{course.description}</p>

          {course.status === 'in_progress' && (
            <div>
              <div className="flex justify-between text-[8px] mb-1"><span className="text-muted-foreground">Progress</span><span className="font-semibold">{course.progress}%</span></div>
              <Progress value={course.progress} className="h-1.5" />
              <div className="text-[7px] text-muted-foreground mt-0.5">{course.completedLessons}/{course.lessons} lessons</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {[
              { l: 'Duration', v: course.duration, icon: Clock },
              { l: 'Lessons', v: String(course.lessons), icon: Layers },
              { l: 'Category', v: course.category, icon: BookOpen },
              { l: 'Type', v: course.type, icon: Award },
            ].map(m => (
              <div key={m.l} className="rounded-md border p-2 flex items-start gap-1.5">
                <m.icon className="h-3 w-3 text-muted-foreground mt-0.5" />
                <div><div className="text-[7px] text-muted-foreground">{m.l}</div><div className="text-[9px] font-medium capitalize">{m.v}</div></div>
              </div>
            ))}
          </div>

          <div>
            <div className="text-[10px] font-semibold mb-1.5">Curriculum</div>
            <div className="space-y-0.5">
              {LESSONS.map(l => {
                const Icon = LESSON_ICONS[l.type] || FileText;
                return (
                  <div key={l.id} className={cn('flex items-center gap-2 p-1.5 rounded-md text-[8px]', l.status === 'current' && 'bg-accent/5 border border-accent/20', l.status === 'locked' && 'opacity-50')}>
                    {l.status === 'completed' ? <CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]" /> : l.status === 'locked' ? <Lock className="h-3 w-3 text-muted-foreground" /> : <Icon className="h-3 w-3 text-muted-foreground" />}
                    <span className="flex-1">{l.title}</span>
                    <span className="text-muted-foreground">{l.duration}</span>
                    {l.status === 'current' && <Badge className="text-[5px] bg-accent/10 text-accent border-0">Current</Badge>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-1">{course.tags.map(t => <Badge key={t} variant="secondary" className="text-[6px]">{t}</Badge>)}</div>

          {isLocked && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 flex items-start gap-2">
              <Lock className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
              <div className="text-[8px]"><span className="font-semibold">Premium Content.</span> This course requires a paid subscription or one-time purchase ({course.price}).</div>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 border-t pt-3">
            {course.status === 'in_progress' && <Button size="sm" className="h-6 text-[9px] gap-1"><Play className="h-2.5 w-2.5" />Continue Learning</Button>}
            {course.status === 'not_started' && <Button size="sm" className="h-6 text-[9px] gap-1"><BookOpen className="h-2.5 w-2.5" />Enrol Now</Button>}
            {course.status === 'completed' && <Button size="sm" className="h-6 text-[9px] gap-1"><Award className="h-2.5 w-2.5" />View Certificate</Button>}
            {isLocked && <Button size="sm" className="h-6 text-[9px] gap-1"><Lock className="h-2.5 w-2.5" />Unlock · {course.price}</Button>}
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1">{course.saved ? <BookmarkCheck className="h-2.5 w-2.5" /> : <Bookmark className="h-2.5 w-2.5" />}{course.saved ? 'Saved' : 'Save'}</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><Eye className="h-2.5 w-2.5" />Preview</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ── Main Page ──
const LearnPage: React.FC = () => {
  const { activeRole } = useRole();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filtered = COURSES.filter(c => {
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.category.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const topStrip = (
    <>
      <GraduationCap className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold">Learning Library</span>
      <div className="flex-1" />
      <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-6 rounded-md border bg-background px-1.5 text-[8px]">
        <option value="all">All Types</option>
        <option value="free">Free</option>
        <option value="paid">Paid</option>
        <option value="pathway">Pathway</option>
        <option value="certificate">Certificate</option>
      </select>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses..." className="h-6 rounded-md border bg-background pl-7 pr-2 text-[8px] w-40 focus:outline-none focus:ring-1 focus:ring-ring" />
      </div>
      <Button size="sm" className="h-7 text-[10px] gap-1"><Plus className="h-3 w-3" />Create Course</Button>
      <Badge variant="secondary" className="text-[7px] gap-0.5"><Clock className="h-2.5 w-2.5" />Live</Badge>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Continue Learning" icon={<Play className="h-3.5 w-3.5 text-accent" />}>
        <div className="space-y-1.5">
          {COURSES.filter(c => c.status === 'in_progress').slice(0, 3).map(c => (
            <button key={c.id} onClick={() => setSelectedCourse(c)} className="w-full text-left p-1.5 rounded-md hover:bg-muted/30 transition-colors text-[8px]">
              <div className="font-medium truncate">{c.title}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <Progress value={c.progress} className="h-1 flex-1" />
                <span className="text-[6px] text-muted-foreground">{c.progress}%</span>
              </div>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Certificates" icon={<Award className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />}>
        <div className="space-y-1">
          {CERTIFICATES.map(c => (
            <div key={c.id} className="p-1.5 rounded-md border text-[8px]">
              <div className="font-medium truncate">{c.course}</div>
              <div className="flex items-center gap-1 mt-0.5 text-[6px] text-muted-foreground">
                <span>{c.issued}</span>
                {c.verified && <Badge className="text-[5px] bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))] border-0">Verified</Badge>}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Learning Stats" icon={<BarChart3 className="h-3.5 w-3.5 text-primary" />}>
        <div className="space-y-1 text-[8px]">
          {[
            { l: 'Hours This Month', v: '14.5h' },
            { l: 'Streak', v: '12 days' },
            { l: 'Courses Completed', v: '8' },
            { l: 'Certificates Earned', v: '2' },
          ].map(s => (
            <div key={s.l} className="flex justify-between"><span className="text-muted-foreground">{s.l}</span><span className="font-semibold">{s.v}</span></div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Quick Actions">
        <div className="space-y-0.5">
          {[
            { label: 'Browse Catalog', icon: BookOpen },
            { label: 'My Progress', icon: TrendingUp },
            { label: 'Saved Courses', icon: Bookmark },
            { label: 'Certificates', icon: Award },
          ].map(a => (
            <button key={a.label} className="flex items-center gap-2 p-1.5 rounded-md w-full text-left hover:bg-muted/30 transition-colors text-[8px]">
              <a.icon className="h-3 w-3 text-muted-foreground" /><span>{a.label}</span>
              <ChevronRight className="h-2.5 w-2.5 ml-auto text-muted-foreground" />
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const bottomSection = (
    <div className="p-3">
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><History className="h-3.5 w-3.5 text-accent" />Recent Activity</div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {[
          { action: 'Completed lesson "Custom Hooks Composition" in Advanced React Patterns', time: '2h ago', type: 'lesson' },
          { action: 'Earned certificate for Product Management Fundamentals', time: '2d ago', type: 'certificate' },
          { action: 'Enrolled in Data Science with Python pathway', time: '3d ago', type: 'enrolment' },
          { action: 'Scored 92% on Knowledge Check: Patterns quiz', time: '1w ago', type: 'quiz' },
        ].map((a, i) => (
          <div key={i} className="shrink-0 rounded-lg border bg-card px-3 py-2 min-w-[220px]">
            <Badge variant="secondary" className="text-[6px] capitalize mb-1">{a.type}</Badge>
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
        <KPICard label="Enrolled" value="6" change="Active courses" />
        <KPICard label="Completed" value="8" change="All time" trend="up" />
        <KPICard label="Hours Learned" value="142" change="Total" trend="up" />
        <KPICard label="Certificates" value="2" change="Verified" />
      </KPIBand>

      <Tabs defaultValue="catalog">
        <TabsList className="mb-3 flex-wrap h-auto gap-0.5">
          <TabsTrigger value="catalog" className="gap-1 text-[10px] h-6 px-2"><BookOpen className="h-3 w-3" />Catalog</TabsTrigger>
          <TabsTrigger value="my-courses" className="gap-1 text-[10px] h-6 px-2"><Layers className="h-3 w-3" />My Courses</TabsTrigger>
          <TabsTrigger value="progress" className="gap-1 text-[10px] h-6 px-2"><TrendingUp className="h-3 w-3" />Progress</TabsTrigger>
          <TabsTrigger value="certificates" className="gap-1 text-[10px] h-6 px-2"><Award className="h-3 w-3" />Certificates</TabsTrigger>
        </TabsList>

        {/* Catalog */}
        <TabsContent value="catalog">
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(c => (
              <div key={c.id} onClick={() => setSelectedCourse(c)} className={cn('rounded-lg border bg-card p-3 cursor-pointer hover:border-ring/50 transition-colors', c.status === 'locked' && 'opacity-70')}>
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-8 w-8"><AvatarFallback className="text-[7px]">{c.instructorAvatar}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold flex items-center gap-1 truncate">{c.title}{c.saved && <BookmarkCheck className="h-3 w-3 text-accent shrink-0" />}</div>
                    <div className="text-[8px] text-muted-foreground">{c.instructor} · {c.category}</div>
                  </div>
                </div>
                <p className="text-[8px] text-muted-foreground line-clamp-2 mb-2">{c.description}</p>
                {c.status === 'in_progress' && (
                  <div className="mb-2">
                    <div className="flex justify-between text-[7px] mb-0.5"><span className="text-muted-foreground">Progress</span><span className="font-medium">{c.progress}%</span></div>
                    <Progress value={c.progress} className="h-1" />
                  </div>
                )}
                <div className="flex flex-wrap gap-1 mb-2">
                  <Badge className={cn('text-[6px] border-0 capitalize', TYPE_COLORS[c.type])}>{c.type}</Badge>
                  <Badge className={cn('text-[6px] border-0 capitalize', STATUS_COLORS[c.status])}>{c.status.replace('_', ' ')}</Badge>
                  <Badge variant="secondary" className="text-[6px]">{c.duration}</Badge>
                  <Badge variant="secondary" className="text-[6px]">{c.lessons} lessons</Badge>
                </div>
                <div className="flex items-center justify-between text-[8px] text-muted-foreground border-t pt-1.5">
                  <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />{c.rating} · {c.enrolled.toLocaleString()} enrolled</span>
                  {c.price && <Badge variant="secondary" className="text-[6px]">{c.price}</Badge>}
                </div>
                <div className="flex gap-1 mt-2">
                  {c.status === 'in_progress' && <Button size="sm" className="h-5 text-[7px] flex-1 gap-0.5"><Play className="h-2 w-2" />Continue</Button>}
                  {c.status === 'not_started' && <Button size="sm" className="h-5 text-[7px] flex-1 gap-0.5"><BookOpen className="h-2 w-2" />Enrol</Button>}
                  {c.status === 'completed' && <Button variant="outline" size="sm" className="h-5 text-[7px] flex-1 gap-0.5"><Award className="h-2 w-2" />Certificate</Button>}
                  {c.status === 'locked' && <Button variant="outline" size="sm" className="h-5 text-[7px] flex-1 gap-0.5"><Lock className="h-2 w-2" />Unlock</Button>}
                  <Button variant="outline" size="sm" className="h-5 text-[7px] flex-1 gap-0.5"><Eye className="h-2 w-2" />View</Button>
                </div>
              </div>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="rounded-lg border bg-card p-6 text-center">
              <BookOpen className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <div className="text-[10px] font-semibold mb-1">No Courses Found</div>
              <div className="text-[8px] text-muted-foreground">Try adjusting your search or filter criteria.</div>
            </div>
          )}
        </TabsContent>

        {/* My Courses */}
        <TabsContent value="my-courses">
          <div className="space-y-2">
            {COURSES.filter(c => c.status !== 'not_started' && c.status !== 'locked').map(c => (
              <div key={c.id} onClick={() => setSelectedCourse(c)} className="rounded-lg border bg-card p-3 cursor-pointer hover:border-ring/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8"><AvatarFallback className="text-[7px]">{c.instructorAvatar}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold truncate">{c.title}</div>
                    <div className="text-[8px] text-muted-foreground">{c.instructor} · {c.category}</div>
                  </div>
                  <Badge className={cn('text-[6px] border-0 capitalize', STATUS_COLORS[c.status])}>{c.status.replace('_', ' ')}</Badge>
                </div>
                {c.status === 'in_progress' && (
                  <div className="mt-2 ml-11">
                    <div className="flex justify-between text-[7px] mb-0.5"><span className="text-muted-foreground">{c.completedLessons}/{c.lessons} lessons</span><span className="font-medium">{c.progress}%</span></div>
                    <Progress value={c.progress} className="h-1" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Progress */}
        <TabsContent value="progress">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Learning Streak', value: '12 days', icon: Sparkles, color: 'text-[hsl(var(--gigvora-amber))]' },
                { label: 'This Week', value: '4.5h', icon: Clock, color: 'text-accent' },
                { label: 'Avg Score', value: '87%', icon: Target, color: 'text-primary' },
              ].map(s => (
                <div key={s.label} className="rounded-lg border bg-card p-3 text-center">
                  <s.icon className={cn('h-5 w-5 mx-auto mb-1', s.color)} />
                  <div className="text-sm font-bold">{s.value}</div>
                  <div className="text-[7px] text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>

            <SectionCard title="Course Progress">
              <div className="space-y-2">
                {COURSES.filter(c => c.status === 'in_progress').map(c => (
                  <div key={c.id} className="flex items-center gap-2 text-[9px]">
                    <span className="font-medium w-48 truncate">{c.title}</span>
                    <Progress value={c.progress} className="h-1.5 flex-1" />
                    <span className="text-muted-foreground w-8 text-right">{c.progress}%</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <div className="rounded-lg border border-[hsl(var(--gigvora-amber))]/30 bg-[hsl(var(--gigvora-amber))]/5 p-2.5 flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))] shrink-0 mt-0.5" />
              <div className="text-[8px]"><span className="font-semibold">Keep Going!</span> You're 2 lessons away from completing Advanced React Patterns. Finish this week to maintain your streak.</div>
            </div>
          </div>
        </TabsContent>

        {/* Certificates */}
        <TabsContent value="certificates">
          <div className="space-y-3">
            {CERTIFICATES.map(c => (
              <div key={c.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[hsl(var(--gigvora-amber))]/10 flex items-center justify-center"><Award className="h-5 w-5 text-[hsl(var(--gigvora-amber))]" /></div>
                  <div className="flex-1">
                    <div className="text-[11px] font-semibold">{c.course}</div>
                    <div className="text-[8px] text-muted-foreground">Issued {c.issued} · {c.credential}</div>
                  </div>
                  {c.verified && <Badge className="text-[6px] bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))] border-0 gap-0.5"><CheckCircle2 className="h-2 w-2" />Verified</Badge>}
                </div>
                <div className="flex gap-1 mt-2 ml-13">
                  <Button variant="outline" size="sm" className="h-5 text-[7px] gap-0.5"><Eye className="h-2 w-2" />View</Button>
                  <Button variant="outline" size="sm" className="h-5 text-[7px] gap-0.5"><ArrowUpRight className="h-2 w-2" />Share</Button>
                </div>
              </div>
            ))}

            {CERTIFICATES.length === 0 && (
              <div className="rounded-lg border bg-card p-6 text-center">
                <Award className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <div className="text-[10px] font-semibold mb-1">No Certificates Yet</div>
                <div className="text-[8px] text-muted-foreground">Complete a certificate course to earn your first credential.</div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <CourseDrawer course={selectedCourse} open={!!selectedCourse} onClose={() => setSelectedCourse(null)} />
    </DashboardLayout>
  );
};

export default LearnPage;
