import React from 'react';
import { FinPageShell, FinPageHeader, FinBackLink, FinTable } from './_shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const EMAILS = [
  { id: 'EM-8401', to: 'sarah.chen@gigvora.com', subject: 'Your refund has been processed', sentBy: 'A. Reyes', status: 'sent', time: '3m ago' },
  { id: 'EM-8400', to: 'm.patel@studio.io', subject: 'Update on your July payout', sentBy: 'M. Khan', status: 'sent', time: '14m ago' },
  { id: 'EM-8399', to: 'finance@belmont.uk', subject: 'Corrected VAT on INV-2025-000812', sentBy: 'L. Smith', status: 'sent', time: '47m ago' },
  { id: 'EM-8398', to: 'james@kraftworks.co', subject: 'Subscription charge clarification', sentBy: 'A. Park', status: 'draft', time: '1h ago' },
];

const FinEmailsPage: React.FC = () => (
  <FinPageShell>
    <FinBackLink />
    <FinPageHeader
      eyebrow="Email Console"
      title="Finance email console"
      subtitle="All outbound and reply-to-customer emails from the finance team."
      right={<Button size="sm"><Plus className="h-3.5 w-3.5 mr-1.5" /> Compose</Button>}
    />
    <FinTable
      headers={['Email', 'To', 'Subject', 'Sent by', 'Status', 'When']}
      rows={EMAILS.map((e) => [
        <span className="font-mono text-xs">{e.id}</span>,
        <span className="text-muted-foreground">{e.to}</span>,
        <span className="font-medium">{e.subject}</span>,
        <span>{e.sentBy}</span>,
        <Badge variant={e.status === 'draft' ? 'outline' : 'secondary'} className="capitalize text-[10px]">{e.status}</Badge>,
        <span className="text-xs text-muted-foreground">{e.time}</span>,
      ])}
    />
  </FinPageShell>
);
export default FinEmailsPage;
