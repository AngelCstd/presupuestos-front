/**
 * La unidad de mayor riesgo del proyecto (TASK-front.md U3). `Intl.DateTimeFormat`
 * calcula la fecha de calendario correcta en la zona dada — nunca convirtiendo a
 * cadena vía el instante UTC crudo, que manda el día siguiente en cuanto pasan las
 * 18:00 en CDMX (UTC-6). Prohibido en este archivo, con test propio que lo vigila.
 *
 * Ninguna función de este archivo lee la zona horaria del entorno: siempre es un
 * parámetro explícito (API-CONTRACT.md §4.2 — la zona sale de `GET /me`).
 */

export function todayInTimeZone(timeZone: string, now: Date = new Date()): string {
  // 'en-CA' formatea fechas como YYYY-MM-DD de forma nativa — sin construir el string
  // a mano ni pasar por UTC.
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(now);
}

export function formatInstant(iso: string, timeZone: string): string {
  const instant = new Date(iso);
  return new Intl.DateTimeFormat('es-MX', {
    timeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(instant);
}

/**
 * Agregada en U18 (2026-08-17): ya estaba nombrada en el árbol original de
 * ARCHITECTURE-front.md §8 ("dates.ts todayInTimeZone, formatInstant,
 * isDateInClosedPeriod") pero TASK-front.md §6.1 nunca la fijó, así que la sesión de
 * tests no le escribió test. Extraída aquí como función pura para que /capturar/gasto
 * pueda avisar ANTES de guardar si la fecha cae en un periodo cerrado
 * (TASK-front.md U18), en vez de enterrar esa lógica dentro del componente. Sin test
 * propio todavía — pendiente para una sesión de tests, anotado en PROGRESS.md; no lo
 * escribe el implementador.
 */
export function isDateInClosedPeriod(
  date: string,
  periods: readonly { startsOn: string; endsOn: string; status: 'open' | 'closed' }[],
): boolean {
  return periods.some((period) => period.status === 'closed' && date >= period.startsOn && date <= period.endsOn);
}
