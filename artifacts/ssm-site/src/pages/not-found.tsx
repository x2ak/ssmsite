import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';

export default function NotFound() {
  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-6 py-32 flex flex-col items-center justify-center text-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-6">
            404
          </p>
          <h1
            className="font-syne font-bold text-foreground mb-6"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
          >
            Page not found.
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-md">
            This page does not exist, or it has been moved. Head back to the homepage or get in touch.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <Link href="/">
              <span className="inline-flex h-11 items-center px-6 text-sm font-medium rounded-[var(--radius)] bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer">
                Back to Home
              </span>
            </Link>
            <Link href="/contact">
              <span className="inline-flex h-11 items-center px-6 text-sm font-medium rounded-[var(--radius)] border border-border text-foreground hover:bg-muted transition-colors cursor-pointer">
                Contact Us
              </span>
            </Link>
          </div>
        </motion.div>
      </section>
    </Layout>
  );
}
