import { Switch, Route, useLocation } from 'wouter';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/context/ThemeContext';
import { queryClient } from '@/lib/queryClient';

import Home from '@/pages/Home';
import Work from '@/pages/Work';
import ProjectDetail from '@/pages/ProjectDetail';
import Services from '@/pages/Services';
import About from '@/pages/About';
import Blog from '@/pages/Blog';
import BlogPost from '@/pages/BlogPost';
import Contact from '@/pages/Contact';
import Admin from '@/pages/Admin';
import Privacy from '@/pages/Privacy';
import NotFound from '@/pages/not-found';
import CookieConsent from '@/components/CookieConsent';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -12 },
};

const pageTransition = {
  duration: 0.2,
  ease: [0.25, 0.1, 0.25, 1],
};

export default function App() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            style={{ minHeight: '100%' }}
          >
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/work" component={Work} />
              <Route path="/work/:slug" component={ProjectDetail} />
              <Route path="/services" component={Services} />
              <Route path="/about" component={About} />
              <Route path="/blog" component={Blog} />
              <Route path="/blog/:slug" component={BlogPost} />
              <Route path="/contact" component={Contact} />
              <Route path="/x7-control" component={Admin} />
              <Route path="/privacy" component={Privacy} />
              <Route component={NotFound} />
            </Switch>
          </motion.div>
        </AnimatePresence>

        {/* GDPR cookie consent — rendered outside the transition wrapper so it persists */}
        <CookieConsent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
