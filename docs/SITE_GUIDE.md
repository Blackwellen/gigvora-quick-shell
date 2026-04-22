# Gigvora Site Guide and Site Map

> **Version:** 2.0 — April 2026
> **Purpose:** Full product information architecture, route hierarchy, page families, menu architecture, dashboard families, and cross-domain navigation logic.

---

## 1. Product Structure Philosophy

Gigvora is a multi-domain enterprise platform containing:

- **Professional Networking** — Feed, profiles, connections, groups
- **Freelance & Services Commerce** — Gigs, services, orders, custom offers
- **Jobs & Recruitment** — Job board, ATS, Recruiter Pro
- **Project & Procurement** — Project marketplace, proposals, workspaces, milestones
- **Creator & Media Ecosystem** — Video center, reels, podcasts, webinars, creation studio
- **AI Workspace** — Chat, writer, image/video studio, assistants, prompt library
- **Experience Launchpad** — Pathways, challenges, mentors for early-career users
- **Enterprise Relationship & Growth** — Enterprise Connect, Sales Navigator, Ads Manager
- **Dashboards** — Role-aware command centers (User, Professional, Enterprise)
- **Support, Billing & Disputes** — Help center, tickets, finance hub, escrow
- **Internal Admin Terminals** — Moderation, trust & safety, compliance, super admin

The site distinguishes between:

| Shell | Purpose |
|-------|---------|
| Public Shell | Marketing, showcase, legal, pricing — unauthenticated |
| Logged-In Shell | Discovery, work, social, media — authenticated main app |
| Dashboard Shell | Role-specific management surfaces |
| AI Shell | Dedicated AI workspace |
| Admin Shell | Internal operational terminals |
| Mobile Shell | Bottom nav + drawer-based mega menu equivalents |

---

## 2. Role Model

### External Roles
| Role | Description |
|------|-------------|
| **User** | Personal activity, hiring, discovery |
| **Professional** | Deliver services, grow career, earn |
| **Enterprise** | Scale teams, procurement, campaigns |

### Internal Role Family
| Role | Description |
|------|-------------|
| **Admin** | Moderation, finance ops, trust & safety, super admin |

Sub-modes (e.g., Recruiter, Creator, Advertiser) exist within the main roles — no extra top-level role families.

---

## 3. Unauthenticated Site Map

### Main Public Routes
| Route | Page |
|-------|------|
| `/` | Landing Page |
| `/about` | About Gigvora |
| `/pricing` | Pricing & Plans |
| `/faq` | Frequently Asked Questions |
| `/product` | Product Overview |
| `/solutions` | Solutions Hub |
| `/solutions/:role` | Role-specific solution pages |
| `/support` | Support Hub |
| `/support/contact` | Contact Page |
| `/status` | System Status |
| `/trust-safety` | Trust & Safety |

### Legal Pages
| Route | Page |
|-------|------|
| `/terms` | Terms of Service |
| `/privacy` | Privacy Policy |
| `/user-agreements` | User Agreements |
| `/legal/disputes-policy` | Disputes Policy |
| `/legal/payments-escrow` | Payments & Escrow Policy |
| `/legal/advertising-policy` | Advertising Policy |
| `/legal/creator-monetization` | Creator Monetization Policy |
| `/legal/community-guidelines` | Community Guidelines |
| `/legal/appeals` | Appeals Policy |

### Showcase / Product Discovery Pages
| Route | Product |
|-------|---------|
| `/showcase/jobs` | Jobs Marketplace |
| `/showcase/gigs` | Gigs Marketplace |
| `/showcase/projects` | Projects Marketplace |
| `/showcase/services` | Services Marketplace |
| `/showcase/recruiter-pro` | Recruiter Pro |
| `/showcase/sales-navigator` | Sales Navigator |
| `/showcase/enterprise-connect` | Enterprise Connect |
| `/showcase/ads` | Gigvora Ads |
| `/showcase/networking` | Networking |
| `/showcase/events` | Events & Webinars |
| `/showcase/podcasts` | Podcasts |
| `/showcase/mentorship` | Mentorship |
| `/showcase/creator-studio` | Creator Studio |
| `/showcase/launchpad` | Experience Launchpad |

