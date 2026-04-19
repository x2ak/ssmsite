import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/work', label: 'Work' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
          scrolled
            ? 'backdrop-blur-md border-b border-border bg-background/80'
            : 'bg-transparent'
        )}
      >
        <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <span className="font-mono text-xs font-medium tracking-widest uppercase text-foreground hover:text-primary transition-colors cursor-pointer">
              Secure Solutions Midlands
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = location === href || location.startsWith(href + '/');
              return (
                <Link key={href} href={href}>
                  <span
                    className={cn(
                      'relative text-sm font-medium transition-colors cursor-pointer py-1',
                      isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-primary"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <ThemeToggle className="hidden md:flex" />
            <Link href="/contact">
              <span className="hidden md:inline-flex h-9 items-center px-4 text-sm font-medium rounded-[var(--radius)] bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer">
                Get in Touch
              </span>
            </Link>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(prev => !prev)}
              className="md:hidden h-9 w-9 flex items-center justify-center rounded-[var(--radius)] hover:bg-muted transition-colors text-foreground"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile full-screen overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-background flex flex-col pt-16"
          >
            <div className="flex flex-col px-6 py-8 gap-2 flex-1">
              {NAV_LINKS.map(({ href, label }, i) => (
                <motion.div
                  key={href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={href}>
                    <span
                      className={cn(
                        'block py-4 text-3xl font-syne font-bold cursor-pointer border-b border-border',
                        location === href ? 'text-primary' : 'text-foreground'
                      )}
                    >
                      {label}
                    </span>
                  </Link>
                </motion.div>
              ))}

              <div className="mt-8 flex items-center gap-4">
                <ThemeToggle />
                <Link href="/contact">
                  <span className="inline-flex h-10 items-center px-5 text-sm font-medium rounded-[var(--radius)] bg-primary text-primary-foreground cursor-pointer">
                    Get in Touch
                  </span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
