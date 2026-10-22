import { getAccountLedger, listAccounts } from '@/features/accounts/services/accounts';
import { listIncomeSources } from '@/features/accounts/services/income-sources';
import { listCategories } from '@/features/envelopes/services/categories';
import { SUGGESTED_CATEGORIES, SUGGESTED_INCOME_SOURCE } from '@/features/onboarding/suggestions';
import { OnboardingForm } from './OnboardingForm';

/**
 * El onboarding no es una transacción — son 4 llamadas independientes, y cualquiera
 * puede fallar a la mitad (un bug, o simplemente la red del celular). Este Server
 * Component revisa qué ya existe antes de pintar el formulario, para que reintentar
 * nunca intente recrear algo que ya está ahí. Decisión de diseño, documentada en
 * PROGRESS.md como cambio a U15 posterior a su construcción original.
 */
export default async function EmpezarPage() {
  const cashAccounts = await listAccounts({ kind: 'cash' });
  const existingAccount = cashAccounts.data[0] ?? null;

  // La señal de "¿ya se capturó un saldo?" es el ledger, no balanceCents: una cuenta
  // con saldo cero real y una que nunca capturó saldo se ven idénticas por el monto
  // (SCREENS-front.md, /cuentas — la misma distinción, reusada aquí).
  const balanceAlreadyCaptured = existingAccount
    ? (await getAccountLedger(existingAccount.id, { limit: 1 })).data.length > 0
    : false;

  const categories = await listCategories();
  const existingCategoryNames = categories.data
    .map((category) => category.name)
    .filter((name) => SUGGESTED_CATEGORIES.some((suggestion) => suggestion.name === name));

  const incomeSources = await listIncomeSources();
  const incomeSourceExists = incomeSources.data.some((source) => source.name === SUGGESTED_INCOME_SOURCE);

  return (
    <OnboardingForm
      existingAccount={existingAccount}
      balanceAlreadyCaptured={balanceAlreadyCaptured}
      existingCategoryNames={existingCategoryNames}
      incomeSourceExists={incomeSourceExists}
    />
  );
}
