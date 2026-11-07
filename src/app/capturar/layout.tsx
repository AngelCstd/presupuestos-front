/**
 * Full-screen, sin tab bar (ARCHITECTURE-front.md §2) — capturar/ está fuera de
 * (app)/ a propósito: tiene URL real, así que sobrevive a un refresh y el re-login
 * puede volver exactamente ahí.
 */
export default function CapturarLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
