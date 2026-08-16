import type { Config } from 'tailwindcss';

// Paleta y tipografías: pendiente (ARCHITECTURE-front.md §13, §18.1).
// Todo valor visual sale de tokens en variables CSS, nunca de un hex suelto.
// Este archivo solo define los nombres de token; los valores concretos
// se llenan cuando se decida la dirección visual.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'state-no-budget': 'var(--state-no-budget)',
        'state-available': 'var(--state-available)',
        'state-depleted': 'var(--state-depleted)',
        'state-overspent': 'var(--state-overspent)',
      },
    },
  },
  plugins: [],
};

export default config;
