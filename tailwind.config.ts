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
      fontSize: {
        '2xs': 'var(--font-size-2xs)',
        xs: 'var(--font-size-xs)',
        sm: 'var(--font-size-sm)',
        base: 'var(--font-size-base)',
        lg: 'var(--font-size-lg)',
        xl: 'var(--font-size-xl)',
        '2xl': 'var(--font-size-2xl)',
        '3xl': 'var(--font-size-3xl)',
        '4xl': 'var(--font-size-4xl)',
        hero: 'var(--font-size-hero)',
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      spacing: {
        '0.5': 'var(--spacing-0-5)',
        '1': 'var(--spacing-1)',
        '1.5': 'var(--spacing-1-5)',
        '2': 'var(--spacing-2)',
        '2.5': 'var(--spacing-2-5)',
        '3': 'var(--spacing-3)',
        '4': 'var(--spacing-4)',
        '5': 'var(--spacing-5)',
        '6': 'var(--spacing-6)',
        '8': 'var(--spacing-8)',
        '10': 'var(--spacing-10)',
        '12': 'var(--spacing-12)',
        '16': 'var(--spacing-16)',
        '20': 'var(--spacing-20)',
      },
    },
  },
  plugins: [],
};

export default config;
