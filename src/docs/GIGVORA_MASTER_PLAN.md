# Gigvora — Complete Enterprise Frontend Master Plan

> **Version**: 2.0 — Final Corrected Structure
> **Date**: April 2026
> **Purpose**: Single source of truth for the complete Gigvora front-end build across all 15 phases.

---

## Table of Contents

1. [Core Product Positioning](#1-core-product-positioning)
2. [Product Role Model](#2-product-role-model)
3. [Shell Model](#3-shell-model)
4. [Entry Logic After Login](#4-entry-logic-after-login)
5. [Global Navigation Model](#5-global-navigation-model)
6. [Dashboard vs Page Surfaces](#6-dashboard-vs-page-surfaces)
7. [Dashboard Inventory by Role](#7-dashboard-inventory-by-role)
8. [Full Page Inventory](#8-full-page-inventory)
9. [Landing Page Requirements](#9-landing-page-requirements)
10. [Floating Chat & Full Inbox](#10-floating-chat--full-inbox)
11. [Real-Time, Presence & Socket.IO](#11-real-time-presence--socketio)
12. [Pricing, Commission, Credits & Subscriptions](#12-pricing-commission-credits--subscriptions)
13. [Full Domain Blueprints](#13-full-domain-blueprints)
14. [Machine Learning, AI & Python Integration](#14-machine-learning-ai--python-integration)
15. [Reusable Component System](#15-reusable-component-system)
16. [Required Front-End States](#16-required-front-end-states)
17. [Build Phasing (15 Phases)](#17-build-phasing-15-phases)
18. [Complete Route Map](#18-complete-route-map)
19. [Two-Level Top Bar Specification](#19-two-level-top-bar-specification)
20. [Mega Menu Contents](#20-mega-menu-contents)
21. [Advanced Project Management Specification](#21-advanced-project-management-specification)
22. [Advanced Gig Management Specification](#22-advanced-gig-management-specification)
23. [LinkedIn-Level Feed Specification](#23-linkedin-level-feed-specification)
24. [LinkedIn-Level Profiles, Pages & Groups](#24-linkedin-level-profiles-pages--groups)
25. [Recruiter Pro — Full ATS Specification](#25-recruiter-pro--full-ats-specification)
26. [Sales Navigator — Full CRM Specification](#26-sales-navigator--full-crm-specification)
27. [Gigvora Ads — Google Ads-Level Specification](#27-gigvora-ads--google-ads-level-specification)
28. [Enterprise Connect Specification](#28-enterprise-connect-specification)
29. [Video Interview System](#29-video-interview-system)
30. [Calendar System](#30-calendar-system)
31. [Networking with Built-In Video](#31-networking-with-built-in-video)
32. [Support Center & Legal Pages](#32-support-center--legal-pages)
33. [Finance, Escrow & Disputes Deep Dive](#33-finance-escrow--disputes-deep-dive)
34. [Widget Catalogue by Dashboard Role](#34-widget-catalogue-by-dashboard-role)
35. [Role Visibility Matrix](#35-role-visibility-matrix)
36. [Component Inventory Mapped to Domains](#36-component-inventory-mapped-to-domains)
37. [ML/AI Touchpoint Matrix](#37-mlai-touchpoint-matrix)
38. [Real-Time Event Surface Plan](#38-real-time-event-surface-plan)
39. [File Organization](#39-file-organization)
40. [Technical Patterns](#40-technical-patterns)

---

## 1. Core Product Positioning

Gigvora is a hybrid platform that combines:

- Professional networking (LinkedIn-level identity, network, business reputation)
- Freelance services and gigs (Fiverr-level packages, orders, delivery workflows)
- Project marketplace workflows (Upwork-level projects, proposals, work delivery)
- Jobs and recruitment workflows (full ATS, headhunter management)
- Enterprise hiring and agency operations (recruiter teams, agency CRM)
- Sales prospecting and relationship workflows (Sales Navigator, CRM)
- Work execution and collaboration (project management, kanban, timelines)
- Community, groups, events, webinars, and podcasts (media layer)
- Growth tools including ads and promotion (Google Ads-level)
- Trust, payments, escrow, disputes, and governance

Gigvora should feel like a blend of:

- **LinkedIn** for identity, network, and business reputation
- **Upwork** for projects, proposals, and work delivery
- **Fiverr** for gigs, packages, and order workflows
- **A work operating system** for collaboration and execution
- **A recruiter platform** for sourcing and ATS workflows
- **A sales platform** for lead discovery and outreach
- **A media and community layer** for events, podcasts, webinars, and groups
- **Google Ads** for advertising, keyword planning, audience targeting

---

## 2. Product Role Model

### 2.1 Three Core User Types

#### 1. User / Client (Lightest Role)
- Normal users, buyers, clients
- People mainly consuming content and networking
- People browsing talent, jobs, gigs, projects, groups, events, podcasts, webinars
- People purchasing gigs or hiring
- People managing a personal profile and saved items

#### 2. Professional (Operator Role)
- Freelancers, consultants, creators
- Mentors, advisors
- Project contributors, gig sellers
- Professionals with portfolios, services, reviews, proposals, delivery workflows

#### 3. Enterprise (Organization Role)
- Companies, agencies, startups
- Recruiter teams, advertiser teams
- Business development teams, operations teams
- Client-success teams, hiring teams
- Organization owners/admins

### 2.2 Admin (Protected Layer)
- Not a public-facing customer role
- Moderation, finance operations, trust and safety
- Support ops, verification ops, ads ops, platform ops, super admin

### 2.3 Role Switching Rules
- Role switching lives in the avatar dropdown
- Switching changes visible dashboard surfaces, dashboard top menu items, CTA language, pinned widgets
- Switching does NOT create a separate product or login
- One identity with role overlays and permission-aware modules
- A user may have: normal user/client presence + professional freelancer presence + enterprise workspace membership

---

## 3. Shell Model

### 3.1 Public Pages Shell
**Used for**: Landing page, pricing, product pages, solution pages, public company/agency/user/group/event pages, help/FAQ/support articles, auth pages

**Structure**:
- Two-level top bar (top: logo, CTA buttons, Sign In, Get Started; bottom: mega menu links)
- Optional hero or page header
- Page body
- Deep multi-column footer
- **No dashboard menu**

### 3.2 Logged-In Page Shell
**Used for**: Feed/home, network, search/discovery, inbox, thread, jobs/gigs/projects browse, groups/events discovery, profile views, saved items, notifications, settings

**Structure**:
- Two-level logged-in top bar (top: logo, search, calendar, notifications, module buttons, avatar; bottom: mega menu nav links)
- Page body
- Floating chat launcher visible
- **No dashboard menu, no sidebar**

### 3.3 Dashboard Shell
**Used for**: User/Client Dashboard, Professional Dashboard, Enterprise Dashboard, Admin dashboards, deep operating surfaces (ATS, agency CRM, finance, ads manager, Sales Navigator, enterprise workspaces)

**Structure**:
- Two-level logged-in top bar (same as logged-in pages)
- Dashboard top menu / tab strip (role-aware)
- Dashboard workspace body
- Optional right insights panel or contextual drawers
- Floating chat launcher still available
- **No persistent left sidebar**

### 3.4 Navigation Principle
- Public site: top navigation with mega menus
- Logged-in pages: top bar only (no sidebar)
- Dashboard surfaces: top bar + top dashboard menu
- Premium feel, not generic SaaS template

---

## 4. Entry Logic After Login

### 4.1 Main Home After Login
The **Feed / Home Page** is the default destination after sign-in. It functions as:
- Content feed (LinkedIn-level social feed)
- Opportunity feed
- Network activity feed
- Event/media feed
- Discovery hub

**It is NOT the dashboard.**

### 4.2 Dashboard Entry
Dashboard is entered from the **avatar dropdown** "View Dashboard" option.

### 4.3 Avatar Dropdown Contents
- View Dashboard
- Role Switcher (User/Client | Professional | Enterprise)
- Profile
- Organization / Workspace Switch (if relevant)
- Inbox shortcut
- Billing
- Settings
- Help / Support
- Admin Console (admin users only)
- Logout

### 4.4 Admin Access
Protected, appears only for authorized internal users as "Admin Console" or "Control Center" in avatar dropdown. Opens admin shell, not customer dashboard.

---

## 5. Global Navigation Model

### 5.1 Public Top Bar (Two Levels, Before Login)

**Top Row (Left to Right)**:
- Gigvora logo (left)
- Spacer
- "Hire Talent" CTA button
- "Find Work" CTA button
- "Sign In" link
- "Get Started" primary button

**Bottom Row (Mega Menu Links)**:
- Product (mega menu)
- Solutions (mega menu)
- Discover (mega menu)
- Pricing (link)
- Trust & Safety (link)
- Support (link)

### 5.2 Logged-In Top Bar (Two Levels, After Login)

**Top Row (Left to Right)**:
- Gigvora logo (left)
- Search / command search bar (Cmd+K)
- Calendar icon button
- Notification bell (with unread count badge)
- Creation Studio button
- Gigvora Ads button (**always visible** next to avatar)
- Recruiter Pro button (**conditional** — appears after subscription, next to avatar)
- Sales Navigator button (**conditional** — appears after subscription, next to avatar)
- Enterprise Connect button
- Avatar circle (opens dropdown)

**Bottom Row (Mega Menu Nav Links)**:
- Home
- Network
- Jobs (mega menu)
- Projects (mega menu)
- Gigs (mega menu)
- Groups (mega menu)
- Events (mega menu)
- Media (mega menu)

### 5.3 Dashboard Top Menu
Role-aware horizontal tab strip. Different tabs per role (see Section 7).

---

## 6. Dashboard vs Page Surfaces

### 6.1 Dashboards (Operating Surfaces)
For: overview, active work, queues, KPIs, pipeline, performance, finance summary, alerts, widgets, quick actions, operational tables/boards.

Answers: What needs attention now? What is performing? What actions should be taken? What queues are active?

### 6.2 Pages (Destination Surfaces)
For: browse, detail view, discovery, reading, profile viewing, form submission, content consumption, public presence, workflow steps, standalone task completion.

Answers: What is this? What can I do here? How do I explore? How do I complete this action?

### 6.3 Practical Rule
- Monitoring/managing/prioritizing/reviewing across multiple items → **Dashboard shell**
- Viewing/browsing/creating/editing/consuming a single destination → **Page shell**

---

## 7. Dashboard Inventory by Role

### 7.1 User / Client Dashboard

**Dashboard Top Menu**: Overview | Hiring | Orders | Network | Saved | Finance | Settings

#### Overview
- Account snapshot widget
- Profile strength widget
- Recent messages widget
- Saved items summary widget
- Recommended people widget
- Recommended gigs/projects/jobs widget
- Upcoming events widget
- Recent activity widget
- Verification/trust prompts widget

#### Hiring
- Active projects posted
- Active jobs posted
- Proposal review queue
- Shortlist summary
- Recommended talent
- Spend snapshot
- Pending approvals

#### Orders
- Active gig orders
- Awaiting delivery
- Awaiting approval
- Completed orders
- Disputed items

#### Network
- Invitations
- Suggested connections
- Groups activity
- Event invitations
- Recent follow-ups

#### Saved
- Saved jobs
- Saved gigs
- Saved projects
- Saved people
- Saved companies/agencies

#### Finance
- Wallet summary
- Payment methods
- Active subscriptions
- Invoices
- Escrow holds
- Refunds/disputes summary

#### Settings
- Account settings
- Notifications
- Privacy
- Billing preferences
- Role availability

---

### 7.2 Professional Dashboard

**Dashboard Top Menu**: Overview | Opportunities | Work | Gigs | Projects | Documents | Creation Studio | Network | Finance | Analytics | Settings

#### Overview
- Earnings snapshot
- Profile strength
- New opportunity matches
- Active gigs
- Active projects
- Due soon
- Unread messages
- Reviews summary
- AI suggestions

#### Opportunities
- Matched projects
- Matched jobs
- Recruiter interest
- Saved searches
- Proposal credits
- Application drafts
- Invite inbox

#### Work
- Active delivery board
- Tasks due soon
- Milestones pending
- Files awaiting upload
- Approvals pending
- Revision requests

#### Gigs
- Gig performance
- Impressions
- Clicks
- Orders
- Cancellations
- Conversion rate
- Package performance
- Upsell performance

#### Projects
- Proposals sent
- Shortlist outcomes
- Active workspaces
- Delivery health
- Timeline slippage
- Client communication summary

#### Documents
- CV/resume vault
- Portfolio artifacts
- Certificates
- Proposal templates
- Uploaded forms
- Document sharing status

#### Creation Studio
- Drafts
- Scheduled posts
- Media assets
- AI writing tools
- AI image tools
- Published content analytics

#### Network
- New connections
- Speed networking invites
- Group activity
- Mentor/advisor leads
- Follow-up queue

#### Finance
- Wallet
- Payouts
- Pending funds
- Escrow held funds
- Invoices
- Subscription/credits
- Disputes with financial impact

#### Analytics
- Profile views
- Proposal conversion
- Gig conversion
- Job application conversion
- Repeat client rate
- Review trends
- Response-time trends

#### Settings
- Profile visibility
- Availability
- Service settings
- Notification preferences
- AI provider settings
- Payout settings

---

### 7.3 Enterprise Dashboard

**Dashboard Top Menu**: Overview | Hiring/ATS | Sales | Enterprise Connect | Projects | Gigs/Services | Ads | Network & Events | Inbox | Finance | Team | Analytics | Settings

#### Overview
- Company/agency snapshot
- Hiring summary
- Pipeline summary
- Projects delivery summary
- Ads spend summary
- Finance alerts
- Trust/compliance alerts
- Upcoming events
- Unread priority inbox items

#### Hiring / ATS
- Active jobs
- Candidate pipeline
- Shortlist queue
- Interviews upcoming
- Scorecards pending
- Recruiter activity
- Requisition performance
- Passive candidate watchlists

#### Sales
- Lead pipeline
- Accounts pipeline
- Saved lists
- Outreach sequences
- Reply rates
- Networking follow-up queue
- Event leads
- CRM task queue

#### Enterprise Connect
- Startup/showcase health
- Traction overview
- Advisor requests
- Partnership requests
- Business plan activity
- Client-success/account health
- Staffing readiness

#### Projects
- Portfolio health
- Active workspaces
- Delayed projects
- Resource allocation
- Budget status
- Approvals pending
- Deliverable risk

#### Gigs / Services
- Service catalogue performance
- Order flow
- Department-level service delivery
- Package performance
- Recurring service health

#### Ads
- Active campaigns
- Spend
- CPC / CPM / CPA
- Conversions
- Audience performance
- Creative performance
- Keyword planner suggestions
- Billing issues

#### Network & Events
- Hosted events
- Team event calendar
- Speed networking results
- Sponsor opportunities
- Relationship growth
- Follow-up tasks

#### Inbox
- Shared inbox summary
- Sales inbox summary
- Hiring inbox summary
- Support/escalation messages
- Internal team messages

#### Finance
- Wallet/ledger summary
- Escrow positions
- Invoices
- Commissions
- Subscriptions
- Payouts
- Refunds
- Disputes with financial impact

#### Team
- Members
- Seats
- Role assignments
- Permissions
- Department activity
- Organization switching
- Workspace memberships

#### Analytics
- Hiring analytics
- Sales analytics
- Project delivery analytics
- Gig/service analytics
- Content analytics
- Ads analytics
- Finance analytics

#### Settings
- Organization settings
- Billing
- Permissions
- Integrations
- Branding
- AI provider settings
- Security
- Compliance controls

---

### 7.4 Admin Dashboard / Control Center

**Admin Top Menu**: Overview | Users | Moderation | Trust & Safety | Finance Ops | Support Ops | Verification | Ads Ops | Platform Ops | Feature Flags | Audit Logs | Settings

#### Overview
- Platform health
- Alerts
- Queue counts
- Risk summary
- Transaction summary
- Live incidents

#### Users
- User search
- Account review
- Role review
- Bans/restrictions
- Impersonation tools (where permitted)

#### Moderation
- Reported posts
- Reported messages
- Flagged media
- Automated ML flags
- Action history

#### Trust & Safety
- Fraud cases
- Scam detection
- Repeat offenders
- Suspicious behavior graph
- Appeals

#### Finance Ops
- Payout review
- Refund queue
- Escrow holds
- Dispute payouts
- Billing anomalies

#### Support Ops
- Ticket queue
- SLA board
- Escalations
- Customer service macros
- Resolution analytics

#### Verification
- Identity verification
- Business verification
- Document verification
- Trust badge decisions

#### Ads Ops
- Ad review
- Keyword policy review
- Billing review
- Suspicious traffic review

#### Platform Ops
- Runtime health
- Release controls
- Queue monitoring
- WebSocket/session health
- Storage status
- System banners

#### Feature Flags
- Features
- Experiments
- Rollout control
- Beta groups

#### Audit Logs
- All critical admin actions
- Filters by actor, object, time, severity

#### Settings
- Policy settings
- Moderation rules
- Retention rules
- Security config
- Platform-wide text/config

---

## 8. Full Page Inventory

### 8.1 Logged-Out Pages
- Landing Page
- Product Overview
- Solutions for User/Client
- Solutions for Professionals
- Solutions for Enterprise
- Solutions for Recruiters
- Solutions for Agencies
- Solutions for Advertisers
- Solutions for Creators
- Pricing
- Trust & Safety
- FAQ
- Help Center Home
- Contact / Support
- About Us
- Terms and Conditions
- Privacy Policy
- User Agreements
- Sign In
- Sign Up
- Forgot Password
- Reset Password
- Verification Prompt

### 8.2 Logged-In Core Pages
- Feed / Home
- Network
- Search / Discovery
- Notifications Center
- Saved Items
- Inbox List
- Message Thread
- Unified Calls / Meetings History
- Global Command Search Overlay
- Calendar

### 8.3 Profile Pages
- User Profile View
- User Profile Edit
- Professional / Freelancer Profile View
- Professional Profile Edit
- Company Page View
- Company Page Management
- Agency Page View
- Agency Page Management
- Public Page View
- Profile Hub
- Reviews Page
- Portfolio Page
- References Page
- Media Page
- Verification Center
- Visibility Settings

### 8.4 Jobs, ATS & Recruitment Pages
- Jobs Browse
- Job Detail
- Job Create
- Job Edit
- Job Application Flow
- Application Workspace
- Recruiter Talent Search
- Candidate Profile
- Talent Pools
- Saved Searches
- Candidate Pipeline (Kanban)
- Interview Planner
- Interview Calendar
- Interview Detail
- Interview Scorecard
- Video Interview Room
- Video Interview Playback
- Offer / Handoff Page
- Headhunter Workspace
- Confidential Search Page
- Outreach Console
- Requisition Management
- Pipeline Analytics
- ATS Settings

### 8.5 Projects & Proposals Pages
- Projects Browse
- Project Detail
- Project Create
- Project Edit
- Proposal Create
- Proposal Review
- Proposal Compare
- Smart Match Drawer/Page
- Project Workspace Home
- Kanban Board
- Task List
- Task Detail
- Calendar / Timeline (Gantt)
- In-Project Chat
- In-Project Updates
- Deliverable Vault
- Team & Roles
- Files Page
- Milestones Page
- Approvals Page
- Submissions Page
- Budget Page
- Objectives Page
- Finance Tracking
- Pay Dispersion
- Escrow Management
- Dispute Management
- Task Delegation / Workload
- Archive Page
- Workspace Templates
- Risk Flags
- Change Requests

### 8.6 Gigs, Services & Orders Pages
- Gigs Browse
- Gig Detail
- Gig Create
- Gig Edit
- Package Builder
- Custom Offer Builder
- Offer Detail
- Checkout / Order Start
- Requirements Form
- Orders Center
- Order Detail (Full Timeline)
- Step-by-Step Updates
- Delivery Center
- Revision Center
- Submissions Page
- Reviews (Buyer/Seller)
- Gig Analytics Page
- Service Catalogue Page
- Gig-to-Project Conversion
- Recurring/Retained Services

### 8.7 Enterprise Connect Pages
- Enterprise Connect Home
- Startup / SME Showcase
- Showcase Builder
- Traction Page
- Business Plan Vault
- Advisor Marketplace
- Advisor Detail
- Feedback Board
- Boardroom Mode
- Partnership Requests
- Alliance Directory
- Staffing Portfolio Board
- Client Success Timeline
- Account Health Page

### 8.8 Sales Navigator & CRM Pages
- Sales Navigator Home
- Lead Search
- Account Search
- Prospect Profile
- Account Detail
- Buying Committee View
- Saved Lead Lists
- Saved Account Lists
- Sequence Manager
- Outreach Inbox
- Relationship Timeline
- Relationship Graph
- Conversion Analytics
- Business Card Capture / Scan
- Event Lead Capture
- CRM Tasks Page
- Sales Settings
- Sales Analytics Dashboard

### 8.9 Ads Pages
- Ads Manager Home
- Campaigns List
- Campaign Detail
- Campaign Builder (Multi-Step)
- Audience Builder
- Creative Studio
- Keyword Planner
- Search Insights
- Ads Analytics
- Billing & Spend Control
- Promoted Content Page
- Sponsored Placement Page
- Ad Policies & Guidelines
- A/B Testing
- Reporting

### 8.10 Community, Groups, Pages & Events Pages
- Groups Discovery
- Group Detail (Feed, Members, Events, Files, Rules)
- Group Creation
- Group Management
- Groups Feed
- Events Directory
- Event Detail
- RSVP Flow
- Event Host Console
- Event Calendar
- Community Dashboard Page
- Public Organization Page
- Public User Page

### 8.11 Podcasts, Webinars & Media Pages
- Media Home / Discovery
- Podcast Shows Directory
- Podcast Detail
- Podcast Episode Page
- Podcast Player Surface
- Podcast Recorder / Creator Studio
- Podcast Library / Album
- Webinar Discovery
- Webinar Detail
- Webinar Registration Flow
- Live Room
- Replay Library
- Host Studio
- Clips Library
- Session Analytics
- Creator Profile

### 8.12 Messaging & Communication Pages
- Unified Inbox
- Shared Inbox (Enterprise)
- Thread Detail
- Compose Overlay
- Attachments Browser
- Voice Notes View
- Call History
- Meeting Brief Page
- AI Message Assist Surface
- Contacts / Address Book

### 8.13 Finance, Billing, Disputes & Escrow Pages
- Finance Hub
- Wallet Home
- Wallet Ledger
- Escrow Console
- Release Queue
- Disputes Board
- Dispute Detail (Full Timeline)
- Refund Queue
- Invoices Center
- Invoice Detail
- Subscription Plans
- Billing Settings
- Commission Policy Page
- Charge Configuration
- Payout Settings
- Tax Center
- Credits Wallet

### 8.14 Support, Trust & Compliance Pages
- Support Center
- Help Article Page
- Ticket Submission
- My Tickets
- Ticket Detail
- Trust Center
- Consent Settings
- Security Settings
- Compliance Alerts
- Governance Case Log
- Appeals Page

### 8.15 Organization & Workspace Pages
- Organization Members
- Seats & Billing
- Permissions
- Shared Workspaces
- Department Workspaces
- Branding Settings
- Integrations
- Workspace Switching

### 8.16 Admin Pages
- Admin Overview
- User Management
- Profile Governance
- Moderation Queue
- Trust & Safety Queue
- Finance Admin Queue
- Support Admin Queue
- Verification Queue
- Ads Ops Queue
- Runtime Health
- Release Engineering
- Feature Flags
- Audit Logs
- Storage / System Settings
- Maintenance Mode

---

## 9. Landing Page Requirements

### 9.1 Required Sections (15 Total)
1. **Premium top navigation** with mega menus (two-level top bar)
2. **Hero section** with clear dual-sided CTA (Hire Talent / Find Work), animated headline, background pattern
3. **Role pathway cards** for User/Client, Professional, Enterprise — each with icon, description, CTA
4. **Social proof / trust band** — user count, gigs completed, projects delivered, enterprise clients, trust badges
5. **Product ecosystem overview** — visual grid of all platform capabilities
6. **Jobs / Gigs / Projects overview** — featured items, search teasers, category browsing
7. **Recruiter / Sales / Enterprise Connect overview** — feature highlights for premium products
8. **Networking and speed networking section** — video networking highlight, connection features, built-in video showcase
9. **Creator/media section** for webinars, podcasts, live rooms, creator tools
10. **Ads and growth section** — Gigvora Ads teaser, promotion tools, keyword planner mention
11. **Trust, escrow, dispute, and safety section** — escrow flow visual, dispute resolution, verification badges
12. **Pricing preview section** — plan cards for Free, Professional, Enterprise with feature comparison
13. **Testimonials / use cases** — customer quotes with avatar, role, company
14. **Final CTA banner** — conversion-focused with dual CTA
15. **Deep footer** with full product links

### 9.2 Public Route Hierarchy Supports
- Discoverability and SEO landing pages
- Conversion into signup
- Conversion into solution-specific onboarding
- Credibility for enterprise buyers

---

## 10. Floating Chat & Full Inbox

### 10.1 Floating Chat (After Login)
Appears across all app surfaces after login:
- Unread count badge
- Quick reply preview
- Recent threads list
- Minimize/maximize with smooth animations
- Switch to full inbox
- Voice note quick send
- AI draft assist entry point
- High-class design, premium feel

### 10.2 Full Inbox
Segmented tabs: All | Work | Hiring | Gigs/Orders | Sales | Support | Internal/Team

Features:
- All threads with search and filters
- Unread state, pinned threads, archived threads
- Shared inbox support for enterprise
- Context cards linking thread to order/project/job/lead/event

### 10.3 Thread Requirements
- Text messages
- Files
- Emoji reactions
- Voice notes
- Image/video attachments
- AI assist tools (draft, summarize)
- Thread summary
- Calls / video call launch
- Task extraction
- Search within thread
- Pinned items
- Moderation/reporting tools

---

## 11. Real-Time, Presence & Socket.IO

### 11.1 Real-Time Surfaces
- Inbox and messages
- Floating chat
- Presence indicators (online/away/offline)
- Read receipts
- Typing indicators
- Networking rooms
- Speed networking timers
- Live rooms / webinars
- Collaborative dashboards
- Alert counters (notifications, messages)
- ATS stage updates in active team workflows

### 11.2 Front-End Implications
- Optimistic updates
- Reconnect states (with UI indicator)
- WebSocket connection indicators
- Live participant lists
- Unread and seen states
- Transient system messages

### 11.3 Transport Layer
Socket.IO or equivalent WebSocket layer for messaging, room state, presence, and live activity.

---

## 12. Pricing, Commission, Credits & Subscriptions

### 12.1 Pricing Layers

**Free Layer**:
- Basic account, feed usage
- Limited networking, discovery, messaging

**Subscription Layer**:
- Professional subscription
- Enterprise subscription
- Recruiter Pro seats
- Sales Navigator seats
- Ads manager access tiers
- Creator/media premium features

**Credits Layer**:
- Proposal/bid credits
- Job posting credits
- Recruiter outreach credits
- AI generation credits

**Commission Layer**:
- Gig commissions
- Project commissions
- Mentor/advisor commissions
- Paid event/webinar commissions
- Marketplace transaction take rates

### 12.2 Required Pages
- Pricing (full plan comparison)
- Plan comparison
- Credits wallet
- Billing
- Usage and entitlements
- Commission explanation
- Invoices
- Upgrade flows

### 12.3 UX Principle
Pricing must feel **transparent, not punitive**.

---

## 13. Full Domain Blueprints

### 13.1 Recruiter Pro (Full ATS)
- Requisitions management
- Recruiter dashboard widgets
- Talent search (boolean search, AI ranking)
- Candidate profiles (parsed CV, skills match, history, notes, tags, scorecards)
- Saved talent pools
- Shortlist boards (per job, share with hiring team, compare)
- Outreach console (templates, sequences, tracking, response rates)
- Interview planner (schedule, calendar integration, panel setup)
- Interview calendar (availability, time zones, room booking)
- Video interviews (live video, recorded video questions, playback, scoring)
- Interview scorecards (criteria, ratings, comments, recommendation)
- Offer/handoff (offer letter builder, approval workflow)
- Headhunter workspace (confidential searches, retained search, client reporting)
- Confidential search (hidden company, NDA workflow)
- Pipeline analytics (time-to-hire, source effectiveness, stage conversion, diversity)
- Hiring collaboration (team comments, @mentions, activity log)
- Extensive kanban (custom stages, drag-drop, filters, bulk actions)
- Full job management (create, edit, publish, archive, clone, screening questions)

### 13.2 Enterprise Connect
- Startup/SME showcase pages (pitch, traction, team, product, funding stage)
- Business plan vaults (upload, version, share, AI summary)
- Traction tracking (MRR, users, growth rate, milestones)
- Advisor discovery (browse by expertise, industry, availability)
- Partnership requests (send/receive, terms, status)
- Staffing portfolio (available talent, skills matrix, capacity)
- Client success/account health views (health scores, NPS, churn signals)
- Boardroom/private workspace modes (board meetings, documents, decisions)
- Alliance directory (browse partners, agencies, service providers)
- Feedback board (structured feedback from advisors, investors, peers)

### 13.3 Sales Navigator (More Advanced Than LinkedIn)
- Lead search (industry, company size, role, location, AI scoring)
- Account search (firmographic filters)
- Saved lists (leads and accounts, auto-update, export)
- Buying committee mapping (decision makers, influencers, champions, blockers)
- Outreach sequences (multi-step: email, InMail, connection request, follow-up, timing, conditions)
- CRM tasking (follow-up tasks, reminders, calendar integration)
- Business card capture (camera/upload, OCR, auto-create lead)
- Event follow-up workflows (scan attendees, tag by event, follow-up queue)
- Relationship graph (visual network of connections to target accounts)
- Relationship timeline (per contact/account: all touchpoints)
- Prospect scoring (AI-powered)
- Conversion analytics (pipeline metrics, sequence performance, win rates)
- Sales analytics dashboard (revenue attribution, forecast, territory, team performance)

### 13.4 Gigvora Ads (Google Ads-Level)
- Campaigns (create, manage, pause, archive)
- Objectives (awareness, consideration, conversion, lead gen, engagement)
- Ad sets/groups (targeting, placement, budget, schedule)
- Audience builder (demographics, interests, behaviors, lookalikes, retargeting, custom, exclusions)
- Creative studio (text, image, video, carousel, sponsored posts/jobs/gigs/projects, preview by placement)
- Budgeting (daily/lifetime budgets, bid strategies, spend caps)
- Keyword planner (research, search volume, competition, bid estimates, suggestions)
- Search insights (trending searches, audience behavior, competitive analysis)
- Promoted posts/pages/jobs/gigs/projects
- Attribution analytics (CPC, CPM, CPA, CTR, ROAS, conversion funnel)
- A/B testing (create variants, split traffic, statistical significance)
- Billing controls (budget caps, payment methods, invoices, spend alerts, auto-pause)
- Reporting (custom reports, scheduled exports, multi-campaign comparison)
- **Note**: Ads are CREATED in the Ads area (`/ads/*`), NOT in the dashboard. Dashboard Ads widgets show performance/management of existing campaigns only.

### 13.5 Advanced Project Management
- Templates (save/load project templates)
- Kanban (drag-drop, custom columns, assignees, labels, filters)
- List view (hierarchy: objectives → milestones → tasks → subtasks)
- Timeline/Gantt view (milestone markers, deadline tracking, dependencies)
- Workload concepts (capacity planning, resource allocation)
- Milestones (tracking, completion %, linked tasks, payment triggers)
- Approvals (deliverable approvals, milestone sign-offs, change requests)
- Deliverables (file management, version control, approval status)
- Files (all project files, folders, sharing, version history)
- Roles (multi-freelancer management, role assignment, permissions)
- Budget visibility (per-project P&L, spend by milestone, remaining funds)
- Risk flags (delayed milestones, budget overrun, blocked tasks)
- Change requests (scope changes, budget adjustments, timeline extensions)
- In-project chat (threaded conversations, file sharing, @mentions, pinned messages)
- In-project updates (activity feed, status updates, announcements)
- Multi-freelancer projects (multiple contributors, role-based access)
- Pay dispersion (multi-freelancer payment splitting, milestone-based releases, batch payments)
- Task creation and delegation (assign to team members, priorities, due dates)
- Objectives (project objectives, key results, progress tracking)
- Finance tracking (payment schedule, escrow status, invoice generation)
- Escrow management (fund, hold, release per milestone, dispute triggers)
- Dispute management (raise dispute, evidence, timeline, escalation, resolution)

### 13.6 Advanced Gig Management
- Package builder (3-tier: basic/standard/premium, custom fields, comparison table)
- Extras/add-ons (optional services, pricing, delivery impact)
- Requirements capture (buyer requirement form after purchase)
- Revisions (revision requests, count tracking, revision deliveries)
- Delivery timelines (expected delivery dates, extensions, countdown)
- Full timeline system (ordered → requirements → in progress → delivered → revision → completed/disputed)
- Step-by-step updates (seller posts progress visible to buyer)
- Submissions (all submissions per order with timestamps, files, notes)
- Reviews (buyer reviews seller, seller reviews buyer, response to reviews, rating breakdown)
- Buyer visibility (order status, timeline, deliverables, communication)
- Seller analytics (impressions, clicks, orders, conversion, revenue, package performance, upsell performance, cancellation rate, response time)
- Recurring/retained services (subscription-based gig packages)
- Gig-to-project conversion (upgrade order to full project workspace)

### 13.7 Agency Full CRM
- Leads (capture, qualify, assign)
- Accounts (company-level records)
- Contacts (individual people within accounts)
- Pipeline stages (custom stages, drag-drop kanban)
- Notes (per contact/account)
- Follow-up tasks (reminders, calendar integration)
- Sequences (automated multi-step outreach)
- Account health (health scores, engagement metrics)
- Relationship view (all touchpoints per contact/account)
- Event/networking capture (leads from events, speed networking)
- Client success flows (onboarding → delivery → review → renewal)

### 13.8 Full Disputes & Escrow
- Escrow states (funded, held, partially released, fully released, disputed)
- Holds (milestone-linked, time-based)
- Release flows (approval workflow, partial releases)
- Dispute creation (raise dispute with category, description)
- Evidence submission (text, files, screenshots, screen recordings)
- Timeline/history (full audit trail of dispute)
- Escalation states (created → evidence → review → escalation → arbitration → resolution)
- Arbitration/admin controls (admin intervention, binding decisions)
- Finance impact visibility (amounts at stake, resolution options)

---

## 14. Machine Learning, AI & Python Integration

### 14.1 Core Principle
ML and AI are support layers across the platform, not isolated features.

### 14.2 ML Layers
- Ranking and recommendation layer
- Semantic search layer
- Trust and fraud layer
- Matching layer
- Prediction layer
- Analytics feedback layer

### 14.3 Where ML Appears

**Search & Discovery**: semantic search, ranking tuning, saved-search alerts, recommendation explanations

**Freelancer/Project Automatch**: hard-filter eligibility, ranking, match explanation

**Recruiter Pro**: candidate ranking, CV parsing/summarization, shortlist assistance, interview recommendation

**Sales Navigator**: prospect scoring, relationship recommendations, timing suggestions, outreach assistance

**Enterprise Connect**: business plan summarization, stage classification, advisor matching, startup readiness scoring

**Ads**: keyword suggestions, audience suggestions, performance prediction, creative ranking

**Trust & Safety**: fraud detection, anomaly detection, suspicious behavior scoring, moderation flagging

**Notifications**: priority ranking, digest grouping, noisy alert suppression

### 14.4 Python Integration
Python as supporting service layer for: ML training pipelines, feature engineering, ranking experiments, analytics jobs, CV parsing/document extraction, recommendation computation, anomaly detection, offline evaluation.

Patterns: async batch jobs, scheduled scoring, offline analytics, feature generation, lightweight APIs for model outputs.

### 14.5 Architecture Rule
Heavy ML must not sit in main request path. Prefer: precomputed features, cached scores, nightly/hourly jobs, lightweight online scoring, explainable models first.

### 14.6 AI Assistance (UI Surfaces)
- Message drafting and summarization
- Post writing and article writing
- Image prompt assist and AI image generation
- Job description enrichment
- CV summary extraction
- Business plan summary
- Webinar/podcast transcript summary
- Next action suggestions

### 14.7 Bring Your Own Key/Provider
- Provider settings per workspace
- Model choice
- Usage visibility
- Graceful fallback when no provider active

### 14.8 Explainability
Every meaningful ML decision should have reason codes:
- "Recommended because your availability matches"
- "Candidate ranked higher due to recent relevant work"
- "Lead prioritized due to account fit and engagement signals"

---

## 15. Reusable Component System

### 15.1 Core Primitives
Button, IconButton, Input, Textarea, Select, MultiSelect, Combobox, Checkbox, Radio, Switch, Tabs, Segmented Control, Badge, Chip, Avatar, Tooltip, Popover, DropdownMenu, Modal, Drawer, Sheet, Accordion, Toast, Skeleton, EmptyState

### 15.2 Surface Cards
KPI card, Feed post card, Project card, Gig card, Job card, Candidate card, Prospect card, Company card, Agency card, Startup card, Event card, Podcast/webinar/media card, Admin queue card, Finance summary card, Dispute stage card

### 15.3 Data-Heavy Components
Tables, Advanced tables with saved views, Kanban columns, Timeline views, Shortlist panels, Scorecards, Milestone tables, Payout tables, Ledger tables, Ads charts, Analytics cards

### 15.4 Form Systems
Multi-step wizard, Autosave banner, Validation summary, Attachment uploader, Package builder, FAQ builder, Interview builder, Scorecard builder, Form blueprint builder, Audience builder, Keyword builder

### 15.5 Navigation Components
Two-level top bar, Mega menu, Dashboard top menu, Avatar dropdown, Role switcher, Command search overlay, Floating chat launcher, Notification tray

---

## 16. Required Front-End States

Every major surface must support:
- Loading
- Empty
- Filtered empty
- Partial data
- Error
- Stale / refreshable
- Archived
- Paused
- Restricted / private
- Permission denied
- Unavailable / removed
- Syncing / processing
- Disconnected / reconnecting (where realtime)

Examples: job expired, gig paused, project archived, message failed to send, live room reconnecting, insufficient credits, payment method missing, dispute escalated, escrow on hold, ad under review, verification rejected

---

## 17. Build Phasing (15 Phases)

### Phase 1 — Foundation & Shells
- Design tokens (colors, typography, spacing, shadows)
- Tailwind config extension
- 3 layout shells: PublicShell, LoggedInPageShell, DashboardShell + AdminShell
- Two-level public top bar with mega menus
- Two-level logged-in top bar with all buttons
- Avatar dropdown with role switcher
- Role context provider
- Auth context provider
- Deep multi-column footer
- Routing scaffold for all 300+ routes
- Core component primitives

### Phase 2 — Landing Page & Public Pages
- 15-section landing page
- About Us, Pricing, FAQ
- Terms, Privacy, User Agreements
- Trust & Safety, Product Overview
- 7 Solutions pages

### Phase 3 — Auth & Onboarding
- Sign In, Sign Up (with role selection)
- Forgot/Reset Password
- Email Verification
- Onboarding wizard
- Auth guards, session management

### Phase 4 — LinkedIn-Level Feed & Social
- Post composer (text, image, video, article, poll)
- Feed stream (infinite scroll)
- All post card types
- Full interactions (like, comment, share, save, report)
- Threaded comments, mentions, hashtags
- Article editor
- Feed sidebars

### Phase 5 — LinkedIn-Level Profiles, Pages & Groups
- User/Professional profiles (full LinkedIn-level)
- Company pages, Agency pages
- Groups (discovery, detail, creation, management)
- Profile Hub, Reviews, Portfolio, References
- Verification Center, Visibility Settings

### Phase 6 — Networking & Communication
- Network page, invitations, suggestions
- Speed networking (lobby, matching, timed video)
- Built-in video (1:1, group, screen sharing)
- Floating chat bubble (high-class)
- Unified Inbox, Shared Inbox
- Thread detail (all features)
- Call history, Meeting briefs
- Contacts/address book

### Phase 7 — Jobs, Recruitment & Recruiter Pro
- Jobs browse/detail/create/edit/apply
- Application workspace
- Full Recruiter Pro area:
  - Talent search, Candidate profiles
  - Talent pools, Pipeline kanban
  - Shortlist boards, Outreach console
  - Interview planner/calendar
  - Video interviews (live + recorded)
  - Scorecards, Offer/handoff
  - Headhunter workspace
  - Requisitions, Pipeline analytics
  - ATS settings

### Phase 8 — Projects & Advanced Project Management
- Projects browse/detail/create/edit
- Proposals create/review/compare
- Smart Match
- Full Project Workspace:
  - Kanban, Task list, Task detail
  - Timeline/Gantt
  - In-project chat, In-project updates
  - Deliverable vault, Team & roles
  - Files, Milestones, Approvals
  - Submissions, Budget, Objectives
  - Finance tracking, Pay dispersion
  - Escrow management, Dispute management
  - Task delegation, Workload view
  - Archive, Templates
  - Risk flags, Change requests

### Phase 9 — Gigs & Advanced Gig Management
- Gigs browse/detail/create/edit
- Package builder, Custom offer builder
- Checkout, Requirements form
- Full Order Management:
  - Orders center, Order detail (full timeline)
  - Step-by-step updates
  - Delivery center, Revision center
  - Submissions, Reviews
  - Gig analytics
  - Service catalogue
  - Gig-to-project conversion
  - Recurring services

### Phase 10 — Sales Navigator (Full CRM)
- Sales Navigator area:
  - Home dashboard
  - Lead search, Account search
  - Prospect profile, Account detail
  - Buying committee view
  - Saved lists (leads + accounts)
  - Sequence manager
  - Outreach inbox
  - Relationship timeline + graph
  - Conversion analytics
  - Business card capture
  - Event lead capture
  - CRM tasks
  - Sales settings + analytics

### Phase 11 — Gigvora Ads (Google Ads-Level)
- Ads area:
  - Ads Manager home
  - Campaigns list/detail
  - Campaign builder (multi-step)
  - Audience builder
  - Creative studio
  - Keyword planner
  - Search insights
  - Ads analytics
  - Billing & spend control
  - Promoted content, Sponsored placements
  - A/B testing, Reporting
  - Ad policies

### Phase 12 — Enterprise Connect & Organization
- Enterprise Connect area:
  - Home, Showcase, Builder
  - Traction, Business plans
  - Advisors, Feedback board
  - Boardroom, Partnerships
  - Alliance directory
  - Staffing portfolio
  - Client success, Account health
- Organization management:
  - Members, Seats, Permissions
  - Workspaces, Branding
  - Integrations, Switching

### Phase 13 — Finance, Escrow, Disputes & Billing
- Finance Hub, Wallet, Ledger
- Escrow console, Release queue
- Disputes board + detail (full timeline)
- Refund queue
- Invoices center + detail
- Subscription plans, Billing settings
- Commission policy, Payout settings
- Tax center, Credits wallet

### Phase 14 — Community, Events, Media & Creator Tools
- Groups (discovery, detail, creation, management)
- Events (directory, detail, RSVP, host console, calendar)
- Speed networking (lobby, matching, timed sessions)
- Podcasts (directory, detail, episodes, player, recorder, library)
- Webinars (discovery, detail, registration, live room, replay, host studio)
- Live rooms, Clips library
- Session analytics, Creator profile
- Creation Studio (drafts, scheduling, AI tools, analytics)

### Phase 15 — Support, Admin, Calendar & Advanced Systems
- Support Center, Help articles, Tickets
- Trust Center, Consent/Security settings
- Calendar (month/week/day, integrated)
- Command search overlay (Cmd+K)
- Notifications center
- Full Admin area (12 sections)
- Compliance, Governance, Appeals
- ML/AI integration surfaces

---

## 18. Complete Route Map

### Public Routes
```
/                                    Landing Page
/about                               About Us
/pricing                             Pricing
/faq                                 FAQ
/terms                               Terms and Conditions
/privacy                             Privacy Policy
/user-agreements                     User Agreements
/trust-safety                        Trust & Safety
/product                             Product Overview
/solutions/clients                   Solutions for Clients
/solutions/professionals             Solutions for Professionals
/solutions/enterprise                Solutions for Enterprise
/solutions/recruiters                Solutions for Recruiters
/solutions/agencies                  Solutions for Agencies
/solutions/advertisers               Solutions for Advertisers
/solutions/creators                  Solutions for Creators
/support                             Support Center
/support/contact                     Contact Support
/help/:articleId                     Help Article
/signin                              Sign In
/signup                              Sign Up
/forgot-password                     Forgot Password
/reset-password                      Reset Password
/verify                              Email Verification
```

### Core Logged-In Routes
```
/feed                                Feed / Home (default after login)
/network                             Network
/network/invitations                 Invitations
/network/suggestions                 Suggestions
/network/speed-networking            Speed Networking
/search                              Search / Discovery
/notifications                       Notifications Center
/saved                               Saved Items
/calendar                            Calendar
/settings                            Settings Hub
/settings/account                    Account Settings
/settings/notifications              Notification Preferences
/settings/privacy                    Privacy Settings
/settings/security                   Security Settings
/settings/billing                    Billing Settings
/settings/consent                    Consent Settings
```

### Inbox & Messaging Routes
```
/inbox                               Inbox List
/inbox/:threadId                     Thread Detail
/inbox/shared                        Shared Inbox
/inbox/compose                       Compose
/calls                               Call History
/meetings/:meetingId                 Meeting Brief
/contacts                            Contacts / Address Book
```

### Profile Routes
```
/profile/:userId                     User Profile View
/profile/edit                        Profile Edit
/profile/hub                         Profile Hub
/profile/:userId/reviews             Reviews Page
/profile/:userId/portfolio           Portfolio Page
/profile/:userId/references          References Page
/profile/:userId/media               Media Page
/profile/verification                Verification Center
/profile/visibility                  Visibility Settings
/company/:companyId                  Company Page View
/company/:companyId/manage           Company Page Management
/agency/:agencyId                    Agency Page View
/agency/:agencyId/manage             Agency Page Management
/page/:pageId                        Public Page View
```

### Jobs Routes
```
/jobs                                Jobs Browse
/jobs/:jobId                         Job Detail
/jobs/create                         Job Create
/jobs/:jobId/edit                    Job Edit
/jobs/:jobId/apply                   Job Application Flow
/applications                       Application Workspace
```

### Recruiter Pro Routes
```
/recruiter-pro                       Recruiter Pro Home
/recruiter-pro/talent-search         Talent Search
/recruiter-pro/candidates/:id        Candidate Profile
/recruiter-pro/talent-pools          Talent Pools
/recruiter-pro/talent-pools/:id      Talent Pool Detail
/recruiter-pro/saved-searches        Saved Searches
/recruiter-pro/pipeline              Candidate Pipeline (Kanban)
/recruiter-pro/pipeline/:jobId       Job-Specific Pipeline
/recruiter-pro/shortlists            Shortlist Boards
/recruiter-pro/shortlists/:id        Shortlist Detail
/recruiter-pro/outreach              Outreach Console
/recruiter-pro/outreach/:id          Outreach Detail
/recruiter-pro/interviews            Interview Planner
/recruiter-pro/interviews/calendar   Interview Calendar
/recruiter-pro/interviews/:id        Interview Detail
/recruiter-pro/interviews/:id/score  Interview Scorecard
/recruiter-pro/video-interview/:id   Video Interview Room
/recruiter-pro/video-playback/:id    Video Interview Playback
/recruiter-pro/offers/:id            Offer / Handoff
/recruiter-pro/headhunter            Headhunter Workspace
/recruiter-pro/confidential          Confidential Search
/recruiter-pro/requisitions          Requisition Management
/recruiter-pro/requisitions/:id      Requisition Detail
/recruiter-pro/analytics             Pipeline Analytics
/recruiter-pro/settings              ATS Settings
```

### Projects Routes
```
/projects                            Projects Browse
/projects/:projectId                 Project Detail
/projects/create                     Project Create
/projects/:projectId/edit            Project Edit
/projects/:projectId/proposals/create  Proposal Create
/projects/:projectId/proposals       Proposal Review
/projects/:projectId/proposals/compare Proposal Compare
/projects/:projectId/match           Smart Match
/projects/:projectId/workspace       Project Workspace Home
/projects/:projectId/workspace/kanban         Kanban Board
/projects/:projectId/workspace/tasks          Task List
/projects/:projectId/workspace/tasks/:taskId  Task Detail
/projects/:projectId/workspace/timeline       Timeline / Gantt
/projects/:projectId/workspace/chat           In-Project Chat
/projects/:projectId/workspace/updates        In-Project Updates
/projects/:projectId/workspace/deliverables   Deliverable Vault
/projects/:projectId/workspace/team           Team & Roles
/projects/:projectId/workspace/files          Files
/projects/:projectId/workspace/milestones     Milestones
/projects/:projectId/workspace/approvals      Approvals
/projects/:projectId/workspace/submissions    Submissions
/projects/:projectId/workspace/budget         Budget
/projects/:projectId/workspace/objectives     Objectives
/projects/:projectId/workspace/finance        Finance Tracking
/projects/:projectId/workspace/pay            Pay Dispersion
/projects/:projectId/workspace/escrow         Escrow Management
/projects/:projectId/workspace/disputes       Dispute Management
/projects/:projectId/workspace/delegation     Task Delegation
/projects/:projectId/workspace/archive        Archive
/projects/:projectId/workspace/templates      Workspace Templates
/projects/:projectId/workspace/risks          Risk Flags
/projects/:projectId/workspace/changes        Change Requests
```

### Gigs Routes
```
/gigs                                Gigs Browse
/gigs/:gigId                         Gig Detail
/gigs/create                         Gig Create
/gigs/:gigId/edit                    Gig Edit
/gigs/:gigId/packages                Package Builder
/gigs/:gigId/offer                   Custom Offer Builder
/gigs/:gigId/offer/:offerId          Offer Detail
/gigs/:gigId/checkout                Checkout / Order Start
/gigs/:gigId/requirements            Requirements Form
/orders                              Orders Center
/orders/:orderId                     Order Detail (Full Timeline)
/orders/:orderId/updates             Step-by-Step Updates
/orders/:orderId/delivery            Delivery Center
/orders/:orderId/revisions           Revision Center
/orders/:orderId/submissions         Submissions
/orders/:orderId/reviews             Reviews
/gigs/:gigId/analytics               Gig Analytics
/services                            Service Catalogue
/orders/:orderId/convert             Gig-to-Project Conversion
```

### Sales Navigator Routes
```
/sales-navigator                     Sales Navigator Home
/sales-navigator/leads               Lead Search
/sales-navigator/accounts            Account Search
/sales-navigator/prospects/:id       Prospect Profile
/sales-navigator/accounts/:id        Account Detail
/sales-navigator/accounts/:id/committee  Buying Committee View
/sales-navigator/lists/leads         Saved Lead Lists
/sales-navigator/lists/leads/:id     Lead List Detail
/sales-navigator/lists/accounts      Saved Account Lists
/sales-navigator/lists/accounts/:id  Account List Detail
/sales-navigator/sequences           Sequence Manager
/sales-navigator/sequences/:id       Sequence Detail
/sales-navigator/outreach            Outreach Inbox
/sales-navigator/relationships/:id   Relationship Timeline
/sales-navigator/graph               Relationship Graph
/sales-navigator/analytics           Conversion Analytics
/sales-navigator/capture/card        Business Card Capture
/sales-navigator/capture/event       Event Lead Capture
/sales-navigator/tasks               CRM Tasks
/sales-navigator/settings            Sales Settings
/sales-navigator/analytics/dashboard Sales Analytics Dashboard
```

### Ads Routes
```
/ads                                 Ads Manager Home
/ads/campaigns                       Campaigns List
/ads/campaigns/:id                   Campaign Detail
/ads/campaigns/create                Campaign Builder
/ads/audiences                       Audience Builder
/ads/audiences/:id                   Audience Detail
/ads/creatives                       Creative Studio
/ads/creatives/:id                   Creative Detail
/ads/keywords                        Keyword Planner
/ads/insights                        Search Insights
/ads/analytics                       Ads Analytics
/ads/billing                         Billing & Spend Control
/ads/promoted                        Promoted Content
/ads/sponsored                       Sponsored Placements
/ads/policies                        Ad Policies
/ads/testing                         A/B Testing
/ads/testing/:id                     Test Detail
/ads/reports                         Reporting
```

### Enterprise Connect Routes
```
/enterprise-connect                  Enterprise Connect Home
/enterprise-connect/showcases        Showcase Directory
/enterprise-connect/showcases/:id    Showcase Detail
/enterprise-connect/showcases/create Showcase Builder
/enterprise-connect/traction/:id     Traction Page
/enterprise-connect/plans/:id        Business Plan Vault
/enterprise-connect/advisors         Advisor Marketplace
/enterprise-connect/advisors/:id     Advisor Detail
/enterprise-connect/feedback/:id     Feedback Board
/enterprise-connect/boardroom/:id    Boardroom Mode
/enterprise-connect/partnerships     Partnership Requests
/enterprise-connect/alliances        Alliance Directory
/enterprise-connect/staffing         Staffing Portfolio
/enterprise-connect/success/:id      Client Success Timeline
/enterprise-connect/health/:id       Account Health
```

### Community, Groups & Events Routes
```
/groups                              Groups Discovery
/groups/:groupId                     Group Detail
/groups/create                       Group Creation
/groups/:groupId/manage              Group Management
/groups/:groupId/feed                Group Feed
/events                              Events Directory
/events/:eventId                     Event Detail
/events/:eventId/rsvp               RSVP Flow
/events/:eventId/host               Event Host Console
/events/calendar                     Event Calendar
/community                          Community Dashboard
```

### Media Routes
```
/media                               Media Home / Discovery
/podcasts                            Podcast Shows Directory
/podcasts/:showId                    Podcast Detail
/podcasts/:showId/:episodeId         Episode Page
/podcasts/create                     Podcast Creator Studio
/podcasts/library                    Podcast Library
/webinars                            Webinar Discovery
/webinars/:webinarId                 Webinar Detail
/webinars/:webinarId/register        Registration Flow
/webinars/:webinarId/live            Live Room
/webinars/replays                    Replay Library
/webinars/studio                     Host Studio
/media/clips                        Clips Library
/media/analytics/:id                Session Analytics
/creator/:creatorId                  Creator Profile
/creation-studio                     Creation Studio
```

### Finance Routes
```
/finance                             Finance Hub
/finance/wallet                      Wallet Home
/finance/wallet/ledger               Wallet Ledger
/finance/escrow                      Escrow Console
/finance/escrow/releases             Release Queue
/finance/disputes                    Disputes Board
/finance/disputes/:id                Dispute Detail
/finance/refunds                     Refund Queue
/finance/invoices                    Invoices Center
/finance/invoices/:id                Invoice Detail
/finance/subscriptions               Subscription Plans
/finance/billing                     Billing Settings
/finance/commissions                 Commission Policy
/finance/payouts                     Payout Settings
/finance/tax                         Tax Center
/finance/credits                     Credits Wallet
```

### Support Routes
```
/support                             Support Center
/support/articles/:id                Help Article
/support/tickets/new                 Ticket Submission
/support/tickets                     My Tickets
/support/tickets/:id                 Ticket Detail
/trust                               Trust Center
```

### Organization Routes
```
/org/:orgId/members                  Organization Members
/org/:orgId/seats                    Seats & Billing
/org/:orgId/permissions              Permissions
/org/:orgId/workspaces               Shared Workspaces
/org/:orgId/departments              Department Workspaces
/org/:orgId/branding                 Branding Settings
/org/:orgId/integrations             Integrations
/org/switch                          Workspace Switching
```

### Dashboard Routes
```
/dashboard                           Dashboard Home (role-aware)
/dashboard/overview                  Overview
/dashboard/hiring                    Hiring (User/Client)
/dashboard/orders                    Orders (User/Client)
/dashboard/network                   Network (User/Client)
/dashboard/saved                     Saved (User/Client)
/dashboard/finance                   Finance
/dashboard/settings                  Settings
/dashboard/opportunities             Opportunities (Professional)
/dashboard/work                      Work (Professional)
/dashboard/gigs                      Gigs (Professional)
/dashboard/projects                  Projects (Professional/Enterprise)
/dashboard/documents                 Documents (Professional)
/dashboard/creation-studio           Creation Studio (Professional)
/dashboard/analytics                 Analytics (Professional/Enterprise)
/dashboard/hiring-ats                Hiring / ATS (Enterprise)
/dashboard/sales                     Sales (Enterprise)
/dashboard/enterprise-connect        Enterprise Connect (Enterprise)
/dashboard/gigs-services             Gigs / Services (Enterprise)
/dashboard/ads                       Ads (Enterprise)
/dashboard/network-events            Network & Events (Enterprise)
/dashboard/inbox                     Inbox (Enterprise)
/dashboard/team                      Team (Enterprise)
```

### Admin Routes
```
/admin                               Admin Overview
/admin/users                         User Management
/admin/governance                    Profile Governance
/admin/moderation                    Moderation Queue
/admin/trust-safety                  Trust & Safety Queue
/admin/finance                       Finance Admin
/admin/support                       Support Admin
/admin/verification                  Verification Queue
/admin/ads-ops                       Ads Ops
/admin/platform                      Platform Ops
/admin/runtime                       Runtime Health
/admin/releases                      Release Engineering
/admin/feature-flags                 Feature Flags
/admin/audit-logs                    Audit Logs
/admin/storage                       Storage / System Settings
/admin/maintenance                   Maintenance Mode
/admin/settings                      Admin Settings
```

---

## 19. Two-Level Top Bar Specification

### Public Top Bar

**Top Row**:
| Position | Element | Behavior |
|----------|---------|----------|
| Left | Gigvora logo | Links to `/` |
| Right | "Hire Talent" button | Links to `/signup?role=client` |
| Right | "Find Work" button | Links to `/signup?role=professional` |
| Right | "Sign In" link | Links to `/signin` |
| Right | "Get Started" primary button | Links to `/signup` |

**Bottom Row**:
| Element | Type | Content |
|---------|------|---------|
| Product | Mega menu | Jobs, Gigs, Projects, Recruiter Pro, Sales Navigator, Enterprise Connect, Networking, Media, Ads |
| Solutions | Mega menu | For Clients, For Professionals, For Enterprise, For Recruiters, For Agencies, For Advertisers, For Creators |
| Discover | Mega menu | Browse Talent, Browse Gigs, Browse Projects, Browse Jobs, Browse Groups, Browse Events, Explore Media |
| Pricing | Link | `/pricing` |
| Trust & Safety | Link | `/trust-safety` |
| Support | Link | `/support` |

### Logged-In Top Bar

**Top Row**:
| Position | Element | Behavior |
|----------|---------|----------|
| Left | Gigvora logo | Links to `/feed` |
| Center | Search / command bar | Opens Cmd+K overlay |
| Right | Calendar icon | Links to `/calendar` |
| Right | Notification bell + badge | Opens notifications dropdown, links to `/notifications` |
| Right | "Creation Studio" button | Links to `/creation-studio` |
| Right | "Gigvora Ads" button | **Always visible**. Links to `/ads` |
| Right | "Recruiter Pro" button | **Conditional** (subscription). Links to `/recruiter-pro` |
| Right | "Sales Navigator" button | **Conditional** (subscription). Links to `/sales-navigator` |
| Right | "Enterprise Connect" button | Links to `/enterprise-connect` |
| Right | Avatar circle | Opens dropdown menu |

**Bottom Row**:
| Element | Type | Content |
|---------|------|---------|
| Home | Link | `/feed` |
| Network | Mega menu | Connections, Invitations, Speed Networking, Groups, Events |
| Jobs | Mega menu | Browse Jobs, My Applications, Post a Job, Recruiter Pro |
| Projects | Mega menu | Browse Projects, My Projects, Create Project, Proposals |
| Gigs | Mega menu | Browse Gigs, My Gigs, Create Gig, My Orders |
| Groups | Mega menu | Discover Groups, My Groups, Create Group |
| Events | Mega menu | Browse Events, My Events, Host Event, Calendar |
| Media | Mega menu | Podcasts, Webinars, Live Rooms, Clips, Creator Studio |

---

## 20. Mega Menu Contents

### Product Mega Menu
| Category | Items |
|----------|-------|
| Marketplace | Jobs, Gigs, Projects |
| Enterprise Tools | Recruiter Pro, Sales Navigator, Enterprise Connect |
| Growth | Gigvora Ads, Promoted Content |
| Community | Networking, Speed Networking, Groups, Events |
| Media | Podcasts, Webinars, Live Rooms, Creator Studio |
| Trust | Escrow, Disputes, Verification, Safety |

### Solutions Mega Menu
| Solution | Description |
|----------|-------------|
| For Clients | Hire talent, post jobs, manage projects |
| For Professionals | Find work, build reputation, grow career |
| For Enterprise | Scale operations, manage teams, enterprise tools |
| For Recruiters | Full ATS, talent search, pipeline management |
| For Agencies | Agency CRM, client success, staffing |
| For Advertisers | Campaigns, audiences, keyword planning |
| For Creators | Podcasts, webinars, content creation |

### Discover Mega Menu
| Category | Items |
|----------|-------|
| Talent | Browse Freelancers, Browse Agencies, Browse Companies |
| Work | Browse Jobs, Browse Gigs, Browse Projects |
| Community | Browse Groups, Browse Events, Browse Podcasts |
| Media | Browse Webinars, Browse Live Rooms, Browse Clips |

### Logged-In Mega Menus

**Network Mega Menu**: My Connections, Invitations (Sent/Received), People You May Know, Speed Networking Lobby, Follow-up Queue

**Jobs Mega Menu**: Browse All Jobs, Remote Jobs, Featured Jobs, My Applications, Saved Jobs, Post a Job, Recruiter Pro

**Projects Mega Menu**: Browse Projects, Featured Projects, My Projects, My Proposals, Create Project, Workspace Templates

**Gigs Mega Menu**: Browse All Gigs, Trending Gigs, Categories, My Gigs, Create Gig, My Orders, Service Catalogue

**Groups Mega Menu**: Discover Groups, My Groups, Create Group, Group Invitations, Featured Groups

**Events Mega Menu**: Browse Events, My Events, Upcoming, Past, Host Event, Speed Networking, Event Calendar

**Media Mega Menu**: Podcasts, Webinars, Live Rooms, Clips Library, My Content, Creator Studio, Replay Library

---

## 21. Advanced Project Management Specification

### Workspace Views
- **Kanban Board**: Drag-drop cards between customizable columns. Each card shows assignee avatar, due date, priority label, progress indicator. Filters by assignee, priority, milestone, label. Bulk actions (move, assign, archive).
- **Task List**: Hierarchical view: Objectives → Milestones → Tasks → Subtasks. Inline editing for title, assignee, due date, priority. Sorting by any column. Grouping by milestone/assignee/priority/status.
- **Timeline/Gantt**: Horizontal bars showing task duration. Milestone diamonds. Dependency arrows. Critical path highlighting. Drag to resize/move. Zoom levels (day/week/month).
- **Workload View**: Per-team-member capacity visualization. Overallocation warnings. Drag tasks between members to rebalance.

### In-Project Chat
- Threaded conversations per topic/channel
- File sharing with preview
- @mention team members
- Pin important messages
- Search within project chat
- Link messages to tasks/milestones
- Emoji reactions
- Voice notes

### In-Project Updates
- Activity feed showing all changes
- Status updates (on track, at risk, blocked, completed)
- Announcements (pinned to top)
- Automated updates (task completed, milestone reached, file uploaded)
- Comment on updates
- Filter by type/person/date

### Multi-Freelancer Support
- Multiple contributors with role-based access
- Role assignment (lead, contributor, reviewer, observer)
- Per-role permissions (edit tasks, approve deliverables, view budget, etc.)
- Activity tracking per contributor
- Individual performance metrics

### Pay Dispersion
- Multi-freelancer payment splitting per milestone
- Percentage-based or fixed-amount splits
- Milestone-triggered automatic payment queue
- Batch payment processing
- Payment confirmation and receipts
- Tax withholding consideration per contributor

### Escrow Management (Per Project)
- Fund escrow at project start or per milestone
- Hold funds until deliverable approved
- Release per milestone approval
- Partial release for partial deliverables
- Dispute triggers if deliverable rejected
- Escrow balance visibility for all parties
- Automatic release after approval timeout

### Dispute Management (Per Project)
- Raise dispute with category (quality, delay, scope, payment)
- Evidence submission (files, screenshots, chat history)
- Timeline view of dispute events
- Escalation levels (peer review → admin review → arbitration)
- Resolution options (refund, partial refund, re-delivery, mutual cancel)
- Financial impact statement
- Post-resolution actions (release funds, close milestone, archive)

---

## 22. Advanced Gig Management Specification

### Full Order Timeline
```
Order Created → Requirements Submitted → In Progress → [Updates] → Delivered → [Accepted / Revision Requested] → [Re-delivered] → Completed / Disputed
```

Each step has:
- Timestamp
- Actor (buyer/seller)
- Description
- Attached files (if any)
- Status change record

### Step-by-Step Updates
- Seller posts progress updates visible to buyer
- Each update has: text description, optional files/images, timestamp
- Buyer can comment on updates
- Update frequency tracking (seller responsiveness metric)

### Package Builder
- 3-tier system: Basic, Standard, Premium
- Custom field names per tier (e.g., "Pages", "Revisions", "Source Files")
- Delivery time per tier
- Price per tier
- Comparison table auto-generated
- Add-ons/extras (optional services with price and delivery impact)

### Revision System
- Revision count per package tier
- Revision request with specific feedback
- Revision delivery with changelog
- Additional revisions beyond package (paid)
- Revision history with diff view

### Reviews System
- Buyer reviews seller (1-5 stars: communication, quality, timeliness, value)
- Seller reviews buyer (1-5 stars: clarity, responsiveness, professionalism)
- Written review with character limits
- Seller can respond to buyer review (once)
- Review moderation (flagging inappropriate content)
- Review analytics (average rating, trend over time, sentiment)

### Seller Analytics Dashboard
- Impressions (gig views)
- Clicks (from search/browse to detail)
- Orders (conversion from clicks)
- Conversion rate (orders/clicks)
- Revenue (total, per package tier)
- Average order value
- Cancellation rate
- Response time (average first response)
- Upsell performance (extras purchased %)
- Repeat buyer rate
- Review score trend
- Ranking position tracking

---

## 23. LinkedIn-Level Feed Specification

### Post Types
1. **Text Post**: Plain text with hashtags, mentions, links. Character limit TBD (suggest 3000).
2. **Image Post**: 1-10 images in gallery/carousel format. Alt text per image.
3. **Video Post**: Single video with thumbnail. Inline playback. View count.
4. **Article Post**: Long-form content with rich text editor. Cover image. Reading time estimate.
5. **Poll Post**: Question + 2-4 options. Voting with results. Duration (1 day, 3 days, 1 week, 2 weeks).
6. **Shared Post**: Repost of another post with optional commentary.
7. **Shared Entity**: Gig card, project card, job card, event card embedded in post.
8. **Document Post**: PDF/document upload with inline preview/carousel.

### Post Composer
- Rich toolbar: text formatting (bold, italic), image upload, video upload, document upload, poll creation, article mode, emoji picker, hashtag suggestions, mention autocomplete
- Draft saving
- Scheduling (post later)
- Visibility (public, connections only, specific groups)
- AI writing assist (rewrite, expand, tone adjustment)

### Feed Algorithm
- Chronological option + algorithmic option (user toggle)
- Algorithmic considers: connection strength, content relevance, engagement signals, recency, content type diversity
- Boosted content (sponsored posts) clearly labeled

### Interactions
- **Like**: Click to like. Long-press/hover for reaction menu (Like, Celebrate, Love, Insightful, Curious, Support).
- **Comment**: Threaded replies (2 levels). Like on comments. Mention in comments. Image/GIF in comments.
- **Share**: Repost (with/without commentary), share to group, share via message, copy link.
- **Save**: Bookmark for later. Organize in collections.
- **Report**: Flag inappropriate content with reason.
- **Hide**: Remove from feed without reporting.

### Feed Layout
- **Left Sidebar**: Mini profile card (avatar, name, headline, connections count, views count), quick links (saved items, groups, events, my gigs, my projects)
- **Center**: Post composer + feed stream (infinite scroll)
- **Right Sidebar**: Trending topics/hashtags, suggested connections, upcoming events, recommended gigs/jobs, Gigvora Ads

---

## 24. LinkedIn-Level Profiles, Pages & Groups

### User/Professional Profile
- **Banner image**: Customizable header image
- **Avatar**: Round profile photo with online status indicator
- **Headline**: Role/title (e.g., "Senior Full-Stack Developer | React & Node.js Specialist")
- **Location**: City, Country
- **Verification badges**: Identity verified, business verified, skill verified
- **About section**: Rich text biography
- **Experience timeline**: Company, role, duration, description (like LinkedIn)
- **Education**: Institution, degree, year
- **Skills**: Endorsable skills with count
- **Portfolio grid**: Project screenshots, case studies, deliverables
- **Reviews/ratings**: Star rating, written reviews, breakdown by category
- **References**: Professional references with quotes
- **Certifications**: Professional certifications with verification
- **Activity feed**: Recent posts, articles, comments
- **Contact info**: Email, website, social links (visibility controlled)
- **Availability status**: Available, busy, not available, open to work
- **Gigs offered**: If professional, linked gig cards
- **Services**: Listed services with rates

### Company Page
- Logo, banner, about, industry, size, locations
- Services offered, culture section
- Jobs posted (linked), projects (linked), gigs offered
- Reviews from freelancers/employees
- Followers count, posts feed
- Team showcase
- Company analytics (for admins)

### Agency Page
- Similar to company + client portfolio, case studies
- Specializations, team profiles with skills
- Staffing portfolio, availability
- Client success metrics

### Groups
- **Discovery**: Browse by category, search, trending, recommended
- **Group Detail**: Feed (all post types), members list, events calendar, files/resources, about/rules, admin tools
- **Group Creation**: Name, description, category, privacy (public/private), cover image, rules
- **Group Management**: Member approval, moderation tools, banned members, analytics (growth, engagement), settings, roles (admin, moderator, member)
- **Group Feed**: All post types supported, pinned posts, announcements

---

## 25. Recruiter Pro — Full ATS Specification

### Talent Search
- **Boolean search**: AND, OR, NOT operators on skills, title, location, company
- **Filters**: Skills, experience level, location, salary range, availability, industry, education, languages, certifications
- **AI ranking**: ML-powered candidate ranking with explanation
- **Saved searches**: Save search criteria, get alerts on new matches

### Candidate Profile (Recruiter View)
- Parsed CV/resume (structured data extraction)
- Skills match score (vs. job requirements)
- Work history timeline
- Notes (private, per recruiter)
- Tags (hot lead, culture fit, technical strong, etc.)
- Scorecards (from interviews)
- Activity log (when contacted, responded, interviewed)
- Source tracking (how candidate was found)

### Pipeline Kanban
- Customizable stages: Sourced → Applied → Screened → Phone Screen → Technical Interview → On-Site → Offer → Hired
- Drag-drop candidates between stages
- Bulk actions (move, tag, email, archive)
- Stage duration tracking (time in stage)
- Per-stage conversion rates
- Color coding by source/priority

### Video Interviews
- **Live video interviews**: WebRTC-based, multi-participant, screen sharing, recording
- **Recorded video interviews**: Send questions, candidate records responses on own time
- **Playback**: Watch recordings with speed controls, timestamped notes
- **Scoring**: Rate during/after playback, link to scorecard

### Interview Scorecards
- Customizable criteria per job (technical skills, communication, culture fit, problem solving, etc.)
- 1-5 rating per criterion
- Written comments per criterion
- Overall recommendation (Strong Yes, Yes, Maybe, No, Strong No)
- Compare scorecards across interviewers
- Aggregate score calculation

### Headhunter Workspace
- Confidential search management (company hidden from candidates)
- Retained search tracking (milestones, deliverables)
- Client reporting (search progress, candidate pipeline, market insights)
- NDA workflow tracking
- Executive-level candidate profiles

---

## 26. Sales Navigator — Full CRM Specification

### Lead Search
- Filters: Industry, company size, role/title, seniority, location, keywords, technologies, funding stage
- AI scoring: Propensity to buy, engagement signals, fit score
- Results with quick actions: Save, Connect, InMail, Add to sequence
- Search export to list

### Buying Committee View
- Map stakeholders per account:
  - Decision Maker
  - Budget Holder
  - Technical Evaluator
  - Influencer
  - Champion
  - Blocker
- Relationship strength indicator per contact
- Engagement timeline per contact
- Notes and next actions per contact

### Sequence Manager
- Multi-step automated outreach:
  - Step types: Email, InMail, Connection Request, Follow-up, Task reminder
  - Timing: Days between steps, specific times
  - Conditions: If replied → stop, If opened → proceed, If no response → escalate
  - Personalization tokens
  - A/B testing on message variants
- Sequence analytics: Open rates, reply rates, conversion rates, best-performing templates

### Relationship Graph
- Visual network showing:
  - Direct connections to target accounts
  - Second-degree connections (warm introductions)
  - Shared groups/events
  - Interaction history (messages, meetings, events)
- Click-through to any node for details
- Path finding (shortest path to target contact)

### Business Card Capture
- Camera/upload image of business card
- OCR extraction: Name, title, company, email, phone, address
- Auto-create lead record
- Duplicate detection
- Manual correction interface
- Batch capture from events

---

## 27. Gigvora Ads — Google Ads-Level Specification

### Campaign Builder (Multi-Step Wizard)
1. **Objective Selection**: Awareness, Consideration, Conversion, App Installs, Lead Generation, Engagement
2. **Audience Targeting**: Demographics, interests, behaviors, lookalike, retargeting, custom audiences, exclusions
3. **Placements**: Feed, Search results, Gig listings, Job listings, Project listings, Profile sidebar, Group feed, Event pages
4. **Budget & Schedule**: Daily/lifetime budget, start/end dates, bid strategy (CPC, CPM, CPA), budget caps, pace (standard/accelerated)
5. **Creative Creation**: Text ads, image ads, video ads, carousel ads, sponsored posts/jobs/gigs/projects, preview by placement
6. **Review & Launch**: Summary of all settings, estimated reach, launch or save draft

### Keyword Planner
- Keyword research: Enter seed keywords, get suggestions
- Search volume estimates (monthly)
- Competition level (low, medium, high)
- Suggested bid ranges
- Keyword grouping
- Negative keyword management
- Historical trends
- Related keyword clusters

### Audience Builder
- **Demographics**: Age, gender, location, language
- **Interests**: Categories, subcategories, specific interests
- **Behaviors**: Purchase behavior, device usage, platform activity
- **Lookalike**: Based on existing customer lists, website visitors, engagement
- **Retargeting**: People who visited profile, gig, job, project
- **Custom Audiences**: Upload lists, website pixels, engagement-based
- **Exclusions**: Exclude audiences, locations, behaviors

### Analytics Dashboard
- CPC (Cost Per Click)
- CPM (Cost Per 1000 Impressions)
- CPA (Cost Per Acquisition/Action)
- CTR (Click-Through Rate)
- ROAS (Return On Ad Spend)
- Conversion funnel visualization
- A/B test results with statistical significance
- Attribution models (first-click, last-click, linear, time-decay)
- Custom date ranges, comparison periods
- Export to CSV/PDF

---

## 28. Enterprise Connect Specification

### Startup/SME Showcase
- Pitch section (one-liner, elevator pitch, full description)
- Traction metrics (MRR, users, growth rate, revenue)
- Team section (founders, key hires, advisors)
- Product screenshots/demo video
- Funding stage (pre-seed, seed, Series A, etc.)
- Partnerships and clients
- Press mentions
- Call to action (Request intro, Partner, Invest, Advise)

### Business Plan Vault
- Upload business plans (PDF, DOCX)
- Version control (track changes between versions)
- Share with specific advisors/investors (granular permissions)
- AI summary generation (key points, financials, risks, opportunities)
- Annotate and comment on sections
- Expiring access links

### Boardroom Mode
- Private workspace for board meetings
- Document sharing with access control
- Meeting agenda builder
- Minutes/notes taking
- Decision tracking
- Action items with assignees
- Historical meeting archive
- Voting/approval mechanisms

### Client Success Timeline
- Per-client lifecycle tracking:
  - Onboarding phase (tasks, milestones, check-ins)
  - Active delivery (projects, gigs, services)
  - Review phase (satisfaction surveys, NPS)
  - Renewal/expansion phase (upsell opportunities)
- Health indicators (engagement, satisfaction, risk level)
- Automated alerts (at-risk clients, upcoming renewals)
- Communication log

---

## 29. Video Interview System

### Live Video Interviews
- WebRTC-based real-time video
- Multi-participant (up to 10 panelists + 1 candidate)
- Screen sharing (full screen or application window)
- Recording with consent notification
- In-call chat
- Interview guide sidebar (questions, evaluation criteria)
- Timer per question (optional)
- Virtual whiteboard
- Background blur/replacement
- Waiting room for candidate

### Recorded Video Interviews
- Recruiter creates question set (text + optional video prompt)
- Candidate receives link, records answers on own schedule
- Time limits per question (e.g., 2 minutes)
- Re-record option (configurable: unlimited, 3 attempts, 1 take)
- Automatic transcription
- AI sentiment/confidence analysis

### Playback
- Speed controls (0.5x, 1x, 1.5x, 2x)
- Timestamped notes (click to jump to moment)
- Share specific clips with team
- Side-by-side comparison of candidates
- Scorecard integration (rate while watching)

---

## 30. Calendar System

### Views
- Month view (overview of all events/tasks)
- Week view (detailed time blocks)
- Day view (hour-by-hour)
- Agenda/list view (upcoming items)

### Integrated Items
- Events (from Events module)
- Interviews (from Recruiter Pro)
- Task deadlines (from Projects)
- Milestone due dates (from Projects)
- Gig delivery deadlines (from Gigs)
- Meetings (from Inbox/Calls)
- Speed networking sessions (from Network)
- Webinars (from Media)
- Custom reminders

### Features
- Color coding by category/module
- Drag to reschedule
- Quick create (click on time slot)
- Recurring events
- Time zone support
- Availability sharing
- Calendar sync indicators
- Conflict detection
- RSVP status per event

---

## 31. Networking with Built-In Video

### Speed Networking
- **Lobby**: Waiting room with participant count, match preferences
- **Matching Algorithm**: Match by interests, industry, role, goals
- **Timed Sessions**: 5/10/15 minute sessions with countdown timer
- **Session Flow**: Auto-connect → Video call → Timer countdown → Warning bell → Session end → Rate/save contact → Next match or exit
- **Follow-Up**: Post-session prompt to connect, send message, save notes
- **History**: Past networking sessions, contacts made, follow-up status

### Video Calls
- 1:1 video calls (from inbox, profile, or contact)
- Group video calls (up to 25 participants)
- Screen sharing
- Recording (with consent)
- Virtual background
- Chat during call
- Raise hand feature
- Breakout rooms (for group calls)
- Call quality indicators
- Reconnection handling

---

## 32. Support Center & Legal Pages

### Support Center
- **Help Article Directory**: Categorized (Getting Started, Account, Billing, Jobs, Gigs, Projects, etc.)
- **Search**: Full-text search across all articles
- **Article Page**: Rich content, screenshots, videos, related articles, "Was this helpful?" feedback
- **Ticket Submission**: Category, priority, description, attachments, order/project linking
- **My Tickets**: List with status (Open, In Progress, Waiting, Resolved, Closed)
- **Ticket Detail**: Conversation thread, status updates, resolution notes, satisfaction rating

### Legal Pages
- **Terms and Conditions**: Full legal document with table of contents, section navigation, last updated date
- **Privacy Policy**: GDPR-compliant, data categories, rights, contact, cookie policy
- **User Agreements**: Platform-specific agreements (freelancer agreement, client agreement, enterprise agreement)
- **Cookie Consent**: Banner with granular consent options

---

## 33. Finance, Escrow & Disputes Deep Dive

### Wallet System
- Balance display (available, pending, held)
- Transaction ledger (all credits/debits with filters)
- Top-up methods (card, bank transfer)
- Withdrawal to bank account
- Currency support
- Transaction receipts

### Escrow System
- **States**: Created → Funded → Held → Partially Released → Fully Released → Disputed → Resolved
- **Milestone-linked**: Each milestone can have escrow amount
- **Release Flow**: Deliverable submitted → Buyer reviews → Approve (funds release) or Dispute
- **Auto-release**: If buyer doesn't respond within N days, funds auto-release
- **Partial Release**: Release portion of milestone funds
- **Fee Structure**: Platform fee deducted at release

### Dispute System
- **Creation**: Either party raises dispute with category and description
- **Evidence Submission**: Text explanation, file uploads (screenshots, documents, recordings), chat history reference
- **Timeline**: All events chronologically (submissions, responses, escalations)
- **Escalation Levels**:
  1. Direct resolution (parties communicate)
  2. Mediation (platform mediator reviews)
  3. Admin review (senior admin decision)
  4. Arbitration (binding final decision)
- **Resolution Options**: Full refund, partial refund, re-delivery required, mutual cancellation, funds released to seller
- **Financial Impact**: Clear display of amounts at stake, potential outcomes
- **Appeals**: One appeal per resolution within 7 days

---

## 34. Widget Catalogue by Dashboard Role

### Universal Widgets (All Roles)
- KPI card (number + trend + label)
- Activity timeline widget
- Quick actions widget
- Notifications widget
- Messages preview widget

### User/Client Specific
- Profile strength meter
- Recommended talent carousel
- Spending summary donut chart
- Active orders list
- Saved items grid

### Professional Specific
- Earnings chart (line/bar)
- Opportunity match list
- Delivery board (mini kanban)
- Review score trend
- AI suggestions card

### Enterprise Specific
- Pipeline funnel chart
- Team activity heatmap
- Multi-project health grid
- Budget utilization bars
- Recruitment velocity metrics
- Ads performance mini-dashboard

### Admin Specific
- Platform health traffic light
- Queue count cards
- Risk alert list
- Transaction volume chart
- System status indicators

---

## 35. Role Visibility Matrix

| Feature/Page | User/Client | Professional | Enterprise | Admin |
|-------------|:-----------:|:------------:|:----------:|:-----:|
| Feed/Home | ✓ | ✓ | ✓ | ✓ |
| Network | ✓ | ✓ | ✓ | — |
| Jobs Browse | ✓ | ✓ | ✓ | — |
| Job Create | ✓ | — | ✓ | — |
| Job Apply | ✓ | ✓ | — | — |
| Gigs Browse | ✓ | ✓ | ✓ | — |
| Gig Create | — | ✓ | ✓ | — |
| Gig Order | ✓ | ✓ | ✓ | — |
| Projects Browse | ✓ | ✓ | ✓ | — |
| Project Create | ✓ | — | ✓ | — |
| Proposal Submit | — | ✓ | — | — |
| Recruiter Pro | — | — | ✓ (sub) | — |
| Sales Navigator | — | — | ✓ (sub) | — |
| Gigvora Ads | ✓ | ✓ | ✓ | — |
| Enterprise Connect | — | — | ✓ | — |
| Dashboard | ✓ | ✓ | ✓ | — |
| Admin Panel | — | — | — | ✓ |
| Creation Studio | ✓ | ✓ | ✓ | — |
| Calendar | ✓ | ✓ | ✓ | — |
| Inbox | ✓ | ✓ | ✓ | ✓ |
| Groups | ✓ | ✓ | ✓ | — |
| Events | ✓ | ✓ | ✓ | — |
| Media | ✓ | ✓ | ✓ | — |
| Finance | ✓ | ✓ | ✓ | ✓ |
| Support | ✓ | ✓ | ✓ | ✓ |

*(sub) = requires active subscription*

---

## 36. Component Inventory Mapped to Domains

### Layout Domain
- PublicShell, LoggedInPageShell, DashboardShell, AdminShell
- TwoLevelTopBar (public variant, logged-in variant)
- Footer
- PageHeader, SectionHeader

### Navigation Domain
- MegaMenu, MegaMenuItem, MegaMenuColumn
- AvatarDropdown, AvatarDropdownItem
- RoleSwitcher, RoleOption
- DashboardTabMenu, DashboardTab
- CommandSearchOverlay, SearchResult
- FloatingChatLauncher, ChatBubble, ChatThreadPreview
- NotificationTray, NotificationItem
- Breadcrumbs, BreadcrumbItem

### Feed Domain
- PostComposer, PostToolbar, PostMediaUploader
- PostCard, PostCardText, PostCardImage, PostCardVideo, PostCardPoll, PostCardArticle, PostCardDocument, PostCardShared, PostCardEntity
- CommentThread, Comment, CommentComposer
- ReactionMenu, ReactionButton
- FeedStream, FeedFilterTabs
- TrendingSidebar, SuggestedConnections
- MiniProfileCard

### Profile Domain
- ProfileBanner, ProfileAvatar, ProfileHeadline
- ExperienceTimeline, ExperienceItem
- EducationSection, EducationItem
- SkillsGrid, SkillBadge, EndorsementCount
- PortfolioGrid, PortfolioItem
- ReviewCard, ReviewStars, ReviewSummary
- ReferenceCard
- CertificationCard
- AvailabilityBadge
- VerificationBadge

### Marketplace Domain (Jobs/Gigs/Projects)
- BrowseGrid, BrowseList, BrowseFilters
- JobCard, GigCard, ProjectCard
- JobDetail, GigDetail, ProjectDetail
- ApplicationForm, ProposalForm
- PackageBuilder, PackageTable, PackageSelector
- CheckoutFlow, RequirementsForm
- OrderTimeline, OrderStep
- DeliveryForm, RevisionRequest
- ReviewForm, ReviewDisplay

### Recruiter Domain
- TalentSearchFilters, CandidateResultCard
- CandidateProfile, CVParser, SkillsMatch
- PipelineKanban, PipelineColumn, PipelineCard
- ShortlistBoard, ShortlistItem
- OutreachComposer, OutreachSequence
- InterviewScheduler, InterviewCard
- VideoInterviewRoom, VideoPlayback
- ScorecardForm, ScorecardSummary
- OfferBuilder, OfferPreview
- RequisitionForm, RequisitionCard

### Sales Domain
- LeadSearchFilters, LeadResultCard
- ProspectProfile, AccountProfile
- BuyingCommitteeMap, StakeholderCard
- SequenceBuilder, SequenceStep
- RelationshipTimeline, TouchpointCard
- RelationshipGraph, GraphNode, GraphEdge
- BusinessCardScanner, OCRResult
- CRMTaskCard, TaskBoard

### Ads Domain
- CampaignCard, CampaignList
- CampaignWizard, WizardStep
- AudienceBuilder, AudienceSegment
- CreativeEditor, CreativePreview
- KeywordPlannerTable, KeywordSuggestion
- AdsChart, MetricCard
- BudgetControl, SpendAlert
- ABTestCard, TestResults

### Enterprise Domain
- ShowcaseCard, ShowcaseBuilder
- TractionMetrics, MetricGraph
- BusinessPlanViewer, PlanAnnotation
- AdvisorCard, AdvisorBooking
- FeedbackBoard, FeedbackItem
- BoardroomWorkspace, MeetingAgenda
- PartnershipCard, AllianceDirectory
- ClientSuccessTimeline, HealthScore

### Finance Domain
- WalletBalance, TransactionRow
- EscrowCard, EscrowTimeline
- DisputeCard, DisputeTimeline, EvidenceUploader
- InvoiceCard, InvoiceDetail
- SubscriptionCard, PlanComparison
- PayoutSettings, BankAccountForm
- CreditBalance, CreditPurchase

### Communication Domain
- InboxList, ThreadPreview
- ThreadDetail, MessageBubble
- ComposeOverlay, ContactSearch
- VoiceNotePlayer, VoiceNoteRecorder
- VideoCallUI, ScreenShare
- AIAssistPanel, DraftSuggestion
- TypingIndicator, ReadReceipt, PresenceIndicator

### Community Domain
- GroupCard, GroupDetail, GroupFeed
- EventCard, EventDetail, RSVPButton
- EventHostConsole, CheckInList
- SpeedNetworkingLobby, MatchCard, TimerDisplay

### Media Domain
- PodcastCard, PodcastPlayer, EpisodeList
- WebinarCard, WebinarRoom, WebinarChat
- LiveRoomUI, AudienceReactions
- ClipCard, ClipPlayer
- CreatorStudio, ContentCalendar
- MediaUploader, TranscriptViewer

### Dashboard Domain
- WidgetGrid, WidgetCard
- KPICard, TrendIndicator
- ChartWidget (line, bar, donut, funnel)
- TableWidget, DataGrid
- QuickActionsWidget
- ActivityTimelineWidget

### Admin Domain
- AdminQueueCard, QueueList
- UserSearchPanel, UserDetailDrawer
- ModerationAction, FlagCard
- AuditLogEntry, AuditLogFilters
- FeatureFlagToggle, ExperimentCard
- SystemHealthIndicator, RuntimeMetrics

---

## 37. ML/AI Touchpoint Matrix

| Domain | Feature | AI Type | UI Surface |
|--------|---------|---------|------------|
| Feed | Post ranking | Recommendation | Algorithmic feed toggle |
| Feed | Writing assist | Generative AI | Composer toolbar button |
| Search | Semantic search | NLP | Search results |
| Search | Saved search alerts | ML matching | Notification + email |
| Jobs | Description enrichment | Generative AI | Job create form |
| Jobs | Candidate matching | ML ranking | Recruiter search results |
| Recruiter | CV parsing | Document AI | Candidate profile |
| Recruiter | Candidate ranking | ML scoring | Pipeline sort/filter |
| Recruiter | Interview recommendations | ML prediction | Scorecard insights |
| Gigs | Smart pricing | ML prediction | Gig create form |
| Projects | Freelancer automatch | ML matching | Smart Match page |
| Projects | Risk prediction | ML prediction | Risk flags widget |
| Sales | Prospect scoring | ML scoring | Lead search results |
| Sales | Outreach timing | ML prediction | Sequence suggestions |
| Sales | Relationship strength | ML scoring | Relationship graph |
| Ads | Keyword suggestions | ML/NLP | Keyword planner |
| Ads | Audience suggestions | ML clustering | Audience builder |
| Ads | Performance prediction | ML prediction | Campaign builder |
| Enterprise | Business plan summary | Generative AI | Plan vault |
| Enterprise | Advisor matching | ML matching | Advisor marketplace |
| Inbox | Message drafting | Generative AI | Compose + thread |
| Inbox | Thread summary | Generative AI | Thread header |
| Inbox | Priority ranking | ML scoring | Inbox sort |
| Media | Transcript summary | Generative AI | Episode/webinar page |
| Trust | Fraud detection | ML anomaly | Admin queue |
| Trust | Content moderation | ML classification | Moderation queue |
| Notifications | Priority ranking | ML scoring | Notification tray |
| Notifications | Digest grouping | ML clustering | Email digest |

---

## 38. Real-Time Event Surface Plan

| Surface | Events | Transport |
|---------|--------|-----------|
| Inbox | new_message, message_read, typing, presence | WebSocket |
| Floating Chat | same as inbox | WebSocket |
| Notifications | new_notification, badge_count | WebSocket |
| Feed | new_post (from connections), new_comment, new_reaction | WebSocket |
| Pipeline (ATS) | candidate_stage_change, new_application | WebSocket |
| Project Workspace | task_update, milestone_complete, new_comment, file_upload | WebSocket |
| Order Timeline | status_change, new_delivery, revision_request | WebSocket |
| Video Call | participant_join, participant_leave, screen_share_start | WebRTC + WebSocket |
| Speed Networking | match_found, timer_tick, session_end | WebSocket |
| Live Room | participant_count, new_reaction, chat_message | WebSocket |
| Ads Dashboard | performance_update (periodic) | Polling / WebSocket |
| Admin | new_queue_item, alert, system_status | WebSocket |
| Escrow | status_change, release_approval | WebSocket |
| Disputes | new_evidence, status_change, escalation | WebSocket |

---

## 39. File Organization

```
src/
├── components/
│   ├── layout/          — Shells, TopBar, Footer, PageHeader
│   ├── navigation/      — MegaMenu, AvatarDropdown, RoleSwitcher, DashboardTabMenu, CommandSearch
│   ├── feed/            — PostComposer, PostCard variants, FeedStream, Comments
│   ├── profile/         — ProfileView, ProfileEdit, CompanyPage, AgencyPage
│   ├── inbox/           — FloatingChat, InboxList, ThreadDetail, SharedInbox, ComposeOverlay
│   ├── jobs/            — JobBrowse, JobDetail, JobForm, ApplicationFlow
│   ├── recruiter/       — TalentSearch, CandidateProfile, Pipeline, Scorecard, Interviews
│   ├── projects/        — ProjectBrowse, ProjectDetail, Workspace, Kanban, TaskList, Timeline
│   ├── gigs/            — GigBrowse, GigDetail, GigForm, PackageBuilder, OrderFlow
│   ├── sales/           — LeadSearch, AccountSearch, ProspectProfile, SequenceManager
│   ├── ads/             — CampaignBuilder, AudienceBuilder, CreativeStudio, KeywordPlanner
│   ├── enterprise/      — ShowcaseBuilder, TractionPage, AdvisorMarketplace, Boardroom
│   ├── finance/         — Wallet, EscrowConsole, DisputeDetail, InvoiceCenter
│   ├── community/       — GroupDetail, EventDetail, SpeedNetworking
│   ├── media/           — PodcastPlayer, WebinarRoom, CreationStudio, ClipPlayer
│   ├── support/         — SupportCenter, TicketForm, HelpArticle
│   ├── admin/           — AdminOverview, ModerationQueue, UserManagement
│   ├── dashboard/       — DashboardWidgets, KPICard, WidgetGrid (per role)
│   ├── common/          — All reusable primitives, surface cards, data components
│   └── ui/              — shadcn/ui components
├── pages/
│   ├── public/          — Landing, About, Pricing, FAQ, Terms, Privacy, etc.
│   ├── auth/            — SignIn, SignUp, ForgotPassword, ResetPassword, Verify
│   ├── feed/            — Feed/Home
│   ├── network/         — Network, Invitations, SpeedNetworking
│   ├── profile/         — ProfileView, ProfileEdit, CompanyPage, AgencyPage
│   ├── inbox/           — InboxList, ThreadDetail, SharedInbox, CallHistory
│   ├── jobs/            — JobsBrowse, JobDetail, JobCreate, JobEdit, ApplicationWorkspace
│   ├── recruiter/       — All Recruiter Pro pages
│   ├── projects/        — All project and workspace pages
│   ├── gigs/            — All gig and order pages
│   ├── sales/           — All Sales Navigator pages
│   ├── ads/             — All Ads Manager pages
│   ├── enterprise/      — All Enterprise Connect pages
│   ├── finance/         — All finance, escrow, dispute pages
│   ├── community/       — Groups, Events pages
│   ├── media/           — Podcasts, Webinars, Media pages
│   ├── support/         — Support, Help, Tickets pages
│   ├── org/             — Organization management pages
│   ├── dashboard/       — Dashboard views (role-aware)
│   ├── admin/           — All admin pages
│   ├── settings/        — Settings pages
│   └── calendar/        — Calendar page
├── contexts/
│   ├── AuthContext.tsx
│   ├── RoleContext.tsx
│   ├── ThemeContext.tsx
│   ├── ChatContext.tsx
│   └── NotificationContext.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useRole.ts
│   ├── useCommandSearch.ts
│   ├── useFloatingChat.ts
│   ├── useRealtime.ts
│   ├── useInfiniteScroll.ts
│   └── use-mobile.tsx
├── types/
│   ├── user.ts
│   ├── role.ts
│   ├── feed.ts
│   ├── inbox.ts
│   ├── jobs.ts
│   ├── gigs.ts
│   ├── projects.ts
│   ├── recruiter.ts
│   ├── sales.ts
│   ├── ads.ts
│   ├── enterprise.ts
│   ├── finance.ts
│   ├── community.ts
│   ├── media.ts
│   ├── admin.ts
│   ├── dashboard.ts
│   └── navigation.ts
├── data/               — Mock data for all surfaces
├── docs/               — GIGVORA_MASTER_PLAN.md
├── lib/                — Utilities, API helpers, constants
└── styles/             — Additional CSS if needed
```

---

## 40. Technical Patterns

### State Management
- React Context for auth, role, theme, chat, notifications
- React Query for server state and caching
- Local state for form and UI state
- URL state for filters, pagination, search

### Role-Aware Rendering
```tsx
// Pattern for conditional rendering based on active role
const { activeRole } = useRole();

// In navigation
{activeRole === 'enterprise' && <RecruiterProButton />}

// In dashboard
const dashboardTabs = getDashboardTabs(activeRole);
```

### Route Protection
```tsx
// Pattern for protected routes
<Route element={<RequireAuth />}>
  <Route element={<RequireRole roles={['enterprise']} />}>
    <Route path="/recruiter-pro/*" element={<RecruiterProLayout />} />
  </Route>
</Route>
```

### Front-End States
```tsx
// Pattern for handling all states
interface DataState<T> {
  data: T | null;
  isLoading: boolean;
  isEmpty: boolean;
  isError: boolean;
  error: Error | null;
  isStale: boolean;
  isArchived: boolean;
  isRestricted: boolean;
}
```

### Real-Time Pattern
```tsx
// Pattern for real-time subscriptions
const useRealtimeChannel = (channel: string) => {
  // Subscribe to WebSocket channel
  // Handle reconnection
  // Update local state optimistically
  // Reconcile with server state
};
```

### Mock Data Pattern
```tsx
// Pattern for mock data in development
const useMockData = <T,>(key: string, generator: () => T) => {
  // Return mock data in development
  // Return API data in production
};
```

---

## End of Master Plan

This document serves as the complete reference for the Gigvora front-end build. All 15 phases, 300+ routes, 4 dashboard roles, 40 sections of specification, and every feature domain are documented here.

Every implementation prompt should reference this document for context, routing, component naming, role visibility, and architectural decisions.
