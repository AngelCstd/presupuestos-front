import type { InputHTMLAttributes, ReactNode } from 'react';
import { useId } from 'react';
import { cx } from '@/lib/ui/cx';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
}

export function Checkbox({ label, className, id, ...rest }: CheckboxProps) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;

  return (
    <label htmlFor={checkboxId} className={cx('flex items-center gap-2 text-sm text-foreground', className)}>
      <input
        {...rest}
        id={checkboxId}
        type="checkbox"
        className="h-4 w-4 rounded border-border text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      />
      {label}
    </label>
  );
}
