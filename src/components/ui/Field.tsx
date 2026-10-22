import { cloneElement, isValidElement, useId, type ReactElement } from 'react';

export interface FieldProps {
  label: string;
  error?: string | null;
  hint?: string;
  children: ReactElement<{ id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }>;
}

/**
 * Cablea label + error + hint con `aria-describedby`, foco al primer campo inválido
 * (ARCHITECTURE-front.md §9). `components/ui` no sabe nada de dominio — este componente
 * no menciona "sobre" ni "periodo", solo estructura de formulario genérica.
 */
export function Field({ label, error, hint, children }: FieldProps) {
  const inputId = useId();
  const errorId = useId();
  const hintId = useId();

  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  const field = isValidElement(children)
    ? cloneElement(children, {
        id: inputId,
        'aria-describedby': describedBy,
        'aria-invalid': Boolean(error),
      })
    : children;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {field}
      {hint && !error ? (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
