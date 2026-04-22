export interface SearchFilters {
  tags?: string[];
  salaryMin?: number;
  salaryMax?: number;
  seniority?: string[];
  employmentType?: string[];
  remoteMode?: string[];
  location?: string;
  locationRadiusKm?: number;
  postedWithinDays?: number;
  mustHaveSkills?: string[];
  excludedSkills?: string[];
  companySize?: string[];
  visaSponsorship?: boolean;
  category?: string[];
  priceMin?: number;
  priceMax?: number;
  availability?: string[];
  region?: string[];
  startAfter?: string;
  startBefore?: string;
  format?: string[];
}

export const INDEX_WEIGHTS: Record<string, string[]> = {
  users: ['title^2', 'headline^3', 'skills^4', 'location^2', 'tags^2', 'body'],
  jobs: ['title^3', 'skills^4', 'company^2', 'tags^2', 'body'],
  projects: ['title^3', 'skills^4', 'tags^2', 'body'],
  gigs: ['title^3', 'category^2', 'tags^2', 'body'],
  services: ['title^3', 'category^2', 'tags^2', 'body'],
  companies: ['title^3', 'industry^3', 'hqCountry^2', 'tags^2', 'body'],
  events: ['title^3', 'mode^2', 'region^2', 'tags^2', 'body'],
  webinars: ['title^3', 'mode^2', 'tags^2', 'body'],
  podcasts: ['title^3', 'category^2', 'tags^2', 'body'],
  posts: ['title^2', 'tags^2', 'body'],
  media: ['title^3', 'kind^2', 'tags^2', 'body'],
  groups: ['title^3', 'topic^2', 'tags^2', 'body'],
  startups: ['title^3', 'stage^2', 'tags^2', 'body'],
};

export function parseFilters(raw?: string): SearchFilters {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as SearchFilters;
    return parsed ?? {};
  } catch {
    return {};
  }
}

export function buildSqlFilterClauses(filters: SearchFilters, params: any[]) {
  let where = '';
  if (filters.tags?.length) {
    params.push(filters.tags);
    where += ` AND tags && $${params.length}::text[]`;
  }
  if (filters.region?.length) {
    params.push(filters.region);
    where += ` AND region = ANY($${params.length}::text[])`;
  }
  if (filters.category?.length) {
    params.push(filters.category);
    where += ` AND COALESCE(meta->>'category','') = ANY($${params.length}::text[])`;
  }
  if (typeof filters.salaryMin === 'number') {
    params.push(filters.salaryMin);
    where += ` AND COALESCE((meta->>'salaryMin')::int, 0) >= $${params.length}`;
  }
  if (typeof filters.salaryMax === 'number') {
    params.push(filters.salaryMax);
    where += ` AND COALESCE((meta->>'salaryMax')::int, 999999999) <= $${params.length}`;
  }
  if (typeof filters.priceMin === 'number') {
    params.push(filters.priceMin);
    where += ` AND COALESCE((meta->>'priceMin')::int, 0) >= $${params.length}`;
  }
  if (typeof filters.priceMax === 'number') {
    params.push(filters.priceMax);
    where += ` AND COALESCE((meta->>'priceMax')::int, 999999999) <= $${params.length}`;
  }
  if (filters.remoteMode?.length) {
    params.push(filters.remoteMode);
    where += ` AND COALESCE(meta->>'remote','') = ANY($${params.length}::text[])`;
  }
  if (filters.employmentType?.length) {
    params.push(filters.employmentType);
    where += ` AND COALESCE(meta->>'workType', meta->>'employmentType', '') = ANY($${params.length}::text[])`;
  }
  if (filters.seniority?.length) {
    params.push(filters.seniority);
    where += ` AND COALESCE(meta->>'seniority','') = ANY($${params.length}::text[])`;
  }
  if (typeof filters.visaSponsorship === 'boolean') {
    params.push(String(filters.visaSponsorship));
    where += ` AND COALESCE(meta->>'visaSponsorship','false') = $${params.length}`;
  }
  if (typeof filters.postedWithinDays === 'number' && filters.postedWithinDays > 0) {
    params.push(filters.postedWithinDays);
    where += ` AND updated_at >= now() - ($${params.length} || ' days')::interval`;
  }
  return where;
}

export function buildOpenSearchFilters(filters: SearchFilters) {
  const out: any[] = [];
  if (filters.tags?.length) out.push({ terms: { tags: filters.tags } });
  if (filters.region?.length) out.push({ terms: { region: filters.region } });
  if (filters.category?.length) out.push({ terms: { category: filters.category } });
  if (typeof filters.salaryMin === 'number' || typeof filters.salaryMax === 'number') {
    out.push({ range: { salaryMin: { gte: filters.salaryMin ?? undefined, lte: filters.salaryMax ?? undefined } } });
  }
  if (typeof filters.priceMin === 'number' || typeof filters.priceMax === 'number') {
    out.push({ range: { priceMin: { gte: filters.priceMin ?? undefined, lte: filters.priceMax ?? undefined } } });
  }
  if (filters.remoteMode?.length) out.push({ terms: { remote: filters.remoteMode } });
  if (filters.employmentType?.length) out.push({ terms: { workType: filters.employmentType } });
  if (filters.seniority?.length) out.push({ terms: { seniority: filters.seniority } });
  if (typeof filters.postedWithinDays === 'number' && filters.postedWithinDays > 0) {
    out.push({ range: { updatedAt: { gte: `now-${filters.postedWithinDays}d/d` } } });
  }
  return out;
}