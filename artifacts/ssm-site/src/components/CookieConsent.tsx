import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X } from 'lucide-react';

const STORAGE_KEY = 'ssm-cookie-consent';

export type ConsentState = 'accepted' | 'necessary' | null;

export function getCookieConsent(): ConsentState {
  try {
    return (localStorage.getItem(STORAGE_KEY) as ConsentState) ?? null;
  } catch {
    return null;
  }
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = getCookieConsent();
    if (!stored) {
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  }

  function necessary() {
    localStorage.setItem(STORAGE_KEY, 'necessary');
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="cookie-banner"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="fixed bottom-4 left-4 right-4 z-[9999] mx-auto max-w-[680px]"
          role="dialog"
          aria-label="Cookie consent"
        >
          <div className="relative rounded-xl border border-border bg-background/95 backdrop-blur-md shadow-2xl overflow-hidden">
            {/* Brand accent bar */}
            <div className="h-[2px] w-full bg-primary" />

            <div className="px-5 py-4 sm:px-6 sm:py-5">
              <div className="flex items-start gap-3">
                <Shield
                  size={18}
                  className="text-primary mt-0.5 flex-shrink-0"
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-1">
                    Cookie Notice
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    We use cookies to keep the site secure and to understand how it&apos;s used.
                    No tracking cookies are set without your consent.{' '}
                    <a
                      href="/privacy"
                      className="text-primary hover:underline underline-offset-2 whitespace-nowrap"
                    >
                      Privacy policy
                    </a>
                    .
                  </p>
                </div>

                {/* Dismiss without choosing — same as "necessary only" */}
                <button
                  onClick={necessary}
                  aria-label="Dismiss"
                  className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors ml-1 mt-0.5"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
                <button
                  onClick={necessary}
                  className="order-2 sm:order-1 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  Necessary only
                </button>
                <button
                  onClick={accept}
                  className="order-1 sm:order-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Accept all
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
