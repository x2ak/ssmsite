import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowRight, Clock } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { apiRequest } from '@/lib/queryClient';
import { formatDate, estimateReadTime } from '@/lib/utils';
import type { Post } from '@shared/schema';

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded ${className ?? ''}`} />;
}

function FeaturedPost({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="group grid grid-cols-1 lg:grid-cols-5 gap-0 border border-border bg-card cursor-pointer hover:border-primary/40 transition-colors"
      >
        {/* Image */}
        <div className="lg:col-span-3 aspect-[16/9] lg:aspect-auto overflow-hidden bg-muted">
          {post.imageUrl ? (
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full min-h-[240px] bg-gradient-to-br from-primary/10 to-primary/5 flex items-end p-6">
              <span className="font-mono text-xs text-primary/50 uppercase tracking-widest">SSM-LTD</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="lg:col-span-2 p-7 flex flex-col justify-between border-l border-border">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-primary">
                Featured
              </span>
              <span className="text-border">·</span>
              <time className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
                {formatDate((post.publishedAt ?? post.createdAt)!)}
              </time>
            </div>
            <h2
              className="font-syne font-bold text-foreground leading-tight mb-4 group-hover:text-primary transition-colors"
              style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)' }}
            >
              {post.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
              {post.excerpt}
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-sm text-primary font-medium group-hover:gap-2.5 transition-all">
              Read article
              <ArrowRight size={14} />
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
              <Clock size={11} />
              {post.readTime ?? estimateReadTime(post.content)} min
            </span>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

function SecondaryPost({ post, index }: { post: Post; index: number }) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: index * 0.07 }}
        className="group border-t border-border pt-5 cursor-pointer"
      >
        <div className="flex items-center gap-2 mb-3">
          <time className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
            {formatDate((post.publishedAt ?? post.createdAt)!)}
          </time>
          <span className="text-border text-xs">·</span>
          <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-1">
            <Clock size={9} />
            {post.readTime ?? estimateReadTime(post.content)} min
          </span>
        </div>
        <h3 className="font-syne font-bold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors text-base">
          {post.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3">
          {post.excerpt}
        </p>
        <span className="inline-flex items-center gap-1 text-xs text-primary group-hover:gap-1.5 transition-all">
          Read <ArrowRight size={11} />
        </span>
      </motion.article>
    </Link>
  );
}

export default function Blog() {
  const { data: posts = [], isLoading, error } = useQuery<Post[]>({
    queryKey: ['posts'],
    queryFn: () => apiRequest<Post[]>('GET', '/api/posts'),
  });

  const [featured, ...rest] = posts;

  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-6 py-20">

        {/* Masthead */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12 pb-6 border-b-2 border-foreground"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Secure Solutions Midlands · Insights & Analysis
          </p>
          <h1
            className="font-syne font-bold text-foreground leading-none"
            style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}
          >
            The Brief
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-xl">
            Practical thinking on cybersecurity, web development, and building digital infrastructure that lasts.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 border border-border h-72">
              <SkeletonBlock className="lg:col-span-3 rounded-none" />
              <SkeletonBlock className="lg:col-span-2 rounded-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => <SkeletonBlock key={i} className="h-32" />)}
            </div>
          </div>
        ) : error ? (
          <p className="text-muted-foreground text-center py-16">Unable to load posts. Please try again.</p>
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground text-center py-16">No posts published yet — check back soon.</p>
        ) : (
          <div className="space-y-0">
            {/* Featured story */}
            {featured && <FeaturedPost post={featured} />}

            {/* Secondary stories */}
            {rest.length > 0 && (
              <>
                <div className="flex items-center gap-4 mt-10 mb-8">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">
                    Latest
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-0">
                  {rest.map((post, i) => (
                    <SecondaryPost key={post.id} post={post} index={i} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </section>
    </Layout>
  );
}
