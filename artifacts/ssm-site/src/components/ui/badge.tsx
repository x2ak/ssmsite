import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'muted';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[var(--radius)] px-2.5 py-0.5 text-xs font-medium font-mono transition-colors',
        variant === 'default' && 'bg-primary/10 text-primary border border-primary/20',
        variant === 'outline' && 'border border-border text-muted-foreground',
        variant === 'muted' && 'bg-muted text-muted-foreground',
        className
      )}
      {...props}
    />
  );
}
