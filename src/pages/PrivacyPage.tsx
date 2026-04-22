import React from 'react';
import { PageSEO } from '@/components/seo/PageSEO';
import { Shield } from 'lucide-react';
import { LegalPageShell, LegalSection, LegalCallout } from '@/components/legal/LegalPageShell';

const TOC = [
  { id: 'information', label: 'Information We Collect' },
  { id: 'usage', label: 'How We Use Information' },
  { id: 'sharing', label: 'Data Sharing' },
  { id: 'security', label: 'Data Security' },
  { id: 'rights', label: 'Your Rights' },
  { id: 'cookies', label: 'Cookies & Tracking' },
  { id: 'retention', label: 'Data Retention' },
  { id: 'international', label: 'International Transfers' },
  { id: 'children', label: 'Children\'s Privacy' },
  { id: 'changes', label: 'Policy Changes' },
  { id: 'contact', label: 'Contact Us' },
];

const PrivacyPage: React.FC = () => (
  <>
    <PageSEO title="Privacy Policy" description="Gigvora privacy policy — how we collect, use, and protect your data." canonical="/privacy" />
    <LegalPageShell
    title="Privacy Policy"
    subtitle="How we collect, use, and protect your personal information on the Gigvora platform."
    icon={<Shield className="h-5 w-5 text-white/70" />}
    badge="Data Protection"
    lastUpdated="April 14, 2026"
    effectiveDate="April 14, 2026"
    version="v3.1"
    toc={TOC}
    relatedLinks={[
      { label: 'Terms & Conditions', to: '/terms' },
      { label: 'Cookie Policy', to: '/privacy' },
      { label: 'Trust & Safety', to: '/trust-safety' },
      { label: 'Community Guidelines', to: '/legal/community-guidelines' },
    ]}
  >
    <LegalCallout type="info">
      <strong>Summary:</strong> We collect only what we need, never sell your data, and give you full control over your information. You can export or delete your data at any time from your account settings.
    </LegalCallout>

    <LegalSection id="information" number="01" title="Information We Collect">
      <p><strong>Information you provide:</strong> Name, email address, phone number, profile photo, professional details, payment information, and content you create or share on the platform.</p>
      <p><strong>Information collected automatically:</strong> IP address, browser type, device information, operating system, pages visited, time spent, referral URLs, and interaction patterns.</p>
      <p><strong>Information from third parties:</strong> Social login providers (Google, LinkedIn), payment processors, identity verification services, and analytics partners.</p>
    </LegalSection>

    <LegalSection id="usage" number="02" title="How We Use Information">
      <p>We use your information to:</p>
      <ul className="list-disc pl-4 space-y-1">
        <li>Provide, maintain, and improve our services</li>
        <li>Personalize your experience and content recommendations</li>
        <li>Process transactions and send related notices</li>
        <li>Communicate about updates, promotions, and support</li>
        <li>Ensure platform safety, detect fraud, and prevent abuse</li>
        <li>Comply with legal obligations and enforce our terms</li>
        <li>Generate anonymized analytics to improve the platform</li>
      </ul>
    </LegalSection>

    <LegalSection id="sharing" number="03" title="Data Sharing">
      <LegalCallout type="important">We never sell your personal data to third parties.</LegalCallout>
      <p>We may share data with:</p>
      <ul className="list-disc pl-4 space-y-1">
        <li><strong>Service providers:</strong> Cloud hosting, payment processing, email delivery, and analytics</li>
        <li><strong>Marketplace participants:</strong> Limited information shared to facilitate transactions (e.g., connecting buyers and sellers)</li>
        <li><strong>Legal compliance:</strong> When required by law, court order, or governmental authority</li>
        <li><strong>Business transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
      </ul>
    </LegalSection>

    <LegalSection id="security" number="04" title="Data Security">
      <p>We implement industry-standard security measures including:</p>
      <ul className="list-disc pl-4 space-y-1">
        <li>AES-256 encryption for data at rest and TLS 1.3 for data in transit</li>
        <li>Multi-factor authentication and role-based access controls</li>
        <li>Regular penetration testing and security audits (SOC 2 Type II)</li>
        <li>Automated threat detection and incident response protocols</li>
        <li>Data backup and disaster recovery procedures</li>
      </ul>
    </LegalSection>

    <LegalSection id="rights" number="05" title="Your Rights">
      <p>You have the right to:</p>
      <ul className="list-disc pl-4 space-y-1">
        <li><strong>Access:</strong> Request a copy of your personal data</li>
        <li><strong>Correction:</strong> Update inaccurate or incomplete data</li>
        <li><strong>Deletion:</strong> Request erasure of your personal data</li>
        <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
        <li><strong>Restriction:</strong> Limit processing of your data in certain circumstances</li>
        <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
        <li><strong>Withdrawal:</strong> Withdraw consent at any time where processing is consent-based</li>
      </ul>
      <LegalCallout type="info">Exercise these rights from Settings → Privacy or contact privacy@gigvora.com. We respond within 30 days.</LegalCallout>
    </LegalSection>

    <LegalSection id="cookies" number="06" title="Cookies & Tracking">
      <p>We use cookies and similar technologies for:</p>
      <ul className="list-disc pl-4 space-y-1">
        <li><strong>Essential:</strong> Authentication, security, and core functionality</li>
        <li><strong>Preferences:</strong> Language, theme, and display settings</li>
        <li><strong>Analytics:</strong> Usage patterns and platform improvement (anonymized)</li>
        <li><strong>Marketing:</strong> Relevant advertising with your consent</li>
      </ul>
      <p>You can manage cookie preferences in your browser settings or through our cookie consent manager.</p>
    </LegalSection>

    <LegalSection id="retention" number="07" title="Data Retention">
      <p>We retain personal data only as long as necessary for the purposes described in this policy. Active account data is retained while your account is active. After account deletion, we retain certain data for up to 90 days for legal and compliance purposes, after which it is permanently erased.</p>
    </LegalSection>

    <LegalSection id="international" number="08" title="International Transfers">
      <p>Your data may be transferred to and processed in countries outside your jurisdiction. We ensure adequate protection through Standard Contractual Clauses (SCCs), adequacy decisions, and other lawful transfer mechanisms compliant with GDPR and applicable data protection laws.</p>
    </LegalSection>

    <LegalSection id="children" number="09" title="Children's Privacy">
      <p>Gigvora is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child, we will promptly delete it.</p>
    </LegalSection>

    <LegalSection id="changes" number="10" title="Policy Changes">
      <p>We may update this policy periodically. Material changes will be communicated via email and in-app notification at least 30 days before taking effect. Continued use after changes constitutes acceptance.</p>
    </LegalSection>

    <LegalSection id="contact" number="11" title="Contact Us">
      <p>For privacy inquiries, contact our Data Protection Officer:</p>
      <ul className="list-none space-y-1">
        <li>📧 privacy@gigvora.com</li>
        <li>📬 Gigvora Inc., Privacy Office, [Address]</li>
        <li>🌐 Support Center → Privacy Requests</li>
      </ul>
    </LegalSection>
  </LegalPageShell>
  </>
);

export default PrivacyPage;
