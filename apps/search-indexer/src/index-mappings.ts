import type { IndexName } from './index';

export const INDEX_FIELD_BOOSTS: Record<IndexName, string[]> = {
  users: ['title^2', 'headline^3', 'skills^4', 'location^2', 'tags^2', 'body'],
  jobs: ['title^3', 'skills^4', 'company^2', 'tags^2', 'body'],
  projects: ['title^3', 'skills^4', 'tags^2', 'body'],
  gigs: ['title^3', 'category^2', 'tags^2', 'body'],
  services: ['title^3', 'category^2', 'tags^2', 'body'],
  companies: ['title^3', 'industry^3', 'hqCountry^2', 'tags^2', 'body'],
  startups: ['title^3', 'stage^2', 'tags^2', 'body'],
  media: ['title^3', 'kind^2', 'tags^2', 'body'],
  groups: ['title^3', 'topic^2', 'tags^2', 'body'],
  events: ['title^3', 'mode^2', 'region^2', 'tags^2', 'body'],
  podcasts: ['title^3', 'category^2', 'tags^2', 'body'],
  webinars: ['title^3', 'mode^2', 'tags^2', 'body'],
  posts: ['title^2', 'tags^2', 'body'],
};