### Auth Routes
| Route | Page |
|-------|------|
| `/signin` | Sign In |
| `/signup` | Sign Up |
| `/forgot-password` | Forgot Password |
| `/reset-password` | Reset Password |
| `/verify` | Email Verification |
| `/onboarding` | Onboarding / Role Selection |
| `/account-locked` | Account Locked |

---

## 4. Authenticated Main App Site Map

### Core Navigation
| Route | Surface |
|-------|---------|
| `/feed` | Social Feed Home |
| `/explore` | Search Explorer Hub |
| `/explore/people` | People Search |
| `/explore/jobs` | Jobs Search |
| `/explore/projects` | Projects Search |
| `/explore/gigs` | Gigs Search |
| `/explore/services` | Services Search |
| `/explore/events` | Events Search |
| `/explore/groups` | Groups Search |
| `/explore/podcasts` | Podcasts Search |
| `/explore/webinars` | Webinars Search |
| `/explore/pages` | Pages Search |
| `/explore/saved` | Saved Searches |
| `/explore/map` | Map View |
| `/explore/compare` | Compare Preview |
| `/search` | Command Center Search |

### Profile Family
| Route | Surface |
|-------|---------|
| `/profile` | Own Profile |
| `/profile/:userId` | User Profile |
| `/profile/:userId/activity` | Activity Tab |
| `/profile/:userId/services` | Services Tab |
| `/profile/:userId/gigs` | Gigs Tab |
| `/profile/:userId/projects` | Projects Tab |
| `/profile/:userId/reviews` | Reviews Tab |
| `/profile/:userId/media` | Media Tab |
| `/profile/:userId/events` | Events Tab |
| `/profile/:userId/network` | Network Tab |
| `/profile/edit` | Profile Edit (NEW) |
| `/creator/:userId` | Creator Profile |

### Networking Family
| Route | Surface |
|-------|---------|
| `/networking` | Networking Home |
| `/networking/connections` | Connections Hub |
| `/networking/followers` | Followers |
| `/networking/following` | Following |
| `/networking/suggestions` | Suggested Connections |
| `/networking/invitations` | Pending Invitations |
| `/networking/cards` | Digital Card Gallery |
| `/networking/follow-ups` | Follow-Up Center |
| `/networking/collaboration` | Collaboration Suggestions |
| `/networking/rooms` | Rooms Lobby |
| `/networking/rooms/create` | Room Creation Wizard |
| `/networking/rooms/:roomId` | Live Room |
| `/networking/rooms/:roomId/host` | Host Console |
| `/networking/speed` | Speed Networking Lobby |
| `/networking/speed/live` | Live Speed Networking |
| `/networking/sessions` | Sessions |
| `/networking/sessions/analytics` | Session Analytics |
| `/networking/introductions` | Introductions |
| `/networking/analytics` | Networking Analytics |

### Events Family
| Route | Surface |
|-------|---------|
| `/events` | Events Discovery |
| `/events/create` | Create Event |
| `/events/:eventId` | Event Detail |
| `/events/:eventId/rsvp` | RSVP |
| `/events/:eventId/lobby` | Event Lobby |
| `/events/:eventId/live` | Live Room |
| `/events/:eventId/host` | Host Controls |
| `/events/:eventId/attendees` | Attendee Management |
| `/events/:eventId/replay` | Replay |
| `/events/:eventId/analytics` | Event Analytics |

