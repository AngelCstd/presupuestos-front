import { spawn } from 'child_process';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONT_DIR = path.resolve(__dirname, '..');
const PREVIEW_DIR = '/tmp/preview_inicio';
fs.mkdirSync(path.join(PREVIEW_DIR, 'css'), { recursive: true });

// 1. Copiar CSS compilado
const cssDir = path.join(FRONT_DIR, '.next/static/css');
const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
if (cssFiles.length === 0) {
  throw new Error("No hay CSS compilado en .next/static/css");
}
const latestCss = cssFiles.map(f => ({ name: f, time: fs.statSync(path.join(cssDir, f)).mtimeMs }))
  .sort((a, b) => b.time - a.time)[0].name;

fs.copyFileSync(path.join(cssDir, latestCss), path.join(PREVIEW_DIR, 'css/style.css'));
console.log(`CSS copiado: ${latestCss} -> /tmp/preview_inicio/css/style.css`);

// 2. Generar index.html con tokens y jerarquía tipográfica real
const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="/css/style.css">
  <title>Inicio - Presupuestos</title>
</head>
<body class="bg-background text-foreground antialiased min-h-screen">
  <div class="pb-28">
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
            <span class="font-semibold text-foreground text-right truncate">
              <span>$4,250<span class="text-[0.8em] font-normal opacity-75">.00</span></span>
              <span class="font-normal text-muted"> de </span>
              <span>$10,000<span class="text-[0.8em] font-normal opacity-75">.00</span></span>
            </span>
          </div>
          <div class="h-2 w-full overflow-hidden rounded-full bg-muted-background">
            <div class="h-full rounded-full bg-primary" style="width: 42.5%"></div>
          </div>
        </div>
      </div>

      <!-- Hero Card: Sobres por ajustar (Caso cubrible: Comida tiene $2,500 disp, tono templado de atención) -->
      <div class="flex flex-col gap-3 rounded-xl border border-state-depleted/40 bg-muted-background/60 p-5 shadow-sm min-w-0">
        <div class="flex flex-col gap-1">
          <p class="text-xs font-semibold uppercase tracking-wider text-state-depleted">Sobres por ajustar</p>
          <p class="text-hero font-bold tracking-tight text-foreground">
            <span>$350<span class="text-[0.8em] font-normal opacity-75">.00</span></span>
          </p>
          <p class="text-xs text-muted">1 sobre gastó más de lo asignado.</p>
        </div>
        <div class="flex items-center justify-between gap-2 border-t border-border/60 pt-2 text-xs">
          <span class="text-muted shrink-0">Por asignar: <span>$0<span class="text-[0.8em] font-normal opacity-75">.00</span></span></span>
          <a href="#" class="font-medium text-primary underline shrink-0">Revisar sobres</a>
        </div>
      </div>

      <!-- Categories Summary Block -->
      <div class="flex flex-col gap-3 min-w-0">
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs font-semibold uppercase tracking-wider text-muted shrink-0">Sobres del periodo</p>
          <a href="#" class="text-xs font-medium text-primary underline shrink-0">Repartir</a>
        </div>

        <ul class="flex flex-col gap-2 min-w-0">
          <!-- 1. Sobre en sobregiro (Salidas) -->
          <li class="flex flex-col gap-2 rounded-lg border border-state-overspent/50 bg-muted-background/30 p-3 shadow-sm min-w-0">
            <div class="flex items-center justify-between gap-2 min-w-0">
              <span class="min-w-0 truncate font-medium text-foreground">Salidas</span>
              <div class="flex shrink-0 items-center gap-2">
                <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-state-overspent/15 text-state-overspent">Sobregiro</span>
                <span class="font-medium text-state-overspent">
                  <span>-$350<span class="text-[0.8em] font-normal opacity-75">.00</span></span>
                </span>
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
                <span class="font-medium text-foreground">
                  <span>$2,500<span class="text-[0.8em] font-normal opacity-75">.00</span></span>
                </span>
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
                <span class="font-medium text-foreground">
                  <span>$0<span class="text-[0.8em] font-normal opacity-75">.00</span></span>
                </span>
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
          <p class="text-xs font-semibold uppercase tracking-wider text-muted shrink-0">Cuentas y saldos</p>
          <a href="#" class="text-xs font-medium text-primary underline shrink-0">Ver</a>
        </div>

        <div class="flex flex-col gap-2 min-w-0">
          <div class="flex items-center justify-between gap-2 text-xs">
            <span class="text-muted shrink-0">Efectivo y bancos</span>
            <span class="font-medium text-foreground text-right">
              <span>$5,000<span class="text-[0.8em] font-normal opacity-75">.00</span></span>
            </span>
          </div>
          <div class="flex items-center justify-between gap-2 text-xs">
            <span class="text-muted shrink-0">Tarjetas de crédito</span>
            <span class="font-medium text-foreground text-right">
              <span>$3,800<span class="text-[0.8em] font-normal opacity-75">.00</span></span>
              <span class="text-muted text-xs"> debes</span>
            </span>
          </div>
          <div class="flex items-center justify-between gap-2 text-xs">
            <span class="text-muted shrink-0">Te deben</span>
            <span class="font-medium text-foreground text-right">
              <span>$1,200<span class="text-[0.8em] font-normal opacity-75">.00</span></span>
              <span class="text-muted text-xs"> te deben</span>
            </span>
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
</html>`;

fs.writeFileSync(path.join(PREVIEW_DIR, 'index.html'), htmlContent);

// 3. Servidor HTTP local
const server = http.createServer((req, res) => {
  let reqPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(PREVIEW_DIR, reqPath);
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    const contentType = ext === '.css' ? 'text/css' : ext === '.html' ? 'text/html' : 'text/plain';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(fs.readFileSync(filePath));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const HTTP_PORT = 8992;
await new Promise(r => server.listen(HTTP_PORT, r));

// 4. Iniciar Brave con remote debugging
const CDP_PORT = 9334;
const braveBin = "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";
const browserProc = spawn(braveBin, [
  '--headless',
  '--disable-gpu',
  `--remote-debugging-port=${CDP_PORT}`,
  'about:blank'
]);

try {
  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
      const data = await res.json();
      wsUrl = data.webSocketDebuggerUrl;
      if (wsUrl) break;
    } catch (e) {}
  }

  if (!wsUrl) throw new Error("No se pudo conectar a CDP de Brave");

  const ws = new WebSocket(wsUrl);
  await new Promise(resolve => ws.onopen = resolve);

  let id = 1;
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const reqId = id++;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === reqId) {
          ws.removeEventListener('message', handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: reqId, method, params }));
    });
  }

  const { targetId } = await send('Target.createTarget', { url: `http://127.0.0.1:${HTTP_PORT}/index.html` });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });

  function sendSession(method, params = {}) {
    return new Promise((resolve, reject) => {
      const reqId = id++;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === reqId) {
          ws.removeEventListener('message', handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: reqId, sessionId, method, params }));
    });
  }

  await sendSession('Page.enable');

  const viewports = [
    { name: '360px.png', width: 360, height: 780, mobile: true },
    { name: '390px.png', width: 390, height: 844, mobile: true },
    { name: '768px.png', width: 768, height: 1024, mobile: false },
  ];

  const results = [];
  const outputDir = path.join(FRONT_DIR, 'ux/inicio');

  for (const vp of viewports) {
    // 1. Fijar el viewport real en CDP
    await sendSession('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.mobile
    });

    await sendSession('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/index.html` });
    await new Promise(r => setTimeout(r, 600));

    // 2. Aserción mecánica de desborde horizontal (G8)
    const evalRes = await sendSession('Runtime.evaluate', {
      expression: '({ innerWidth: window.innerWidth, scrollWidth: document.documentElement.scrollWidth, passed: document.documentElement.scrollWidth <= window.innerWidth })',
      returnByValue: true
    });

    const metrics = evalRes.result.value;
    results.push({ ...vp, ...metrics });

    if (!metrics.passed) {
      console.error(`FALLA G8 a ${vp.width}px: innerWidth=${metrics.innerWidth}, scrollWidth=${metrics.scrollWidth}`);
      process.exitCode = 1;
    }

    // 3. Capturar screenshot con el viewport real
    const screenshot = await sendSession('Page.captureScreenshot', { format: 'png' });
    const outPath = path.join(outputDir, vp.name);
    fs.writeFileSync(outPath, Buffer.from(screenshot.data, 'base64'));
    console.log(`[G8] ${vp.name} (${vp.width}x${vp.height}): innerWidth=${metrics.innerWidth}, scrollWidth=${metrics.scrollWidth}, passed=${metrics.passed}`);
  }

  ws.close();
  console.log("\nResultados de verificación mecánica G8:");
  console.table(results.map(r => ({
    Viewport: `${r.width}px`,
    'window.innerWidth': `${r.innerWidth}px`,
    'documentElement.scrollWidth': `${r.scrollWidth}px`,
    'Sin desborde (G8)': r.passed ? '✅ PASA' : '❌ FALLA'
  })));
} finally {
  browserProc.kill();
  server.close();
}
