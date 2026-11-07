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
      onClick={(e) => {
        if (e.target === ref.current) {
          onClose();
        }
      }}
      aria-labelledby="sheet-title"
      className={cx(
        'w-full max-w-md rounded-t-xl border border-border bg-background p-6 text-foreground shadow-xl',
        'backdrop:bg-foreground/40 backdrop:backdrop-blur-sm',
        'sm:rounded-xl',
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 id="sheet-title" className="text-lg font-semibold text-foreground">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-muted transition-colors hover:bg-muted-background hover:text-foreground focus:outline-none"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>
      {children}
    </dialog>
  );
}
