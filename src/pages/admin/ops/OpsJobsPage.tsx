import React from 'react';
import { OpsPageShell, OpsPageHeader, OpsBackLink, OpsTable, OpsBadge } from './_shared';

const rows = [
  ['job_2201', 'Senior Product Designer', 'Acme Co.', 'London · Hybrid', <OpsBadge tone="success">Live</OpsBadge>, '184 applicants'],
  ['job_2198', 'Staff Engineer (Platform)', 'Lyra Labs', 'Remote · UK', <OpsBadge tone="success">Live</OpsBadge>, '92 applicants'],
  ['job_2190', 'Marketing Manager', 'Northwind', 'Manchester', <OpsBadge tone="warn">Under review</OpsBadge>, '21 applicants'],
];

export default function OpsJobsPage() {
  return (
    <OpsPageShell>
      <OpsBackLink />
      <OpsPageHeader eyebrow="Catalog" title="Jobs" subtitle="All active job postings across the platform with applicant volume." />
      <OpsTable headers={['ID', 'Title', 'Company', 'Location', 'Status', 'Applicants']} rows={rows} />
    </OpsPageShell>
  );
}
