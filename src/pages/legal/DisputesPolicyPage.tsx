import React from 'react';
import { Scale } from 'lucide-react';
import { LegalPageShell, LegalSection, LegalCallout } from '@/components/legal/LegalPageShell';

const TOC = [
  { id: 'overview', label: 'Overview' },
  { id: 'eligibility', label: 'Eligibility' },
  { id: 'process', label: 'Resolution Process' },
  { id: 'evidence', label: 'Evidence Standards' },
  { id: 'mediation', label: 'Mediation' },
  { id: 'arbitration', label: 'Arbitration' },
  { id: 'outcomes', label: 'Possible Outcomes' },
  { id: 'appeals', label: 'Appeals' },
  { id: 'timelines', label: 'Timelines' },
  { id: 'prohibited', label: 'Prohibited Actions' },
];

export default function DisputesPolicyPage() {
  return (
    <LegalPageShell
      title="Disputes Policy"
      subtitle="A structured, fair resolution process for all marketplace disagreements on Gigvora."
      icon={<Scale className="h-5 w-5 text-white/70" />}
      badge="Resolution Framework"
      lastUpdated="April 14, 2026"
      effectiveDate="April 14, 2026"
      version="v2.0"
      toc={TOC}
      relatedLinks={[
        { label: 'Payments & Escrow', to: '/legal/payments-escrow' },
        { label: 'Appeals & Enforcement', to: '/legal/appeals' },
        { label: 'Terms & Conditions', to: '/terms' },
        { label: 'Trust & Safety', to: '/trust-safety' },
      ]}
    >
      <LegalSection id="overview" number="01" title="Overview">
        <p>Gigvora provides a structured dispute resolution framework designed to resolve marketplace disagreements fairly and efficiently. Our process balances the interests of both parties while protecting the integrity of the platform.</p>
        <LegalCallout type="info">Our dispute resolution team resolves 97% of disputes within 7 business days. Escalated arbitration cases are resolved within 14 days.</LegalCallout>
      </LegalSection>

      <LegalSection id="eligibility" number="02" title="Eligibility">
        <p>Disputes may be filed when:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Deliverables do not match the agreed specifications</li>
          <li>Work is not delivered within the agreed timeframe</li>
          <li>Quality standards are not met as defined in the agreement</li>
          <li>Communication breakdown prevents project completion</li>
          <li>Payment or escrow issues arise during a transaction</li>
        </ul>
        <p>Disputes must be filed within 14 days of the triggering event. Late filings may be considered at the platform's discretion.</p>
      </LegalSection>

      <LegalSection id="process" number="03" title="Resolution Process">
        <p>The dispute resolution process follows five stages:</p>
        <ol className="list-decimal pl-4 space-y-1">
          <li><strong>Filing:</strong> The initiating party submits a dispute with description and evidence</li>
          <li><strong>Counter-response:</strong> The responding party has 72 hours to submit their response</li>
          <li><strong>Review:</strong> Our resolution team evaluates evidence from both parties</li>
          <li><strong>Mediation:</strong> A mediator facilitates direct negotiation between parties</li>
          <li><strong>Arbitration:</strong> If mediation fails, a binding decision is issued</li>
        </ol>
      </LegalSection>

      <LegalSection id="evidence" number="04" title="Evidence Standards">
        <p>Acceptable evidence includes:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Original contracts, statements of work, and project agreements</li>
          <li>Deliverables, screenshots, and work samples</li>
          <li>Communication records (chat logs, emails sent through platform)</li>
          <li>Milestone completion records and approval history</li>
          <li>Payment receipts and escrow transaction records</li>
        </ul>
        <LegalCallout type="warning">Evidence altered, fabricated, or taken out of context will result in the dispute being decided against the submitting party and potential account sanctions.</LegalCallout>
      </LegalSection>

      <LegalSection id="mediation" number="05" title="Mediation">
        <p>Mediation is a collaborative process where a neutral Gigvora mediator helps both parties reach a mutually acceptable resolution. The mediator does not make binding decisions but facilitates communication and proposes compromises. Both parties must participate in good faith.</p>
      </LegalSection>

      <LegalSection id="arbitration" number="06" title="Arbitration">
        <p>If mediation fails, the dispute proceeds to arbitration. An independent arbitrator reviews all evidence and issues a binding decision. Arbitration decisions are final and not subject to further internal appeal, though parties retain the right to pursue legal remedies outside the platform.</p>
      </LegalSection>

      <LegalSection id="outcomes" number="07" title="Possible Outcomes">
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Full refund:</strong> Client receives full escrow amount back</li>
          <li><strong>Partial refund:</strong> Escrow split based on work completed</li>
          <li><strong>Full release:</strong> Professional receives full payment</li>
          <li><strong>Revision mandate:</strong> Professional given additional time to correct deliverables</li>
          <li><strong>Mutual cancellation:</strong> Both parties agree to cancel with no financial penalty</li>
        </ul>
      </LegalSection>

      <LegalSection id="appeals" number="08" title="Appeals">
        <p>Mediation outcomes may be appealed within 7 days. Arbitration decisions are final. See our <a href="/legal/appeals" className="text-accent hover:underline">Appeals & Enforcement</a> page for the complete appeals process.</p>
      </LegalSection>

      <LegalSection id="timelines" number="09" title="Timelines">
        <ul className="list-disc pl-4 space-y-1">
          <li>Filing deadline: 14 days from triggering event</li>
          <li>Counter-response: 72 hours from notification</li>
          <li>Review period: 3-5 business days</li>
          <li>Mediation: Up to 7 business days</li>
          <li>Arbitration: 7-14 business days</li>
          <li>Appeal window: 7 days from mediation decision</li>
        </ul>
      </LegalSection>

      <LegalSection id="prohibited" number="10" title="Prohibited Actions During Disputes">
        <ul className="list-disc pl-4 space-y-1">
          <li>Harassing or threatening the other party</li>
          <li>Deleting or altering evidence after a dispute is filed</li>
          <li>Filing frivolous or retaliatory disputes</li>
          <li>Attempting to circumvent the dispute process</li>
          <li>Public defamation of the other party during active proceedings</li>
        </ul>
      </LegalSection>
    </LegalPageShell>
  );
}
