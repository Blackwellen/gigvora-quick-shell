import React, { useState } from 'react';
import { PageSEO } from '@/components/seo/PageSEO';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Send, CheckCircle2, Building2, Headphones, Mail,
  MessageSquare, Phone, MapPin, Clock, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CHANNELS = [
  { icon: Headphones, title: 'Support Center', desc: 'Browse help articles and submit tickets', href: '/help', cta: 'Visit Help Center' },
  { icon: Mail, title: 'Email Us', desc: 'support@gigvora.com — response within 24h', href: 'mailto:support@gigvora.com', cta: 'Send Email' },
  { icon: Building2, title: 'Enterprise Sales', desc: 'Custom plans, demos, and volume pricing', href: '/pricing', cta: 'Contact Sales' },
];

const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div>
      <PageSEO title="Contact Us" description="Reach out to the Gigvora team for sales inquiries, partnerships, or support." canonical="/support/contact" />
      <section className="bg-gradient-to-br from-[hsl(var(--gigvora-navy))] via-[hsl(var(--gigvora-navy-light))] to-[hsl(var(--gigvora-blue)/0.2)] py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,hsl(var(--gigvora-blue)/0.1),transparent_60%)]" />
        <div className="relative max-w-[1600px] mx-auto px-4 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">Get in Touch</h1>
          <p className="text-sm text-white/60 max-w-lg mx-auto">We're here to help. Choose the best way to reach us.</p>
        </div>
      </section>

      {/* Contact channels */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            {CHANNELS.map(ch => (
              <Link key={ch.title} to={ch.href} className="group rounded-2xl border bg-card p-5 hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 text-center">
                <div className="h-10 w-10 rounded-lg bg-[hsl(var(--gigvora-blue)/0.1)] flex items-center justify-center mx-auto mb-3">
                  <ch.icon className="h-5 w-5 text-[hsl(var(--gigvora-blue))]" />
                </div>
                <h3 className="text-sm font-bold mb-1">{ch.title}</h3>
                <p className="text-[11px] text-muted-foreground mb-3">{ch.desc}</p>
                <span className="text-[11px] text-[hsl(var(--gigvora-blue))] font-semibold group-hover:underline flex items-center justify-center gap-1">
                  {ch.cta} <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Contact form */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold mb-2">Send Us a Message</h2>
            <p className="text-xs text-muted-foreground">Fill out the form and we'll respond within 24 hours.</p>
          </div>

          {submitted ? (
            <div className="rounded-2xl border bg-card p-8 text-center">
              <div className="h-14 w-14 rounded-full bg-[hsl(var(--state-healthy)/0.1)] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-7 w-7 text-[hsl(var(--state-healthy))]" />
              </div>
              <h3 className="text-lg font-bold mb-2">Message Sent!</h3>
              <p className="text-xs text-muted-foreground mb-4">We'll get back to you shortly. Check your email for a confirmation.</p>
              <Button size="sm" className="text-xs h-8" asChild>
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          ) : (
            <form className="rounded-3xl border bg-card p-6 lg:p-8 space-y-4 shadow-sm" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium mb-1.5 block">Name *</label>
                  <input type="text" required className="w-full h-9 rounded-lg border bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Your name" />
                </div>
                <div>
                  <label className="text-[11px] font-medium mb-1.5 block">Email *</label>
                  <input type="email" required className="w-full h-9 rounded-lg border bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring" placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium mb-1.5 block">Category *</label>
                <select required className="w-full h-9 rounded-lg border bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Select a category...</option>
                  <option>General Inquiry</option>
                  <option>Account Issue</option>
                  <option>Billing & Payments</option>
                  <option>Technical Support</option>
                  <option>Report a Problem</option>
                  <option>Enterprise Sales</option>
                  <option>Partnership</option>
                  <option>Press & Media</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium mb-1.5 block">Subject *</label>
                <input type="text" required className="w-full h-9 rounded-lg border bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Brief description of your inquiry" />
              </div>
              <div>
                <label className="text-[11px] font-medium mb-1.5 block">Message *</label>
                <textarea required className="w-full rounded-lg border bg-background px-3 py-2.5 text-xs min-h-[120px] focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Describe your issue or question in detail..." />
              </div>
              <Button type="submit" size="sm" className="w-full text-xs h-9 gap-1.5 font-semibold">
                <Send className="h-3 w-3" /> Send Message
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">By submitting, you agree to our <Link to="/privacy" className="underline">Privacy Policy</Link>.</p>
            </form>
          )}
        </div>
      </section>

      {/* Office info */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <MapPin className="h-5 w-5 text-[hsl(var(--gigvora-blue))]" />
              <h4 className="text-xs font-semibold">Headquarters</h4>
              <p className="text-[11px] text-muted-foreground">San Francisco, CA</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Clock className="h-5 w-5 text-[hsl(var(--gigvora-blue))]" />
              <h4 className="text-xs font-semibold">Business Hours</h4>
              <p className="text-[11px] text-muted-foreground">Mon–Fri, 9am–6pm PST</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[hsl(var(--gigvora-blue))]" />
              <h4 className="text-xs font-semibold">Response Time</h4>
              <p className="text-[11px] text-muted-foreground">Within 24 hours</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
