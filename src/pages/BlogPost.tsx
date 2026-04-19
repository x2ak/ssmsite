import { useRoute, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { apiRequest } from '@/lib/queryClient';
import { formatDate, estimateReadTime } from '@/lib/utils';
import type { Post } from '@shared/schema';

export default function BlogPost() {
  const [, params] = useRoute('/blog/:slug');
  const slug = params?.slug ?? '';
  const [copied, setCopied] = useState(false);

  const { data: post, isLoading, error } = useQuery<Post>({
    queryKey: ['posts', slug],
    queryFn: () => apiRequest<Post>('GET', `/api/posts/${slug}`),
    enabled: !!slug,
  });

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Layout>
      <article className="max-w-3xl mx-auto px-6 py-24">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-12"
        >
          <Link href="/blog">
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <ArrowLeft size={14} />
              Back to Blog
            </span>
          </Link>
        </motion.div>

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-12 w-3/4 bg-muted rounded" />
            <div className="h-4 w-48 bg-muted rounded" />
            <div className="mt-8 space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded" style={{ width: `${85 + Math.random() * 15}%` }} />
              ))}
            </div>
          </div>
        ) : error || !post ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-6">
              This post could not be found or is no longer available.
            </p>
            <Link href="/blog">
              <span className="text-primary hover:underline cursor-pointer">
                Return to the blog
              </span>
            </Link>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Meta */}
            <div className="flex items-center gap-4 mb-6">
              <time className="font-mono text-xs text-muted-foreground">
                {formatDate(post.createdAt!)}
              </time>
              <span className="text-muted-foreground/40">·</span>
              <span className="font-mono text-xs text-muted-foreground">
                {estimateReadTime(post.content)} min read
              </span>
            </div>

            {/* Title */}
            <h1
              className="font-syne font-bold text-foreground leading-tight mb-8"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
            >
              {post.title}
            </h1>

            {/* Excerpt */}
            <p className="text-lg text-muted-foreground leading-relaxed mb-10 border-l-2 border-primary pl-4">
              {post.excerpt}
            </p>

            {/* Content */}
            <div className="prose max-w-none">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>

            {/* Share */}
            <div className="mt-16 pt-8 border-t border-border flex items-center justify-between">
              <Link href="/blog">
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  <ArrowLeft size={14} />
                  Back to Blog
                </span>
              </Link>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label="Copy link to this post"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-primary" />
                    <span className="text-primary">Link copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy link
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </article>
    </Layout>
  );
}
