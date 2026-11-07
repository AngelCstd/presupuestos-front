'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';

/**
 * U14b (TASK-front.md) — correo + contraseña vía `supabase.auth.signInWithPassword`.
 * Sin registro, sin recuperación de contraseña, sin verificación de correo: se
 * administran desde el dashboard de Supabase, a propósito, fuera de esta app.
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setLoading(false);
      setError(
        authError.code === 'invalid_credentials'
          ? 'Correo o contraseña incorrectos.'
          : 'No se pudo iniciar sesión. Intenta de nuevo.',
      );
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4" noValidate>
      <h1 className="text-xl font-semibold text-foreground">Iniciar sesión</h1>

      <Field label="Correo">
        <Input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>

      <Field label="Contraseña">
        <Input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      <Button type="submit" loading={loading}>
        Entrar
      </Button>

      {process.env.NODE_ENV !== 'production' && (
        <button
          type="button"
          onClick={() => {
            window.location.href = '/api/bff/dev-login';
          }}
          className="text-center rounded-lg border border-border bg-muted-background/40 py-2.5 text-xs font-medium text-foreground hover:bg-muted-background transition-colors"
        >
          Entrar como Luis (Desarrollo local)
        </button>
      )}
    </form>
  );
}
