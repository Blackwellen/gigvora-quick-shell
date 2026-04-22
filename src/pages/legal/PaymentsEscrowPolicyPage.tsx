import React from 'react';
import { CreditCard } from 'lucide-react';
import { LegalPageShell, LegalSection, LegalCallout } from '@/components/legal/LegalPageShell';

const TOC = [
  { id: 'overview', label: 'Overview' },
  { id: 'escrow', label: 'Escrow Protection' },
  { id: 'milestones', label: 'Milestone Payments' },
  { id: 'release', label: 'Fund Release' },
  { id: 'refunds', label: 'Refunds' },
  { id: 'fees', label: 'Fees & Commissions' },
  { id: 'methods', label: 'Payment Methods' },
  { id: 'payouts', label: 'Professional Payouts' },
  { id: 'taxes', label: 'Tax Obligations' },
  { id: 'fraud', label: 'Fraud Prevention' },
];

export default function PaymentsEscrowPolicyPage() {
  return (
    <LegalPageShell
      title="Payments & Escrow Policy"
      subtitle="How funds are handled, protected, and distributed on the Gigvora marketplace."
      icon={<CreditCard className="h-5 w-5 text-white/70" />}
      badge="Financial Policy"
      lastUpdated="April 14, 2026"
      effectiveDate="April 14, 2026"
      version="v3.0"
      toc={TOC}
      relatedLinks={[
        { label: 'Disputes Policy', to: '/legal/disputes-policy' },
        { label: 'Terms & Conditions', to: '/terms' },
        { label: 'User Agreements', to: '/user-agreements' },
      ]}
    >
      <LegalSection id="overview" number="01" title="Overview">
        <p>Gigvora uses a secure escrow system to protect both clients and professionals during marketplace transactions. Funds are held in segregated trust accounts managed by our licensed payment partners and released only when predefined conditions are met.</p>
      </LegalSection>

      <LegalSection id="escrow" number="02" title="Escrow Protection">
        <p>When a client initiates a project or purchases a service, funds are deposited into our escrow system. These funds are:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Held in segregated trust accounts separate from company operating funds</li>
          <li>Protected by FDIC-insured banking partners (up to applicable limits)</li>
          <li>Released only upon client approval, milestone completion, or dispute resolution</li>
          <li>Visible to both parties in real-time through the transaction dashboard</li>
        </ul>
        <LegalCallout type="important">Funds in escrow belong to neither party until release conditions are met. Gigvora acts as a neutral custodian.</LegalCallout>
      </LegalSection>

      <LegalSection id="milestones" number="03" title="Milestone Payments">
        <p>Projects can be structured with milestone-based payments. Each milestone defines a specific deliverable, amount, and deadline. Clients fund milestones before work begins, and funds are released upon approval of each deliverable.</p>
        <p>Auto-release occurs after 14 days if the client does not explicitly approve or dispute a delivered milestone.</p>
      </LegalSection>

      <LegalSection id="release" number="04" title="Fund Release">
        <p>Funds are released when:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Client explicitly approves the deliverable</li>
          <li>Auto-release timer expires (14 days after delivery)</li>
          <li>Dispute resolution mandates release</li>
          <li>Both parties agree to mutual release</li>
        </ul>
        <p>Released funds are available in the professional's account within 1-3 business days.</p>
      </LegalSection>

      <LegalSection id="refunds" number="05" title="Refunds">
        <p>Refunds may be issued in the following cases:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Mutual cancellation before work begins (full refund)</li>
          <li>Dispute resolution in favor of the client</li>
          <li>Non-delivery within the agreed timeframe</li>
          <li>Fraudulent transaction or unauthorized charge</li>
        </ul>
        <p>Processing times: 5-10 business days for credit cards, 3-5 for digital wallets.</p>
      </LegalSection>

      <LegalSection id="fees" number="06" title="Fees & Commissions">
        <p>Gigvora charges a transparent commission deducted at the time of fund release:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Standard services:</strong> 10% commission</li>
          <li><strong>Enterprise contracts:</strong> 5% commission</li>
          <li><strong>Volume pricing:</strong> Available for accounts exceeding $10,000/month</li>
          <li><strong>Currency conversion:</strong> Market rate + 1.5% fee</li>
        </ul>
        <LegalCallout type="info">No hidden fees. Commission rates are always visible before you confirm a transaction.</LegalCallout>
      </LegalSection>

      <LegalSection id="methods" number="07" title="Payment Methods">
        <p>Accepted payment methods: Visa, Mastercard, American Express, PayPal, Apple Pay, Google Pay, ACH bank transfer (US), SEPA transfer (EU), and wire transfer for enterprise accounts.</p>
      </LegalSection>

      <LegalSection id="payouts" number="08" title="Professional Payouts">
        <p>Professionals can withdraw earnings via bank transfer, PayPal, or digital wallet. Minimum withdrawal: $25. Automatic weekly payouts can be configured in account settings.</p>
      </LegalSection>

      <LegalSection id="taxes" number="09" title="Tax Obligations">
        <p>Users are responsible for their own tax obligations. Gigvora issues 1099 forms to US-based professionals earning over $600 annually. Invoices and earning reports are available in the dashboard for tax preparation purposes.</p>
      </LegalSection>

      <LegalSection id="fraud" number="10" title="Fraud Prevention">
        <p>Our fraud prevention systems include real-time transaction monitoring, behavioral analysis, device fingerprinting, and manual review of flagged transactions. Suspected fraudulent activity results in immediate fund hold and investigation.</p>
        <LegalCallout type="warning">Fraudulent transactions, including chargebacks initiated in bad faith, will result in account suspension and potential legal action.</LegalCallout>
      </LegalSection>
    </LegalPageShell>
  );
}
