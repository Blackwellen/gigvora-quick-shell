import React from 'react';
import { Outlet } from 'react-router-dom';
import { LoggedInTopBar } from '@/components/navigation/LoggedInTopBar';
import { MobileBottomNav } from '@/components/shell/MobileBottomNav';
import MessagingBubble from '@/components/messaging/MessagingBubble';
import { MlFallbackBanner } from '@/components/ml/MlFallbackBanner';

export const LoggedInShell: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LoggedInTopBar />
      <main
        className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden pb-16 md:pb-0"
        style={{ height: 'calc(100vh - var(--topbar-height) - var(--megamenu-height))' }}
      >
        <div className="max-w-[var(--content-max-width)] mx-auto w-full px-3 md:px-[var(--shell-gutter)] py-5 md:py-7">
          <MlFallbackBanner className="mb-4" />
          <Outlet />
        </div>
      </main>
      <MobileBottomNav />
      <MessagingBubble />
    </div>
  );
};
