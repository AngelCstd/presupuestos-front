import type { Metadata } from 'next';
import { OverduePeriodBanner } from '@/components/layout/OverduePeriodBanner';
import { QueryProvider } from '@/providers/QueryProvider';
import { TimezoneProvider } from '@/providers/TimezoneProvider';
import { createClient } from '@/lib/supabase/server';
import { getMe } from '@/features/profile/services/profile';
import './globals.css';

export const metadata: Metadata = {
  title: 'presupuestos-front',
};

// Default antes de iniciar sesión (p.ej. en /login) — ahí no hay a quién preguntarle
// GET /me. En cuanto hay sesión, la zona real la manda el perfil, nunca este valor.
const FALLBACK_TIMEZONE = 'America/Mexico_City';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const timezone = session ? (await getMe()).timezone : FALLBACK_TIMEZONE;

  return (
    <html lang="es">
      <body>
        <QueryProvider>
          <TimezoneProvider timezone={timezone}>
            {session ? <OverduePeriodBanner /> : null}
            {children}
          </TimezoneProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