### Inbox & Messaging Family
| Route | Surface |
|-------|---------|
| `/inbox` | Inbox Home |
| `/inbox/search` | Chat Search |
| `/inbox/settings` | Chat Settings |
| `/inbox/files` | Shared Files |
| `/inbox/linked` | Linked Context |
| `/inbox/unread` | Unread & Mentions |
| `/inbox/groups` | Group Chats |
| `/inbox/channels` | Channels |
| `/inbox/:threadId` | Thread View |
| `/inbox/:threadId/detail` | Thread Detail |
| `/inbox/:threadId/call` | Call Flow |
| `/inbox/:threadId/book` | Booking |
| `/inbox/:threadId/offer` | Custom Offer |

### Jobs & Recruitment Family
| Route | Surface |
|-------|---------|
| `/jobs` | Jobs Browse |
| `/jobs/create` | Create Job |
| `/jobs/:jobId` | Job Detail |
| `/jobs/applications` | Application Tracker |
| `/jobs/templates` | Job Templates |
| `/jobs/:jobId/workspace` | Job Workspace |
| `/jobs/:jobId/distribution` | Distribution |
| `/jobs/:jobId/applicants` | Applicants Center |
| `/jobs/:jobId/screening` | Screening |
| `/jobs/:jobId/team` | Hiring Team |
| `/jobs/:jobId/analytics` | Job Analytics |
| `/jobs/archive` | Job Archive |

### Hire (Unified Recruitment)
| Route | Surface |
|-------|---------|
| `/hire` | Command Center |
| `/hire/jobs` | Recruiter Jobs |
| `/hire/jobs/create` | Create Job |
| `/hire/jobs/:id` | Job Detail |
| `/hire/search` | Talent Search |
| `/hire/candidates` | Candidate Search |
| `/hire/match` | Match Center |
| `/hire/interviews` | Interviews |
| `/hire/offers` | Offers |
| `/hire/outreach` | Outreach |
| `/hire/analytics` | Analytics |
| `/hire/billing` | Billing |
| `/hire/templates` | Outreach Templates |
| `/hire/notes` | Candidate Notes |
| `/hire/seats` | Seats |
| `/hire/scorecards` | Scorecards |
| `/hire/pools` | Talent Pools |
| `/hire/team` | Hiring Team |
| `/hire/settings` | Hire Settings |
| `/hire/pipeline` | Pipeline |
| `/hire/pro` | Recruiter Pro |
| `/hire/management` | Management |

### Gigs Family
| Route | Surface |
|-------|---------|
| `/gigs` | Gigs Discovery |
| `/gigs/new` or `/gigs/create` | Create Gig |
| `/gigs/:gigId` | Gig Detail |
| `/gigs/orders/:orderId` | Gig Order |
| `/gigs/workspace` | Gig Workspace |
| `/gigs/packages` | Packages Builder |
| `/gigs/requirements` | Requirements Builder |
| `/gigs/analytics` | Analytics |
| `/gigs/orders` | Orders Center |
| `/gigs/pricing` | Pricing Intel |
| `/gigs/custom-offers` | Custom Offers |
| `/gigs/revisions` | Revision Management |
| `/gigs/availability` | Availability |
| `/gigs/addons` | Add-ons Builder |
| `/gigs/media` | Media Manager |
| `/gigs/promotions` | Promotions |
| `/gigs/archive` | Archive |
| `/gigs/checkout/:gigId` | Purchase Flow (NEW) |

### Services Family
| Route | Surface |
|-------|---------|
| `/services` | Services Marketplace |
| `/services/:serviceId` | Service Detail |
| `/services/create` | Create Service |
| `/services/orders` | Orders Center |
| `/services/browse` | Browse Services |
| `/services/:serviceId/detail` | Full Detail |
| `/services/listing/builder` | Listing Builder |
| `/services/packages/builder` | Packages Builder |
| `/services/availability` | Availability |
| `/services/:serviceId/book` | Booking |
| `/services/orders/:orderId/delivery` | Delivery |
| `/services/analytics` | Analytics |
| `/services/promotions` | Promotions |
| `/services/checkout/:serviceId` | Purchase Flow (NEW) |

