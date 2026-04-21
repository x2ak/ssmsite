import { useRoute, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, ExternalLink, ChevronLeft, ChevronRight, Quote, ZoomIn } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import Lightbox from '@/components/Lightbox';
import type { Project, ProjectSection } from '@shared/schema';

// ── Hero Carousel ──────────────────────────────────────────────────────────────

function HeroCarousel({
  images,
  title,
  onImageClick,
}: {
  images: string[];
  title: string;
  onImageClick: (i: number) => void;
}) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = images.length;

  const next = useCallback(() => setCurrent(c => (c + 1) % count), [count]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + count) % count), [count]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [count, paused, next]);

  if (count === 0) return null;

  if (count === 1) {
    return (
      <div
        className="group relative w-full aspect-video rounded-[var(--radius)] overflow-hidden mb-10 border border-border cursor-zoom-in"
        onClick={() => onImageClick(0)}
      >
        <img src={images[0]} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
          <ZoomIn size={24} className="text-white drop-shadow-lg" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full aspect-video rounded-[var(--radius)] overflow-hidden mb-10 border border-border group"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current}
          className="absolute inset-0 cursor-zoom-in"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          onClick={() => onImageClick(current)}
        >
          <img
            src={images[current]}
            alt={`${title} — image ${current + 1}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
            <ZoomIn size={24} className="text-white drop-shadow-lg" />
          </div>
        </motion.div>
      </AnimatePresence>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); prev(); }}
        aria-label="Previous image"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 flex items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur-sm border border-border/60 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/90"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); next(); }}
        aria-label="Next image"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 flex items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur-sm border border-border/60 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/90"
      >
        <ChevronRight size={16} />
      </button>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
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

// ── Section helpers ────────────────────────────────────────────────────────────

function SectionPhotoGrid({
  urls,
  title,
  onImageClick,
}: {
  urls: string[];
  title: string;
  onImageClick: (i: number) => void;
}) {
  if (urls.length === 0) return null;
  return (
    <div className={`grid gap-4 ${
      urls.length === 1 ? 'grid-cols-1' : urls.length === 2 ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-3'
    }`}>
      {urls.map((url, j) => (
        <div
          key={j}
          className={`group relative rounded-[var(--radius)] overflow-hidden border border-border cursor-zoom-in ${
            urls.length === 1 ? 'aspect-video' : 'aspect-[4/3]'
          }`}
          onClick={() => onImageClick(j)}
        >
          <img src={url} alt={`${title} — photo ${j + 1}`} className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
            <ZoomIn size={20} className="text-white drop-shadow-lg" />
          </div>
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

function SectionContent({
  section,
  onImageClick,
}: {
  section: ProjectSection;
  onImageClick: (i: number) => void;
}) {
  const urls = section.imageUrls ?? [];
  const hasPhotos = urls.length > 0;
  const hasBody = !!section.body;
  const layout = section.layout ?? 'text-above';

  if (layout === 'photos-above') {
    return (
      <div className="space-y-6">
        {hasPhotos && <SectionPhotoGrid urls={urls} title={section.title} onImageClick={onImageClick} />}
        {hasBody && <SectionBody body={section.body} />}
      </div>
    );
  }

  if (layout === 'side-by-side') {
    return (
      <div className="flex flex-col md:flex-row gap-8">
        {hasBody && <div className="flex-1 min-w-0"><SectionBody body={section.body} /></div>}
        {hasPhotos && <div className="flex-1 min-w-0"><SectionPhotoGrid urls={urls} title={section.title} onImageClick={onImageClick} /></div>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {hasBody && <SectionBody body={section.body} />}
      {hasPhotos && <SectionPhotoGrid urls={urls} title={section.title} onImageClick={onImageClick} />}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProjectDetail() {
  const [, params] = useRoute('/work/:slug');
  const slug = params?.slug ?? '';

  // Lightbox state: null = closed, otherwise { images, index }
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

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

  const heroImages: string[] = project
    ? (project.imageUrls ?? []).length > 0
      ? (project.imageUrls as string[])
      : project.imageUrl
      ? [project.imageUrl]
      : []
    : [];

  const isCaseStudy = project?.caseStudy ?? false;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-24">
        {/* Back */}
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
          </div>
        ) : error || !project ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-6">This project could not be found.</p>
            <Link href="/work">
              <span className="text-primary hover:underline cursor-pointer">Return to Our Work</span>
            </Link>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Client · Year · Case-study badge */}
            <div className="flex items-center gap-3 flex-wrap mb-3">
              {project.client && (
                <p className="font-mono text-xs text-primary tracking-widest uppercase">
                  {project.client}
                </p>
              )}
              {project.client && (project.year || !isCaseStudy) && (
                <span className="text-border text-xs">·</span>
              )}
              {project.year && (
                <p className="font-mono text-xs text-muted-foreground tracking-widest">{project.year}</p>
              )}
              {project.year && !isCaseStudy && (
                <span className="text-border text-xs">·</span>
              )}
              {!isCaseStudy && (
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground border border-border px-2 py-0.5">
                  Showcase
                </span>
              )}
            </div>

            {/* Title */}
            <h1
              className="font-syne font-bold text-foreground leading-tight mb-4"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)' }}
            >
              {project.title}
            </h1>

            {/* Services */}
            {(project.services ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {(project.services as string[]).map(s => (
                  <span
                    key={s}
                    className="text-[10px] font-mono uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 px-2.5 py-1"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            {/* Tags */}
            {(project.tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {(project.tags ?? []).map(tag => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            )}

            {/* Hero carousel — click to open lightbox */}
            <HeroCarousel
              images={heroImages}
              title={project.title}
              onImageClick={(i) => setLightbox({ images: heroImages, index: i })}
            />

            {/* Short description */}
            <p className="text-lg text-muted-foreground leading-relaxed mb-10 border-l-2 border-primary pl-4">
              {project.description}
            </p>

            {/* Long description — case study only */}
            {isCaseStudy && project.longDescription && (
              <div className="prose prose-neutral dark:prose-invert max-w-none mb-12">
                <ReactMarkdown>{project.longDescription}</ReactMarkdown>
              </div>
            )}

            {/* Sections — case study only */}
            {isCaseStudy && sections.length > 0 && (
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
                    <h2 className="font-syne font-bold text-2xl text-foreground mb-6">{section.title}</h2>
                    <SectionContent
                      section={section}
                      onImageClick={(j) => setLightbox({ images: section.imageUrls ?? [], index: j })}
                    />
                  </motion.section>
                ))}
              </div>
            )}

            {/* Testimonial */}
            {(project.testimonial || (project as Project & { testimonialImageUrl?: string }).testimonialImageUrl) && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="my-14 border-l-2 border-primary pl-6 py-2"
              >
                {(project as Project & { testimonialImageUrl?: string }).testimonialImageUrl ? (
                  <>
                    <img
                      src={(project as Project & { testimonialImageUrl?: string }).testimonialImageUrl}
                      alt="Client testimonial"
                      className="w-full rounded-[var(--radius)] border border-border mb-4 cursor-zoom-in"
                      onClick={() => setLightbox({
                        images: [(project as Project & { testimonialImageUrl?: string }).testimonialImageUrl!],
                        index: 0,
                      })}
                    />
                    {project.testimonialAuthor && (
                      <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                        — {project.testimonialAuthor}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <Quote size={18} className="text-primary/40 mb-3" />
                    <blockquote className="font-syne text-lg text-foreground leading-relaxed italic mb-4">
                      {project.testimonial}
                    </blockquote>
                    {project.testimonialAuthor && (
                      <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                        — {project.testimonialAuthor}
                      </p>
                    )}
                  </>
                )}
              </motion.div>
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

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          alt={project?.title}
          onClose={() => setLightbox(null)}
          onNav={(i) => setLightbox(lb => lb ? { ...lb, index: i } : null)}
        />
      )}
    </Layout>
  );
}
