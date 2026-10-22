import os
import glob
import shutil
import subprocess
import time
import urllib.request
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading

FRONT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PREVIEW_DIR = '/tmp/preview_inicio'
os.makedirs(os.path.join(PREVIEW_DIR, 'css'), exist_ok=True)

# 1. Encontrar y copiar el CSS compilado más reciente
css_files = glob.glob(os.path.join(FRONT_DIR, '.next/static/css/*.css'))
if not css_files:
    raise RuntimeError("No se encontró CSS compilado en .next/static/css/. Ejecuta pnpm build primero.")

latest_css = max(css_files, key=os.path.getmtime)
target_css = os.path.join(PREVIEW_DIR, 'css/style.css')
shutil.copyfile(latest_css, target_css)
print(f"Copiado CSS: {latest_css} -> {target_css}")

# 2. Construir el HTML fiel a InicioView.tsx y TabBar.tsx con tokens aplicados
html_content = """<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="/css/style.css">
  <title>Inicio - Presupuestos</title>
</head>
<body class="bg-background text-foreground antialiased min-h-screen">
  <div class="pb-24">
    <div class="mx-auto flex w-full max-w-lg flex-col gap-5 p-4 min-w-0">
      
      <!-- Period Header -->
      <div class="flex flex-col gap-3 rounded-xl border border-border bg-muted-background/40 p-4 shadow-sm min-w-0">
        <div class="flex items-center justify-between gap-2 text-xs text-muted min-w-0">
          <span class="shrink-0">2026-08-01 — 2026-08-15</span>
          <span class="font-medium text-foreground truncate">Quedan 4 días</span>
        </div>
        <div class="flex flex-col gap-1.5 min-w-0">
          <div class="flex items-center justify-between gap-2 text-xs min-w-0">
            <span class="text-muted shrink-0">Gastado este periodo</span>
            <span class="font-medium text-foreground text-right truncate">$4,250.00 de $10,000.00</span>
          </div>
          <div class="h-2 w-full overflow-hidden rounded-full bg-muted-background">
            <div class="h-full rounded-full bg-primary" style="width: 42.5%"></div>
          </div>
        </div>
      </div>

      <!-- Hero Card: Situación Sobres por Ajustar -->
      <div class="flex flex-col gap-3 rounded-xl border border-state-overspent/40 bg-muted-background/60 p-5 shadow-sm min-w-0">
        <div class="flex flex-col gap-1">
          <p class="text-xs font-medium text-state-overspent uppercase tracking-wider">Sobres por ajustar</p>
          <p class="text-3xl font-semibold text-state-overspent">$350.00</p>
          <p class="text-xs text-muted">1 sobre gastó más de lo asignado.</p>
        </div>
        <div class="flex items-center justify-between gap-2 border-t border-border/60 pt-2 text-xs">
          <span class="text-muted shrink-0">Por asignar: $0.00</span>
          <a href="#" class="font-medium text-primary underline shrink-0">Revisar sobres</a>
        </div>
      </div>

      <!-- Categories Summary Block -->
      <div class="flex flex-col gap-3 min-w-0">
        <div class="flex items-center justify-between gap-2">
          <p class="text-sm font-semibold text-foreground shrink-0">Sobres del periodo</p>
          <a href="#" class="text-xs font-medium text-primary underline shrink-0">Repartir</a>
        </div>

        <ul class="flex flex-col gap-2 min-w-0">
          <!-- 1. Sobre en sobregiro (Salidas) -->
          <li class="flex flex-col gap-2 rounded-lg border border-state-overspent/50 bg-muted-background/30 p-3 shadow-sm min-w-0">
            <div class="flex items-center justify-between gap-2 min-w-0">
              <span class="min-w-0 truncate font-medium text-foreground">Salidas</span>
              <div class="flex shrink-0 items-center gap-2">
                <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-state-overspent/15 text-state-overspent">Sobregiro</span>
                <span class="font-medium text-state-overspent">-$350.00</span>
                <a href="#" class="rounded bg-state-overspent/10 px-2 py-0.5 text-xs font-medium text-state-overspent underline shrink-0">Cubrir</a>
              </div>
            </div>
            <div class="h-1.5 w-full overflow-hidden rounded-full bg-muted-background">
              <div class="h-full rounded-full bg-state-overspent" style="width: 100%"></div>
            </div>
          </li>

          <!-- 2. Sobre disponible (Comida) -->
          <li class="flex flex-col gap-2 rounded-lg border border-border bg-background p-3 shadow-sm min-w-0">
            <div class="flex items-center justify-between gap-2 min-w-0">
              <span class="min-w-0 truncate font-medium text-foreground">Comida</span>
              <div class="flex shrink-0 items-center gap-2">
                <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-state-available/15 text-state-available">Disponible</span>
                <span class="font-medium text-foreground">$2,500.00</span>
              </div>
            </div>
            <div class="h-1.5 w-full overflow-hidden rounded-full bg-muted-background">
              <div class="h-full rounded-full bg-state-available" style="width: 62.5%"></div>
            </div>
          </li>

          <!-- 3. Sobre agotado (Transporte) -->
          <li class="flex flex-col gap-2 rounded-lg border border-border bg-background p-3 shadow-sm min-w-0">
            <div class="flex items-center justify-between gap-2 min-w-0">
              <span class="min-w-0 truncate font-medium text-foreground">Transporte</span>
              <div class="flex shrink-0 items-center gap-2">
                <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-state-depleted/15 text-state-depleted">Agotado</span>
                <span class="font-medium text-foreground">$0.00</span>
              </div>
            </div>
            <div class="h-1.5 w-full overflow-hidden rounded-full bg-muted-background">
              <div class="h-full rounded-full bg-state-depleted" style="width: 100%"></div>
            </div>
          </li>

          <!-- 4. Sobres sin presupuesto (colapsado) -->
          <li class="pt-1">
            <button type="button" class="w-full text-left text-xs text-muted underline">
              2 sobres sin presupuesto este periodo
            </button>
          </li>
        </ul>
      </div>

      <!-- Accounts Block -->
      <div class="flex flex-col gap-3 rounded-xl border border-border bg-muted-background/30 p-4 shadow-sm min-w-0">
        <div class="flex items-center justify-between gap-2">
          <p class="text-sm font-semibold text-foreground shrink-0">Cuentas y saldos</p>
          <a href="#" class="text-xs font-medium text-primary underline shrink-0">Ver</a>
        </div>

        <div class="flex flex-col gap-2 min-w-0">
          <div class="flex items-center justify-between gap-2 text-xs">
            <span class="text-muted shrink-0">Efectivo y bancos</span>
            <span class="font-medium text-foreground text-right">$5,000.00</span>
          </div>
          <div class="flex items-center justify-between gap-2 text-xs">
            <span class="text-muted shrink-0">Tarjetas de crédito</span>
            <span class="font-medium text-foreground text-right">$3,800.00 debes</span>
          </div>
          <div class="flex items-center justify-between gap-2 text-xs">
            <span class="text-muted shrink-0">Te deben</span>
            <span class="font-medium text-foreground text-right">$1,200.00 te deben</span>
          </div>
        </div>
      </div>

    </div>

    <!-- Floating Action Button (FAB) -->
    <div class="fixed bottom-16 right-4 z-20">
      <a href="#" class="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 active:scale-95" aria-label="Capturar gasto">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </a>
    </div>

    <!-- TabBar (fiel a TabBar.tsx con tokens) -->
    <nav aria-label="Navegación principal" class="fixed inset-x-0 bottom-0 z-20 flex w-full border-t border-border bg-background/95 backdrop-blur-sm shadow-md">
      <a href="#" aria-current="page" class="flex flex-1 flex-col items-center justify-center py-2.5 px-1 text-xs min-w-0 transition-colors text-primary font-medium">
        <span class="truncate">Inicio</span>
      </a>
      <a href="#" class="flex flex-1 flex-col items-center justify-center py-2.5 px-1 text-xs min-w-0 transition-colors text-muted hover:text-foreground">
        <span class="truncate">Sobres</span>
      </a>
      <a href="#" class="flex flex-1 flex-col items-center justify-center py-2.5 px-1 text-xs min-w-0 transition-colors text-muted hover:text-foreground">
        <span class="truncate">Movimientos</span>
      </a>
      <a href="#" class="flex flex-1 flex-col items-center justify-center py-2.5 px-1 text-xs min-w-0 transition-colors text-muted hover:text-foreground">
        <span class="truncate">Más</span>
      </a>
    </nav>
  </div>
</body>
</html>
"""

