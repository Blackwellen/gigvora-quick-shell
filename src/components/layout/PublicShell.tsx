import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicTopBar } from '@/components/navigation/PublicTopBar';
import { Footer } from '@/components/navigation/Footer';
import { AutoBackNav } from '@/components/shell/AutoBackNav';

export const PublicShell: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicTopBar />
      <main className="flex-1">
        <div className="max-w-[var(--public-max-width)] mx-auto w-full px-[var(--shell-gutter-wide)] py-10">
          <AutoBackNav />
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
};
