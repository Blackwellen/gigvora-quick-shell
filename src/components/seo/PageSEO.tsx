import React from 'react';
import { usePageMeta } from '@/hooks/usePageMeta';

interface PageSEOProps {
  title: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonical?: string;
  noIndex?: boolean;
}

/**
 * Invisible component that sets page-level SEO meta tags.
 * Drop it anywhere in a page component's JSX tree.
 */
export const PageSEO: React.FC<PageSEOProps> = (props) => {
  usePageMeta(props);
  return null;
};
