import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Project } from '@shared/schema';

interface PortfolioGridProps {
  projects: Project[];
}

const ALL_TAG = 'All';

// Gradient placeholders for projects without images
const GRADIENTS = [
  'from-cyan-500/20 to-blue-600/20',
  'from-violet-500/20 to-purple-600/20',
  'from-emerald-500/20 to-teal-600/20',
  'from-orange-500/20 to-red-600/20',
  'from-pink-500/20 to-rose-600/20',
  'from-amber-500/20 to-yellow-600/20',
];

export function PortfolioGrid({ projects }: PortfolioGridProps) {
  // Collect all unique tags
  const allTags = [
    ALL_TAG,
    ...Array.from(new Set(projects.flatMap(p => p.tags ?? []))).sort(),
  ];

  const [activeTag, setActiveTag] = useState(ALL_TAG);

  const filtered =
    activeTag === ALL_TAG
      ? projects
      : projects.filter(p => p.tags?.includes(activeTag));

  return (
    <div>
      {/* Tag filter pills */}
      {allTags.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-10">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={cn(
                'px-3 py-1.5 text-xs font-mono rounded-[var(--radius)] border transition-all duration-150 cursor-pointer',
                activeTag === tag
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <AnimatePresence mode="popLayout">
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filtered.map((project, i) => (
            <Link key={project.id} href={`/work/${project.slug}`}>
            <motion.article
              layout
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="group rounded-[var(--radius)] border border-border bg-card overflow-hidden hover:border-primary/50 hover:shadow-[0_0_0_1px_var(--primary)] transition-all duration-300 cursor-pointer"
            >
              {/* Image / placeholder */}
              <div className="relative aspect-video overflow-hidden">
                {project.imageUrl ? (
                  <img
                    src={project.imageUrl}
                    alt={`${project.title} — ${project.client ?? 'SSM-LTD project'}`}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div
                    className={cn(
                      'w-full h-full bg-gradient-to-br',
                      GRADIENTS[i % GRADIENTS.length],
                      'flex items-center justify-center'
                    )}
                  >
                    <span className="font-mono text-xs text-muted-foreground tracking-widest uppercase opacity-60">
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
                    className="absolute top-3 right-3 h-7 w-7 flex items-center justify-center rounded-[var(--radius)] bg-background/80 backdrop-blur-sm text-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                    aria-label={`Visit ${project.title}`}
                  >
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                {project.client && (
                  <p className="font-mono text-xs text-muted-foreground mb-1 tracking-wide">
                    {project.client}
                  </p>
                )}
                <h3 className="font-syne font-bold text-lg text-foreground mb-2 leading-tight">
                  {project.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                  {project.description}
                </p>
                {(project.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {(project.tags ?? []).map(tag => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </motion.article>
            </Link>
          ))}
        </motion.div>
      </AnimatePresence>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-16">
          No projects found for this category.
        </p>
      )}
    </div>
  );
}
