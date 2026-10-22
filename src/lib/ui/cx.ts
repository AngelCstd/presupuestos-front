/** Concatena clases condicionalmente, sin agregar una dependencia nueva para esto. */
export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
