'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { cx } from '@/lib/ui/cx';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Bottom sheet / diálogo modal genérico, sobre `<dialog>` nativo: foco atrapado,
 * cierre con Escape y backdrop-click vienen del navegador, no hay que reimplementarlos.
 */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      aria-labelledby="sheet-title"
      className={cx(
        'w-full max-w-md rounded-t-xl border border-border bg-background p-6 text-foreground',
        'backdrop:bg-foreground/40',
        'sm:rounded-xl',
      )}
    >
      <h2 id="sheet-title" className="mb-4 text-lg font-semibold">
        {title}
      </h2>
      {children}
    </dialog>
  );
}
