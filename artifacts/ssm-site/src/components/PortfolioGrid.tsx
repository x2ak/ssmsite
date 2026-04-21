import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import type { Project } from '@shared/schema';

interface PortfolioGridProps {
  projects: Project[];
}

const ALL_TAG = 'All';

// Gradient placeholders for projects without images
const GRADIENTS = [
  'from-cyan-500/10 to-blue-600/10',
  'from-violet-500/10 to-purple-600/10',
  'from-emerald-500/10 to-teal-600/10',
  'from-orange-500/10 to-red-600/10',
  'from-pink-500/10 to-rose-600/10',
  'from-amber-500/10 to-yellow-600/10',
];

function FeaturedCard({ project, gradientIndex }: { project: Project; gradientIndex: number }) {
  return (
    <Link href={`/work/${project.slug}`}>
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="group grid grid-cols-1 lg:grid-cols-5 border border-border bg-card cursor-pointer hover:border-primary/40 transition-colors mb-0"
      >
        {/* Image / GIF */}
        <div className="lg:col-span-3 aspect-[16/9] lg:aspect-auto overflow-hidden bg-muted relative">
          {project.previewVideoUrl ? (
            <img
              src={project.previewVideoUrl}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          ) : project.imageUrl ? (
            <img
              src={project.imageUrl}
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
            />
          ) : (
            <div className={cn('w-full h-full min-h-[280px] bg-gradient-to-br flex items-end p-6', GRADIENTS[gradientIndex % GRADIENTS.length])}>
              <span className="font-mono text-xs text-primary/50 uppercase tracking-widest">
                {(project.tags ?? [])[0] ?? 'Project'}
              </span>
            </div>
          )}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="absolute top-3 right-3 h-7 w-7 flex items-center justify-center bg-background/80 backdrop-blur-sm text-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
              aria-label={`Visit ${project.title}`}
            >
              <ExternalLink size={13} />
            </a>
          )}
        </div>

        {/* Content */}
        <div className="lg:col-span-2 p-7 flex flex-col justify-between border-l border-border">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-5">
              <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-primary">Featured</span>
              {project.client && (
                <>
                  <span className="text-border">·</span>
                  <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground">{project.client}</span>
                </>
              )}
              {project.year && (
                <>
                  <span className="text-border">·</span>
                  <span className="text-[10px] font-mono tracking-[0.1em] text-muted-foreground">{project.year}</span>
                </>
              )}
            </div>
            <h2
              className="font-syne font-bold text-foreground leading-tight mb-4 group-hover:text-primary transition-colors"
              style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)' }}
            >
              {project.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
              {project.description}
            </p>
          </div>
          <div className="mt-6">
            {(project.services ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(project.services as string[]).map(s => (
                  <span key={s} className="text-[10px] font-mono uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 px-2 py-0.5">
                    {s}
                  </span>
                ))}
              </div>
            )}
            {(project.tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(project.tags ?? []).map(tag => (
                  <span key={tag} className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground border border-border px-2 py-0.5">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <span className="inline-flex items-center gap-1.5 text-sm text-primary font-medium group-hover:gap-2.5 transition-all">
              {project.caseStudy ? 'Read case study' : 'View project'}
              <ArrowRight size={14} />
            </span>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

function GridCard({ project, index, gradientIndex }: { project: Project; index: number; gradientIndex: number }) {
  return (
    <Link href={`/work/${project.slug}`}>
      <motion.article
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.35, delay: index * 0.05 }}
        className="group border-t border-border pt-5 cursor-pointer"
      >
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-muted mb-4">
          {project.previewVideoUrl ? (
            <img
              src={project.previewVideoUrl}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          ) : project.imageUrl ? (
            <img
              src={project.imageUrl}
              alt={project.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className={cn('w-full h-full bg-gradient-to-br flex items-center justify-center', GRADIENTS[gradientIndex % GRADIENTS.length])}>
              <span className="font-mono text-xs text-muted-foreground tracking-widest uppercase opacity-50">
                {(project.tags ?? [])[0] ?? 'Project'}
              </span>
            </div>
          )}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="absolute top-2 right-2 h-6 w-6 flex items-center justify-center bg-background/80 backdrop-blur-sm text-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
            >
              <ExternalLink size={11} />
            </a>
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-1.5 flex-wrap mb-1">
          {project.client && (
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {project.client}
            </p>
          )}
          {project.client && project.year && (
            <span className="text-border text-[10px]">·</span>
          )}
          {project.year && (
            <p className="font-mono text-[10px] tracking-[0.1em] text-muted-foreground">{project.year}</p>
          )}
        </div>
        <h3 className="font-syne font-bold text-foreground leading-tight mb-2 group-hover:text-primary transition-colors">
          {project.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3">
          {project.description}
        </p>
        {(project.services ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(project.services as string[]).map(s => (
              <span key={s} className="text-[10px] font-mono uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 px-2 py-0.5">
                {s}
              </span>
            ))}
          </div>
        )}
        {(project.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {(project.tags ?? []).map(tag => (
              <span key={tag} className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground border border-border px-2 py-0.5">
                {tag}
              </span>
            ))}
          </div>
        )}
      </motion.article>
    </Link>
  );
}

export function PortfolioGrid({ projects }: PortfolioGridProps) {
  const allTags = [ALL_TAG, ...Array.from(new Set(projects.flatMap(p => p.tags ?? []))).sort()];
  const [activeTag, setActiveTag] = useState(ALL_TAG);

  const filtered = activeTag === ALL_TAG ? projects : projects.filter(p => p.tags?.includes(activeTag));

  const featured = filtered.filter(p => p.featured);
  const rest = filtered.filter(p => !p.featured);

  // If no featured projects, treat the first as the lead story
  const leadProjects = featured.length > 0 ? featured : (rest.length > 0 ? [rest[0]] : []);
  const gridProjects = featured.length > 0 ? rest : rest.slice(1);

  let globalIdx = 0;

  return (
    <div>
      {/* Filter pills */}
      {allTags.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-10">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={cn(
                'px-3 py-1 text-[10px] font-mono uppercase tracking-wider border transition-all duration-150 cursor-pointer',
                activeTag === tag
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground'
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="popLayout">
        <motion.div layout>
          {/* Featured / lead story */}
          {leadProjects.length > 0 && (
            <>
              {leadProjects.map((project, i) => (
                <FeaturedCard key={project.id} project={project} gradientIndex={i} />
              ))}
            </>
          )}

          {/* Grid — rest of projects */}
          {gridProjects.length > 0 && (
            <>
              <div className="flex items-center gap-4 mt-10 mb-8">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">
                  {activeTag === ALL_TAG ? 'All projects' : activeTag}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
                {gridProjects.map((project, i) => (
                  <GridCard
                    key={project.id}
                    project={project}
                    index={i}
                    gradientIndex={++globalIdx}
                  />
                ))}
              </div>
            </>
          )}

          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-16 font-mono text-sm">
              No projects found for this category.
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
