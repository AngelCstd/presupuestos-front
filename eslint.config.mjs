import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript', 'prettier'),
  {
    ignores: ['.next/**', 'node_modules/**', '.vitest-report.json', 'next-env.d.ts'],
  },
  {
    rules: {
      // Los stubs de la sesión de tests (TASK-front.md: "no implementes nada más allá
      // de lo necesario para que los tests compilen") declaran parámetros que todavía
      // no usan. args: 'none' no relaja variables locales sin usar, solo parámetros —
      // eso sigue señalando código real olvidado durante la implementación real.
      '@typescript-eslint/no-unused-vars': ['warn', { args: 'none' }],
    },
  },
];

export default eslintConfig;
