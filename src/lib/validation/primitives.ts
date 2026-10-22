import { z } from 'zod';

/**
 * Primitivas Zod compartidas entre los esquemas de cada `features/<dominio>/schemas/` y los
 * Route Handlers del BFF (ARCHITECTURE-front.md §9): mismo archivo de esquema, dos
 * consumidores — en el cliente valida para la experiencia, en el BFF valida de verdad.
 */

// API-CONTRACT.md §4.1: entero de centavos, sin punto decimal, sin separadores.
export const centsString = z.string().regex(/^-?\d{1,19}$/, 'must be a string of integer cents');

// API-CONTRACT.md §4.2: fecha de calendario, no instante.
export const calendarDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must match YYYY-MM-DD');

export const idString = z.uuid();
