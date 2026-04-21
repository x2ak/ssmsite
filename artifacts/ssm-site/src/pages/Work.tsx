import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { PortfolioGrid } from '@/components/PortfolioGrid';
import { apiRequest } from '@/lib/queryClient';
import type { Project } from '@shared/schema';

export default function Work() {
  const { data: projects = [], isLoading, error } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => apiRequest<Project[]>('GET', '/api/projects'),
  });

  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-6 py-24">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">
            Portfolio
          </p>
          <h1
            className="font-syne font-bold text-foreground leading-tight"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
          >
            Our Work
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            A selection of projects across web development and cybersecurity — each built to last and secured by design.
          </p>
        </motion.div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-[var(--radius)] border border-border bg-muted animate-pulse aspect-[4/3]"
              />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              Unable to load projects. Please try again later.
            </p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No projects to display yet.</p>
          </div>
        ) : (
          <PortfolioGrid projects={projects} />
        )}
      </section>
    </Layout>
  );
}
