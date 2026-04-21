import ReactMarkdown from 'react-markdown';
import type { PostSection } from '@shared/schema';

function parseItems(items: string | null | undefined): string[] {
  if (!items) return [];
  try {
    const parsed = JSON.parse(items);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function TextSection({ section }: { section: PostSection }) {
  return (
    <div>
      {section.title && (
        <h2 className="font-syne font-bold text-xl text-foreground mb-4">{section.title}</h2>
      )}
      <div className="prose max-w-none">
        <ReactMarkdown>{section.body ?? ''}</ReactMarkdown>
      </div>
    </div>
  );
}

function PhotoSection({ section }: { section: PostSection }) {
  if (!section.imageUrl) return null;
  return (
    <figure className="my-2">
      <img
        src={section.imageUrl}
        alt={section.caption ?? section.title ?? ''}
        className="w-full rounded-[var(--radius)] border border-border object-cover"
      />
      {section.caption && (
        <figcaption className="mt-3 text-center font-mono text-xs text-muted-foreground tracking-wide">
          {section.caption}
        </figcaption>
      )}
    </figure>
  );
}

function CalloutSection({ section }: { section: PostSection }) {
  return (
    <blockquote className="border-l-2 border-primary pl-5 py-3 bg-primary/5 rounded-r-[var(--radius)]">
      {section.body && (
        <p className="text-base text-muted-foreground italic leading-relaxed">{section.body}</p>
      )}
      {section.title && (
        <cite className="mt-2 block font-mono text-xs text-primary not-italic">— {section.title}</cite>
      )}
    </blockquote>
  );
}

const ALERT_STYLES: Record<string, { bg: string; border: string; label: string; labelClass: string }> = {
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/15',
    border: 'border-amber-300/50 dark:border-amber-700/40',
    label: '⚠ Warning',
    labelClass: 'text-amber-600 dark:text-amber-400',
  },
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/15',
    border: 'border-emerald-300/50 dark:border-emerald-700/40',
    label: '✓ Status',
    labelClass: 'text-emerald-600 dark:text-emerald-400',
  },
  info: {
    bg: 'bg-primary/5',
    border: 'border-primary/20',
    label: '// Info',
    labelClass: 'text-primary',
  },
};

function AlertSection({ section }: { section: PostSection }) {
  const style = ALERT_STYLES[section.variant ?? 'info'] ?? ALERT_STYLES.info;
  return (
    <div className={`rounded-[var(--radius)] border px-5 py-4 ${style.bg} ${style.border}`}>
      {section.title ? (
        <p className={`font-mono text-[10px] uppercase tracking-widest mb-2 ${style.labelClass}`}>
          {section.title}
        </p>
      ) : (
        <p className={`font-mono text-[10px] uppercase tracking-widest mb-2 ${style.labelClass}`}>
          {style.label}
        </p>
      )}
      {section.body && (
        <p className="text-sm text-foreground leading-relaxed">{section.body}</p>
      )}
    </div>
  );
}

function CardSection({ section }: { section: PostSection }) {
  return (
    <div className="bg-card border border-border rounded-[var(--radius)] p-5">
      {section.title && (
        <p className="font-mono text-[10px] uppercase tracking-widest text-primary mb-3">
          {section.title}
        </p>
      )}
      {section.body && (
        <div className="prose max-w-none text-sm">
          <ReactMarkdown>{section.body}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function TimelineSection({ section }: { section: PostSection }) {
  const items = parseItems(section.items);
  return (
    <div>
      {section.title && (
        <h2 className="font-syne font-bold text-xl text-foreground mb-5">{section.title}</h2>
      )}
      {items.length > 0 && (
        <div className="relative pl-6 border-l border-border space-y-6">
          {items.map((item, i) => (
            <div key={i} className="relative">
              <span className="absolute -left-[1.625rem] top-1 flex h-3 w-3 items-center justify-center">
                <span className="h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
              </span>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-primary mb-1">
                  Stage {String(i + 1).padStart(2, '0')}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">{item}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChecklistSection({ section }: { section: PostSection }) {
  const items = parseItems(section.items);
  return (
    <div>
      {section.title && (
        <h2 className="font-syne font-bold text-xl text-foreground mb-4">{section.title}</h2>
      )}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 bg-card border border-border rounded-[var(--radius)] px-4 py-3"
            >
              <span className="font-mono text-xs text-primary mt-px shrink-0">[✓]</span>
              <span className="text-sm text-foreground leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CtaSection({ section }: { section: PostSection }) {
  let btnLabel = 'Get in touch';
  let btnHref = '/contact';
  if (section.items) {
    try {
      const parsed = JSON.parse(section.items) as { btnLabel?: string; btnHref?: string };
      if (parsed.btnLabel) btnLabel = parsed.btnLabel;
      if (parsed.btnHref) btnHref = parsed.btnHref;
    } catch {
      // ignore
    }
  }
  return (
    <div className="bg-card border border-primary/25 rounded-[var(--radius)] p-8 text-center">
      {section.title && (
        <h3 className="font-syne font-bold text-2xl text-foreground mb-3">{section.title}</h3>
      )}
      {section.body && (
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
          {section.body}
        </p>
      )}
      <a
        href={btnHref}
        className="inline-flex items-center justify-center rounded-[var(--radius)] bg-primary text-primary-foreground font-mono text-xs uppercase tracking-wider px-6 py-3 hover:opacity-85 transition-opacity"
      >
        {btnLabel}
      </a>
    </div>
  );
}

export function PostSectionRenderer({ section }: { section: PostSection }) {
  switch (section.type) {
    case 'text':      return <TextSection section={section} />;
    case 'photo':     return <PhotoSection section={section} />;
    case 'callout':   return <CalloutSection section={section} />;
    case 'alert':     return <AlertSection section={section} />;
    case 'card':      return <CardSection section={section} />;
    case 'timeline':  return <TimelineSection section={section} />;
    case 'checklist': return <ChecklistSection section={section} />;
    case 'cta':       return <CtaSection section={section} />;
    default:          return <TextSection section={section} />;
  }
}
