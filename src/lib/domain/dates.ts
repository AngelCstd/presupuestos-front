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
