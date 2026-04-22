import React from 'react';
import { Gavel } from 'lucide-react';
import { LegalPageShell, LegalSection, LegalCallout } from '@/components/legal/LegalPageShell';

const TOC = [
  { id: 'overview', label: 'Overview' },
  { id: 'eligible', label: 'Appealable Actions' },
  { id: 'process', label: 'Appeals Process' },
  { id: 'timelines', label: 'Timelines' },
  { id: 'evidence', label: 'Supporting Evidence' },
  { id: 'review', label: 'Review & Decision' },
  { id: 'outcomes', label: 'Possible Outcomes' },
  { id: 'escalation', label: 'Further Escalation' },
  { id: 'transparency', label: 'Transparency Report' },
];

export default function AppealsPolicyPage() {
  return (
    <LegalPageShell
      title="Appeals & Enforcement"
      subtitle="How to challenge enforcement decisions and understand the actions we take to maintain platform integrity."
      icon={<Gavel className="h-5 w-5 text-white/70" />}
      badge="Due Process"
      lastUpdated="April 14, 2026"
      effectiveDate="April 14, 2026"
      version="v2.0"
      toc={TOC}
      relatedLinks={[
        { label: 'Community Guidelines', to: '/legal/community-guidelines' },
        { label: 'Disputes Policy', to: '/legal/disputes-policy' },
        { label: 'Trust & Safety', to: '/trust-safety' },
        { label: 'Terms & Conditions', to: '/terms' },
      ]}
    >
      <LegalCallout type="info">
        We believe in due process. Every enforcement action includes the reason, evidence, and instructions for appeal. Our appeals team is independent from the original enforcement team.
      </LegalCallout>

      <LegalSection id="overview" number="01" title="Overview">
        <p>Gigvora provides a formal appeals process for users who believe an enforcement action was made in error or was disproportionate. Appeals are reviewed by an independent team that was not involved in the original decision.</p>
      </LegalSection>

      <LegalSection id="eligible" number="02" title="Appealable Actions">
        <p>The following enforcement actions can be appealed:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Content removal or restriction</li>
          <li>Account warnings and strikes</li>
          <li>Feature restrictions (messaging, posting, bidding)</li>
          <li>Temporary suspensions</li>
          <li>Demonetization decisions</li>
          <li>Ad rejection or advertiser restrictions</li>
          <li>Dispute resolution outcomes (mediation stage only)</li>
        </ul>
        <LegalCallout type="warning">Permanent bans and arbitration decisions are not eligible for standard appeals but may be reviewed through our escalation process.</LegalCallout>
      </LegalSection>

      <LegalSection id="process" number="03" title="Appeals Process">
        <ol className="list-decimal pl-4 space-y-1">
          <li><strong>Notification:</strong> You receive a detailed notice of the enforcement action with reason and evidence</li>
          <li><strong>Submission:</strong> Submit your appeal through the Appeals Center with your explanation and supporting evidence</li>
          <li><strong>Acknowledgment:</strong> You receive confirmation within 24 hours with a case reference number</li>
          <li><strong>Review:</strong> An independent reviewer examines the original action and your appeal</li>
          <li><strong>Decision:</strong> You receive the final decision with detailed reasoning</li>
        </ol>
      </LegalSection>

      <LegalSection id="timelines" number="04" title="Timelines">
        <ul className="list-disc pl-4 space-y-1">
          <li>Appeal submission deadline: 14 days from enforcement notification</li>
          <li>Acknowledgment: Within 24 hours</li>
          <li>Standard review: 5-7 business days</li>
          <li>Priority review (account suspensions): 48-72 hours</li>
          <li>Escalation review: 10-14 business days</li>
        </ul>
      </LegalSection>

      <LegalSection id="evidence" number="05" title="Supporting Evidence">
        <p>Strong appeals include:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Clear explanation of why the action was incorrect</li>
          <li>Context that may not have been available during original review</li>
          <li>Evidence that contradicts the findings</li>
          <li>Documentation of policy compliance</li>
        </ul>
      </LegalSection>

      <LegalSection id="review" number="06" title="Review & Decision">
        <p>The appeals reviewer will examine the original enforcement evidence, your appeal submission, your account history, and applicable policies. The reviewer may request additional information from either party. All reviews are conducted objectively and independently.</p>
      </LegalSection>

      <LegalSection id="outcomes" number="07" title="Possible Outcomes">
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Overturned:</strong> The enforcement action is reversed completely</li>
          <li><strong>Modified:</strong> The action is reduced in severity (e.g., suspension shortened)</li>
          <li><strong>Upheld:</strong> The original action stands as decided</li>
          <li><strong>Escalated:</strong> The case is referred to senior review for complex situations</li>
        </ul>
      </LegalSection>

      <LegalSection id="escalation" number="08" title="Further Escalation">
        <p>If you disagree with the appeals decision, you may request a final escalation review within 7 days. Escalation reviews are conducted by senior policy staff and represent the final internal review. Beyond this, users retain the right to pursue legal remedies through appropriate external channels.</p>
      </LegalSection>

      <LegalSection id="transparency" number="09" title="Transparency Report">
        <p>Gigvora publishes quarterly transparency reports detailing enforcement actions taken, appeals received, overturn rates, and policy changes. These reports are available in our Trust & Safety center and demonstrate our commitment to accountability.</p>
      </LegalSection>
    </LegalPageShell>
  );
}
