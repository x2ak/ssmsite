import { useRoute, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import type { Project, ProjectSection } from '@shared/schema';

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

            {/* Hero image */}
            {project.imageUrl && (
              <div className="w-full aspect-video rounded-[var(--radius)] overflow-hidden mb-10 border border-border">
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

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
                    <h2 className="font-syne font-bold text-2xl text-foreground mb-6">{section.title}</h2>

                    {/* Photos */}
                    {(section.imageUrls ?? []).length > 0 && (
                      <div className={`grid gap-4 mb-8 ${
                        section.imageUrls!.length === 1
                          ? 'grid-cols-1'
                          : section.imageUrls!.length === 2
                          ? 'grid-cols-2'
                          : 'grid-cols-2 lg:grid-cols-3'
                      }`}>
                        {section.imageUrls!.map((url, j) => (
                          <div
                            key={j}
                            className={`rounded-[var(--radius)] overflow-hidden border border-border ${
                              section.imageUrls!.length === 1 ? 'aspect-video' : 'aspect-[4/3]'
                            }`}
                          >
                            <img
                              src={url}
                              alt={`${section.title} — photo ${j + 1}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Body */}
                    {section.body && (
                      <div className="prose prose-neutral dark:prose-invert max-w-none">
                        <ReactMarkdown>{section.body}</ReactMarkdown>
                      </div>
                    )}
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
