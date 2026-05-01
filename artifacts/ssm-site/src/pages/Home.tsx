import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { ChatInterface } from '@/components/ChatInterface';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NetworkBackground } from '@/components/NetworkBackground';
import { MarqueeTicker } from '@/components/MarqueeTicker';

const HEADING = "Tell me what you're building.";

const NAV_LINKS = [
  { href: '/work',     label: 'Work'     },
  { href: '/services', label: 'Services' },
  { href: '/about',    label: 'About'    },
  { href: '/blog',     label: 'Blog'     },
  { href: '/contact',  label: 'Contact'  },
];

export default function Home() {
  const [typedChars, setTypedChars] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatActive, setChatActive] = useState(false);
  const [, navigate] = useLocation();
  const headingDone = typedChars >= HEADING.length;
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleActivity = useCallback(() => {
    setChatActive(true);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setChatActive(false), 3000);
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        setTypedChars(prev => {
          if (prev >= HEADING.length) {
            if (interval) clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, 48);
    }, 700);
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);

  function handleMobileNav(href: string) {
    setMenuOpen(false);
    navigate(href);
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-background relative overflow-hidden">
      <NetworkBackground active={chatActive} />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4">
        <Link href="/">
          <span className="font-mono text-xs font-medium tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            SSM-LTD
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          {/* Desktop nav — hidden on mobile */}
          <div className="hidden sm:flex items-center gap-6">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href}>
                <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  {label}
                </span>
              </Link>
            ))}
          </div>

          <ThemeToggle />

          {/* Hamburger — visible on mobile only */}
          <button
            className="sm:hidden flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen(o => !o)}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </nav>
      </header>

      {/* Mobile nav drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-30 sm:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMenuOpen(false)}
            />

            {/* Panel */}
            <motion.div
              key="panel"
              className="fixed top-[56px] left-0 right-0 z-40 sm:hidden border-b border-border bg-background/90 backdrop-blur-md px-6 py-4"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ul className="flex flex-col gap-1">
                {NAV_LINKS.map(({ href, label }) => (
                  <li key={href}>
                    <button
                      className="w-full text-left py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b border-border/50 last:border-0"
                      onClick={() => handleMobileNav(href)}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>

              <p className="mt-4 text-xs text-muted-foreground/60 pb-1">
                Or use the chat below to tell us what you need.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content — fills remaining viewport, compresses when keyboard opens */}
      <main className="flex-1 flex flex-col items-center overflow-hidden px-6 pt-[64px] pb-2 relative z-10">
        <div className="w-full max-w-[680px] flex flex-col flex-1 min-h-0">

          {/* Brand label + hero heading — shrink-0 so they don't squash */}
          <div className="flex-shrink-0 pt-6 sm:pt-10">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-2 mb-6"
            >
              <span className="pulse-dot" aria-hidden="true" />
              <span className="font-mono text-xs font-medium tracking-widest uppercase text-muted-foreground">
                Secure Solutions Midlands
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="font-syne font-bold text-foreground leading-[1.05] mb-6 sm:mb-10 text-balance"
              style={{ fontSize: 'clamp(1.75rem, 7vw, 5rem)' }}
            >
              {HEADING.slice(0, typedChars)}
              {!headingDone && (
                <span className="cursor-blink" aria-hidden="true" />
              )}
            </motion.h1>
          </div>

          {/* Chat — grows to fill all remaining space so input sits at bottom */}
          <AnimatePresence>
            {headingDone && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex-1 min-h-0 flex flex-col"
              >
                <ChatInterface onActivity={handleActivity} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer hint — desktop only, hidden on mobile to save space */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: headingDone ? 1 : 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="hidden sm:block flex-shrink-0 mt-4 text-xs text-muted-foreground text-center"
          >
            Or{' '}
            <Link href="/contact">
              <span className="text-primary hover:underline cursor-pointer">
                send us a message directly
              </span>
            </Link>
            {' '}— we respond within 24 hours.
          </motion.p>
        </div>
      </main>

      {/* Marquee ticker strip — anchored at the very bottom of the home viewport */}
      <div className="shrink-0 relative z-10">
        <MarqueeTicker />
      </div>
    </div>
  );
}
