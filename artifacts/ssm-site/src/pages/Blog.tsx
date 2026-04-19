import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { BlogCard } from '@/components/BlogCard';
import { apiRequest } from '@/lib/queryClient';
import type { Post } from '@shared/schema';

export default function Blog() {
  const { data: posts = [], isLoading, error } = useQuery<Post[]>({
    queryKey: ['posts'],
    queryFn: () => apiRequest<Post[]>('GET', '/api/posts'),
  });

  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">
            Insights
          </p>
          <h1
            className="font-syne font-bold text-foreground leading-tight"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
          >
            Blog
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            Practical thinking on cybersecurity, web development, and building digital infrastructure that lasts.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-[var(--radius)] border border-border bg-muted animate-pulse h-48"
              />
            ))}
          </div>
        ) : error ? (
          <p className="text-muted-foreground text-center py-16">
            Unable to load posts. Please try again later.
          </p>
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground text-center py-16">
            No posts published yet — check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, i) => (
              <BlogCard key={post.id} post={post} index={i} />
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
