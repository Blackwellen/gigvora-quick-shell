import React from 'react';
import { ModPageShell, ModPageHeader, ModBackLink, ModTable, ModBadge } from './_shared';

const rows = [
  ['vc_9921', 'vd_8821 — "Product walkthrough"', '142 comments', <ModBadge tone="warn">3 flagged</ModBadge>, '12m'],
  ['vc_9918', 'vd_8810 — "Behind the scenes"', '67 comments', <ModBadge tone="danger">9 flagged</ModBadge>, '38m'],
  ['vc_9904', 'vd_8771 — "Tutorial part 4"', '21 comments', <ModBadge tone="success">Clear</ModBadge>, '2h'],
];

export default function ModVideoCommentsPage() {
  return (
    <ModPageShell>
      <ModBackLink />
      <ModPageHeader eyebrow="Video" title="Video Comments" subtitle="All video comment streams across reels, podcasts, and webinars — flagged-first ordering." />
      <ModTable headers={['Stream', 'Video', 'Volume', 'Status', 'Updated']} rows={rows} />
    </ModPageShell>
  );
}
