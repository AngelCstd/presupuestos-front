import type { InputHTMLAttributes } from 'react';
import { cx } from '@/lib/ui/cx';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  bare?: boolean;
}

export function Input({ invalid = false, bare = false, className, ...rest }: InputProps) {
  return (
    <input
      {...rest}
      aria-invalid={invalid || undefined}
      className={
        bare
          ? cx('text-foreground focus:outline-none', className)
          : cx(
              'w-full rounded-md border bg-background px-3 py-2 text-foreground',
              'placeholder:text-muted',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
              'disabled:cursor-not-allowed disabled:opacity-50',
              invalid ? 'border-danger' : 'border-border',
              className,
            )
      }
    />
  );
}
