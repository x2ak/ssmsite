import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowRight, Clock } from 'lucide-react';
import { formatDate, estimateReadTime } from '@/lib/utils';
import type { Post } from '@shared/schema';

interface BlogCardProps {
  post: Post;
  index: number;
}

export function BlogCard({ post, index }: BlogCardProps) {
  const readTime = estimateReadTime(post.content);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <Link href={`/blog/${post.slug}`}>
        <div className="group block p-6 rounded-[var(--radius)] border border-border bg-card hover:border-primary/50 transition-all duration-300 cursor-pointer h-full">
          <div className="flex items-center gap-4 mb-4">
            <time className="font-mono text-xs text-muted-foreground">
              {formatDate(post.createdAt!)}
            </time>
            <span className="text-muted-foreground/40">·</span>
            <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
              <Clock size={11} />
              {readTime} min read
            </span>
          </div>
          <h2 className="font-syne font-bold text-xl text-foreground mb-3 group-hover:text-primary transition-colors leading-tight">
            {post.title}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
            {post.excerpt}
          </p>
          <span className="inline-flex items-center gap-1 text-sm text-primary font-medium group-hover:gap-2 transition-all">
            Read more
            <ArrowRight size={14} />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
