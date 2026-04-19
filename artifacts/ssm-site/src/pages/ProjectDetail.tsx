import { useRoute, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import type { Project, ProjectSection } from '@shared/schema';

// ── Hero Carousel ──────────────────────────────────────────────────────────────

function HeroCarousel({ images, title }: { images: string[]; title: string }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = images.length;

  const next = useCallback(() => setCurrent(c => (c + 1) % count), [count]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + count) % count), [count]);

  // Auto-advance every 4 seconds
  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [count, paused, next]);

  if (count === 0) return null;

  // Single image — no controls
  if (count === 1) {
    return (
      <div className="w-full aspect-video rounded-[var(--radius)] overflow-hidden mb-10 border border-border">
        <img src={images[0]} alt={title} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className="relative w-full aspect-video rounded-[var(--radius)] overflow-hidden mb-10 border border-border group"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.img
          key={current}
          src={images[current]}
          alt={`${title} — image ${current + 1}`}
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </AnimatePresence>

      {/* Prev / Next */}
      <button
        type="button"
        onClick={prev}
        aria-label="Previous image"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 flex items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur-sm border border-border/60 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/90"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next image"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 flex items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur-sm border border-border/60 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/90"
      >
        <ChevronRight size={16} />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrent(i)}
            aria-label={`Go to image ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? 'w-5 h-1.5 bg-primary'
                : 'w-1.5 h-1.5 bg-white/60 hover:bg-white/90'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Section photo grid ─────────────────────────────────────────────────────────

function SectionPhotoGrid({ urls, title }: { urls: string[]; title: string }) {
  if (urls.length === 0) return null;
  return (
    <div className={`grid gap-4 ${
      urls.length === 1
        ? 'grid-cols-1'
        : urls.length === 2
        ? 'grid-cols-2'
        : 'grid-cols-2 lg:grid-cols-3'
    }`}>
      {urls.map((url, j) => (
        <div
          key={j}
          className={`rounded-[var(--radius)] overflow-hidden border border-border ${
            urls.length === 1 ? 'aspect-video' : 'aspect-[4/3]'
          }`}
        >
          <img
            src={url}
            alt={`${title} — photo ${j + 1}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}

function SectionBody({ body }: { body: string }) {
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <ReactMarkdown>{body}</ReactMarkdown>
    </div>
  );
}

// ── Layout-aware section renderer ─────────────────────────────────────────────

function SectionContent({ section }: { section: ProjectSection }) {
  const urls = section.imageUrls ?? [];
  const hasPhotos = urls.length > 0;
  const hasBody = !!section.body;
  const layout = section.layout ?? 'text-above';

  if (layout === 'photos-above') {
    return (
      <div className="space-y-6">
        {hasPhotos && <SectionPhotoGrid urls={urls} title={section.title} />}
        {hasBody && <SectionBody body={section.body} />}
      </div>
    );
  }

  if (layout === 'side-by-side') {
    return (
      <div className="flex flex-col md:flex-row gap-8">
        {/* Text left */}
        {hasBody && (
          <div className="flex-1 min-w-0">
            <SectionBody body={section.body} />
          </div>
        )}
        {/* Photos right — stacks below on mobile */}
        {hasPhotos && (
          <div className="flex-1 min-w-0">
            <SectionPhotoGrid urls={urls} title={section.title} />
          </div>
        )}
      </div>
    );
  }

  // Default: text-above (text first, then photos)
  return (
    <div className="space-y-6">
      {hasBody && <SectionBody body={section.body} />}
      {hasPhotos && <SectionPhotoGrid urls={urls} title={section.title} />}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProjectDetail() {
  const [, params] = useRoute('/work/:slug');
  const slug = params?.slug ?? '';

  const { data: project, isLoading, error } = useQuery<Project>({
    queryKey: ['projects', slug],
    queryFn: () => apiRequest<Project>('GET', `/api/projects/${slug}`),
    enabled: !!slug,
  });

  const { data: sections = [] } = useQuery<ProjectSection[]>({
    queryKey: ['projects', slug, 'sections'],
    queryFn: () => apiRequest<ProjectSection[]>('GET', `/api/projects/${slug}/sections`),
    enabled: !!slug && !!project,
  });

  // Build carousel image list: uploaded hero images take priority; fall back to imageUrl
  const heroImages: string[] = project
    ? (project.imageUrls ?? []).length > 0
      ? (project.imageUrls as string[])
      : project.imageUrl
      ? [project.imageUrl]
      : []
    : [];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-24">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-12"
        >
          <Link href="/work">
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <ArrowLeft size={14} />
              Back to Our Work
            </span>
          </Link>
        </motion.div>

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 w-20 bg-muted rounded" />
            <div className="h-12 w-2/3 bg-muted rounded" />
            <div className="h-64 w-full bg-muted rounded mt-6" />
            <div className="space-y-3 mt-8">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded" style={{ width: `${75 + Math.random() * 20}%` }} />
              ))}
            </div>
          </div>
        ) : error || !project ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-6">
              This project could not be found.
            </p>
            <Link href="/work">
              <span className="text-primary hover:underline cursor-pointer">
                Return to Our Work
              </span>
            </Link>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Client */}
            {project.client && (
              <p className="font-mono text-xs text-primary tracking-widest uppercase mb-3">
                {project.client}
              </p>
            )}

            {/* Title */}
            <h1
              className="font-syne font-bold text-foreground leading-tight mb-4"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)' }}
            >
              {project.title}
            </h1>

            {/* Tags */}
            {(project.tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {(project.tags ?? []).map(tag => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            )}

            {/* Hero carousel */}
            <HeroCarousel images={heroImages} title={project.title} />

            {/* Short description */}
            <p className="text-lg text-muted-foreground leading-relaxed mb-10 border-l-2 border-primary pl-4">
              {project.description}
            </p>

            {/* Long description */}
            {project.longDescription && (
              <div className="prose prose-neutral dark:prose-invert max-w-none mb-12">
                <ReactMarkdown>{project.longDescription}</ReactMarkdown>
              </div>
            )}

            {/* Sections */}
            {sections.length > 0 && (
              <div className="space-y-16 mb-16">
                {sections.map((section, i) => (
                  <motion.section
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary whitespace-nowrap">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <h2 className="font-syne font-bold text-2xl text-foreground mb-6">
                      {section.title}
                    </h2>
                    <SectionContent section={section} />
                  </motion.section>
                ))}
              </div>
            )}

            {/* Footer row */}
            <div className="pt-8 border-t border-border flex items-center justify-between flex-wrap gap-4">
              <Link href="/work">
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  <ArrowLeft size={14} />
                  Back to Our Work
                </span>
              </Link>

              <div className="flex items-center gap-3">
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-[var(--radius)] border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
                  >
                    <ExternalLink size={14} />
                    View live site
                  </a>
                )}
                <Link href="/contact">
                  <span className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-[var(--radius)] bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer">
                    Get in touch
                  </span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
