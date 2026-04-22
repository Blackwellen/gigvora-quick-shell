export interface MockUser {
  id: string;
  name: string;
  headline: string;
  avatar?: string;
  verified?: boolean;
  role: 'client' | 'professional' | 'enterprise';
}

export interface FeedPost {
  id: string;
  author: MockUser;
  content: string;
  type: 'text' | 'image' | 'article' | 'poll' | 'shared-gig' | 'shared-job' | 'shared-project';
  images?: string[];
  likes: number;
  comments: number;
  shares: number;
  liked?: boolean;
  saved?: boolean;
  createdAt: string;
  hashtags?: string[];
  sharedEntity?: { title: string; subtitle: string; type: string };
  poll?: { question: string; options: { label: string; votes: number }[]; totalVotes: number };
}

export const MOCK_USERS: MockUser[] = [
  { id: '1', name: 'Sarah Chen', headline: 'Senior Product Designer at Figma', verified: true, role: 'professional', avatar: 'https://i.pravatar.cc/150?u=sarah-chen' },
  { id: '2', name: 'Marcus Johnson', headline: 'Head of Talent Acquisition · TechCorp', verified: true, role: 'enterprise', avatar: 'https://i.pravatar.cc/150?u=marcus-johnson' },
  { id: '3', name: 'Elena Rodriguez', headline: 'Full-Stack Developer · Freelancer', role: 'professional', avatar: 'https://i.pravatar.cc/150?u=elena-rodriguez' },
  { id: '4', name: 'Alex Kim', headline: 'CEO & Founder · LaunchPad AI', verified: true, role: 'enterprise', avatar: 'https://i.pravatar.cc/150?u=alex-kim' },
  { id: '5', name: 'Priya Patel', headline: 'Marketing Consultant · Independent', role: 'professional', avatar: 'https://i.pravatar.cc/150?u=priya-patel' },
  { id: '6', name: 'David Thompson', headline: 'VP Engineering · DataFlow', role: 'enterprise', avatar: 'https://i.pravatar.cc/150?u=david-thompson' },
  { id: '7', name: 'Lisa Wang', headline: 'UX Researcher · Google', verified: true, role: 'professional', avatar: 'https://i.pravatar.cc/150?u=lisa-wang' },
  { id: '8', name: 'James Wilson', headline: 'Content Creator · 50K followers', role: 'professional', avatar: 'https://i.pravatar.cc/150?u=james-wilson' },
];

export const MOCK_FEED: FeedPost[] = [
  {
    id: 'p1', author: MOCK_USERS[0], type: 'text',
    content: 'Just wrapped up an incredible design sprint with the team. 🎨 The key takeaway? Always start with user research, not assumptions. We reduced our onboarding drop-off by 40% by actually listening to what users struggled with.\n\nWhat\'s your #1 design lesson this year?',
    likes: 234, comments: 45, shares: 12, createdAt: '2h ago', hashtags: ['design', 'ux', 'productdesign'],
  },
  {
    id: 'p2', author: MOCK_USERS[1], type: 'shared-job',
    content: 'We\'re hiring! Looking for exceptional engineers to join our growing team. Remote-first, competitive comp, amazing culture. 🚀',
    sharedEntity: { title: 'Senior Frontend Engineer', subtitle: 'TechCorp · Remote · $150K-200K', type: 'job' },
    likes: 89, comments: 23, shares: 34, createdAt: '4h ago', hashtags: ['hiring', 'engineering'],
  },
  {
    id: 'p3', author: MOCK_USERS[2], type: 'text',
    content: 'Shipped my 100th project on Gigvora today! 🎉 From small landing pages to full-stack enterprise apps. The journey has been incredible. Here\'s what I\'ve learned:\n\n1. Communication > Code quality\n2. Under-promise, over-deliver\n3. Build relationships, not just products\n4. Always have a clear scope\n5. Never stop learning\n\nThank you to every client who trusted me! 💪',
    likes: 567, comments: 89, shares: 45, createdAt: '6h ago', hashtags: ['freelancing', 'milestone'],
  },
  {
    id: 'p4', author: MOCK_USERS[3], type: 'poll',
    content: 'What\'s the biggest challenge for startups in 2026?',
    poll: {
      question: 'What\'s the biggest challenge for startups in 2026?',
      options: [
        { label: 'Finding product-market fit', votes: 342 },
        { label: 'Hiring the right team', votes: 289 },
        { label: 'Raising funding', votes: 156 },
        { label: 'Scaling operations', votes: 198 },
      ],
      totalVotes: 985,
    },
    likes: 145, comments: 67, shares: 23, createdAt: '8h ago',
  },
  {
    id: 'p5', author: MOCK_USERS[4], type: 'shared-gig',
    content: 'Excited to launch my new service! Offering comprehensive marketing strategy packages for early-stage startups. Includes brand positioning, go-to-market strategy, and content roadmap.',
    sharedEntity: { title: 'Marketing Strategy Package', subtitle: 'Starting at $500 · 7-day delivery · ⭐ 4.9', type: 'gig' },
    likes: 78, comments: 15, shares: 8, createdAt: '12h ago',
  },
  {
    id: 'p6', author: MOCK_USERS[5], type: 'text',
    content: 'Hot take: The best engineering teams don\'t have 10x engineers. They have 10x communication. A team that can clearly articulate problems, share context, and align on solutions will always outperform a team of brilliant lone wolves.',
    likes: 892, comments: 134, shares: 78, createdAt: '1d ago', hashtags: ['engineering', 'leadership', 'teamwork'],
  },
  {
    id: 'p7', author: MOCK_USERS[6], type: 'article',
    content: 'Just published: "The Future of UX Research in the Age of AI" — How AI tools are changing (but not replacing) the way we understand users. Key insight: AI handles the "what" but humans still excel at the "why".',
    sharedEntity: { title: 'The Future of UX Research in the Age of AI', subtitle: '8 min read · 2.3K views', type: 'article' },
    likes: 345, comments: 56, shares: 89, createdAt: '1d ago', hashtags: ['uxresearch', 'ai'],
  },
  {
    id: 'p8', author: MOCK_USERS[7], type: 'shared-project',
    content: 'Looking for a talented React/Node developer for our new SaaS platform build. This is a 3-month project with potential for ongoing work. Budget: $25K-35K.',
    sharedEntity: { title: 'SaaS Platform Development', subtitle: '$25K-35K · 3 months · React + Node.js', type: 'project' },
    likes: 56, comments: 28, shares: 15, createdAt: '2d ago',
  },
];