### Projects Family
| Route | Surface |
|-------|---------|
| `/projects` | Projects Browse |
| `/projects/mine` | My Projects |
| `/projects/create` or `/projects/new` | Create Project |
| `/projects/templates` | Templates |
| `/projects/:projectId` | Project Detail |
| `/projects/:projectId/propose` | Proposal Submission |
| `/projects/:projectId/review` | Proposal Review |
| `/projects/:projectId/workspace` | Workspace |
| `/projects/:projectId/board` | Task Board |
| `/projects/:projectId/tasks` | Task Table |
| `/projects/:projectId/timeline` | Timeline |
| `/projects/:projectId/files` | Files |
| `/projects/:projectId/approvals` | Approvals |
| `/projects/:projectId/risks` | Risks & Blockers |
| `/projects/:projectId/escrow` | Escrow |
| `/projects/:projectId/milestones` | Milestones |
| `/projects/:projectId/dashboard` | Dashboard |
| `/projects/:projectId/deliverables` | Deliverables |
| `/projects/:projectId/fund` | Milestone Funding (NEW) |
| `/projects/archive` | Archive |

### Sales Navigator Family
| Route | Surface |
|-------|---------|
| `/navigator` | Navigator Home |
| `/navigator/leads` | Lead Search |
| `/navigator/talent` | Talent Search |
| `/navigator/accounts` | Account Search |
| `/navigator/intel` | Company Intelligence |
| `/navigator/outreach` | Outreach |
| `/navigator/graph` | Relationship Graph |
| `/navigator/geo` | Geo Intelligence |
| `/navigator/signals` | Signals |
| `/navigator/analytics` | Analytics |
| `/navigator/saved` | Saved Lists |
| `/navigator/smart-lists` | Smart Lists |
| `/navigator/seats` | Seats |
| `/navigator/saved-talent` | Saved Talent Lists |
| `/navigator/outreach-templates` | Outreach Templates |
| `/navigator/hiring-signals` | Hiring Signals |
| `/navigator/engagement` | Engagement Signals |
| `/navigator/settings` | Settings |

### Enterprise Connect Family
| Route | Surface |
|-------|---------|
| `/enterprise-connect` | Enterprise Connect Home |
| `/enterprise-connect/directory` | Directory |
| `/enterprise-connect/profile` | Enterprise Profile |
| `/enterprise-connect/partners` | Partner Discovery |
| `/enterprise-connect/procurement` | Procurement |
| `/enterprise-connect/intros` | Introductions |
| `/enterprise-connect/events` | Enterprise Events |
| `/enterprise-connect/rooms` | Enterprise Rooms |
| `/enterprise-connect/analytics` | Analytics |
| `/enterprise-connect/saved` | Saved Lists |
| `/enterprise-connect/matchmaking` | Matchmaking |
| `/enterprise-connect/activity` | Activity Signals |
| `/enterprise-connect/settings` | Settings |
| `/enterprise-connect/startups` | Startup Showcase (NEW) |
| `/enterprise-connect/startups/:id` | Startup Detail (NEW) |

### Ads Family
| Route | Surface |
|-------|---------|
| `/ads` | Ads Home |
| `/ads/campaigns` | Campaign List |
| `/ads/campaign-detail` | Campaign Detail |
| `/ads/adset-builder` | Ad Set Builder |
| `/ads/creative-builder` | Creative Builder |
| `/ads/assets` | Asset Library |
| `/ads/audience-builder` | Audience Builder |
| `/ads/keyword-builder` | Keyword Builder |
| `/ads/geo-targeting` | Geo Targeting |
| `/ads/forecasting` | Forecasting |
| `/ads/bid-budget` | Bid & Budget |
| `/ads/billing` | Billing |
| `/ads/analytics` | Analytics |
| `/ads/creative-compare` | Creative Compare |
| `/ads/attribution` | Attribution |
| `/ads/saved-audiences` | Saved Audiences |
| `/ads/placements` | Placement Manager |
| `/ads/audience-insights` | Audience Insights |
| `/ads/creative-performance` | Creative Performance |
| `/ads/policy-review` | Policy Review |

