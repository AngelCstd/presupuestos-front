import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const SRC_ROOT = path.resolve(import.meta.dirname, '../../src');

export function readSourceFile(relativePath: string): string {
  return readFileSync(path.resolve(SRC_ROOT, relativePath), 'utf-8');
}

/** Lista, recursivamente, todos los .ts/.tsx bajo src/, con su ruta relativa a src/. */
export function listSourceFiles(): string[] {
  const results: string[] = [];

  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const fullPath = path.join(dir, entry);
      const stats = statSync(fullPath);
      if (stats.isDirectory()) {
        walk(fullPath);
      } else if (/\.tsx?$/.test(entry)) {
        results.push(path.relative(SRC_ROOT, fullPath));
      }
    }
  }

  walk(SRC_ROOT);
  return results;
}
