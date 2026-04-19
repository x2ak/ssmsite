import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          // Variants
          variant === 'default' &&
            'bg-primary text-primary-foreground hover:opacity-90 rounded-[var(--radius)]',
          variant === 'outline' &&
            'border border-border bg-transparent text-foreground hover:bg-muted rounded-[var(--radius)]',
          variant === 'ghost' &&
            'bg-transparent text-foreground hover:bg-muted rounded-[var(--radius)]',
          variant === 'destructive' &&
            'bg-destructive text-destructive-foreground hover:opacity-90 rounded-[var(--radius)]',
          variant === 'link' &&
            'text-primary underline-offset-4 hover:underline p-0 h-auto',
          // Sizes
          size === 'sm' && 'h-8 px-3 text-sm',
          size === 'md' && 'h-10 px-4 text-sm',
          size === 'lg' && 'h-12 px-6 text-base',
          size === 'icon' && 'h-10 w-10',
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
export { Button };