### Media Family
| Route | Surface |
|-------|---------|
| `/media` | Media Home |
| `/media/reels` | Reels Discovery |
| `/media/reels/:reelId` | Reel Viewer |
| `/media/reels/studio` | Reels Studio |
| `/media/videos` | Video Discovery |
| `/media/videos/:videoId` | Video Player |
| `/media/videos/upload` | Video Upload |
| `/media/videos/studio` | Video Studio |
| `/media/creators` | Creator Discovery |
| `/media/analytics` | Media Analytics |
| `/media/library` | Media Library |

### Creation Studio Family
| Route | Surface |
|-------|---------|
| `/creation-studio` | Studio Home |
| `/creation-studio/drafts` | Drafts |
| `/creation-studio/scheduled` | Scheduled |
| `/creation-studio/assets` | Asset Library |
| `/creation-studio/reel-builder` | Reel Builder |
| `/creation-studio/analytics` | Analytics |
| `/creation-studio/publish-review` | Publish Review |

### Podcasts Family
| Route | Surface |
|-------|---------|
| `/podcasts` | Discovery |
| `/podcasts/show/:showId` | Show Detail |
| `/podcasts/player` | Player |
| `/podcasts/library` | Library |
| `/podcasts/studio` | Creator Studio |
| `/podcasts/episode/:episodeId` | Episode Detail |
| `/podcasts/queue` | Queue |
| `/podcasts/series` | Series |
| `/podcasts/purchases` | Purchases |
| `/podcasts/subscriptions` | Subscriptions |
| `/podcasts/donations` | Donations |
| `/podcasts/recorder` | Recorder |
| `/podcasts/analytics` | Analytics |
| `/podcasts/host/:hostId` | Host Profile |

### Webinars Family
| Route | Surface |
|-------|---------|
| `/webinars` | Discovery |
| `/webinars/:webinarId` | Detail |
| `/webinars/:webinarId/lobby` | Lobby |
| `/webinars/:webinarId/live` | Live Player |
| `/webinars/:webinarId/replay` | Replay |
| `/webinars/host` | Host Studio |
| `/webinars/:webinarId/register` | Registration |
| `/webinars/:webinarId/checkout` | Checkout |
| `/webinars/:webinarId/chat` | Chat |
| `/webinars/library` | Library |
| `/webinars/series` | Series |
| `/webinars/:webinarId/donations` | Donations |
| `/webinars/purchases` | Purchases |
| `/webinars/:webinarId/analytics` | Analytics |
| `/webinars/:webinarId/settings` | Settings |

### Groups Family
| Route | Surface |
|-------|---------|
| `/groups` | Groups Hub |
| `/groups/:groupId` | Group Detail |
| `/groups/:groupId/feed` | Group Feed |
| `/groups/:groupId/members` | Members |
| `/groups/:groupId/files` | Files |
| `/groups/:groupId/events` | Events |
| `/groups/:groupId/moderation` | Moderation |
| `/groups/:groupId/join-approval` | Join Approval |
| `/groups/:groupId/analytics` | Analytics |

### Experience Launchpad Family
| Route | Surface |
|-------|---------|
| `/launchpad` | Launchpad Home |
| `/launchpad/discover` | Discover |
| `/launchpad/opportunities` | Opportunities |
| `/launchpad/pathways` | Pathways |
| `/launchpad/challenges` | Challenges |
| `/launchpad/applications` | Applications |
| `/launchpad/events` | Events |
| `/launchpad/enterprise` | Enterprise Programs |
| `/launchpad/saved` | Saved |
| `/launchpad/jobs` | Entry-Level Jobs |
| `/launchpad/hosts` | Hosts |
| `/launchpad/early-career` | Early Career |
| `/launchpad/graduate` | Graduate Opportunities |
| `/launchpad/school-leaver` | School Leaver |
| `/launchpad/career-changer` | Career Changer |
| `/launchpad/projects` | Experience Projects |
| `/launchpad/mentors` | Mentor Matching |
| `/launchpad/sessions` | Mentor Sessions |
| `/launchpad/learning` | Learning Paths |
| `/launchpad/portfolio` | Portfolio Builder |
| `/launchpad/badges` | Badges & Verification |
| `/launchpad/community` | Community |
| `/launchpad/analytics` | Analytics |
| `/launchpad/employer` | Employer Partners |
| `/launchpad/settings` | Settings |
| `/launchpad/progress` | Progress Tracker |