export const MOCK_TRENDING = [
  { tag: '#remotework', posts: '12.5K' },
  { tag: '#hiring2026', posts: '8.2K' },
  { tag: '#aitools', posts: '6.8K' },
  { tag: '#freelancing', posts: '5.4K' },
  { tag: '#startup', posts: '4.1K' },
];

export const MOCK_SUGGESTED_CONNECTIONS = [
  { id: '10', name: 'Nina Kowalski', headline: 'Data Scientist · Stripe', mutual: 12, avatar: 'https://i.pravatar.cc/150?u=nina-kowalski' },
  { id: '11', name: 'Tom Richards', headline: 'Product Manager · Airbnb', mutual: 8, avatar: 'https://i.pravatar.cc/150?u=tom-richards' },
  { id: '12', name: 'Aisha Mohammed', headline: 'DevOps Engineer · AWS', mutual: 5, avatar: 'https://i.pravatar.cc/150?u=aisha-mohammed' },
];

export const MOCK_UPCOMING_EVENTS = [
  { id: 'e1', title: 'Design Systems Summit 2026', date: 'Apr 15', attendees: 234 },
  { id: 'e2', title: 'Speed Networking: Tech Leaders', date: 'Apr 18', attendees: 56 },
  { id: 'e3', title: 'Freelancer Mastermind', date: 'Apr 20', attendees: 89 },
];

// Jobs mock data
export interface MockJob {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'freelance';
  salary: string;
  remote: boolean;
  postedAt: string;
  applicants: number;
  description: string;
  requirements: string[];
  benefits: string[];
  skills: string[];
  saved?: boolean;
}

