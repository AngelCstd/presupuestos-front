import { describe, it, expect } from 'vitest';
import { calculateEnvelopeProgress } from '@/lib/domain/envelopes';

describe('calculateEnvelopeProgress — derivación pura del avance visual del sobre (API-CONTRACT.md §14, §15)', () => {
  it('calcula el disponible restante de un sobre activo proporcional al asignado', () => {
    const res = calculateEnvelopeProgress({
      assignedCents: '400000', // $4,000.00
      spentCents: '150000',    // $1,500.00
      availableCents: '250000',// $2,500.00
      status: 'available',
    });
    expect(res.availablePercentage).toBe(62.5);
    expect(res.overspentPercentage).toBe(0);
  });

  it('un sobre completamente intacto marca 100% disponible', () => {
    const res = calculateEnvelopeProgress({
      assignedCents: '100000',
      spentCents: '0',
      availableCents: '100000',
      status: 'available',
    });
    expect(res.availablePercentage).toBe(100);
    expect(res.overspentPercentage).toBe(0);
  });

  it('un sobre agotado marca 0% disponible y 0% sobregiro', () => {
    const res = calculateEnvelopeProgress({
      assignedCents: '200000',
      spentCents: '200000',
      availableCents: '0',
      status: 'depleted',
    });
    expect(res.availablePercentage).toBe(0);
    expect(res.overspentPercentage).toBe(0);
  });

  it('un sobre sin presupuesto marca 0% disponible y 0% sobregiro', () => {
    const res = calculateEnvelopeProgress({
      assignedCents: '0',
      spentCents: '0',
      availableCents: '0',
      status: 'no_budget',
    });
    expect(res.availablePercentage).toBe(0);
    expect(res.overspentPercentage).toBe(0);
  });

  it('un sobre con sobregiro y asignado positivo marca 0% disponible y porcentaje de déficit', () => {
    const res = calculateEnvelopeProgress({
      assignedCents: '100000', // $1,000.00
      spentCents: '150000',    // $1,500.00
      availableCents: '-50000',// -$500.00 (déficit del 50%)
      status: 'overspent',
    });
    expect(res.availablePercentage).toBe(0);
    expect(res.overspentPercentage).toBe(50);
  });

  // CASO DE CONTRATO 1: Asignaciones canceladas dan assignedCents: "0" con gasto
  it('caso de contrato 1: asignaciones canceladas (assignedCents: "0") no lanza NaN ni división por cero', () => {
    const res = calculateEnvelopeProgress({
      assignedCents: '0',      // Asignaciones sumaron 0
      spentCents: '30000',     // $300.00 gastados
      availableCents: '-30000',// -$300.00 de déficit
      status: 'overspent',
    });
    expect(Number.isNaN(res.availablePercentage)).toBe(false);
    expect(Number.isNaN(res.overspentPercentage)).toBe(false);
    expect(res.availablePercentage).toBe(0);
    expect(res.overspentPercentage).toBe(100);
  });

  // CASO DE CONTRATO 2: Ajuste de captura tardía da assignedCents negativo
  it('caso de contrato 2: captura tardía con assignedCents negativo no invierte el cociente', () => {
    const res = calculateEnvelopeProgress({
      assignedCents: '-50000', // -$500.00 de asignación por compensación de periodo cerrado
      spentCents: '0',         // $0 gastados en este periodo
      availableCents: '-50000',// -$500.00 disponible
      status: 'overspent',
    });
    expect(Number.isNaN(res.availablePercentage)).toBe(false);
    expect(Number.isNaN(res.overspentPercentage)).toBe(false);
    expect(res.availablePercentage).toBe(0);
    expect(res.overspentPercentage).toBe(100);
  });
});
