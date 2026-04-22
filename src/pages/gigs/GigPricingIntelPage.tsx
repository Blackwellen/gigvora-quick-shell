import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, BarChart3, ArrowUp, ArrowDown, Minus } from 'lucide-react';

export default function GigPricingIntelPage() {
  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <TrendingUp className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold mr-4">Pricing Intelligence</h1>
          <KPICard label="Your Avg Price" value="$117" />
          <KPICard label="Market Avg" value="$125" />
          <KPICard label="Position" value="Top 25%" />
          <KPICard label="Win Rate" value="42%" />
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <SectionCard title="Market Comparison" icon={<BarChart3 className="h-3 w-3 text-muted-foreground" />}>
          <div className="space-y-3">
            {[
              { tier: 'Basic', yours: '$50', market: '$45', position: 'above' },
              { tier: 'Standard', yours: '$100', market: '$120', position: 'below' },
              { tier: 'Premium', yours: '$200', market: '$195', position: 'above' },
            ].map((p, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20">
                <span className="text-[10px] font-medium w-16">{p.tier}</span>
                <div className="flex-1 text-[9px]">
                  <div className="flex justify-between mb-1"><span className="text-muted-foreground">Your price</span><span className="font-semibold">{p.yours}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Market avg</span><span className="font-semibold">{p.market}</span></div>
                </div>
                <div className={`flex items-center gap-0.5 text-[9px] font-medium ${p.position === 'above' ? 'text-[hsl(var(--gigvora-amber))]' : 'text-accent'}`}>
                  {p.position === 'above' ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
                  {p.position}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Price Trends" icon={<TrendingUp className="h-3 w-3 text-muted-foreground" />}>
          <div className="h-44 bg-muted/30 rounded-lg flex items-center justify-center text-[10px] text-muted-foreground">[Chart: Category price trends over time]</div>
        </SectionCard>

        <SectionCard title="Competitive Pricing">
          {[
            { seller: 'TopDesigner', basic: '$40', std: '$90', prem: '$180', rating: 4.9 },
            { seller: 'CreativeStudio', basic: '$55', std: '$130', prem: '$250', rating: 4.7 },
            { seller: 'BrandMaster', basic: '$45', std: '$110', prem: '$190', rating: 4.8 },
          ].map((c, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0 text-[9px]">
              <span className="font-medium w-24">{c.seller}</span>
              <span className="text-muted-foreground">B: {c.basic}</span>
              <span className="text-muted-foreground">S: {c.std}</span>
              <span className="text-muted-foreground">P: {c.prem}</span>
              <span className="ml-auto">⭐ {c.rating}</span>
            </div>
          ))}
        </SectionCard>

        <SectionCard title="Recommendations">
          <div className="space-y-2">
            {[
              { text: 'Your Standard tier is 17% below market — consider raising to $115-$120 without losing competitiveness.', type: 'opportunity' },
              { text: 'Adding a rush delivery add-on (+$30) could increase revenue by ~15% based on market demand.', type: 'suggestion' },
              { text: 'Your Premium tier is well-positioned. Maintain current pricing.', type: 'maintain' },
            ].map((r, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-muted/20 text-[9px] text-muted-foreground">
                <Badge variant="outline" className="text-[7px] h-3 mb-1 capitalize">{r.type}</Badge>
                <p>{r.text}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}
