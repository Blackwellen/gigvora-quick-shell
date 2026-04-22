import React from 'react';
import { ModPageShell, ModPageHeader, ModBackLink, ModTable, ModBadge } from './_shared';

const rows = [
  ['CHT-4421', 'DM thread (u_1182 ↔ u_5510)', '12 msgs', <ModBadge tone="danger">Harassment</ModBadge>, '2m'],
  ['CHT-4420', 'DM thread (u_2210 ↔ u_3340)', '4 msgs', <ModBadge tone="warn">Solicitation</ModBadge>, '8m'],
  ['CHT-4418', 'DM thread (u_8801 ↔ u_8810)', '36 msgs', <ModBadge tone="info">Phishing-like</ModBadge>, '32m'],
];

export default function ModChatsPage() {
  return (
    <ModPageShell>
      <ModBackLink />
      <ModPageHeader eyebrow="DMs" title="Chats Review" subtitle="Reviewable chat threads surfaced by ML signals — opened only when policy permits inspection." />
      <ModTable headers={['ID', 'Thread', 'Length', 'Signal', 'Flagged']} rows={rows} />
    </ModPageShell>
  );
}
