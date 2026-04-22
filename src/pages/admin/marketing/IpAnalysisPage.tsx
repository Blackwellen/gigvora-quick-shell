import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Globe, ArrowLeft, ShieldAlert, Ban, Eye } from 'lucide-react';

interface IpRecord { ip: string; country: string; asn: string; requests: number; risk: 'low' | 'medium' | 'high'; flag: string; lastSeen: string }

const IPS: IpRecord[] = [
  { ip: '203.0.113.42', country: 'Singapore', asn: 'AS14061 DigitalOcean', requests: 28420, risk: 'high', flag: 'Datacenter — likely bot', lastSeen: '4m ago' },
  { ip: '198.51.100.18', country: 'United States', asn: 'AS16509 Amazon AWS', requests: 18920, risk: 'high', flag: 'Headless browser fingerprint', lastSeen: '12m ago' },
  { ip: '192.0.2.84', country: 'Russia', asn: 'AS9009 M247', requests: 14420, risk: 'high', flag: 'TOR exit node', lastSeen: '34m ago' },
  { ip: '203.0.113.221', country: 'Vietnam', asn: 'AS45899 VNPT', requests: 8240, risk: 'medium', flag: 'Sudden traffic spike', lastSeen: '1h ago' },
  { ip: '198.51.100.99', country: 'Brazil', asn: 'AS28573 Claro', requests: 6420, risk: 'medium', flag: 'Repeated failed signups', lastSeen: '2h ago' },
  { ip: '203.0.113.7', country: 'Germany', asn: 'AS24940 Hetzner', requests: 4280, risk: 'low', flag: 'Crawler — robots.txt respected', lastSeen: '20m ago' },
];

const RISK_BADGE = {
  low: 'bg-muted text-foreground/70',
  medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  high: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
};

const IpAnalysisPage: React.FC = () => (
  <div className="mx-auto w-full max-w-[1500px] px-8 py-8">
    <Link to="/admin/marketing" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
      <ArrowLeft className="h-3.5 w-3.5" /> Back to Marketing
    </Link>
    <div className="flex items-end justify-between gap-6 mb-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"><Globe className="h-3.5 w-3.5" /> Marketing · IP Analysis</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">IP & bot detection</h1>
        <p className="mt-1 text-sm text-muted-foreground">Suspicious IPs, datacenter clusters, TOR exits, and rate-limit candidates.</p>
      </div>
      <Badge variant="secondary">12 flagged · 4 blocked</Badge>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {[
        { label: 'Flagged IPs', value: '12' },
        { label: 'Blocked (24h)', value: '4' },
        { label: 'Bot traffic share', value: '8.4%' },
        { label: 'Datacenter sources', value: '3' },
      ].map((k) => (
        <div key={k.label} className="rounded-xl border bg-card p-4">
          <div className="text-2xl font-semibold tabular-nums">{k.value}</div>
          <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
        </div>
      ))}
    </div>

    <div className="rounded-xl border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th className="text-left px-4 py-3">IP address</th>
            <th className="text-left px-4 py-3">Country</th>
            <th className="text-left px-4 py-3">ASN</th>
            <th className="text-right px-4 py-3">Requests (24h)</th>
            <th className="text-left px-4 py-3">Risk</th>
            <th className="text-left px-4 py-3">Flag reason</th>
            <th className="text-left px-4 py-3">Last seen</th>
            <th className="px-2"></th>
          </tr>
        </thead>
        <tbody>
          {IPS.map((ip) => (
            <tr key={ip.ip} className="border-t hover:bg-muted/30">
              <td className="px-4 py-3 font-mono text-xs">{ip.ip}</td>
              <td className="px-4 py-3 text-sm">{ip.country}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{ip.asn}</td>
              <td className="px-4 py-3 text-right tabular-nums">{ip.requests.toLocaleString()}</td>
              <td className="px-4 py-3"><Badge variant="outline" className={cn('text-[10px] capitalize border-0', RISK_BADGE[ip.risk])}>{ip.risk}</Badge></td>
              <td className="px-4 py-3 text-xs">{ip.flag}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{ip.lastSeen}</td>
              <td className="px-2 py-3 text-right">
                <Button variant="ghost" size="sm"><Eye className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="sm" className="text-rose-600"><Ban className="h-3.5 w-3.5" /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default IpAnalysisPage;