export const MOCK_JOBS: MockJob[] = [
  {
    id: 'j1', title: 'Senior Frontend Engineer', company: 'TechCorp', location: 'San Francisco, CA', type: 'full-time',
    salary: '$150K - $200K', remote: true, postedAt: '2 days ago', applicants: 45,
    description: 'Join our engineering team building the next generation of developer tools. You\'ll work on complex UI challenges, performance optimization, and design system architecture.',
    requirements: ['5+ years React/TypeScript experience', 'Strong CSS and design system skills', 'Experience with large-scale applications', 'Excellent communication skills'],
    benefits: ['Remote-first culture', 'Unlimited PTO', 'Health, dental, vision', '$5K annual learning budget', 'Equity package'],
    skills: ['React', 'TypeScript', 'CSS', 'Design Systems', 'Performance'],
  },
  {
    id: 'j2', title: 'Product Designer', company: 'DesignHub', location: 'New York, NY', type: 'full-time',
    salary: '$120K - $160K', remote: true, postedAt: '1 day ago', applicants: 67,
    description: 'We\'re looking for a Product Designer to own end-to-end design for our core product. You\'ll conduct user research, create wireframes and prototypes, and collaborate closely with engineering.',
    requirements: ['3+ years product design experience', 'Figma proficiency', 'User research skills', 'Portfolio demonstrating UX thinking'],
    benefits: ['Hybrid work', 'Design conference budget', 'Latest hardware', 'Team retreats'],
    skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Accessibility'],
  },
  {
    id: 'j3', title: 'DevOps Engineer', company: 'CloudScale', location: 'Austin, TX', type: 'full-time',
    salary: '$140K - $180K', remote: true, postedAt: '3 days ago', applicants: 23,
    description: 'Help us scale our infrastructure to serve millions of users. You\'ll work with Kubernetes, Terraform, and modern CI/CD pipelines.',
    requirements: ['4+ years DevOps experience', 'Kubernetes expertise', 'Terraform/IaC experience', 'Strong Linux skills'],
    benefits: ['Fully remote', 'Competitive equity', '4-day work week', 'Home office setup'],
    skills: ['Kubernetes', 'Terraform', 'AWS', 'Docker', 'CI/CD'],
  },
  {
    id: 'j4', title: 'Data Scientist', company: 'AnalyticsPro', location: 'Remote', type: 'contract',
    salary: '$100/hr', remote: true, postedAt: '5 hours ago', applicants: 12,
    description: 'Build ML models for our recommendation engine. Work with large datasets, design experiments, and deploy models to production.',
    requirements: ['MS/PhD in CS, Statistics, or related', 'Python, SQL proficiency', 'ML framework experience', 'Production ML experience'],
    benefits: ['Flexible hours', 'Long-term contract', 'Cutting-edge ML work'],
    skills: ['Python', 'ML', 'SQL', 'TensorFlow', 'Statistics'],
  },
  {
    id: 'j5', title: 'Marketing Manager', company: 'GrowthEngine', location: 'London, UK', type: 'full-time',
    salary: '£70K - £90K', remote: false, postedAt: '1 week ago', applicants: 89,
    description: 'Lead our marketing team and drive growth across all channels. Own strategy, execution, and analytics for B2B SaaS marketing.',
    requirements: ['5+ years B2B marketing experience', 'Team management experience', 'Data-driven approach', 'Content marketing expertise'],
    benefits: ['Central London office', 'Private healthcare', '30 days holiday', 'Stock options'],
    skills: ['B2B Marketing', 'Content Strategy', 'Analytics', 'Team Leadership', 'SaaS'],
  },
  {
    id: 'j6', title: 'Mobile Developer', company: 'AppWorks', location: 'Berlin, DE', type: 'full-time',
    salary: '€80K - €110K', remote: true, postedAt: '4 days ago', applicants: 34,
    description: 'Build cross-platform mobile apps with React Native. Join a small, talented team shipping features weekly to 500K+ users.',
    requirements: ['3+ years React Native', 'iOS and Android experience', 'TypeScript proficiency', 'App Store publishing experience'],
    benefits: ['Remote-first', 'Berlin office option', 'Conference budget', 'Latest MacBook'],
    skills: ['React Native', 'TypeScript', 'iOS', 'Android', 'Mobile UI'],
  },
];

// Gigs mock
export interface MockGig {
  id: string;
  title: string;
  seller: MockUser;
  category: string;
  startingPrice: number;
  rating: number;
  reviews: number;
  deliveryDays: number;
  description: string;
  packages: { name: string; price: number; delivery: string; features: string[] }[];
  tags: string[];
  saved?: boolean;
}

