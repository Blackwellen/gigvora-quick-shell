import React from 'react';
import { DollarSign } from 'lucide-react';
import { LegalPageShell, LegalSection, LegalCallout } from '@/components/legal/LegalPageShell';

const TOC = [
  { id: 'overview', label: 'Overview' },
  { id: 'eligibility', label: 'Eligibility' },
  { id: 'revenue', label: 'Revenue Streams' },
  { id: 'payouts', label: 'Payouts & Thresholds' },
  { id: 'content-req', label: 'Content Requirements' },
  { id: 'prohibited', label: 'Prohibited Monetization' },
  { id: 'demonetization', label: 'Demonetization' },
  { id: 'taxes', label: 'Tax Reporting' },
  { id: 'reinstatement', label: 'Reinstatement' },
];

export default function CreatorMonetizationPolicyPage() {
  return (
    <LegalPageShell
      title="Creator Monetization Policy"
      subtitle="How creators earn, get paid, and maintain their monetization status on Gigvora."
      icon={<DollarSign className="h-5 w-5 text-white/70" />}
      badge="Creator Economy"
      lastUpdated="April 14, 2026"
      effectiveDate="April 14, 2026"
      version="v1.5"
      toc={TOC}
      relatedLinks={[
        { label: 'Payments & Escrow', to: '/legal/payments-escrow' },
        { label: 'Community Guidelines', to: '/legal/community-guidelines' },
        { label: 'Advertising Policy', to: '/legal/advertising-policy' },
      ]}
    >
      <LegalSection id="overview" number="01" title="Overview">
        <p>Gigvora enables creators to monetize their expertise through multiple channels including content, courses, events, and premium subscriptions. This policy governs eligibility, revenue sharing, payouts, and compliance requirements for monetized creators.</p>
      </LegalSection>

      <LegalSection id="eligibility" number="02" title="Eligibility">
        <p>To qualify for monetization, creators must:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Have a verified Gigvora account with identity verification complete</li>
          <li>Maintain an account in good standing with no active policy violations</li>
          <li>Meet minimum engagement thresholds (500+ followers or equivalent activity)</li>
          <li>Agree to the Creator Monetization Agreement</li>
          <li>Provide valid tax documentation (W-9 for US, W-8BEN for international)</li>
        </ul>
      </LegalSection>

      <LegalSection id="revenue" number="03" title="Revenue Streams">
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Content monetization:</strong> Revenue share on premium articles, newsletters, and guides</li>
          <li><strong>Course sales:</strong> 85% revenue share on courses published through Creator Studio</li>
          <li><strong>Event tickets:</strong> 90% revenue share on paid events and webinars</li>
          <li><strong>Subscriptions:</strong> 80% revenue share on creator subscription tiers</li>
          <li><strong>Tips & donations:</strong> 95% goes to creator (5% processing fee)</li>
          <li><strong>Sponsored content:</strong> 100% of sponsor payments (creator-negotiated)</li>
        </ul>
        <LegalCallout type="info">Revenue share percentages are among the highest in the industry. We believe creators should keep the majority of what they earn.</LegalCallout>
      </LegalSection>

      <LegalSection id="payouts" number="04" title="Payouts & Thresholds">
        <p>Minimum payout threshold: $50. Payouts processed on the 1st and 15th of each month. Available payout methods: bank transfer, PayPal, Wise. Earnings dashboard provides real-time revenue tracking and forecasting.</p>
      </LegalSection>

      <LegalSection id="content-req" number="05" title="Content Requirements">
        <p>Monetized content must be original, provide genuine value, comply with community guidelines, and not infringe on third-party intellectual property. Sponsored content must be clearly disclosed in accordance with FTC guidelines.</p>
      </LegalSection>

      <LegalSection id="prohibited" number="06" title="Prohibited Monetization">
        <ul className="list-disc pl-4 space-y-1">
          <li>Paywall-gating content that misleads about its value</li>
          <li>Engagement manipulation to meet monetization thresholds</li>
          <li>Reselling others' content as your own</li>
          <li>Monetizing harmful, misleading, or policy-violating content</li>
          <li>Using monetization to circumvent platform fees on services</li>
        </ul>
      </LegalSection>

      <LegalSection id="demonetization" number="07" title="Demonetization">
        <p>Creators may be demonetized for policy violations, community guideline breaches, or failure to maintain eligibility requirements. Demonetization may affect specific content or the entire account. Pending earnings at the time of demonetization will be held for 90 days pending review.</p>
        <LegalCallout type="warning">Severe violations (fraud, copyright infringement, harmful content) may result in immediate permanent demonetization with forfeiture of pending earnings.</LegalCallout>
      </LegalSection>

      <LegalSection id="taxes" number="08" title="Tax Reporting">
        <p>Gigvora issues 1099-NEC forms to US-based creators earning over $600 annually. International creators receive annual earnings statements. All creators are responsible for reporting income and paying applicable taxes in their jurisdiction.</p>
      </LegalSection>

      <LegalSection id="reinstatement" number="09" title="Reinstatement">
        <p>Demonetized creators may apply for reinstatement after 90 days if the underlying violation has been addressed. Reinstatement requires a review of compliance history and may include a probationary period with reduced revenue share.</p>
      </LegalSection>
    </LegalPageShell>
  );
}