### AI Tools Family (Dedicated Shell)
| Route | Surface |
|-------|---------|
| `/ai` | AI Hub |
| `/ai/chat` | AI Chat |
| `/ai/writer` | AI Writer |
| `/ai/image` | AI Image Studio |
| `/ai/video` | AI Video Studio |
| `/ai/proposal` | Proposal Helper |
| `/ai/jd` | JD Helper |
| `/ai/brief` | Brief Helper |
| `/ai/outreach` | Outreach Assistant |
| `/ai/recruiter` | Recruiter Assistant |
| `/ai/support` | Support Summarizer |
| `/ai/analytics` | Analytics Assistant |
| `/ai/prompts` | Prompt Library |
| `/ai/history` | History |
| `/ai/billing` | AI Billing |
| `/ai/byok` | Bring Your Own Key |
| `/ai/settings` | AI Settings |

### Finance Family
| Route | Surface |
|-------|---------|
| `/finance` | Finance Hub |
| `/finance/wallet` | Wallet |
| `/finance/billing` | Billing |
| `/finance/invoices` | Invoices |
| `/finance/payouts` | Payouts |
| `/finance/commerce` | Commerce & Patronage |
| `/finance/pricing` | Pricing & Monetization |

### Calendar & Bookings
| Route | Surface |
|-------|---------|
| `/calendar` | Calendar |
| `/calendar/bookings` | Bookings List |
| `/calendar/availability` | Availability Settings |
| `/calendar/book` | Booking Wizard |

### Support (Authenticated)
| Route | Surface |
|-------|---------|
| `/help` | Support Center |
| `/help/categories` | Help Categories |
| `/help/article/:articleId` | Article Detail |
| `/help/submit` | Submit Ticket |
| `/help/tickets` | My Tickets |
| `/help/tickets/:ticketId` | Ticket Detail |
| `/help/escalations` | Escalations |
| `/help/search` | Support Search |
| `/help/advisor` | Advisor Console |

### Disputes & Escrow
| Route | Surface |
|-------|---------|
| `/disputes` | Disputes Hub |
| `/disputes/new` | File Dispute |
| `/disputes/:disputeId` | Dispute Detail |
| `/disputes/:disputeId/evidence` | Evidence Upload |
| `/disputes/:disputeId/counter` | Counter Response |
| `/disputes/:disputeId/mediation` | Mediation |
| `/disputes/arbitration` | Arbitration Review |
| `/disputes/history` | Resolution History |
| `/escrow` | Escrow Ledger |
| `/escrow/release` | Release Funds |
| `/escrow/refund` | Refund Request |

### Organization & Team
| Route | Surface |
|-------|---------|
| `/org` | Org Workspace |
| `/org/members` | Members & Seats |
| `/org/workspaces` | Shared Workspaces |
| `/org/settings` | Organization Settings (NEW) |
| `/team` | Team Management (NEW) |

### Mentorship Family
| Route | Surface |
|-------|---------|
| `/mentorship` | Mentor Marketplace |
| `/mentorship/profile/:mentorId` | Mentor Profile |
| `/mentorship/book/:mentorId` | Book Mentor |
| `/mentorship/feedback` | Feedback |
| `/mentorship/analytics` | Analytics |
| `/mentorship/payments` | Payments |

