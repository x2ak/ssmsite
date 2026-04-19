import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ChatInterface } from '@/components/ChatInterface';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
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
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24">
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

          {/* Hero heading */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-syne font-bold text-foreground leading-[1.05] mb-10 text-balance"
            style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)' }}
          >
            Tell me what you're building.
          </motion.h1>

          {/* Chat interface */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <ChatInterface />
          </motion.div>

          {/* Footer hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
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
