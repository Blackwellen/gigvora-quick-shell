import React from 'react';
import { HireShell } from '@/components/shell/HireShell';
import { SectionBackNav } from '@/components/shell/SectionBackNav';
import { Shield } from 'lucide-react';

interface HirePageWrapperProps {
  children: React.ReactNode;
  label: string;
  breadcrumbs?: { label: string; to?: string }[];
  rightInspector?: React.ReactNode;
}

export const HirePageWrapper: React.FC<HirePageWrapperProps> = ({ children, label, breadcrumbs, rightInspector }) => {
  return (
    <HireShell rightInspector={rightInspector}>
      <SectionBackNav homeRoute="/hire" homeLabel="Recruitment" currentLabel={label} icon={<Shield className="h-3 w-3" />} breadcrumbs={breadcrumbs} />
      {children}
    </HireShell>
  );
};
