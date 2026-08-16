import { describe, expect, it } from 'vitest';
import { deriveEnvelopeStatus } from '@/lib/domain/envelopes';

describe('deriveEnvelopeStatus', () => {
  it('hasBudget: false gana antes que cualquier monto — no_budget', () => {
    expect(
      deriveEnvelopeStatus({
        assignedCents: '999999',
        spentCents: '0',
        availableCents: '999999',
        hasBudget: false,
      }),
    ).toBe('no_budget');
  });

  it('assigned "0", hasBudget: true, available "0" → depleted, no no_budget', () => {
    expect(
      deriveEnvelopeStatus({
        assignedCents: '0',
        spentCents: '0',
        availableCents: '0',
        hasBudget: true,
      }),
    ).toBe('depleted');
  });

  it('available negativo con hasBudget: true → overspent', () => {
    expect(
      deriveEnvelopeStatus({
        assignedCents: '20000',
        spentCents: '50000',
        availableCents: '-30000',
        hasBudget: true,
      }),
    ).toBe('overspent');
  });

  it('overspent con spentCents "0" — el caso de captura tardía del §11.12, y es correcto', () => {
    expect(
      deriveEnvelopeStatus({
        assignedCents: '-30000',
        spentCents: '0',
        availableCents: '-30000',
        hasBudget: true,
      }),
    ).toBe('overspent');
  });

  it('available positivo con hasBudget: true → available', () => {
    expect(
      deriveEnvelopeStatus({
        assignedCents: '200000',
        spentCents: '50000',
        availableCents: '150000',
        hasBudget: true,
      }),
    ).toBe('available');
  });
});
