import { Link } from 'wouter';
import { Linkedin, Mail } from 'lucide-react';

const NAV_LINKS = [
  { href: '/work', label: 'Work' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <Link href="/">
              <span className="font-mono text-xs font-medium tracking-widest uppercase text-foreground hover:text-primary transition-colors cursor-pointer">
                Secure Solutions Midlands
              </span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-xs">
              Your Vision, Safely Implemented.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Cybersecurity · Web Development
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">
              Navigation
            </p>
            <ul className="space-y-2">
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href}>
                    <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      {label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">
              Get in Touch
            </p>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:contact@ssmltd.co.uk"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <Mail size={14} />
                  contact@ssmltd.co.uk
                </a>
              </li>
              <li className="text-sm text-muted-foreground">
                Midlands, United Kingdom
              </li>
              <li className="pt-2">
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="SSM-LTD on LinkedIn"
                >
                  <Linkedin size={14} />
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {year} Secure Solutions Midlands Ltd. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            Built with intent.
          </p>
        </div>
      </div>
    </footer>
  );
}
