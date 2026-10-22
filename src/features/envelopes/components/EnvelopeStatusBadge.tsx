import { es } from '@/lib/i18n/es';
import type { EnvelopeStatus } from '@/types/api';

// Color como texto sobre un tinte muy claro del mismo tono — el patrón verificado
// contra AA al aplicar la paleta (globals.css): un fill sólido con texto encima habría
// exigido un segundo tono por estado solo para el contraste, que no existe todavía.
const STATUS_CLASSES: Record<EnvelopeStatus, string> = {
  no_budget: 'bg-state-no-budget/15 text-state-no-budget',
  available: 'bg-state-available/15 text-state-available',
  depleted: 'bg-state-depleted/15 text-state-depleted',
  overspent: 'bg-state-overspent/15 text-state-overspent',
};

/**
 * No es el `Badge` de `components/ui`: ese es genérico y no conoce los cuatro tonos de
 * sobre. Este sí sabe de dominio a propósito — vive en `features/envelopes/`, no en
 * `components/ui` (ARCHITECTURE-front.md §15: "si un componente ahí menciona 'sobre',
 * está en el lugar equivocado").
 */
export function EnvelopeStatusBadge({ status }: { status: EnvelopeStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {es.envelopeStatus[status]}
    </span>
  );
}
