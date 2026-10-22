/**
 * Construye un query string a partir de un objeto, omitiendo `undefined` y `null`.
 * Usado por los servicios (U11) para las queries documentadas en API-CONTRACT.md.
 */
export function buildQueryString(params: object): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value === undefined || value === null) continue;
    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}
