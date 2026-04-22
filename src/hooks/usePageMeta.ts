import { useEffect } from 'react';

interface PageMetaOptions {
  title: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonical?: string;
  noIndex?: boolean;
}

const BASE_TITLE = 'Gigvora';
const BASE_URL = 'https://gigvora.lovable.app';

/**
 * Hook to set per-page document title and meta tags for SEO.
 * Updates on mount and cleans up on unmount (restores defaults).
 */
export function usePageMeta({
  title,
  description,
  ogTitle,
  ogDescription,
  ogImage,
  canonical,
  noIndex = false,
}: PageMetaOptions) {
  useEffect(() => {
    // Title
    const prevTitle = document.title;
    document.title = title.includes(BASE_TITLE) ? title : `${title} — ${BASE_TITLE}`;

    // Helper to set/create meta tags
    const setMeta = (attr: 'name' | 'property', key: string, content: string | undefined) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Description
    if (description) {
      setMeta('name', 'description', description);
    }

    // OG tags
    setMeta('property', 'og:title', ogTitle || title);
    setMeta('property', 'og:description', ogDescription || description);
    if (ogImage) setMeta('property', 'og:image', ogImage);

    // Twitter tags
    setMeta('name', 'twitter:title', ogTitle || title);
    setMeta('name', 'twitter:description', ogDescription || description);
    if (ogImage) setMeta('name', 'twitter:image', ogImage);

    // Canonical
    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (canonical) {
      if (!canonicalEl) {
        canonicalEl = document.createElement('link');
        canonicalEl.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalEl);
      }
      canonicalEl.setAttribute('href', canonical.startsWith('http') ? canonical : `${BASE_URL}${canonical}`);
    }

    // Robots
    if (noIndex) {
      setMeta('name', 'robots', 'noindex, nofollow');
    } else {
      const robotsMeta = document.querySelector('meta[name="robots"]');
      if (robotsMeta) robotsMeta.setAttribute('content', 'index, follow');
    }

    return () => {
      document.title = prevTitle;
    };
  }, [title, description, ogTitle, ogDescription, ogImage, canonical, noIndex]);
}

/**
 * SEO route configuration map for all major public pages.
 * Import and use with usePageMeta in each page component.
 */
export const SEO_PAGES = {
  home: {
    title: 'Gigvora — Hire, Sell, Create & Grow',
    description: 'The all-in-one professional platform to hire talent, sell services, create content, and grow your business.',
    canonical: '/',
  },
  about: {
    title: 'About Gigvora',
    description: 'Learn about Gigvora — the platform connecting freelancers, agencies, and enterprises for hiring, services, and growth.',
    canonical: '/about',
  },
  pricing: {
    title: 'Pricing & Plans',
    description: 'Explore Gigvora plans — Free, Starter, Pro, Business, and Enterprise. Find the right plan for your needs.',
    canonical: '/pricing',
  },
  faq: {
    title: 'Frequently Asked Questions',
    description: 'Find answers to common questions about Gigvora — accounts, payments, hiring, services, and more.',
    canonical: '/faq',
  },
  support: {
    title: 'Support & Help Center',
    description: 'Get help with Gigvora. Browse guides, submit tickets, and contact our support team.',
    canonical: '/support',
  },
  contact: {
    title: 'Contact Us',
    description: 'Reach out to the Gigvora team for sales inquiries, partnerships, or support.',
    canonical: '/support/contact',
  },
  product: {
    title: 'Product Overview',
    description: 'Discover all Gigvora features — hiring, gigs, services, projects, content creation, ads, and enterprise tools.',
    canonical: '/product',
  },
  solutions: {
    title: 'Solutions',
    description: 'See how Gigvora solves challenges for freelancers, agencies, recruiters, and enterprises.',
    canonical: '/solutions',
  },
  signin: {
    title: 'Sign In',
    description: 'Sign in to your Gigvora account to manage your work, hiring, and services.',
    canonical: '/signin',
    noIndex: true,
  },
  signup: {
    title: 'Create Account',
    description: 'Join Gigvora — create your free account and start hiring, selling, or growing today.',
    canonical: '/signup',
  },
  // Authenticated pages
  feed: {
    title: 'Feed',
    description: 'Your personalized Gigvora feed with updates from your network.',
    noIndex: true,
  },
  explore: {
    title: 'Explore',
    description: 'Discover talent, services, gigs, projects, and opportunities on Gigvora.',
    canonical: '/explore',
  },
  inbox: {
    title: 'Inbox',
    description: 'Your messages, group chats, and channels.',
    noIndex: true,
  },
  dashboard: {
    title: 'Dashboard',
    description: 'Your Gigvora dashboard — manage orders, earnings, hiring, and more.',
    noIndex: true,
  },
  professionalDashboard: {
    title: 'Professional Dashboard',
    description: 'Your professional command centre — earnings, work queue, analytics, and growth.',
    noIndex: true,
  },
  enterpriseDashboard: {
    title: 'Enterprise Command Centre',
    description: 'Enterprise dashboard — hiring ops, procurement, spend, team activity, and governance.',
    noIndex: true,
  },
  jobs: {
    title: 'Find Jobs',
    description: 'Browse and apply to jobs on Gigvora — remote, onsite, and hybrid opportunities.',
    canonical: '/jobs',
  },
  gigs: {
    title: 'Browse Gigs',
    description: 'Find freelance gigs for design, development, marketing, writing, and more.',
    canonical: '/gigs',
  },
  services: {
    title: 'Professional Services',
    description: 'Hire professional services — consulting, design, development, marketing, and business.',
    canonical: '/services',
  },
  projects: {
    title: 'Projects',
    description: 'Post projects and receive proposals from qualified freelancers and agencies.',
    canonical: '/projects',
  },
  terms: {
    title: 'Terms of Service',
    description: 'Gigvora terms of service — read our user agreement and platform policies.',
    canonical: '/terms',
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'Gigvora privacy policy — how we collect, use, and protect your data.',
    canonical: '/privacy',
  },
} as const;
