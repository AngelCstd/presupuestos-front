import Link from 'next/link';

/**
 * Va directo a /capturar/gasto, sin selector intermedio — es el movimiento dominante
 * (ARCHITECTURE-front.md §2, TASK-front.md U14). Las otras 6 intenciones viven en
 * /capturar/otro, a un tap de aquí.
 */
export function Fab() {
  return (
    <Link
      href="/capturar/gasto"
      aria-label="Capturar un gasto"
      className="fixed bottom-20 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl leading-none text-primary-foreground shadow-lg"
    >
      +
    </Link>
  );
}