### Utility Routes
| Route | Surface |
|-------|---------|
| `/settings` | Account Settings |
| `/settings/integrations` | Integrations |
| `/notifications` | Notifications |
| `/saved` | Saved Items |
| `/analytics` | Global Analytics |
| `/purchases` | Purchases |
| `/donations` | Donations |
| `/pages` | Pages Management |
| `/work` | Work Hub |
| `/orders` | Orders Dashboard |
| `/offers` | Offers |

---

## 5. Dashboard Families

### User Dashboard
| Route | Surface |
|-------|---------|
| `/dashboard` | Overview (role-routed) |
| `/dashboard/activity` | My Activity |
| `/dashboard/saved` | Saved |
| `/dashboard/orders` | Orders & Purchases |
| `/dashboard/projects` | Projects |
| `/dashboard/applications` | Applications |
| `/dashboard/bookings` | Bookings |
| `/dashboard/media` | Media Library |
| `/dashboard/billing` | Billing |
| `/dashboard/support` | Support |
| `/dashboard/settings` | Settings |

### Professional Dashboard
| Route | Surface |
|-------|---------|
| `/dashboard/professional` | Overview |
| `/dashboard/work-queue` | Work Queue |
| `/dashboard/gigs` | Gigs & Services |
| `/dashboard/pro-orders` | Orders |
| `/dashboard/pro-projects` | Projects & Proposals |
| `/dashboard/pro-bookings` | Bookings |
| `/dashboard/earnings` | Earnings |
| `/dashboard/profile` | Performance |
| `/dashboard/analytics` | Analytics |
| `/dashboard/content` | Content & Media |
| `/dashboard/pro-billing` | Credits & Billing |
| `/dashboard/pro-settings` | Settings |

### Enterprise Dashboard
| Route | Surface |
|-------|---------|
| `/dashboard/hiring` | Hiring Ops |
| `/dashboard/procurement` | Projects & Procurement |
| `/dashboard/vendors` | Vendors & Services |
| `/dashboard/campaigns` | Campaigns & Growth |
| `/dashboard/spend` | Spend & Approvals |
| `/dashboard/team` | Team Activity |
| `/dashboard/connect` | Enterprise Connect |
| `/dashboard/risk` | Support & Risk |
| `/dashboard/ent-settings` | Settings & Seats |

---

## 6. Admin Terminal Site Map

| Route | Surface |
|-------|---------|
| `/admin/login` | Admin Login Portal |
| `/admin` | Super Admin Overview |
| `/admin/ops` | Operations |
| `/admin/moderation` | Moderation |
| `/admin/trust` | Trust |
| `/admin/finance` | Finance Ops |
| `/admin/compliance` | Compliance |
| `/admin/shell` | Admin Shell |
| `/admin/cs-dashboard` | Customer Service |
| `/admin/dispute-ops` | Dispute Operations |
| `/admin/moderator-dashboard` | Moderator Dashboard |
| `/admin/trust-safety` | Trust & Safety ML |
| `/admin/ads-ops` | Ads Operations |
| `/admin/verification-compliance` | Verification & Compliance |
| `/admin/super-admin` | Super Admin Command |
| `/admin/search` | Internal Search |
| `/admin/audit` | Audit Logs |

---

## 7. Mega Menu Architecture

### Public Mega Menu (Unauthenticated)
Leads to `/showcase/*` pages.

| Group | Items |
|-------|-------|
| **Marketplace** | Jobs, Gigs, Projects, Services |
| **Professional Tools** | Recruiter Pro, Sales Navigator, Gigvora Ads, Enterprise Connect |
| **Community & Media** | Networking, Events & Webinars, Podcasts, Mentorship |
| **Featured** | Enterprise Connect, Creator Studio, Experience Launchpad |