export const MOCK_GIGS: MockGig[] = [
  {
    id: 'g1', title: 'Professional Logo Design', seller: MOCK_USERS[0], category: 'Design',
    startingPrice: 50, rating: 4.9, reviews: 234, deliveryDays: 3,
    description: 'I will create a unique, professional logo for your brand.',
    packages: [
      { name: 'Basic', price: 50, delivery: '3 days', features: ['1 concept', '1 revision', 'PNG file'] },
      { name: 'Standard', price: 100, delivery: '5 days', features: ['3 concepts', '3 revisions', 'PNG + SVG', 'Source file'] },
      { name: 'Premium', price: 200, delivery: '7 days', features: ['5 concepts', 'Unlimited revisions', 'All formats', 'Brand guide', 'Social media kit'] },
    ],
    tags: ['logo', 'branding', 'graphic-design'],
  },
  {
    id: 'g2', title: 'Full-Stack Web Application', seller: MOCK_USERS[2], category: 'Development',
    startingPrice: 500, rating: 4.8, reviews: 156, deliveryDays: 14,
    description: 'I will build a complete web application using React and Node.js.',
    packages: [
      { name: 'Basic', price: 500, delivery: '7 days', features: ['Landing page', 'Responsive design', '3 pages'] },
      { name: 'Standard', price: 1500, delivery: '14 days', features: ['Full web app', 'Auth system', 'Database', '10 pages'] },
      { name: 'Premium', price: 3000, delivery: '30 days', features: ['Enterprise app', 'Advanced features', 'API integrations', 'Admin panel', '30-day support'] },
    ],
    tags: ['react', 'nodejs', 'fullstack'],
  },
  {
    id: 'g3', title: 'SEO Strategy & Implementation', seller: MOCK_USERS[4], category: 'Marketing',
    startingPrice: 150, rating: 4.7, reviews: 89, deliveryDays: 7,
    description: 'Complete SEO audit, strategy, and implementation for your website.',
    packages: [
      { name: 'Basic', price: 150, delivery: '5 days', features: ['SEO audit', 'Keyword research', 'Report'] },
      { name: 'Standard', price: 350, delivery: '10 days', features: ['Full audit', 'Strategy doc', 'On-page optimization', 'Technical fixes'] },
      { name: 'Premium', price: 750, delivery: '21 days', features: ['Everything in Standard', 'Content strategy', 'Link building plan', 'Monthly monitoring'] },
    ],
    tags: ['seo', 'marketing', 'content'],
  },
];

// Profile mock data
export interface MockProfile extends MockUser {
  banner?: string;
  location: string;
  about: string;
  connections: number;
  experience: { title: string; company: string; period: string; current: boolean }[];
  education: { school: string; degree: string; period: string }[];
  skills: { name: string; endorsements: number }[];
  reviews: { author: string; rating: number; text: string; date: string }[];
}

export const MOCK_PROFILE: MockProfile = {
  ...MOCK_USERS[0],
  location: 'San Francisco, CA',
  about: 'Senior Product Designer with 8+ years of experience creating user-centered digital products. Passionate about design systems, accessibility, and building products that make a real difference. Previously at Google, Airbnb, and Stripe.',
  connections: 1247,
  experience: [
    { title: 'Senior Product Designer', company: 'Figma', period: 'Jan 2024 - Present', current: true },
    { title: 'Product Designer', company: 'Stripe', period: 'Mar 2021 - Dec 2023', current: false },
    { title: 'UX Designer', company: 'Airbnb', period: 'Jun 2018 - Feb 2021', current: false },
    { title: 'Junior Designer', company: 'Google', period: 'Aug 2016 - May 2018', current: false },
  ],
  education: [
    { school: 'Stanford University', degree: 'MS Human-Computer Interaction', period: '2014 - 2016' },
    { school: 'UC Berkeley', degree: 'BS Cognitive Science', period: '2010 - 2014' },
  ],
  skills: [
    { name: 'Product Design', endorsements: 89 }, { name: 'Figma', endorsements: 76 },
    { name: 'Design Systems', endorsements: 65 }, { name: 'User Research', endorsements: 54 },
    { name: 'Prototyping', endorsements: 48 }, { name: 'Accessibility', endorsements: 34 },
  ],
  reviews: [
    { author: 'Marcus J.', rating: 5, text: 'Exceptional design work. Sarah delivered beyond expectations with incredible attention to detail.', date: '2 weeks ago' },
    { author: 'Alex K.', rating: 5, text: 'Best designer I\'ve worked with on the platform. Fast, communicative, and brilliant.', date: '1 month ago' },
    { author: 'David T.', rating: 4, text: 'Great collaboration, delivered on time with solid quality.', date: '2 months ago' },
  ],
};

// Inbox mock
export interface MockThread {
  id: string;
  participant: MockUser;
  lastMessage: string;
  unread: boolean;
  timestamp: string;
  context?: { type: string; label: string };
}

