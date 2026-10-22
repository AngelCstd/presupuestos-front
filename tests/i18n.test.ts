import { describe, expect, it } from 'vitest';
import { es } from '@/lib/i18n/es';
import { listSourceFiles, readSourceFile } from './helpers/source-files';

const REAL_ACCOUNT_KINDS = ['cash', 'credit', 'receivable', 'category', 'income_source'] as const;
const ENVELOPE_STATUSES = ['no_budget', 'available', 'depleted', 'overspent'] as const;
const ROLLOVER_TYPES = ['accumulate', 'reset'] as const;
// in_open_period no se traduce: SCREENS-front.md Parte 1 dice explícitamente "(no se
// muestra nada)". Solo estos tres necesitan texto visible.
const VISIBLE_BUDGET_IMPACT_STATUSES = ['no_period', 'compensated', 'uncompensated'] as const;

describe('es — cobertura de traducción', () => {
  it.each(REAL_ACCOUNT_KINDS)('kind "%s" tiene traducción', (kind) => {
    expect(es.kind[kind]).toBeTruthy();
  });

  it.each(ENVELOPE_STATUSES)('status de sobre "%s" tiene traducción', (status) => {
    expect(es.envelopeStatus[status]).toBeTruthy();
  });

  it.each(ROLLOVER_TYPES)('rolloverType "%s" tiene traducción', (rollover) => {
    expect(es.rollover[rollover]).toBeTruthy();
  });

  it.each(VISIBLE_BUDGET_IMPACT_STATUSES)('budgetImpact "%s" tiene traducción', (status) => {
    expect(es.budgetImpact[status]).toBeTruthy();
  });
});

describe('una sola capa de traducción — el glosario solo vive en lib/i18n/es.ts', () => {
  const GLOSSARY_TERMS = [
    'Sobre',
    'Periodo',
    'Por asignar',
    'Disponible',
    'Te deben',
    'Sin presupuesto',
    'Sobregiro',
  ];

  // Positiva y negativa en el MISMO test, en ese orden: si "Sobre" ni siquiera está
  // implementado dentro de es.ts, la comprobación de que no hay fugas no debe poder
  // pasar por su cuenta contra un proyecto vacío (TASK-front.md §5, regla de "ninguna
  // aserción de ausencia sin afirmación positiva antes" — nos mordió en el backend).
  it.each(GLOSSARY_TERMS)('"%s" solo vive dentro de es.ts', (term) => {
    const esSource = readSourceFile('lib/i18n/es.ts');
    expect(esSource).toContain(term);

    const offenders = listSourceFiles()
      .filter((file) => file !== 'lib/i18n/es.ts')
      .filter((file) => readSourceFile(file).includes(term));

    expect(offenders).toEqual([]);
  });
});
