'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

import { es } from '@/lib/i18n/es';

/**
 * `supabase.auth.signOut()` + redirige a /login. SCREENS-front.md ya lista "Cerrar
 * sesión" dentro de /mas (U23); esta pieza se adelantó fuera de orden porque sin ella
 * no hay manera de volver a /empezar sin borrar cookies a mano — U23 completo (perfil,
 * zona horaria, fuentes de ingreso, etc.) sigue sin construirse.
 */
export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <Button variant="secondary" loading={loading} onClick={handleSignOut} className="w-full text-danger border-border hover:bg-danger/10">
      {es.masView.signOutAction}
    </Button>
  );
}
