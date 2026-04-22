import { pgTable, uuid, text, jsonb, timestamp, integer, boolean, index, uniqueIndex, primaryKey } from 'drizzle-orm/pg-core';

/** Domain 12 — Companies, employer presence, brand. */
export const companies = pgTable(
  'companies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    tagline: text('tagline').notNull().default(''),
    about: text('about').notNull().default(''),
    industry: text('industry'),
    sizeBand: text('size_band'),
    foundedYear: integer('founded_year'),
    headquarters: text('headquarters'),
    website: text('website'),
    logoUrl: text('logo_url'),
    coverUrl: text('cover_url'),
    brandColor: text('brand_color'),
    visibility: text('visibility').notNull().default('public'),
    status: text('status').notNull().default('active'),
    verified: boolean('verified').notNull().default(false),
    followerCount: integer('follower_count').notNull().default(0),
    employeeCount: integer('employee_count').notNull().default(0),
    openRolesCount: integer('open_roles_count').notNull().default(0),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    version: integer('version').notNull().default(1),
  },
  (t) => ({
    slugUq: uniqueIndex('companies_slug_uq').on(t.slug),
    statusIdx: index('companies_status_idx').on(t.status, t.visibility),
    industryIdx: index('companies_industry_idx').on(t.industry),
  }),
);

export const companyMembers = pgTable(
  'company_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id').notNull(),
    identityId: uuid('identity_id').notNull(),
    role: text('role').notNull().default('employee'),
    title: text('title'),
    isPublic: boolean('is_public').notNull().default(true),
    status: text('status').notNull().default('active'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pairUq: uniqueIndex('company_members_pair_uq').on(t.companyId, t.identityId),
    byCompany: index('company_members_company_idx').on(t.companyId, t.status),
    byIdentity: index('company_members_identity_idx').on(t.identityId),
  }),
);

export const companyLocations = pgTable('company_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  label: text('label').notNull(),
  city: text('city'),
  country: text('country'),
  isHq: boolean('is_hq').notNull().default(false),
  position: integer('position').notNull().default(0),
});

export const companyLinks = pgTable(
  'company_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id').notNull(),
    kind: text('kind').notNull(),
    url: text('url').notNull(),
    position: integer('position').notNull().default(0),
  },
  (t) => ({ kindUq: uniqueIndex('company_links_kind_uq').on(t.companyId, t.kind) }),
);

export const companyFollowers = pgTable(
  'company_followers',
  {
    companyId: uuid('company_id').notNull(),
    followerId: uuid('follower_id').notNull(),
    followedAt: timestamp('followed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.companyId, t.followerId] }) }),
);

export const companyPosts = pgTable(
  'company_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id').notNull(),
    authorId: uuid('author_id').notNull(),
    body: text('body').notNull(),
    media: jsonb('media').$type<Array<Record<string, unknown>>>().notNull().default([]),
    status: text('status').notNull().default('published'),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
    reactionCount: integer('reaction_count').notNull().default(0),
  },
  (t) => ({ byCompany: index('company_posts_company_idx').on(t.companyId, t.publishedAt) }),
);

export const companyBrand = pgTable('company_brand', {
  companyId: uuid('company_id').primaryKey(),
  primaryColor: text('primary_color'),
  secondaryColor: text('secondary_color'),
  textColor: text('text_color'),
  fontFamily: text('font_family'),
  heroUrl: text('hero_url'),
  values: jsonb('values').$type<string[]>().notNull().default([]),
  perks: jsonb('perks').$type<string[]>().notNull().default([]),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type CompanyRow = typeof companies.$inferSelect;
export type CompanyMemberRow = typeof companyMembers.$inferSelect;
