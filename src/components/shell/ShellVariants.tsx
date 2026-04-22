/**
 * Product-Family Shell Variant System
 * 
 * Each product family operates as a slightly different environment
 * while preserving brand consistency through shared tokens.
 * 
 * Controls: max-width, gutters, nav/right rail presence,
 * background treatment, card radius, content padding,
 * and responsive breakpoint behavior.
 */

import React from 'react';
import { cn } from '@/lib/utils';

export type ShellVariant =
  | 'default'         // Standard logged-in pages (feed, notifications)
  | 'dashboard'       // Dashboard workstation (nav rail + right rail + tabs)
  | 'workspace'       // Full-width workspace (gig builder, project kanban)
  | 'studio'          // Creator studio (podcast, webinar, post composer)
  | 'marketplace'     // Browse/discovery (gigs, services, events, jobs)
  | 'admin'           // Internal admin terminal
  | 'public'          // Public/unauthenticated (landing, pricing, legal)
  | 'auth'            // Auth pages (sign in, sign up, verify)
  | 'media'           // Media-heavy surfaces (lightbox, player, viewer)
  | 'conversation'    // Inbox thread, chat, video call
  | 'social'          // Social feed, profiles, networking
  | 'recruiting'      // Recruiter Pro, talent search, pipeline
  | 'organization'    // Org management, team, procurement
  | 'finance';        // Finance hub, escrow, transactions

interface ShellVariantConfig {
  maxWidth: string;
  showNavRail: boolean;
  showRightRail: boolean;
  showMegaMenu: boolean;
  background: string;
  gutter: string;
  paddingY: string;
  cardRadius: string;
  railGap: string;
  contentClass?: string;
  /** Additional wrapper class for the shell body */
  bodyClass?: string;
}

