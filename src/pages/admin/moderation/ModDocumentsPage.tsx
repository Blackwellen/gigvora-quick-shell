import React from 'react';
import { ModPageShell, ModPageHeader, ModBackLink, ModTable, ModBadge } from './_shared';

const rows = [
  ['doc_5512', 'Pitch_Deck_v3.pdf', '2.4 MB', <ModBadge tone="warn">Watermark missing</ModBadge>, 'a.fenton'],
  ['doc_5511', 'Service_Agreement.docx', '88 KB', <ModBadge tone="info">PII detected</ModBadge>, 'r.kahan'],
  ['doc_5509', 'Portfolio.zip', '12 MB', <ModBadge tone="success">Clean</ModBadge>, 'auto'],
  ['doc_5505', 'Invoice_3320.pdf', '420 KB', <ModBadge tone="danger">Counterfeit pattern</ModBadge>, 'r.kahan'],
];

export default function ModDocumentsPage() {
  return (
    <ModPageShell>
      <ModBackLink />
      <ModPageHeader eyebrow="Files" title="Document Review" subtitle="Uploaded document review for PII leakage, counterfeit patterns, and IP infringement." />
      <ModTable headers={['ID', 'File', 'Size', 'Signal', 'Reviewer']} rows={rows} />
    </ModPageShell>
  );
}
