import Link from 'next/link';
import { es } from '@/lib/i18n/es';

const DESTINATIONS = [
  { href: '/capturar/ingreso', label: es.intent.income },
  { href: '/capturar/transferencia', label: es.intent.transfer },
  { href: '/capturar/prestamo', label: es.intent.loan },
  { href: '/capturar/cobro', label: es.intent.loanRepayment },
  { href: '/capturar/perdida', label: es.intent.loanWriteOff },
] as const;

export default function CapturarOtroPage() {
  return (
    <div className="flex flex-col gap-2 p-4">
      <h1 className="mb-2 text-xl font-semibold text-foreground">Otro movimiento</h1>
      {DESTINATIONS.map((destination) => (
        <Link
          key={destination.href}
          href={destination.href}
          className="rounded-md border border-border p-4 text-foreground hover:bg-muted-background"
        >
          {destination.label}
        </Link>
      ))}
    </div>
  );
}
