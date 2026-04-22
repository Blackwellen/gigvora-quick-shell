import React from 'react';
import { ModPageShell, ModPageHeader, ModBackLink, ModTable, ModBadge } from './_shared';

const rows = [
  ['gig_1102', 'Gig conversation', 'Buyer ↔ Seller', <ModBadge tone="warn">Off-platform pmt</ModBadge>, '4m'],
  ['proj_8810', 'Project room', 'Client + 3 freelancers', <ModBadge tone="info">Scope dispute</ModBadge>, '21m'],
  ['web_551', 'Webinar Q&A', 'Host + 412 attendees', <ModBadge tone="danger">Hate speech</ModBadge>, '1h'],
  ['intv_220', 'Interview chat', 'Recruiter ↔ Candidate', <ModBadge tone="neutral">Routine</ModBadge>, '2h'],
];

export default function ModCommunicationsPage() {
  return (
    <ModPageShell>
      <ModBackLink />
      <ModPageHeader eyebrow="Workflows" title="Comms Review" subtitle="Gig, project, webinar, and interview conversations surfaced for review where policy and permissions allow." />
      <ModTable headers={['Context ID', 'Type', 'Participants', 'Signal', 'Flagged']} rows={rows} />
    </ModPageShell>
  );
}
