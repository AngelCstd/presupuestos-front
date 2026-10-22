import type { Config } from 'tailwindcss';

// Paleta y tipografías: pendiente (ARCHITECTURE-front.md §13, §18.1).
// Todo valor visual sale de tokens en variables CSS, nunca de un hex suelto.
// Este archivo solo define los nombres de token y su cableado a Tailwind; los valores
// concretos viven en src/app/globals.css y se llenan cuando se decida la dirección
// visual — cambiar la paleta después es editar un solo archivo, no los componentes.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        muted: 'var(--color-muted)',
        'muted-background': 'var(--color-muted-background)',
        border: 'var(--color-border)',
        primary: 'var(--color-primary)',
        'primary-foreground': 'var(--color-primary-foreground)',
        danger: 'var(--color-danger)',
        'danger-foreground': 'var(--color-danger-foreground)',
        success: 'var(--color-success)',
        'success-foreground': 'var(--color-success-foreground)',
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
