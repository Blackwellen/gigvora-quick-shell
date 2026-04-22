import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { LoggedInTopBar } from '@/components/navigation/LoggedInTopBar';
import { DashboardSidebar } from '@/components/shell/DashboardSidebar';
import { MobileBottomNav } from '@/components/shell/MobileBottomNav';
import MessagingBubble from '@/components/messaging/MessagingBubble';
import { AutoBackNav } from '@/components/shell/AutoBackNav';

export const DashboardShell: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <LoggedInTopBar />

      <div className="flex flex-1 min-h-0">
        <DashboardSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

        <main
          className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden pb-20 md:pb-0"
          style={{ height: 'calc(100vh - var(--topbar-height))' }}
        >
          

          <div className="max-w-[1400px] mx-auto w-full px-3 md:px-5 lg:px-8 py-4 md:py-6">
            <AutoBackNav />
            <Outlet />
          </div>
        </main>
      </div>

      <MobileBottomNav />
      <MessagingBubble />
    </div>
  );
};
