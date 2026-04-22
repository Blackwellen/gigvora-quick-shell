import React from 'react';
import { PageSEO } from '@/components/seo/PageSEO';
import { FileText } from 'lucide-react';
import { LegalPageShell, LegalSection, LegalCallout } from '@/components/legal/LegalPageShell';

const TOC = [
  { id: 'acceptance', label: 'Acceptance of Terms' },
  { id: 'registration', label: 'Account Registration' },
  { id: 'roles', label: 'User Roles' },
  { id: 'transactions', label: 'Marketplace Transactions' },
  { id: 'escrow', label: 'Escrow & Payments' },
  { id: 'disputes', label: 'Dispute Resolution' },
  { id: 'ip', label: 'Intellectual Property' },
  { id: 'prohibited', label: 'Prohibited Conduct' },
  { id: 'termination', label: 'Termination' },
  { id: 'liability', label: 'Limitation of Liability' },
  { id: 'changes', label: 'Changes to Terms' },
];

const TermsPage: React.FC = () => (
  <>
    <PageSEO title="Terms of Service" description="Gigvora terms of service — read our user agreement and platform policies." canonical="/terms" />
    <LegalPageShell
    title="Terms & Conditions"
    subtitle="The legal agreement between you and Gigvora governing your use of the platform."
    icon={<FileText className="h-5 w-5 text-white/70" />}
    badge="Legal Agreement"
    lastUpdated="April 14, 2026"
    effectiveDate="April 14, 2026"
    version="v4.0"
    toc={TOC}
    relatedLinks={[
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'User Agreements', to: '/user-agreements' },
      { label: 'Payments & Escrow Policy', to: '/legal/payments-escrow' },
      { label: 'Disputes Policy', to: '/legal/disputes-policy' },
    ]}
  >
    <LegalCallout type="important">
      By accessing Gigvora, you agree to these Terms. If you do not agree, please do not use the platform. These terms constitute a binding legal agreement.
    </LegalCallout>

    <LegalSection id="acceptance" number="01" title="Acceptance of Terms">
      <p>By accessing and using Gigvora, you accept and agree to be bound by these Terms and Conditions and all applicable laws and regulations. These terms apply to all users including visitors, clients, professionals, and enterprise accounts.</p>
    </LegalSection>

    <LegalSection id="registration" number="02" title="Account Registration">
      <p>You must provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and all activities under your account. You must immediately notify us of any unauthorized use.</p>
      <p>You must be at least 18 years old to create an account. One person may not maintain more than one account without explicit platform approval.</p>
    </LegalSection>

    <LegalSection id="roles" number="03" title="User Roles">
      <p>Gigvora supports User/Client, Professional, and Enterprise roles. Users may switch between roles. Each role has specific responsibilities and access levels:</p>
      <ul className="list-disc pl-4 space-y-1">
        <li><strong>Client:</strong> Post projects, hire professionals, purchase services</li>
        <li><strong>Professional:</strong> Offer services, bid on projects, deliver work</li>
        <li><strong>Enterprise:</strong> Manage teams, organizational workflows, and bulk operations</li>
      </ul>
    </LegalSection>

    <LegalSection id="transactions" number="04" title="Marketplace Transactions">
      <p>All marketplace transactions including gig orders, project contracts, and service purchases are subject to our escrow and payment terms. Commission rates are disclosed transparently on our pricing page and may vary by service category and user tier.</p>
      <LegalCallout type="info">All transactions are conducted through our secure escrow system. Direct off-platform payments are prohibited and may result in account suspension.</LegalCallout>
    </LegalSection>

    <LegalSection id="escrow" number="05" title="Escrow & Payments">
      <p>Funds for gig orders and project milestones are held in escrow until work is delivered and approved. Release schedules follow the agreed milestone terms. Platform commission is deducted at the time of fund release.</p>
      <p>Refunds are processed according to our Refund Policy. Processing times vary by payment method (typically 5-10 business days).</p>
    </LegalSection>

    <LegalSection id="disputes" number="06" title="Dispute Resolution">
      <p>Disputes are handled through our structured resolution process including evidence submission, review, and if necessary, professional arbitration. Both parties agree to participate in good faith and accept the final arbitration decision as binding.</p>
    </LegalSection>

    <LegalSection id="ip" number="07" title="Intellectual Property">
      <p>Users retain ownership of content they create. By posting content on Gigvora, you grant us a non-exclusive, worldwide, royalty-free license to display and distribute it within the platform for the purpose of providing our services.</p>
      <p>Work product ownership transfers to the client upon full payment unless otherwise specified in the project agreement.</p>
    </LegalSection>

    <LegalSection id="prohibited" number="08" title="Prohibited Conduct">
      <p>Users must not engage in:</p>
      <ul className="list-disc pl-4 space-y-1">
        <li>Fraud, misrepresentation, or deceptive practices</li>
        <li>Harassment, discrimination, or abusive behavior</li>
        <li>Spam, unsolicited communications, or automated scraping</li>
        <li>Circumventing platform fees or escrow protections</li>
        <li>Posting illegal, harmful, or infringing content</li>
        <li>Creating multiple accounts to manipulate reviews or rankings</li>
      </ul>
      <LegalCallout type="warning">Violations may result in immediate account suspension, fund freezing, and permanent ban from the platform.</LegalCallout>
    </LegalSection>

    <LegalSection id="termination" number="09" title="Termination">
      <p>Either party may terminate the agreement at any time. Upon termination, your right to use the platform ceases immediately. We may retain certain data as required by law. Pending transactions will be handled according to our escrow terms.</p>
    </LegalSection>

    <LegalSection id="liability" number="10" title="Limitation of Liability">
      <p>Gigvora is provided "as is" without warranties of any kind. We are not liable for indirect, incidental, special, consequential, or punitive damages arising from platform use. Our total liability shall not exceed the fees paid by you in the 12 months preceding the claim.</p>
    </LegalSection>

    <LegalSection id="changes" number="11" title="Changes to Terms">
      <p>We may update these terms at any time. Material changes will be communicated via email and in-app notification at least 30 days before taking effect. Continued use of the platform after changes constitutes acceptance of the updated terms.</p>
    </LegalSection>
  </LegalPageShell>
  </>
);

export default TermsPage;
