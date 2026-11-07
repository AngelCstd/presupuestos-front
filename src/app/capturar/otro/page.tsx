import Link from 'next/link';
import { es } from '@/lib/i18n/es';

const DESTINATIONS = [
  { href: '/capturar/ingreso', label: es.intent.income, desc: es.intentDesc.income },
  { href: '/capturar/transferencia', label: es.intent.transfer, desc: es.intentDesc.transfer },
  { href: '/capturar/prestamo', label: es.intent.loan, desc: es.intentDesc.loan },
  { href: '/capturar/cobro', label: es.intent.loanRepayment, desc: es.intentDesc.loanRepayment },
  { href: '/capturar/perdida', label: es.intent.loanWriteOff, desc: es.intentDesc.loanWriteOff },
] as const;

export default function CapturarOtroPage() {
  return (
    <div className="flex flex-col gap-3 p-4 pb-36">
      <header className="flex flex-col gap-0.5 mb-1">
        <h1 className="text-2xl font-bold text-foreground">Otro movimiento</h1>
        <p className="text-xs text-muted">Elige el tipo de movimiento que deseas registrar</p>
      </header>

      <div className="flex flex-col gap-2.5">
        {DESTINATIONS.map((destination) => (
          <Link
            key={destination.href}
            href={destination.href}
            className="flex flex-col gap-0.5 rounded-xl border border-border/80 bg-background p-4 text-foreground shadow-sm hover:bg-muted-background/40 hover:border-border transition-colors active:scale-95"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">{destination.label}</span>
              <span aria-hidden="true" className="text-muted text-sm">
                ›
              </span>
            </div>
            <p className="text-xs text-muted">{destination.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
