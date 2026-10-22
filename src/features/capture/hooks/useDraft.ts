'use client';

import { useCallback, useEffect, useState } from 'react';
import { clearDraft, openDraft, updateDraft, type Draft } from '@/features/capture/stores/draft-store';

/**
 * Envuelve las funciones puras de `draft-store.ts` (U12) sobre `sessionStorage` real
 * — nunca `localStorage` (ARCHITECTURE-front.md §7). El comentario de ese archivo
 * sugiere Zustand + `persist`; esta sesión usa `useState`/`useEffect` en su lugar:
 * ningún formulario necesita que otro componente reaccione al mismo borrador, así que
 * Zustand no añade nada que este hook no resuelva ya, y evita instalar una
 * dependencia nueva sin que el comportamiento tested cambie (`draft-store.test.ts`
 * prueba las funciones puras, no este hook). Documentado como desviación en
 * PROGRESS.md, no una decisión enterrada.
 *
 * La hidratación es solo de cliente a propósito: `sessionStorage` no existe en el
 * servidor, y hacerlo síncrono en el primer render produciría un mismatch de
 * hidratación. `draft` empieza en `null` y se resuelve en el primer efecto — el
 * formulario debe sembrar su propio estado con `initialValues` mientras tanto, y
 * sincronizarse cuando `draft` deje de ser `null` (así es como el 401 + re-login
 * rehidrata valores y llave intactos).
 */
export function useDraft<T>(intent: string, initialValues: T) {
  const [draft, setDraft] = useState<Draft<T> | null>(null);

  useEffect(() => {
    setDraft(openDraft(intent, initialValues, window.sessionStorage));
    // Solo al montar — no se quiere reabrir el borrador cada vez que initialValues
    // cambia de referencia entre renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent]);

  const update = useCallback(
    (values: T) => {
      setDraft(updateDraft(intent, values, window.sessionStorage));
    },
    [intent],
  );

  const clear = useCallback(() => {
    clearDraft(intent, window.sessionStorage);
    setDraft(null);
  }, [intent]);

  return { draft, update, clear };
}
