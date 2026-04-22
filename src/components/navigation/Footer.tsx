import React from 'react';
import { Link } from 'react-router-dom';
import { FOOTER_COLUMNS } from '@/data/navigation';
import { GigvoraLogo } from '@/components/GigvoraLogo';
import { Globe, Shield, Award } from 'lucide-react';
import { NewsletterSignup } from '@/components/marketing/NewsletterSignup';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t bg-card">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-12 lg:py-16">
        {/* Top section — brand + newsletter */}
        <div className="grid lg:grid-cols-5 gap-8 mb-10">
          <div className="lg:col-span-2">
            <GigvoraLogo size="sm" />
            <p className="text-xs text-muted-foreground leading-relaxed mt-3 max-w-xs">
              The hybrid professional platform unifying networking, freelance services, recruitment, sales, and enterprise operations.
            </p>
            <div className="flex items-center gap-4 mt-4">
              {[
                { icon: Globe, label: '150+ Countries' },
                { icon: Shield, label: 'SOC 2 Compliant' },
                { icon: Award, label: '99.9% Uptime' },
              ].map(b => (
                <div key={b.label} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                  <b.icon className="h-3 w-3" /> {b.label}
                </div>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_COLUMNS.slice(0, 3).map((col) => (
            <div key={col.title}>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-foreground mb-3">{col.title}</h4>
              <ul className="space-y-1.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Second row of columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {FOOTER_COLUMNS.slice(3).map((col) => (
            <div key={col.title}>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-foreground mb-3">{col.title}</h4>
              <ul className="space-y-1.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="rounded-2xl bg-muted/30 border p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 shadow-sm">
          <div>
            <h4 className="text-sm font-bold mb-0.5">Stay in the loop</h4>
            <p className="text-[11px] text-muted-foreground">Get the latest updates on new features, tips, and opportunities.</p>
          </div>
          <NewsletterSignup className="w-full md:w-auto md:min-w-[420px]" source="footer" topics={['product','launches']} />
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} Gigvora. All rights reserved.
          </span>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="text-[11px] text-muted-foreground hover:text-foreground">Terms</Link>
            <Link to="/privacy" className="text-[11px] text-muted-foreground hover:text-foreground">Privacy</Link>
            <Link to="/trust-safety" className="text-[11px] text-muted-foreground hover:text-foreground">Trust & Safety</Link>
            <div className="h-3 w-px bg-border" />
            {/* Social icons */}
            <div className="flex items-center gap-2">
              {['X', 'Li', 'GH'].map(name => (
                <Link key={name} to="#" className="h-7 w-7 rounded-md flex items-center justify-center bg-muted/50 text-[9px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  {name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
