import React from 'react';
import { Heart } from 'lucide-react';
import { LegalPageShell, LegalSection, LegalCallout } from '@/components/legal/LegalPageShell';

const TOC = [
  { id: 'principles', label: 'Core Principles' },
  { id: 'respect', label: 'Respect & Professionalism' },
  { id: 'content', label: 'Content Standards' },
  { id: 'harassment', label: 'Harassment & Abuse' },
  { id: 'integrity', label: 'Integrity & Honesty' },
  { id: 'safety', label: 'Safety' },
  { id: 'ip', label: 'Intellectual Property' },
  { id: 'reporting', label: 'Reporting Violations' },
  { id: 'enforcement', label: 'Enforcement Actions' },
];

export default function CommunityGuidelinesPage() {
  return (
    <LegalPageShell
      title="Community Guidelines"
      subtitle="The standards of conduct that keep Gigvora a safe, professional, and inclusive platform for everyone."
      icon={<Heart className="h-5 w-5 text-white/70" />}
      badge="Community Standards"
      lastUpdated="April 14, 2026"
      effectiveDate="April 14, 2026"
      version="v3.2"
      toc={TOC}
      relatedLinks={[
        { label: 'Trust & Safety', to: '/trust-safety' },
        { label: 'Appeals & Enforcement', to: '/legal/appeals' },
        { label: 'User Agreements', to: '/user-agreements' },
        { label: 'Terms & Conditions', to: '/terms' },
      ]}
    >
      <LegalCallout type="important">
        These guidelines apply to all interactions on Gigvora including profiles, messages, projects, reviews, groups, events, and content creation. Every user is expected to read and follow them.
      </LegalCallout>

      <LegalSection id="principles" number="01" title="Core Principles">
        <p>Gigvora is built on four pillars:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Professionalism:</strong> Conduct yourself as you would in any business environment</li>
          <li><strong>Inclusivity:</strong> Welcome and respect people of all backgrounds</li>
          <li><strong>Integrity:</strong> Be honest in your representations and dealings</li>
          <li><strong>Safety:</strong> Help maintain a platform free from harm and abuse</li>
        </ul>
      </LegalSection>

      <LegalSection id="respect" number="02" title="Respect & Professionalism">
        <p>Treat all users with dignity and respect. Constructive disagreement is welcome; personal attacks are not. Use professional language in all communications. Be mindful of cultural differences and communication styles across our global community.</p>
      </LegalSection>

      <LegalSection id="content" number="03" title="Content Standards">
        <p>All content must be:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Accurate and not misleading</li>
          <li>Relevant to the professional context</li>
          <li>Free from spam, excessive self-promotion, or manipulation</li>
          <li>Properly attributed when referencing others' work</li>
          <li>Appropriate for a professional audience</li>
        </ul>
      </LegalSection>

      <LegalSection id="harassment" number="04" title="Harassment & Abuse">
        <LegalCallout type="warning">Zero tolerance. Any form of harassment results in immediate investigation and enforcement action.</LegalCallout>
        <p>Prohibited behavior includes:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Threats, intimidation, or bullying</li>
          <li>Discrimination based on race, gender, religion, orientation, disability, or any protected characteristic</li>
          <li>Unwanted sexual advances or sexually explicit messages</li>
          <li>Doxxing or sharing others' private information</li>
          <li>Coordinated attacks or brigading</li>
          <li>Stalking or persistent unwanted contact after being asked to stop</li>
        </ul>
      </LegalSection>

      <LegalSection id="integrity" number="05" title="Integrity & Honesty">
        <ul className="list-disc pl-4 space-y-1">
          <li>Do not misrepresent your identity, qualifications, or experience</li>
          <li>Do not create fake accounts or manipulate reviews</li>
          <li>Do not engage in fraudulent transactions or payment manipulation</li>
          <li>Honor your commitments and agreements</li>
          <li>Disclose conflicts of interest</li>
        </ul>
      </LegalSection>

      <LegalSection id="safety" number="06" title="Safety">
        <p>Do not share content that promotes violence, self-harm, dangerous activities, or illegal substances. Do not use the platform to recruit for illegal activities. Report any content or behavior that poses a safety risk immediately.</p>
      </LegalSection>

      <LegalSection id="ip" number="07" title="Intellectual Property">
        <p>Respect intellectual property rights. Do not share copyrighted material without permission. Do not pass off others' work as your own. Report suspected IP infringement through our DMCA process.</p>
      </LegalSection>

      <LegalSection id="reporting" number="08" title="Reporting Violations">
        <p>If you witness a violation, report it through:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>The "Report" button on any content, profile, or message</li>
          <li>Trust & Safety center at /trust-safety</li>
          <li>Email: safety@gigvora.com for urgent matters</li>
        </ul>
        <p>All reports are confidential. Retaliation against reporters is strictly prohibited and will result in enforcement action.</p>
      </LegalSection>

      <LegalSection id="enforcement" number="09" title="Enforcement Actions">
        <p>Violations result in escalating enforcement:</p>
        <ol className="list-decimal pl-4 space-y-1">
          <li><strong>Warning:</strong> First-time minor violations</li>
          <li><strong>Content removal:</strong> Violating content is removed</li>
          <li><strong>Temporary restriction:</strong> Limited platform access (7-30 days)</li>
          <li><strong>Suspension:</strong> Account suspended (30-90 days)</li>
          <li><strong>Permanent ban:</strong> Severe or repeated violations</li>
        </ol>
        <p>All enforcement actions can be appealed through the <a href="/legal/appeals" className="text-accent hover:underline">Appeals process</a>.</p>
      </LegalSection>
    </LegalPageShell>
  );
}
