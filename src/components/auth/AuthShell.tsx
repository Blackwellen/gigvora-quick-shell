import React from 'react';
import { Link } from 'react-router-dom';
import { GigvoraLogo } from '@/components/GigvoraLogo';
import { Shield, CheckCircle2, Lock } from 'lucide-react';

interface AuthShellProps {
  children: React.ReactNode;
  maxWidth?: string;
  showTrust?: boolean;
}

export const AuthShell: React.FC<AuthShellProps> = ({ children, maxWidth = 'max-w-md', showTrust = true }) => (
  <div className="min-h-screen flex flex-col bg-background">
    {/* Subtle texture */}
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--muted)/0.5),transparent_60%)]" />
    </div>

    {/* Top bar */}
    <header className="relative flex items-center justify-between px-4 lg:px-8 py-4">
      <Link to="/" className="hover:opacity-80 transition-opacity">
        <GigvoraLogo size="sm" />
      </Link>
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Secure</span>
      </div>
    </header>

    {/* Center card */}
    <div className="relative flex-1 flex items-center justify-center px-4 py-8">
      <div className={`w-full ${maxWidth}`}>
        {children}
      </div>
    </div>

    {/* Trust footer */}
    {showTrust && (
      <div className="relative px-4 pb-2">
        <div className="max-w-md mx-auto flex items-center justify-center gap-5 py-3 text-[9px] text-muted-foreground/50">
          {[
            { icon: Lock, text: 'Encrypted' },
            { icon: Shield, text: 'SOC 2' },
            { icon: CheckCircle2, text: '99.9% uptime' },
          ].map(t => (
            <span key={t.text} className="flex items-center gap-1">
              <t.icon className="h-2.5 w-2.5" /> {t.text}
            </span>
          ))}
        </div>
      </div>
    )}

    {/* Footer links */}
    <footer className="relative text-center py-3 text-[10px] text-muted-foreground/40 space-x-3">
      <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
      <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
      <Link to="/support" className="hover:text-foreground transition-colors">Support</Link>
    </footer>
  </div>
);
