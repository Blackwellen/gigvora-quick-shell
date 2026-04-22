import React, { useState } from 'react';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Building2, Shield, Bell, CreditCard, Link2, Globe, Save, Upload, ArrowLeft, Settings, Users, Palette, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function OrgSettingsPage() {
  const [orgName, setOrgName] = useState('Acme Corporation');
  const [domain, setDomain] = useState('acme.com');
  const [website, setWebsite] = useState('https://acme.com');
  const [industry, setIndustry] = useState('Technology');

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="h-4 w-4" /></Link>
            <h1 className="text-xl font-bold flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Organization Settings</h1>
          </div>
          <p className="text-xs text-muted-foreground ml-6">Manage your organization profile, security, billing, and integrations</p>
        </div>
        <Button onClick={() => toast.success('Settings saved')} className="h-9 text-xs rounded-xl gap-1.5"><Save className="h-3.5 w-3.5" />Save Changes</Button>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="h-9 rounded-xl bg-muted/50 flex-wrap">
          <TabsTrigger value="profile" className="text-xs rounded-lg gap-1"><Building2 className="h-3 w-3" />Profile</TabsTrigger>
          <TabsTrigger value="branding" className="text-xs rounded-lg gap-1"><Palette className="h-3 w-3" />Branding</TabsTrigger>
          <TabsTrigger value="security" className="text-xs rounded-lg gap-1"><Shield className="h-3 w-3" />Security</TabsTrigger>
          <TabsTrigger value="billing" className="text-xs rounded-lg gap-1"><CreditCard className="h-3 w-3" />Billing</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs rounded-lg gap-1"><Bell className="h-3 w-3" />Notifications</TabsTrigger>
          <TabsTrigger value="integrations" className="text-xs rounded-lg gap-1"><Link2 className="h-3 w-3" />Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4 space-y-4">
          <SectionCard title="Organization Profile" icon={<Building2 className="h-3.5 w-3.5 text-primary" />} className="!rounded-2xl">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="text-xs font-medium mb-1.5 block">Organization Name</label><Input value={orgName} onChange={e => setOrgName(e.target.value)} className="h-10 rounded-xl" /></div>
                <div><label className="text-xs font-medium mb-1.5 block">Primary Domain</label><Input value={domain} onChange={e => setDomain(e.target.value)} className="h-10 rounded-xl" /></div>
                <div><label className="text-xs font-medium mb-1.5 block">Website</label><Input value={website} onChange={e => setWebsite(e.target.value)} className="h-10 rounded-xl" /></div>
                <div><label className="text-xs font-medium mb-1.5 block">Industry</label><Input value={industry} onChange={e => setIndustry(e.target.value)} className="h-10 rounded-xl" /></div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">About</label>
                <textarea className="w-full min-h-[80px] rounded-xl border bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" defaultValue="Leading technology company delivering innovative enterprise solutions." />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Team Overview" icon={<Users className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
            <KPIBand>
              <KPICard label="Total Seats" value="25" />
              <KPICard label="Active Members" value="18" change="72% utilized" />
              <KPICard label="Departments" value="6" />
              <KPICard label="Admins" value="3" />
            </KPIBand>
            <Link to="/team"><Button variant="outline" className="mt-3 h-8 text-[10px] rounded-xl gap-1"><Users className="h-3 w-3" />Manage Team</Button></Link>
          </SectionCard>
        </TabsContent>

        <TabsContent value="branding" className="mt-4 space-y-4">
          <SectionCard title="Logo & Branding" icon={<Palette className="h-3.5 w-3.5 text-primary" />} className="!rounded-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-medium mb-2 block">Organization Logo</label>
                <div className="border-2 border-dashed rounded-2xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-[10px] text-muted-foreground">Drop your logo here or click to upload</p>
                  <p className="text-[9px] text-muted-foreground mt-1">PNG, SVG up to 2MB</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-2 block">Cover Image</label>
                <div className="border-2 border-dashed rounded-2xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-[10px] text-muted-foreground">Drop your cover here or click to upload</p>
                  <p className="text-[9px] text-muted-foreground mt-1">PNG, JPG up to 5MB · 1200×400px recommended</p>
                </div>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="security" className="mt-4 space-y-4">
          <SectionCard title="Access & Security" icon={<Shield className="h-3.5 w-3.5 text-primary" />} className="!rounded-2xl">
            <div className="space-y-3">
              {[
                { label: 'SSO Enforcement', desc: 'Require SSO for all team members', on: false },
                { label: 'Two-Factor Authentication', desc: 'Enforce 2FA for all seats', on: true },
                { label: 'Domain Verification', desc: 'Only allow emails from verified domains', on: true },
                { label: 'Approval Chain Required', desc: 'All spend requires at least one approver', on: true },
                { label: 'Auto-Remove Inactive', desc: 'Remove seats inactive for 30+ days', on: false },
                { label: 'IP Allowlisting', desc: 'Restrict access to approved IP ranges', on: false },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-2.5 border-b border-border/10 last:border-0">
                  <div>
                    <div className="text-xs font-medium flex items-center gap-1.5">{s.label} {s.on && <Lock className="h-3 w-3 text-primary" />}</div>
                    <div className="text-[10px] text-muted-foreground">{s.desc}</div>
                  </div>
                  <Switch defaultChecked={s.on} />
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="billing" className="mt-4 space-y-4">
          <SectionCard title="Billing & Subscription" icon={<CreditCard className="h-3.5 w-3.5 text-primary" />} className="!rounded-2xl">
            <div className="bg-primary/5 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold">Enterprise Plan</div>
                  <div className="text-[10px] text-muted-foreground">25 seats · Billed annually</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">$249<span className="text-xs text-muted-foreground font-normal">/mo</span></div>
                  <div className="text-[9px] text-muted-foreground">Next billing: May 1, 2026</div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 text-xs">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium">•••• 4242</span>
              </div>
              <div className="flex items-center justify-between py-2 text-xs">
                <span className="text-muted-foreground">Billing Email</span>
                <span className="font-medium">billing@acme.com</span>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" className="h-8 text-[10px] rounded-xl">Update Payment</Button>
              <Button variant="outline" className="h-8 text-[10px] rounded-xl">View Invoices</Button>
              <Button variant="outline" className="h-8 text-[10px] rounded-xl">Change Plan</Button>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4 space-y-4">
          <SectionCard title="Notification Preferences" icon={<Bell className="h-3.5 w-3.5 text-primary" />} className="!rounded-2xl">
            <div className="space-y-3">
              {[
                { label: 'New member joins', desc: 'Get notified when someone accepts an invitation', on: true },
                { label: 'Spend approvals', desc: 'Notify admins of pending spend approvals', on: true },
                { label: 'Security alerts', desc: 'Failed login attempts and suspicious activity', on: true },
                { label: 'Weekly digest', desc: 'Summary of team activity and metrics', on: false },
                { label: 'Product updates', desc: 'New features and platform changes', on: true },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-2">
                  <div><div className="text-xs font-medium">{s.label}</div><div className="text-[10px] text-muted-foreground">{s.desc}</div></div>
                  <Switch defaultChecked={s.on} />
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="integrations" className="mt-4 space-y-4">
          <SectionCard title="Connected Integrations" icon={<Link2 className="h-3.5 w-3.5 text-primary" />} className="!rounded-2xl">
            <div className="space-y-2">
              {[
                { name: 'Slack', status: 'Connected', desc: 'Team notifications and alerts' },
                { name: 'Google Workspace', status: 'Connected', desc: 'SSO and calendar sync' },
                { name: 'Salesforce', status: 'Not Connected', desc: 'CRM data sync' },
                { name: 'HubSpot', status: 'Not Connected', desc: 'Marketing automation' },
                { name: 'Notion', status: 'Not Connected', desc: 'Knowledge base sync' },
              ].map(int => (
                <div key={int.name} className="flex items-center justify-between py-3 border-b border-border/10 last:border-0">
                  <div>
                    <div className="text-xs font-semibold">{int.name}</div>
                    <div className="text-[10px] text-muted-foreground">{int.desc}</div>
                  </div>
                  {int.status === 'Connected'
                    ? <Button variant="outline" className="h-7 text-[9px] rounded-lg text-[hsl(var(--state-healthy))]">Connected</Button>
                    : <Button variant="outline" className="h-7 text-[9px] rounded-lg">Connect</Button>
                  }
                </div>
              ))}
            </div>
            <Link to="/settings/integrations"><Button variant="outline" className="mt-3 h-8 text-[10px] rounded-xl gap-1"><Settings className="h-3 w-3" />View All Integrations</Button></Link>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