export const MOCK_THREADS: MockThread[] = [
  { id: 't1', participant: MOCK_USERS[1], lastMessage: 'Great, let\'s schedule the interview for next Tuesday at 2 PM.', unread: true, timestamp: '10m ago', context: { type: 'hiring', label: 'Senior Frontend Engineer' } },
  { id: 't2', participant: MOCK_USERS[2], lastMessage: 'I\'ve uploaded the latest deliverables to the project workspace.', unread: true, timestamp: '1h ago', context: { type: 'project', label: 'SaaS Platform' } },
  { id: 't3', participant: MOCK_USERS[3], lastMessage: 'Would love to discuss the partnership opportunity further!', unread: false, timestamp: '3h ago' },
  { id: 't4', participant: MOCK_USERS[4], lastMessage: 'The marketing strategy doc is ready for your review.', unread: false, timestamp: '5h ago', context: { type: 'gig', label: 'Marketing Strategy' } },
  { id: 't5', participant: MOCK_USERS[5], lastMessage: 'Thanks for the great work on the infrastructure setup!', unread: false, timestamp: '1d ago', context: { type: 'project', label: 'Cloud Migration' } },
  { id: 't6', participant: MOCK_USERS[6], lastMessage: 'Can you share the research findings presentation?', unread: false, timestamp: '2d ago' },
  { id: 't7', participant: MOCK_USERS[7], lastMessage: 'Let me know if you need any content revisions.', unread: false, timestamp: '3d ago', context: { type: 'gig', label: 'Content Package' } },
];

// Network mock
export interface MockConnection {
  id: string;
  user: MockUser;
  mutual: number;
  connected: boolean;
}

export const MOCK_CONNECTIONS: MockConnection[] = MOCK_USERS.map((u, i) => ({
  id: `c${i}`, user: u, mutual: Math.floor(Math.random() * 30) + 1, connected: i < 4,
}));

export const MOCK_INVITATIONS = [
  { id: 'inv1', user: { id: '20', name: 'Robert Chang', headline: 'CTO · InnovateTech', role: 'enterprise' as const }, mutual: 15, message: 'I\'d love to connect and discuss potential collaboration opportunities.' },
  { id: 'inv2', user: { id: '21', name: 'Maria Santos', headline: 'Product Manager · Shopify', role: 'professional' as const }, mutual: 8, message: '' },
  { id: 'inv3', user: { id: '22', name: 'Jordan Lee', headline: 'Data Engineer · Netflix', role: 'professional' as const }, mutual: 3, message: 'Saw your talk at the conference — really inspiring work!' },
];

// Recruiter mock
export interface MockCandidate {
  id: string;
  name: string;
  headline: string;
  location: string;
  skills: string[];
  experience: string;
  matchScore: number;
  stage: 'sourced' | 'screened' | 'interviewed' | 'offered' | 'hired';
  appliedFor: string;
  notes: string[];
}

export const MOCK_CANDIDATES: MockCandidate[] = [
  { id: 'c1', name: 'Emily Watson', headline: 'Senior React Developer', location: 'London, UK', skills: ['React', 'TypeScript', 'Node.js'], experience: '6 years', matchScore: 95, stage: 'interviewed', appliedFor: 'Senior Frontend Engineer', notes: ['Strong technical skills', 'Great culture fit'] },
  { id: 'c2', name: 'Ryan Park', headline: 'Full-Stack Engineer', location: 'Seoul, KR', skills: ['React', 'Python', 'AWS'], experience: '4 years', matchScore: 87, stage: 'screened', appliedFor: 'Senior Frontend Engineer', notes: ['Interesting portfolio'] },
  { id: 'c3', name: 'Anna Müller', headline: 'Frontend Developer', location: 'Berlin, DE', skills: ['Vue', 'React', 'CSS'], experience: '5 years', matchScore: 82, stage: 'sourced', appliedFor: 'Senior Frontend Engineer', notes: [] },
  { id: 'c4', name: 'Carlos Diaz', headline: 'Software Engineer', location: 'Madrid, ES', skills: ['React', 'TypeScript', 'GraphQL'], experience: '7 years', matchScore: 91, stage: 'offered', appliedFor: 'Senior Frontend Engineer', notes: ['Excellent references', 'Salary negotiation in progress'] },
  { id: 'c5', name: 'Wei Liu', headline: 'Senior Developer', location: 'Singapore', skills: ['React', 'Go', 'Kubernetes'], experience: '8 years', matchScore: 88, stage: 'interviewed', appliedFor: 'DevOps Engineer', notes: ['Second interview scheduled'] },
  { id: 'c6', name: 'Sophie Martin', headline: 'UX Engineer', location: 'Paris, FR', skills: ['React', 'Design Systems', 'A11y'], experience: '5 years', matchScore: 79, stage: 'screened', appliedFor: 'Product Designer', notes: [] },
];
