import type { RolloverType } from '@/types/api';

/** API-CONTRACT.md §10.3 — la API no los siembra; se crean según lo que el usuario elija. */
export const SUGGESTED_CATEGORIES: readonly { name: string; rolloverType: RolloverType }[] = [
  { name: 'Comida', rolloverType: 'reset' },
  { name: 'Transporte', rolloverType: 'reset' },
  { name: 'Servicios', rolloverType: 'accumulate' },
  { name: 'Hogar', rolloverType: 'reset' },
  { name: 'Salud', rolloverType: 'accumulate' },
  { name: 'Personal', rolloverType: 'reset' },
  { name: 'Ahorro', rolloverType: 'accumulate' },
];

export const SUGGESTED_INCOME_SOURCE = 'Sueldo';
