import type { EnvelopeStatus } from '@/types/api';

/**
 * Orden de evaluación fijo (ARCHITECTURE-front.md §8.3) — cada regla se evalúa en
 * este orden exacto, y la primera que aplica gana:
 * 1. !hasBudget → no_budget, sin mirar montos.
 * 2. availableCents < 0 → overspent.
 * 3. availableCents === 0 → depleted.
 * 4. resto → available.
 */
export function deriveEnvelopeStatus(p: {
  assignedCents: string;
  spentCents: string;
  availableCents: string;
  hasBudget: boolean;
}): EnvelopeStatus {
  if (!p.hasBudget) return 'no_budget';

  const available = BigInt(p.availableCents);
  if (available < 0n) return 'overspent';
  if (available === 0n) return 'depleted';
  return 'available';
}

export interface EnvelopeProgress {
  availablePercentage: number;
  overspentPercentage: number;
}

/**
 * Derivación pura del avance visual de un sobre (malla de disponible y déficit).
 * Maneja de forma estricta los casos borde del contrato (API-CONTRACT.md §14, §15):
 * 1. Asignaciones que se cancelan a 0n (hasBudget: true, assignedCents: "0") -> nunca divide por cero ni da NaN.
 * 2. Asignaciones negativas por captura tardía (assignedCents < 0n) -> nunca invierte cocientes.
 */
export function calculateEnvelopeProgress(p: {
  assignedCents: string;
  spentCents: string;
  availableCents: string;
  status: EnvelopeStatus;
}): EnvelopeProgress {
  if (p.status === 'no_budget') {
    return { availablePercentage: 0, overspentPercentage: 0 };
  }

  const assigned = BigInt(p.assignedCents);
  const spent = BigInt(p.spentCents);
  const available = BigInt(p.availableCents);

  if (p.status === 'depleted' || available === 0n) {
    return { availablePercentage: 0, overspentPercentage: 0 };
  }

  if (p.status === 'available' || available > 0n) {
    if (assigned <= 0n) {
      return { availablePercentage: 100, overspentPercentage: 0 };
    }
    const pct = Number((available * 10000n) / assigned) / 100;
    return {
      availablePercentage: Math.min(100, Math.max(0, pct)),
      overspentPercentage: 0,
    };
  }

  // Caso sobregiro (status === 'overspent' o available < 0n)
  const deficit = -available; // positivo

  let overspentPct = 100;
  if (assigned > 0n) {
    overspentPct = Number((deficit * 10000n) / assigned) / 100;
  } else if (spent > 0n) {
    overspentPct = Number((deficit * 10000n) / spent) / 100;
  } else {
    // assigned <= 0 y spent === 0 (ej. captura tardia con assigned negativo igual al deficit)
    overspentPct = 100;
  }

  return {
    availablePercentage: 0,
    overspentPercentage: Math.min(100, Math.max(0, overspentPct)),
  };
}
