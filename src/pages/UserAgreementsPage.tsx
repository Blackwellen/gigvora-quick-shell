import React from 'react';
import { Users } from 'lucide-react';
import { LegalPageShell, LegalSection, LegalCallout } from '@/components/legal/LegalPageShell';

const TOC = [
  { id: 'freelancer', label: 'Freelancer Agreement' },
  { id: 'client', label: 'Client Agreement' },
  { id: 'enterprise', label: 'Enterprise Agreement' },
  { id: 'community', label: 'Community Guidelines' },
  { id: 'content', label: 'Content Policy' },
  { id: 'commission', label: 'Commission & Fees' },
  { id: 'confidentiality', label: 'Confidentiality' },
  { id: 'indemnification', label: 'Indemnification' },
];

const UserAgreementsPage: React.FC = () => (
  <LegalPageShell
    title="User Agreements"
    subtitle="Role-specific agreements governing how different user types interact on the Gigvora platform."
    icon={<Users className="h-5 w-5 text-white/70" />}
    badge="Role Agreements"
    lastUpdated="April 14, 2026"
    effectiveDate="April 14, 2026"
    version="v2.5"
    toc={TOC}
    relatedLinks={[
      { label: 'Terms & Conditions', to: '/terms' },
      { label: 'Community Guidelines', to: '/legal/community-guidelines' },
      { label: 'Creator Monetization', to: '/legal/creator-monetization' },
    ]}
  >
    <LegalSection id="freelancer" number="01" title="Freelancer Agreement">
      <p>Professionals offering services on Gigvora agree to:</p>
      <ul className="list-disc pl-4 space-y-1">
        <li>Deliver work as described in the service listing or project agreement</li>
        <li>Meet agreed timelines and communicate delays proactively</li>
        <li>Maintain professional conduct in all client interactions</li>
        <li>Follow platform quality standards and content guidelines</li>
        <li>Not solicit clients for off-platform transactions</li>
        <li>Accurately represent skills, experience, and portfolio work</li>
      </ul>
      <LegalCallout type="info">Professionals retain the right to set their own rates, working hours, and client acceptance criteria. Gigvora does not establish an employer-employee relationship.</LegalCallout>
    </LegalSection>

    <LegalSection id="client" number="02" title="Client Agreement">
      <p>Clients agree to:</p>
      <ul className="list-disc pl-4 space-y-1">
        <li>Provide clear, complete requirements before work begins</li>
        <li>Fund escrow before work starts (milestone or full amount)</li>
        <li>Review deliverables within agreed timeframes (default: 7 days)</li>
        <li>Pay fairly for completed work that meets agreed specifications</li>
        <li>Communicate respectfully and provide constructive feedback</li>
        <li>Not request work outside the agreed scope without additional compensation</li>
      </ul>
    </LegalSection>

    <LegalSection id="enterprise" number="03" title="Enterprise Agreement">
      <p>Enterprise accounts have additional responsibilities:</p>
      <ul className="list-disc pl-4 space-y-1">
        <li>Manage team access and permissions responsibly</li>
        <li>Comply with data protection regulations for organizational data</li>
        <li>Maintain appropriate security for organizational accounts including SSO</li>
        <li>Designate authorized administrators and billing contacts</li>
        <li>Accept responsibility for all activity under team member accounts</li>
      </ul>
    </LegalSection>

    <LegalSection id="community" number="04" title="Community Guidelines">
      <p>All users agree to treat others with respect, not engage in discrimination or harassment, post accurate information, and report violations through proper channels. See our full <a href="/legal/community-guidelines" className="text-accent hover:underline">Community Guidelines</a> for details.</p>
    </LegalSection>

    <LegalSection id="content" number="05" title="Content Policy">
      <p>Users must not post illegal, harmful, misleading, or infringing content. The platform reserves the right to remove content that violates these guidelines. Repeated violations result in escalating enforcement actions up to and including permanent account termination.</p>
    </LegalSection>

    <LegalSection id="commission" number="06" title="Commission & Fees">
      <p>Users acknowledge and accept the platform's commission structure as published on the pricing page. Commission rates may vary by service type, transaction volume, and account tier. Enterprise accounts may negotiate custom commission terms.</p>
      <LegalCallout type="info">Current standard rate: 10% on services, 5% on enterprise contracts. Volume discounts available for Enterprise plans.</LegalCallout>
    </LegalSection>

    <LegalSection id="confidentiality" number="07" title="Confidentiality">
      <p>Users agree to maintain the confidentiality of proprietary information shared during engagements. This includes project details, business strategies, and any information marked as confidential. NDA templates are available for engagements requiring additional protection.</p>
    </LegalSection>

    <LegalSection id="indemnification" number="08" title="Indemnification">
      <p>Users agree to indemnify and hold harmless Gigvora and its affiliates from any claims, damages, or expenses arising from their use of the platform, violation of these agreements, or infringement of any third-party rights.</p>
    </LegalSection>
  </LegalPageShell>
);

export default UserAgreementsPage;
