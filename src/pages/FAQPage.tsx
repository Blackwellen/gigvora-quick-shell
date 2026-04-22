import React, { useState } from 'react';
import { PageSEO } from '@/components/seo/PageSEO';
import { Link } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, HelpCircle, Search, MessageSquare, Shield, CreditCard, Users, Sparkles, Briefcase, Building2, Globe, ThumbsUp, ThumbsDown } from 'lucide-react';

const CATEGORIES = [
  {
    title: 'General', icon: <Globe className="h-3.5 w-3.5" />, color: 'bg-[hsl(var(--gigvora-blue)/0.1)] text-[hsl(var(--gigvora-blue))]',
    faqs: [
      { q: 'What is Gigvora?', a: 'Gigvora is a hybrid professional platform that combines professional networking, freelance services, project marketplaces, recruitment tools, sales operations, and enterprise features into one unified ecosystem.', popular: true },
      { q: 'How does the role system work?', a: 'Gigvora supports three main roles: User/Client (hire and browse), Professional (deliver services and work), and Enterprise (manage teams and operations). You can switch between roles from your avatar dropdown without creating separate accounts.' },
      { q: 'Is Gigvora free to use?', a: 'Yes, Gigvora offers a generous free tier with basic features. Premium plans unlock advanced tools, analytics, and unlimited usage. Add-ons like Recruiter Pro and Sales Navigator are available separately.' },
      { q: 'How do I get started?', a: 'Sign up with your email or Google account, complete your profile, select your primary role, and start exploring. Our onboarding wizard will guide you through setting up your workspace.' },
    ],
  },
  {
    title: 'Payments & Billing', icon: <CreditCard className="h-3.5 w-3.5" />, color: 'bg-accent/10 text-accent',
    faqs: [
      { q: 'What is escrow protection?', a: 'Escrow ensures funds are held securely until work is approved. For projects, funds can be released per milestone. Both buyers and sellers are protected with a fair dispute resolution process.', popular: true },
      { q: 'How does dispute resolution work?', a: 'Disputes follow a structured process: creation, evidence submission, review, escalation, and resolution. Both parties can submit evidence, and professional arbitration ensures fair outcomes.' },
      { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, PayPal, and bank transfers for enterprise accounts. Invoicing is available for Enterprise plans.' },
      { q: 'What are the platform fees?', a: 'Gigvora charges a transparent commission on transactions. Rates vary by service type and volume — check our pricing page for current rates. Enterprise accounts can negotiate custom terms.' },
    ],
  },
  {
    title: 'Premium Features', icon: <Sparkles className="h-3.5 w-3.5" />, color: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]',
    faqs: [
      { q: 'What is Recruiter Pro?', a: 'Recruiter Pro is a full applicant tracking system (ATS) with talent search, kanban pipelines, video interviews, scorecards, outreach tools, and advanced hiring analytics. Available as a premium add-on.' },
      { q: 'What is Sales Navigator?', a: 'Sales Navigator provides lead and account search, buying committee mapping, outreach sequences, CRM tasks, business card capture, and relationship graphs for sales professionals.' },
      { q: 'What are Gigvora Ads?', a: 'Gigvora Ads is a professional advertising platform with campaign management, audience builder, keyword planner, creative studio, A/B testing, and detailed attribution analytics.' },
    ],
  },
  {
    title: 'Enterprise & Teams', icon: <Building2 className="h-3.5 w-3.5" />, color: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
    faqs: [
      { q: 'Does Gigvora support enterprise teams?', a: 'Yes, Enterprise accounts include team management, shared inboxes, advanced permissions, custom branding, SSO integration, compliance tools, and department-level workspaces.' },
      { q: 'Can I host events and webinars?', a: 'Yes, Gigvora includes event hosting, webinar tools with live video, Q&A, polls, recording, and replay libraries. You can also create podcasts using the built-in creator studio.' },
      { q: 'Is there an API for integrations?', a: 'Enterprise plans include full API access for custom integrations with your existing tools and workflows. Webhooks and SSO are also available.' },
    ],
  },
  {
    title: 'Trust & Safety', icon: <Shield className="h-3.5 w-3.5" />, color: 'bg-[hsl(var(--state-critical)/0.1)] text-[hsl(var(--state-critical))]',
    faqs: [
      { q: 'How does identity verification work?', a: 'Users can verify their identity through government ID checks, phone verification, and professional credential validation. Verified users receive trust badges visible on their profile.' },
      { q: 'What happens if I encounter fraud?', a: 'Report it immediately through our Trust & Safety center. Our fraud prevention team investigates all reports within 24 hours and takes appropriate action including account suspension.' },
      { q: 'How is my data protected?', a: 'We use enterprise-grade encryption, regular security audits, and comply with GDPR and SOC 2 standards. Your data is never sold to third parties.' },
    ],
  },
];

const FAQPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = searchQuery.trim()
    ? CATEGORIES.map(cat => ({ ...cat, faqs: cat.faqs.filter(f => f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase())) })).filter(cat => cat.faqs.length > 0)
    : activeCategory
      ? CATEGORIES.filter(c => c.title === activeCategory)
      : CATEGORIES;

  const totalFAQs = CATEGORIES.reduce((a, c) => a + c.faqs.length, 0);

  return (
    <div>
      <PageSEO title="Frequently Asked Questions" description="Find answers to common questions about Gigvora — accounts, payments, hiring, services, and more." canonical="/faq" />
      {/* Hero */}
      <section className="bg-gradient-to-br from-[hsl(var(--gigvora-navy))] via-[hsl(var(--gigvora-navy-light))] to-[hsl(var(--gigvora-blue)/0.2)] py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,hsl(var(--gigvora-blue)/0.1),transparent_60%)]" />
        <div className="relative max-w-[1400px] mx-auto px-4 lg:px-8 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] text-white/80 mb-5">
            <HelpCircle className="h-3 w-3" /> {totalFAQs} answers available
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">How can we help?</h1>
          <p className="text-sm text-white/50 max-w-lg mx-auto mb-8">Search our knowledge base or browse by category.</p>
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search questions..."
              className="pl-11 h-11 text-sm rounded-2xl bg-white/10 border-white/15 text-white placeholder:text-white/30 focus-visible:ring-accent"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-white/40 hover:text-white/70">Clear</button>
            )}
          </div>
        </div>
      </section>

      {/* Category pills */}
      <section className="border-b bg-card/50">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-3 flex flex-wrap gap-1.5">
          <Button
            variant={activeCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory(null)}
            className="h-7 text-[10px] rounded-xl"
          >
            All Categories
          </Button>
          {CATEGORIES.map(cat => (
            <Button
              key={cat.title}
              variant={activeCategory === cat.title ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(activeCategory === cat.title ? null : cat.title)}
              className="h-7 text-[10px] rounded-xl gap-1"
            >
              {cat.icon}{cat.title}
              <Badge variant="outline" className="text-[7px] rounded-full ml-0.5 h-4 px-1">{cat.faqs.length}</Badge>
            </Button>
          ))}
        </div>
      </section>

      {/* FAQ by category */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 lg:px-8 space-y-8">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Search className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
              <h3 className="text-sm font-bold mb-1">No results found</h3>
              <p className="text-[10px] text-muted-foreground">Try a different search term or browse by category.</p>
            </div>
          ) : (
            filtered.map(cat => (
              <div key={cat.title}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${cat.color}`}>{cat.icon}</div>
                  <h2 className="text-sm font-bold">{cat.title}</h2>
                  <Badge variant="outline" className="text-[8px] rounded-md">{cat.faqs.length} questions</Badge>
                </div>
                <Accordion type="single" collapsible className="space-y-1.5">
                  {cat.faqs.map((faq, i) => (
                    <AccordionItem key={i} value={`${cat.title}-${i}`} className="border rounded-xl px-4 bg-card hover:shadow-sm transition-all data-[state=open]:shadow-md data-[state=open]:border-accent/20">
                      <AccordionTrigger className="text-left text-[11px] font-semibold py-3 hover:no-underline gap-2">
                        <span className="flex-1">{faq.q}</span>
                        {'popular' in faq && faq.popular && <Badge className="bg-accent/10 text-accent text-[7px] border-0 shrink-0">Popular</Badge>}
                      </AccordionTrigger>
                      <AccordionContent className="text-[10px] text-muted-foreground leading-relaxed pb-4">
                        <p className="mb-3">{faq.a}</p>
                        <div className="flex items-center gap-2 pt-2 border-t border-border/20">
                          <span className="text-[8px] text-muted-foreground/50">Was this helpful?</span>
                          <button className="h-5 w-5 rounded-md bg-muted/30 flex items-center justify-center hover:bg-accent/10 hover:text-accent transition-colors"><ThumbsUp className="h-2.5 w-2.5" /></button>
                          <button className="h-5 w-5 rounded-md bg-muted/30 flex items-center justify-center hover:bg-[hsl(var(--state-critical)/0.1)] hover:text-[hsl(var(--state-critical))] transition-colors"><ThumbsDown className="h-2.5 w-2.5" /></button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-muted/30 border-t">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 text-center">
          <MessageSquare className="h-6 w-6 text-accent mx-auto mb-3" />
          <h3 className="text-base font-bold mb-1">Still have questions?</h3>
          <p className="text-[10px] text-muted-foreground mb-5">Our support team typically responds within 2 hours.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button size="sm" className="text-[10px] h-8 gap-1 rounded-xl" asChild>
              <Link to="/support/contact">Contact Support <ArrowRight className="h-3 w-3" /></Link>
            </Button>
            <Button variant="outline" size="sm" className="text-[10px] h-8 rounded-xl" asChild>
              <Link to="/help">Visit Help Center</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQPage;
