import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatInterface } from '@/components/ChatInterface';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NetworkBackground } from '@/components/NetworkBackground';

const HEADING = "Tell me what you're building.";

export default function Home() {
  const [typedChars, setTypedChars] = useState(0);
  const headingDone = typedChars >= HEADING.length;

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

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <NetworkBackground />
      {/* Minimal floating nav — top right */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4">
        <Link href="/">
          <span className="font-mono text-xs font-medium tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            SSM-LTD
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-6">
            {[
              { href: '/work', label: 'Work' },
              { href: '/services', label: 'Services' },
              { href: '/about', label: 'About' },
              { href: '/contact', label: 'Contact' },
            ].map(({ href, label }) => (
              <Link key={href} href={href}>
                <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  {label}
                </span>
              </Link>
            ))}
          </div>
          <ThemeToggle />
        </nav>
      </header>

      {/* Main content — vertically centred */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 relative z-10">
        <div className="w-full max-w-[680px]">
          {/* Brand label */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2 mb-8"
          >
            <span className="pulse-dot" aria-hidden="true" />
            <span className="font-mono text-xs font-medium tracking-widest uppercase text-muted-foreground">
              Secure Solutions Midlands
            </span>
          </motion.div>

          {/* Hero heading — types in character by character */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="font-syne font-bold text-foreground leading-[1.05] mb-10 text-balance"
            style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)' }}
          >
            {HEADING.slice(0, typedChars)}
            {!headingDone && (
              <span className="cursor-blink" aria-hidden="true" />
            )}
          </motion.h1>

          {/* Chat interface — appears once heading finishes typing */}
          <AnimatePresence>
            {headingDone && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <ChatInterface />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: headingDone ? 1 : 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8 text-xs text-muted-foreground text-center"
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
    </div>
  );
}