export const SHELL_VARIANTS: Record<ShellVariant, ShellVariantConfig> = {
  default: {
    maxWidth: 'max-w-[var(--content-max-width)]',
    showNavRail: false,
    showRightRail: false,
    showMegaMenu: true,
    background: 'bg-background',
    gutter: 'px-[var(--shell-gutter)]',
    paddingY: 'py-7',
    cardRadius: 'rounded-[var(--card-radius-lg)]',
    railGap: 'gap-[var(--right-rail-gap)]',
  },

  social: {
    maxWidth: 'max-w-[var(--content-max-width)]',
    showNavRail: false,
    showRightRail: true,
    showMegaMenu: true,
    background: 'bg-background',
    gutter: 'px-[var(--shell-gutter)]',
    paddingY: 'py-6',
    cardRadius: 'rounded-[var(--card-radius-xl)]',
    railGap: 'gap-8',
    bodyClass: 'items-start',
  },

  dashboard: {
    maxWidth: 'max-w-[var(--content-max-width)]',
    showNavRail: true,
    showRightRail: true,
    showMegaMenu: true,
    background: 'bg-muted/20',
    gutter: 'px-[var(--shell-gutter)]',
    paddingY: 'py-6',
    cardRadius: 'rounded-[var(--card-radius-lg)]',
    railGap: 'gap-[var(--right-rail-gap)]',
  },

  workspace: {
    maxWidth: 'max-w-[var(--studio-max-width)]',
    showNavRail: true,
    showRightRail: false,
    showMegaMenu: true,
    background: 'bg-muted/10',
    gutter: 'px-[var(--shell-gutter)]',
    paddingY: 'py-5',
    cardRadius: 'rounded-[var(--card-radius-lg)]',
    railGap: 'gap-6',
  },

  studio: {
    maxWidth: 'max-w-[var(--studio-max-width)]',
    showNavRail: false,
    showRightRail: false,
    showMegaMenu: false,
    background: 'bg-background',
    gutter: 'px-[var(--shell-gutter)]',
    paddingY: 'py-5',
    cardRadius: 'rounded-[var(--card-radius-xl)]',
    railGap: 'gap-6',
    contentClass: 'min-h-[calc(100vh-var(--topbar-height))]',
  },

  marketplace: {
    maxWidth: 'max-w-[var(--marketplace-max-width)]',
    showNavRail: false,
    showRightRail: false,
    showMegaMenu: true,
    background: 'bg-background',
    gutter: 'px-[var(--shell-gutter-wide)]',
    paddingY: 'py-8',
    cardRadius: 'rounded-[var(--card-radius-xl)]',
    railGap: 'gap-8',
  },

  recruiting: {
    maxWidth: 'max-w-[var(--recruiting-max-width)]',
    showNavRail: true,
    showRightRail: true,
    showMegaMenu: true,
    background: 'bg-muted/15',
    gutter: 'px-[var(--shell-gutter)]',
    paddingY: 'py-5',
    cardRadius: 'rounded-[var(--card-radius-lg)]',
    railGap: 'gap-[var(--right-rail-gap)]',
  },

  organization: {
    maxWidth: 'max-w-[var(--org-max-width)]',
    showNavRail: true,
    showRightRail: true,
    showMegaMenu: true,
    background: 'bg-muted/10',
    gutter: 'px-[var(--shell-gutter)]',
    paddingY: 'py-6',
    cardRadius: 'rounded-[var(--card-radius-lg)]',
    railGap: 'gap-[var(--right-rail-gap)]',
  },

  finance: {
    maxWidth: 'max-w-[var(--content-max-width)]',
    showNavRail: true,
    showRightRail: true,
    showMegaMenu: true,
    background: 'bg-muted/10',
    gutter: 'px-[var(--shell-gutter)]',
    paddingY: 'py-6',
    cardRadius: 'rounded-[var(--card-radius-lg)]',
    railGap: 'gap-[var(--right-rail-gap)]',
  },

  admin: {
    maxWidth: 'max-w-[var(--admin-max-width)]',
    showNavRail: false,
    showRightRail: false,
    showMegaMenu: false,
    background: 'bg-muted/20',
    gutter: 'px-[var(--shell-gutter-tight)]',
    paddingY: 'py-5',
    cardRadius: 'rounded-[var(--card-radius)]',
    railGap: 'gap-5',
  },

  public: {
    maxWidth: 'max-w-[var(--public-max-width)]',
    showNavRail: false,
    showRightRail: false,
    showMegaMenu: true,
    background: 'bg-background',
    gutter: 'px-[var(--shell-gutter-wide)]',
    paddingY: 'py-10',
    cardRadius: 'rounded-[var(--card-radius-xl)]',
    railGap: 'gap-8',
  },

  auth: {
    maxWidth: 'max-w-md',
    showNavRail: false,
    showRightRail: false,
    showMegaMenu: false,
    background: 'bg-muted/10',
    gutter: 'px-6',
    paddingY: 'py-14',
    cardRadius: 'rounded-[var(--card-radius-xl)]',
    railGap: 'gap-6',
    contentClass: 'flex items-center justify-center min-h-[calc(100vh-var(--topbar-height))]',
  },

  media: {
    maxWidth: 'max-w-[var(--media-max-width)]',
    showNavRail: false,
    showRightRail: false,
    showMegaMenu: false,
    background: 'bg-black',
    gutter: 'p-0',
    paddingY: '',
    cardRadius: 'rounded-[var(--card-radius-xl)]',
    railGap: 'gap-0',
  },

  conversation: {
    maxWidth: 'max-w-[var(--conversation-max-width)]',
    showNavRail: false,
    showRightRail: true,
    showMegaMenu: true,
    background: 'bg-background',
    gutter: 'px-[var(--shell-gutter)]',
    paddingY: 'py-0',
    cardRadius: 'rounded-[var(--card-radius-lg)]',
    railGap: 'gap-[var(--right-rail-gap)]',
    contentClass: 'h-[calc(100vh-var(--topbar-height)-var(--megamenu-height))]',
  },
};

/* ─────────────────────────────────────────────
   ShellContent — wraps page content with
   variant-appropriate containment rules.
   ───────────────────────────────────────────── */

interface ShellContentProps {
  variant?: ShellVariant;
  children: React.ReactNode;
  className?: string;
  /** Override gutter for specific pages */
  gutter?: string;
  /** Override max-width */
  maxWidth?: string;
}

export const ShellContent: React.FC<ShellContentProps> = ({
  variant = 'default', children, className, gutter, maxWidth,
}) => {
  const config = SHELL_VARIANTS[variant];
  return (
    <div className={cn(
      maxWidth || config.maxWidth,
      'mx-auto w-full',
      gutter || config.gutter,
      config.paddingY,
      config.contentClass,
      config.bodyClass,
      className,
    )}>
      {children}
    </div>
  );
};

/* ─────────────────────────────────────────────
   ShellCard — consistent card container
   that respects the variant's card radius.
   ───────────────────────────────────────────── */

interface ShellCardProps {
  variant?: ShellVariant;
  children: React.ReactNode;
  className?: string;
  padding?: string;
}

export const ShellCard: React.FC<ShellCardProps> = ({
  variant = 'default', children, className, padding = 'p-5',
}) => {
  const config = SHELL_VARIANTS[variant];
  return (
    <div className={cn(
      'border bg-card shadow-card',
      config.cardRadius,
      padding,
      className,
    )}>
      {children}
    </div>
  );
};

/* ─────────────────────────────────────────────
   useShellVariant — helper hook for components
   that need to adapt to the current shell.
   ───────────────────────────────────────────── */

export const getShellConfig = (variant: ShellVariant) => SHELL_VARIANTS[variant];
