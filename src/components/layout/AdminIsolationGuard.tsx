/**
 * AdminIsolationGuard — runtime defence for hard-isolated admin shell.
 *
 * Mounted once inside AdminShell. On every render:
 *   1. Confirms no `data-user-shell-widget` element exists in the document.
 *      (LoggedInTopBar, MessagingBubble, MobileBottomNav, role switcher all
 *      stamp this attribute so any leak is detectable.)
 *   2. Logs a console.error in dev when a leak is detected.
 *   3. Strips body classes added by user-shell wrappers ('user-shell-active').
 *
 * In production this is a no-op except for the console.error so we never break
 * the admin experience — but it gives operators an immediate signal if a
 * regression mounts a public widget inside the admin terminal.
 */
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const LEAK_SELECTOR = '[data-user-shell-widget]';

export const AdminIsolationGuard: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!pathname.startsWith('/admin')) return;
    const check = () => {
      const leaks = document.querySelectorAll(LEAK_SELECTOR);
      if (leaks.length > 0) {
        // eslint-disable-next-line no-console
        console.error(
          `[AdminIsolationGuard] ${leaks.length} user-shell widget(s) leaked into /admin/*`,
          Array.from(leaks).map((el) => el.tagName + (el.id ? `#${el.id}` : '')),
        );
        // Defensive: hide the leaked nodes so the admin terminal stays clean.
        leaks.forEach((el) => el.setAttribute('hidden', 'true'));
      }
      document.body.classList.remove('user-shell-active', 'public-shell-active');
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname]);

  return null;
};

export default AdminIsolationGuard;
