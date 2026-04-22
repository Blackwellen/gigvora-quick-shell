import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  Settings, Globe, Search, FileText, Link2, Eye, BarChart3,
  Plus, Trash2, Edit, ChevronRight, CheckCircle2, AlertTriangle,
  ArrowRight, ExternalLink, Layers, Layout, Menu, Image,
  Star, TrendingUp, Megaphone, Target, Sparkles, Copy,
  GripVertical, ChevronDown, ChevronUp, MoreHorizontal,
  Shield, Clock, Zap, RefreshCw, Monitor, Smartphone,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Homepage Sections Manager ──
const HomepageSectionsManager: React.FC = () => {
  const [sections, setSections] = useState([
    { id: 's1', name: 'Hero Banner', visible: true, order: 1, type: 'hero' },
    { id: 's2', name: 'Featured Jobs', visible: true, order: 2, type: 'featured' },
    { id: 's3', name: 'Top Gig Sellers', visible: true, order: 3, type: 'carousel' },
    { id: 's4', name: 'Trending Projects', visible: true, order: 4, type: 'grid' },
    { id: 's5', name: 'Success Stories', visible: true, order: 5, type: 'testimonials' },
    { id: 's6', name: 'Enterprise CTA', visible: false, order: 6, type: 'cta' },
    { id: 's7', name: 'Category Browser', visible: true, order: 7, type: 'grid' },
    { id: 's8', name: 'Promoted Content', visible: true, order: 8, type: 'sponsored' },
    { id: 's9', name: 'Platform Stats', visible: true, order: 9, type: 'stats' },
    { id: 's10', name: 'Newsletter CTA', visible: false, order: 10, type: 'cta' },
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Homepage Sections</h3>
        <Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Add Section</Button>
      </div>
      <p className="text-sm text-muted-foreground">Drag to reorder. Toggle visibility without deleting.</p>
      <div className="space-y-2">
        {sections.map((s, i) => (
          <div key={s.id} className={cn('flex items-center gap-3 p-3 rounded-lg border', !s.visible && 'opacity-50')}>
            <GripVertical className="h-4 w-4 text-muted-foreground/30 cursor-grab" />
            <div className="h-8 w-8 rounded bg-accent/10 flex items-center justify-center text-xs font-bold text-accent">{i + 1}</div>
            <div className="flex-1">
              <div className="text-sm font-medium">{s.name}</div>
              <div className="text-[10px] text-muted-foreground">{s.type}</div>
            </div>
            <Badge variant="secondary" className="text-[10px]">{s.type}</Badge>
            <Switch checked={s.visible} onCheckedChange={v => setSections(sections.map(sec => sec.id === s.id ? { ...sec, visible: v } : sec))} />
            <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3 w-3" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-3 w-3" /></Button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button className="gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Save Layout</Button>
        <Button variant="outline" className="gap-1"><Eye className="h-3.5 w-3.5" /> Preview</Button>
      </div>
    </div>
  );
};

// ── Page Settings Manager ──
const PageSettingsManager: React.FC = () => {
  const pages = [
    { path: '/', title: 'Gigvora — Enterprise Hybrid Platform', description: 'Connect with top talent, find gigs, and grow your business.', indexed: true, published: true, lastModified: 'Apr 8' },
    { path: '/jobs', title: 'Jobs — Browse Opportunities', description: 'Find your next role from thousands of job listings.', indexed: true, published: true, lastModified: 'Apr 7' },
    { path: '/gigs', title: 'Gigs — Freelance Services', description: 'Explore freelance services and hire top sellers.', indexed: true, published: true, lastModified: 'Apr 6' },
    { path: '/projects', title: 'Projects — Collaborative Work', description: 'Browse and post project opportunities.', indexed: true, published: true, lastModified: 'Apr 5' },
    { path: '/pricing', title: 'Pricing — Plans & Features', description: 'Choose the right plan for your needs.', indexed: true, published: true, lastModified: 'Apr 3' },
    { path: '/about', title: 'About Gigvora', description: 'Our mission, team, and story.', indexed: true, published: true, lastModified: 'Mar 28' },
    { path: '/blog/startup-guide', title: 'Startup Guide 2026', description: 'How to launch your startup on Gigvora.', indexed: true, published: true, lastModified: 'Apr 1' },
    { path: '/careers', title: 'Careers at Gigvora', description: 'Join our team and shape the future of work.', indexed: false, published: false, lastModified: 'Mar 15' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Page Settings</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1"><Search className="h-3.5 w-3.5" /> Search Pages</Button>
          <Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> New Page</Button>
        </div>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50"><tr>
            <th className="text-left px-4 py-2 text-xs font-medium">Page</th>
            <th className="text-left px-4 py-2 text-xs font-medium">SEO Title</th>
            <th className="text-left px-4 py-2 text-xs font-medium">Indexed</th>
            <th className="text-left px-4 py-2 text-xs font-medium">Published</th>
            <th className="text-left px-4 py-2 text-xs font-medium">Modified</th>
            <th className="px-4 py-2"></th>
          </tr></thead>
          <tbody>
            {pages.map(p => (
              <tr key={p.path} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="font-mono text-xs text-accent">{p.path}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs font-medium">{p.title}</div>
                  <div className="text-[10px] text-muted-foreground truncate max-w-[200px]">{p.description}</div>
                </td>
                <td className="px-4 py-3">{p.indexed ? <CheckCircle2 className="h-4 w-4 text-gigvora-green" /> : <AlertTriangle className="h-4 w-4 text-gigvora-amber" />}</td>
                <td className="px-4 py-3">{p.published ? <Badge className="text-[10px] bg-gigvora-green/10 text-gigvora-green">Live</Badge> : <Badge variant="secondary" className="text-[10px]">Draft</Badge>}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{p.lastModified}</td>
                <td className="px-4 py-3"><Button variant="ghost" size="sm" className="h-7 text-xs">Edit</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Navigation Schema Editor ──
const NavigationSchemaEditor: React.FC = () => {
  const menus = [
    { name: 'Public Top Bar', items: 6, type: 'mega-menu', status: 'active' },
    { name: 'Logged-In Bottom Bar', items: 10, type: 'mega-menu', status: 'active' },
    { name: 'Avatar Dropdown', items: 7, type: 'dropdown', status: 'active' },
    { name: 'Footer Navigation', items: 5, type: 'columns', status: 'active' },
    { name: 'Mobile Drawer', items: 12, type: 'drawer', status: 'active' },
  ];

  const megaMenuPreview = [
    { label: 'Product', columns: 3, items: 9 },
    { label: 'Solutions', columns: 2, items: 7 },
    { label: 'Discover', columns: 2, items: 7 },
    { label: 'Pricing', columns: 0, items: 0 },
    { label: 'Trust & Safety', columns: 0, items: 0 },
    { label: 'Support', columns: 0, items: 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Navigation Schema</h3>
        <Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> New Menu</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Menu List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Menus</h4>
          {menus.map(m => (
            <div key={m.name} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 cursor-pointer">
              <div className="flex items-center gap-3">
                <Menu className="h-4 w-4 text-accent" />
                <div>
                  <div className="text-sm font-medium">{m.name}</div>
                  <div className="text-[10px] text-muted-foreground">{m.items} items · {m.type}</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs"><Edit className="h-3 w-3" /></Button>
            </div>
          ))}
        </div>

        {/* Mega Menu Preview */}
        <div className="rounded-xl border bg-card p-5">
          <h4 className="text-sm font-medium mb-3">Public Mega Menu Preview</h4>
          <div className="flex gap-1 flex-wrap mb-4">
            {megaMenuPreview.map(m => (
              <div key={m.label} className="px-3 py-1.5 rounded-md bg-muted/50 text-xs font-medium flex items-center gap-1">
                {m.label}
                {m.columns > 0 && <Badge variant="secondary" className="text-[8px] h-4 ml-1">{m.columns}col</Badge>}
              </div>
            ))}
          </div>
          <div className="rounded-lg border p-3 bg-muted/30">
            <div className="text-xs font-medium mb-2">Product Menu (3 columns × 3 items)</div>
            <div className="grid grid-cols-3 gap-2">
              {['Marketplace', 'Professional Tools', 'Growth & Community'].map(col => (
                <div key={col} className="text-[10px]">
                  <div className="font-semibold text-muted-foreground uppercase mb-1">{col}</div>
                  <div className="space-y-0.5">
                    {['Item 1', 'Item 2', 'Item 3'].map(item => (
                      <div key={item} className="h-5 bg-background rounded px-2 flex items-center text-muted-foreground/50">{item}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-3 w-full text-xs gap-1"><Edit className="h-3 w-3" /> Edit Mega Menu Structure</Button>
        </div>
      </div>
    </div>
  );
};

// ── SEO Console ──
const SEOConsole: React.FC = () => {
  const seoScore = 78;
  const issues = [
    { severity: 'error', page: '/careers', issue: 'Missing meta description', fix: 'Add a 150-160 character meta description' },
    { severity: 'warning', page: '/gigs', issue: 'Title too long (72 chars)', fix: 'Shorten to under 60 characters' },
    { severity: 'warning', page: '/projects', issue: 'No Open Graph image', fix: 'Add og:image meta tag' },
    { severity: 'info', page: '/pricing', issue: 'Missing JSON-LD schema', fix: 'Add Product schema markup' },
    { severity: 'info', page: '/', issue: 'H1 tag could be more descriptive', fix: 'Include primary keyword in H1' },
  ];

  const sitemapPages = [
    { url: '/', priority: '1.0', changefreq: 'daily', lastmod: 'Apr 8' },
    { url: '/jobs', priority: '0.9', changefreq: 'hourly', lastmod: 'Apr 8' },
    { url: '/gigs', priority: '0.9', changefreq: 'hourly', lastmod: 'Apr 8' },
    { url: '/projects', priority: '0.8', changefreq: 'daily', lastmod: 'Apr 7' },
    { url: '/pricing', priority: '0.7', changefreq: 'weekly', lastmod: 'Apr 3' },
    { url: '/about', priority: '0.5', changefreq: 'monthly', lastmod: 'Mar 28' },
  ];

  return (
    <div className="space-y-6">
      {/* Score */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-5 text-center md:col-span-1">
          <div className={cn('text-4xl font-bold mb-1', seoScore >= 80 ? 'text-gigvora-green' : seoScore >= 60 ? 'text-gigvora-amber' : 'text-destructive')}>{seoScore}</div>
          <div className="text-xs text-muted-foreground">SEO Score</div>
          <Progress value={seoScore} className="h-2 mt-2" />
        </div>
        {[
          { label: 'Indexed Pages', value: '42', icon: Globe },
          { label: 'Crawl Errors', value: '3', icon: AlertTriangle },
          { label: 'Avg. Position', value: '14.2', icon: TrendingUp },
        ].map(s => (
          <div key={s.label} className="rounded-xl border bg-card p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center"><s.icon className="h-5 w-5 text-accent" /></div>
            <div><div className="text-xl font-bold">{s.value}</div><div className="text-xs text-muted-foreground">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Issues */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold text-sm mb-3">SEO Issues</h3>
        <div className="space-y-2">
          {issues.map((issue, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
              {issue.severity === 'error' ? <AlertTriangle className="h-4 w-4 text-destructive shrink-0" /> :
               issue.severity === 'warning' ? <AlertTriangle className="h-4 w-4 text-gigvora-amber shrink-0" /> :
               <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />}
              <div className="flex-1">
                <div className="text-sm font-medium">{issue.issue}</div>
                <div className="text-[10px] text-muted-foreground"><span className="font-mono">{issue.page}</span> · {issue.fix}</div>
              </div>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><Sparkles className="h-3 w-3" /> Auto-fix</Button>
            </div>
          ))}
        </div>
      </div>

      {/* Global SEO Settings */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-semibold text-sm mb-3">Global Meta Tags</h3>
          <div className="space-y-3">
            <div><label className="text-xs font-medium block mb-1">Default Title Suffix</label><input className="w-full h-8 rounded-md border bg-background px-3 text-xs" defaultValue=" — Gigvora" /></div>
            <div><label className="text-xs font-medium block mb-1">Default OG Image</label><div className="h-20 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground/50 text-xs"><Image className="h-4 w-4 mr-1" /> Upload default social image</div></div>
            <div><label className="text-xs font-medium block mb-1">Canonical URL Base</label><input className="w-full h-8 rounded-md border bg-background px-3 text-xs" defaultValue="https://gigvora.com" /></div>
            <div className="flex items-center gap-2"><Switch defaultChecked /><span className="text-xs">Auto-generate canonical tags</span></div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-semibold text-sm mb-3">Sitemap & Robots</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 text-xs"><Globe className="h-3.5 w-3.5 text-accent" /> sitemap.xml</div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-6 text-[10px]"><Eye className="h-3 w-3 mr-1" /> View</Button>
                <Button variant="ghost" size="sm" className="h-6 text-[10px]"><RefreshCw className="h-3 w-3 mr-1" /> Regenerate</Button>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 text-xs"><Shield className="h-3.5 w-3.5 text-accent" /> robots.txt</div>
              <Button variant="ghost" size="sm" className="h-6 text-[10px]"><Edit className="h-3 w-3 mr-1" /> Edit</Button>
            </div>
            <div className="rounded-lg border overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-[10px]">
                <thead className="bg-muted/50"><tr><th className="text-left px-3 py-1.5">URL</th><th className="text-left px-3 py-1.5">Priority</th><th className="text-left px-3 py-1.5">Freq</th><th className="text-left px-3 py-1.5">Modified</th></tr></thead>
                <tbody>{sitemapPages.map(p => (
                  <tr key={p.url} className="border-t"><td className="px-3 py-1.5 font-mono">{p.url}</td><td className="px-3 py-1.5">{p.priority}</td><td className="px-3 py-1.5">{p.changefreq}</td><td className="px-3 py-1.5">{p.lastmod}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Schema Markup */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold text-sm mb-3">Structured Data (JSON-LD)</h3>
        <div className="grid md:grid-cols-3 gap-3">
          {[
            { type: 'Organization', pages: 'All pages', status: 'active' },
            { type: 'JobPosting', pages: '/jobs/*', status: 'active' },
            { type: 'Product', pages: '/gigs/*', status: 'active' },
            { type: 'BreadcrumbList', pages: 'All pages', status: 'active' },
            { type: 'FAQPage', pages: '/faq', status: 'active' },
            { type: 'Event', pages: '/events/*', status: 'missing' },
          ].map(s => (
            <div key={s.type} className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <div className="text-xs font-medium">{s.type}</div>
                <div className="text-[10px] text-muted-foreground">{s.pages}</div>
              </div>
              {s.status === 'active' ? <CheckCircle2 className="h-4 w-4 text-gigvora-green" /> : <AlertTriangle className="h-4 w-4 text-gigvora-amber" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Redirects Manager ──
const RedirectsManager: React.FC = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="font-semibold">URL Redirects</h3>
      <Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Add Redirect</Button>
    </div>
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50"><tr>
          <th className="text-left px-4 py-2 text-xs font-medium">From</th>
          <th className="text-left px-4 py-2 text-xs font-medium">To</th>
          <th className="text-left px-4 py-2 text-xs font-medium">Type</th>
          <th className="text-left px-4 py-2 text-xs font-medium">Hits</th>
          <th className="px-4 py-2"></th>
        </tr></thead>
        <tbody>
          {[
            { from: '/freelancers', to: '/gigs', type: '301', hits: 1240 },
            { from: '/hire', to: '/jobs', type: '301', hits: 890 },
            { from: '/talent', to: '/explore?type=talent', type: '302', hits: 456 },
            { from: '/blog/old-post', to: '/blog/updated-post', type: '301', hits: 123 },
            { from: '/marketplace', to: '/gigs', type: '301', hits: 78 },
          ].map(r => (
            <tr key={r.from} className="border-t hover:bg-muted/30">
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.from}</td>
              <td className="px-4 py-3 font-mono text-xs text-accent">{r.to}</td>
              <td className="px-4 py-3"><Badge variant="secondary" className="text-[10px]">{r.type}</Badge></td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{r.hits.toLocaleString()}</td>
              <td className="px-4 py-3"><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-6 w-6"><Edit className="h-3 w-3" /></Button><Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 className="h-3 w-3" /></Button></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ── Discoverability Tuning ──
const DiscoverabilityTuning: React.FC = () => (
  <div className="space-y-4">
    <h3 className="font-semibold">Discoverability & Ranking</h3>
    <p className="text-sm text-muted-foreground">Control how content surfaces across search, explore, feed, and promotional placements.</p>

    <div className="grid md:grid-cols-2 gap-4">
      <div className="rounded-xl border bg-card p-5">
        <h4 className="font-semibold text-sm mb-3">Content Ranking Signals</h4>
        <div className="space-y-3">
          {[
            { signal: 'Recency', weight: 30, desc: 'Newer content ranks higher' },
            { signal: 'Engagement', weight: 25, desc: 'Likes, comments, shares boost ranking' },
            { signal: 'Relevance', weight: 20, desc: 'Match to user interests and search query' },
            { signal: 'Quality Score', weight: 15, desc: 'Profile completeness, reviews, verification' },
            { signal: 'Paid Boost', weight: 10, desc: 'Promoted/sponsored placement premium' },
          ].map(s => (
            <div key={s.signal}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium">{s.signal}</span>
                <span className="text-muted-foreground">{s.weight}%</span>
              </div>
              <Progress value={s.weight} className="h-1.5 mb-0.5" />
              <div className="text-[10px] text-muted-foreground">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h4 className="font-semibold text-sm mb-3">Promotional Placement Controls</h4>
        <div className="space-y-3">
          {[
            { slot: 'Feed Top Card', type: 'Sponsored Post', enabled: true },
            { slot: 'Explorer Featured', type: 'Promoted Profile/Gig', enabled: true },
            { slot: 'Search Results Sidebar', type: 'Sponsored Job', enabled: true },
            { slot: 'Category Page Banner', type: 'Ad Creative', enabled: false },
            { slot: 'Job Detail Similar', type: 'Promoted Job', enabled: true },
            { slot: 'Gig Detail Upsell', type: 'Bundle Promo', enabled: true },
          ].map(slot => (
            <div key={slot.slot} className="flex items-center justify-between p-2 rounded-lg border">
              <div>
                <div className="text-xs font-medium">{slot.slot}</div>
                <div className="text-[10px] text-muted-foreground">{slot.type}</div>
              </div>
              <Switch defaultChecked={slot.enabled} />
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="rounded-xl border bg-card p-5">
      <h4 className="font-semibold text-sm mb-3">Search Engine Visibility</h4>
      <div className="space-y-2">
        {[
          { section: 'Job listings', indexed: true, desc: 'Public job pages appear in Google results' },
          { section: 'Gig pages', indexed: true, desc: 'Public gig pages appear in search results' },
          { section: 'User profiles', indexed: true, desc: 'Public profiles are crawlable' },
          { section: 'Company pages', indexed: true, desc: 'Company/startup pages are indexed' },
          { section: 'Forum/group posts', indexed: false, desc: 'Community content kept behind login' },
        ].map(s => (
          <div key={s.section} className="flex items-center justify-between p-2 rounded-lg">
            <div>
              <div className="text-xs font-medium">{s.section}</div>
              <div className="text-[10px] text-muted-foreground">{s.desc}</div>
            </div>
            <Switch defaultChecked={s.indexed} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── MAIN PAGE ──
const WebsiteSettingsPage: React.FC = () => (
  <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="h-6 w-6 text-accent" /> Website Settings</h1>
        <p className="text-sm text-muted-foreground">Homepage layout, pages, navigation, SEO, redirects, and discoverability</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="gap-1"><Monitor className="h-3.5 w-3.5" /> Desktop Preview</Button>
        <Button variant="outline" size="sm" className="gap-1"><Smartphone className="h-3.5 w-3.5" /> Mobile Preview</Button>
      </div>
    </div>

    <Tabs defaultValue="homepage">
      <TabsList className="mb-4 flex-wrap h-auto gap-1">
        <TabsTrigger value="homepage" className="text-xs gap-1"><Layout className="h-3 w-3" /> Homepage</TabsTrigger>
        <TabsTrigger value="pages" className="text-xs gap-1"><FileText className="h-3 w-3" /> Pages</TabsTrigger>
        <TabsTrigger value="navigation" className="text-xs gap-1"><Menu className="h-3 w-3" /> Navigation</TabsTrigger>
        <TabsTrigger value="seo" className="text-xs gap-1"><Search className="h-3 w-3" /> SEO Console</TabsTrigger>
        <TabsTrigger value="redirects" className="text-xs gap-1"><Link2 className="h-3 w-3" /> Redirects</TabsTrigger>
        <TabsTrigger value="discoverability" className="text-xs gap-1"><Eye className="h-3 w-3" /> Discoverability</TabsTrigger>
      </TabsList>

      <TabsContent value="homepage"><HomepageSectionsManager /></TabsContent>
      <TabsContent value="pages"><PageSettingsManager /></TabsContent>
      <TabsContent value="navigation"><NavigationSchemaEditor /></TabsContent>
      <TabsContent value="seo"><SEOConsole /></TabsContent>
      <TabsContent value="redirects"><RedirectsManager /></TabsContent>
      <TabsContent value="discoverability"><DiscoverabilityTuning /></TabsContent>
    </Tabs>
  </div>
);

export default WebsiteSettingsPage;