html_path = os.path.join(PREVIEW_DIR, 'index.html')
with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html_content)

print(f"HTML generado en {html_path}")

# 3. Servir en puerto local efímero y capturar con Brave
class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PREVIEW_DIR, **kwargs)
    def log_message(self, format, *args):
        pass

PORT = 8991
server = HTTPServer(('127.0.0.1', PORT), Handler)
t = threading.Thread(target=server.serve_forever)
t.daemon = True
t.start()
print(f"Servidor HTTP corriendo en http://127.0.0.1:{PORT}")

output_dir = os.path.join(FRONT_DIR, 'ux/inicio')
os.makedirs(output_dir, exist_ok=True)

viewports = [
    ('360px.png', 360, 780),
    ('390px.png', 390, 844),
    ('768px.png', 768, 1024),
]

brave_bin = "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
if not os.path.exists(brave_bin):
    raise RuntimeError(f"No se encontró Brave Browser en {brave_bin}")

for filename, w, h in viewports:
    out_path = os.path.join(output_dir, filename)
    cmd = [
        brave_bin,
        '--headless',
        '--disable-gpu',
        '--hide-scrollbars',
        f'--window-size={w},{h}',
        f'--screenshot={out_path}',
        f'http://127.0.0.1:{PORT}/index.html'
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    size_kb = os.path.getsize(out_path) / 1024
    print(f"Capturado {filename} ({w}x{h}): {size_kb:.1f} KB -> {out_path}")

server.shutdown()
print("Todas las capturas se generaron correctamente.")