### Authenticated Mega Menu
| Group | Items |
|-------|-------|
| **Discover** | Feed, Search Explorer, Network, Groups, Events, Media, Launchpad |
| **Work** | Projects, Gigs, Services, Jobs, Bookings, Creation Studio |
| **Hire** | Hire Talent, Recruiter Pro, Enterprise Connect, Navigator, Post Job, Post Project |
| **Media** | Video Center, Reels, Podcasts, Webinars, Media Library, Creator Profiles |
| **Grow** | Ads, Campaigns, Analytics, Content Tools |
| **Enterprise** | Enterprise Dashboard, Org Settings, Team Management, Vendors & Services, Spend & Approvals |
| **AI** | AI Hub, AI Chat, AI Writer, AI Image Studio, AI Video Studio, Assistants, Prompt Library |
| **Help** | Help Center, Support Tickets, Billing Help, Safety Center, Contact |

---

## 8. Avatar Dropdown Architecture

### Common Core
- View Profile
- Dashboard
- Saved
- Billing
- Support
- Settings
- Sign Out

### Professional Additions
- Orders
- Credits & Billing
- Content & Media

### Enterprise Additions
- Team Management → `/team`
- Organization Settings → `/org/settings`
- Enterprise Dashboard

### Admin (only visible when authenticated as admin)
- Admin Terminal → `/admin`

---

## 9. Global Search & Explorer

### Search Scopes
all · people · companies · agencies · jobs · projects · gigs · services · media · groups · events · startups · launchpad

### Explorer Routes
`/explore` → `/explore/people` → `/explore/jobs` → `/explore/projects` → `/explore/gigs` → `/explore/services` → `/explore/events` → `/explore/groups` → `/explore/podcasts` → `/explore/webinars` → `/explore/pages` → `/explore/saved` → `/explore/map` → `/explore/compare`

---

## 10. Mobile Site Map

### Bottom Navigation
| Tab | Route |
|-----|-------|
| Home | `/feed` |
| Jobs | `/jobs` |
| Create | `/create/post` |
| Inbox | `/inbox` |
| Me | `/profile` |

### Mobile Menu (Drawer)
Nested sub-drawers for each mega menu group:
- Discover → Feed, Search, Network, Groups, Events, Media, Launchpad
- Work → Projects, Gigs, Services, Jobs, Bookings, Studio
- Hire → Hire Center, Recruiter Pro, Navigator
- Media → Videos, Reels, Podcasts, Webinars
- Grow → Ads, Campaigns, Analytics
- Enterprise → Dashboard, Org Settings, Team
- AI → Hub, Chat, Writer, Image, Video
- Help → Help Center, Tickets, Contact

---

## 11. Cross-Linking & Follow-Through Rules

1. **No dead-end buttons** — every CTA must route to a real page or flow
2. **Purchase flows** — Order Now on gigs/services opens: review → add-ons → requirements → payment → success
3. **Project funding** — Fund Milestone opens: review → payment → success
4. **Dashboards** hand off to deeper workspaces cleanly
5. **Builders** hand off to management pages after success
6. **Media flows** return to browse/library/studio
7. **Payment flows** return to billing/order/project states
8. **Back buttons** exist wherever users may get stuck
9. **Modals/drawers** never trap users without recovery path

---

## 12. Missing Page Prevention Rule

If a route or option appears in:
- Side menu
- Mega menu
- Avatar dropdown
- Dashboard
- CTA button
- Modal action
- Bottom navigation

It **must** map to:
- A real page
- A real drawer/sheet/modal workflow
- A real success/review/follow-through surface

**No placeholders. No dead links. No fake nav entries.**

---

## 13. Sitewide Consistency Rules

- Dashboard nav is separate from main app nav
- Main app nav is separate from public nav
- Admin nav is separate from public/avatar flows
- Product families appear once in mega menu (no duplication)
- Shell containment and padding are consistent
- Route naming is coherent and predictable
- Mobile route access is intentionally mapped
- Rounded-2xl/3xl cards, premium enterprise styling throughout
- Better page gutters and mobile spacing
- Richer empty states and upload widgets
- Stronger CTA hierarchy and form layouts
