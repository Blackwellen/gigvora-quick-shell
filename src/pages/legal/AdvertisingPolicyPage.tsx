import React from 'react';
import { Megaphone } from 'lucide-react';
import { LegalPageShell, LegalSection, LegalCallout } from '@/components/legal/LegalPageShell';

const TOC = [
  { id: 'overview', label: 'Overview' },
  { id: 'eligibility', label: 'Advertiser Eligibility' },
  { id: 'content', label: 'Ad Content Standards' },
  { id: 'prohibited', label: 'Prohibited Content' },
  { id: 'targeting', label: 'Targeting & Data Use' },
  { id: 'transparency', label: 'Ad Transparency' },
  { id: 'review', label: 'Review Process' },
  { id: 'enforcement', label: 'Enforcement' },
];

export default function AdvertisingPolicyPage() {
  return (
    <LegalPageShell
      title="Advertising Policy"
      subtitle="Standards and guidelines for advertising on the Gigvora platform."
      icon={<Megaphone className="h-5 w-5 text-white/70" />}
      badge="Ad Standards"
      lastUpdated="April 14, 2026"
      effectiveDate="April 14, 2026"
      version="v1.2"
      toc={TOC}
      relatedLinks={[
        { label: 'Community Guidelines', to: '/legal/community-guidelines' },
        { label: 'Privacy Policy', to: '/privacy' },
        { label: 'Terms & Conditions', to: '/terms' },
      ]}
    >
      <LegalSection id="overview" number="01" title="Overview">
        <p>Gigvora Ads enables businesses and professionals to promote their services, products, and content to a targeted professional audience. All advertisements must comply with this policy, applicable laws, and our community standards.</p>
      </LegalSection>

      <LegalSection id="eligibility" number="02" title="Advertiser Eligibility">
        <p>Advertisers must have a verified Gigvora account in good standing, a valid payment method, and comply with all applicable advertising laws in their jurisdiction. Enterprise accounts and verified professionals receive priority ad review.</p>
      </LegalSection>

      <LegalSection id="content" number="03" title="Ad Content Standards">
        <ul className="list-disc pl-4 space-y-1">
          <li>Ads must be truthful, accurate, and not misleading</li>
          <li>Claims must be substantiated and verifiable</li>
          <li>Landing pages must match the ad's promise and content</li>
          <li>Pricing must be clear and inclusive of mandatory fees</li>
          <li>Testimonials must be genuine and not fabricated</li>
          <li>Professional tone appropriate for a business platform</li>
        </ul>
      </LegalSection>

      <LegalSection id="prohibited" number="04" title="Prohibited Content">
        <ul className="list-disc pl-4 space-y-1">
          <li>Illegal products, services, or activities</li>
          <li>Discriminatory content based on protected characteristics</li>
          <li>Misleading health, financial, or legal claims</li>
          <li>Adult or sexually explicit content</li>
          <li>Malware, phishing, or deceptive software</li>
          <li>Competitor disparagement or false comparisons</li>
          <li>Political advertising or propaganda</li>
          <li>Cryptocurrency and high-risk financial products without proper disclaimers</li>
        </ul>
        <LegalCallout type="warning">Ads containing prohibited content will be rejected. Repeated violations result in advertiser account suspension.</LegalCallout>
      </LegalSection>

      <LegalSection id="targeting" number="05" title="Targeting & Data Use">
        <p>Advertisers can target audiences based on professional attributes (industry, job title, skills, location) but cannot use personal data obtained outside the platform. All targeting must comply with our Privacy Policy and GDPR requirements. Sensitive categories (health, religion, political affiliation) cannot be used for targeting.</p>
      </LegalSection>

      <LegalSection id="transparency" number="06" title="Ad Transparency">
        <p>All paid content is clearly labeled as "Sponsored" or "Promoted." Users can view why they are seeing an ad and adjust their ad preferences. Advertisers can access the Ad Transparency Center to view competitor ads in their category.</p>
      </LegalSection>

      <LegalSection id="review" number="07" title="Review Process">
        <p>All ads undergo automated and manual review before publication. Standard review takes 24 hours. Expedited review (4 hours) is available for Enterprise advertisers. Rejected ads include specific reasons and improvement suggestions.</p>
      </LegalSection>

      <LegalSection id="enforcement" number="08" title="Enforcement">
        <p>Violations result in ad rejection, account warnings, spending limits, or advertiser suspension. Appeals can be filed through the Appeals & Enforcement process within 14 days of the enforcement action.</p>
      </LegalSection>
    </LegalPageShell>
  );
}
