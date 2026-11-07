import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mintToken } from '../../presupuestos/scripts/local-auth-server.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const VIEWPORTS = [
  { name: '360px.png', width: 360, height: 780, mobile: true },
  { name: '390px.png', width: 390, height: 844, mobile: true },
  { name: '768px.png', width: 768, height: 1024, mobile: false },
];

export async function captureRoute(targetUrl, outputRelDir, options = {}) {
  const isExempt = !!options.isExemptFromG10;
  const outputDir = path.resolve(rootDir, outputRelDir);
  fs.mkdirSync(outputDir, { recursive: true });

  const token = mintToken('e68fcf27-7fe4-4944-bb42-0eac5da720a5', 'luis@presupuestos.app');
  const sessionData = {
    access_token: token,
    token_type: 'bearer',
    expires_in: 3600 * 24 * 30,
    expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 30,
    refresh_token: 'fake-refresh-token',
    user: {
      id: 'e68fcf27-7fe4-4944-bb42-0eac5da720a5',
      email: 'luis@presupuestos.app',
      role: 'authenticated',
      aud: 'authenticated',
    },
  };
  const cookieValue = 'base64-' + Buffer.from(JSON.stringify(sessionData)).toString('base64url');

  const CDP_PORT = 9455 + Math.floor(Math.random() * 100);
  const braveBin = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';
  const browserProc = spawn(braveBin, [
    '--headless',
    '--disable-gpu',
    `--remote-debugging-port=${CDP_PORT}`,
    'about:blank',
  ]);

  try {
    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 200));
      try {
        const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
        const data = await res.json();
        wsUrl = data.webSocketDebuggerUrl;
        if (wsUrl) break;
      } catch {}
    }

    if (!wsUrl) throw new Error('No se pudo conectar al CDP de Brave');

    const ws = new WebSocket(wsUrl);
    await new Promise((resolve) => (ws.onopen = resolve));

    let id = 1;
    const pending = new Map();
    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    function send(method, params = {}, sessionId = undefined) {
      return new Promise((resolve, reject) => {
        const reqId = id++;
        pending.set(reqId, { resolve, reject });
        const payload = { id: reqId, method, params };
        if (sessionId) payload.sessionId = sessionId;
        ws.send(JSON.stringify(payload));
      });
    }

    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });

    await send('Network.enable', {}, sessionId);
    await send(
      'Network.setCookie',
      {
        name: 'sb-gshuzkuxvfjfopmlgkdo-auth-token',
        value: cookieValue,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
      },
      sessionId
    );

    const results = [];

    for (const vp of VIEWPORTS) {
      await send(
        'Emulation.setDeviceMetricsOverride',
        {
          width: vp.width,
          height: vp.height,
          deviceScaleFactor: 1,
          mobile: vp.mobile,
        },
        sessionId
      );

      const t0 = performance.now();
      await send('Page.navigate', { url: targetUrl }, sessionId);
      await new Promise((r) => setTimeout(r, 2000));
      if (options.evaluateBeforeCapture) {
        await send(
          'Runtime.evaluate',
          {
            expression: `(${options.evaluateBeforeCapture.toString()})()`,
            awaitPromise: true,
          },
          sessionId
        );
        await new Promise((r) => setTimeout(r, 600));
      }
      const responseTimeMs = Math.round(performance.now() - t0);

      // G8 evaluation
      const g8Res = await send(
        'Runtime.evaluate',
        {
          expression:
            '({ innerWidth: window.innerWidth, scrollWidth: document.documentElement.scrollWidth, passed: document.documentElement.scrollWidth <= window.innerWidth })',
          returnByValue: true,
        },
        sessionId
      );
      const g8 = g8Res.result?.value || { innerWidth: vp.width, scrollWidth: 9999, passed: false };

      // G10 evaluation (auditoría estricta contra barra fija o exención formal)
      const g10EvalCode = ((exempt) => {
        const nav = document.querySelector('nav');
        const fab = nav ? (nav.querySelector('.relative') || nav.querySelector('a[aria-label]')) : null;
        const navTop = nav ? Math.round(nav.getBoundingClientRect().top) : null;
        const fabTop = fab ? Math.round(fab.getBoundingClientRect().top) : null;
        const tabBarTop = (navTop !== null && fabTop !== null) ? Math.min(navTop, fabTop) : navTop;

        if (exempt) {
          const form = document.querySelector('form') || document.querySelector('main') || document.body;
          const visibleFormChildren = Array.from(form.querySelectorAll('*')).filter((el) => {
            const s = window.getComputedStyle(el);
            return s.position !== 'fixed' && s.display !== 'none' && el.offsetHeight > 0 && el.children.length === 0;
          });
          const lastEl = visibleFormChildren[visibleFormChildren.length - 1];
          const lastBottom = lastEl ? Math.round(lastEl.getBoundingClientRect().bottom) : 0;
          return {
            exempt: true,
            lastElementDesc: (lastEl?.tagName || 'FORM') + ' (' + (lastEl?.innerText?.slice(0, 30) || lastEl?.className?.slice(0, 30) || '') + ')',
            lastBottom,
            tabBarTop: null,
            despejePx: null,
            hasScroll: false,
            passedG10: lastBottom > 0,
          };
        }

        if (!nav || tabBarTop === null) {
          return {
            exempt: false,
            lastElementDesc: 'Falta nav/TabBar',
            lastBottom: 0,
            tabBarTop: null,
            despejePx: null,
            hasScroll: false,
            passedG10: false,
          };
        }

        const outerContainer = document.querySelector('.pb-36');
        if (!outerContainer) {
          return {
            exempt: false,
            lastElementDesc: 'No existe contenedor .pb-36',
            lastBottom: 0,
            tabBarTop,
            despejePx: null,
            hasScroll: false,
            passedG10: false,
          };
        }

        const view = Array.from(outerContainer.children).find(
          (c) => c.tagName !== 'NAV' && !c.classList.contains('fixed')
        );
        if (!view) {
          return {
            exempt: false,
            lastElementDesc: 'No existe elemento de vista dentro de .pb-36',
            lastBottom: 0,
            tabBarTop,
            despejePx: null,
            hasScroll: false,
            passedG10: false,
          };
        }

        const visibleChildren = Array.from(view.children).filter((c) => {
          if (c.tagName === 'DIALOG' && !c.open) return false;
          return c.offsetHeight > 0;
        });

        const lastChild = visibleChildren[visibleChildren.length - 1];
        if (!lastChild) {
          return {
            exempt: false,
            lastElementDesc: 'Vista sin hijos visibles',
            lastBottom: 0,
            tabBarTop,
            despejePx: null,
            hasScroll: false,
            passedG10: false,
          };
        }

        // 1. Auditoría en scroll = 0 (vista inicial): no debe colisionar a medias con la barra
        window.scrollTo(0, 0);
        const initRect = lastChild.getBoundingClientRect();
        const initTop = Math.round(initRect.top);
        const initBottom = Math.round(initRect.bottom);
        const initialCollision = initTop < window.innerHeight && initBottom > tabBarTop;

        // 2. Auditoría en scroll al fondo: debe haber despeje completo
        window.scrollTo(0, document.body.scrollHeight);
        const lastBottom = Math.round(lastChild.getBoundingClientRect().bottom);
        const lastElementDesc =
          (lastChild.tagName || 'UNKNOWN') +
          ' (' +
          (lastChild.className?.slice(0, 35) || '') +
          ') -> ' +
          (lastChild.innerText?.slice(0, 30)?.replace(/\n/g, ' ') || '');

        const despejePx = tabBarTop - lastBottom;
        const hasScroll = document.body.scrollHeight > window.innerHeight + 16;
        const passedG10 = lastBottom > 0 && lastBottom <= tabBarTop && !initialCollision;

        return {
          exempt: false,
          lastElementDesc,
          lastBottom,
          tabBarTop,
          despejePx,
          hasScroll,
          initialCollision,
          passedG10,
        };
      }).toString();

      const g10Res = await send(
        'Runtime.evaluate',
        {
          expression: `(${g10EvalCode})(${isExempt})`,
          returnByValue: true,
        },
        sessionId
      );
      const g10 = g10Res.result?.value || {
        exempt: isExempt,
        lastElementDesc: 'Error evaluando en browser',
        lastBottom: 0,
        tabBarTop: null,
        despejePx: null,
        hasScroll: false,
        initialCollision: false,
        passedG10: false,
      };

      // Desplazamiento al inicio para capturar el encabezado de la pantalla
      await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' }, sessionId);
      await new Promise((r) => setTimeout(r, 200));

      // Screenshot capture (vista inicial / scroll top)
      const screenshot = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
      const outPath = path.join(outputDir, vp.name);
      fs.writeFileSync(outPath, Buffer.from(screenshot.data, 'base64'));

      // Si la pantalla tiene scroll, capturar también el tope inferior (-tope.png)
      if (g10.hasScroll) {
        await send('Runtime.evaluate', { expression: 'window.scrollTo(0, document.body.scrollHeight)' }, sessionId);
        await new Promise((r) => setTimeout(r, 200));
        const topeScreenshot = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
        const topeName = vp.name.replace('.png', '-tope.png');
        fs.writeFileSync(path.join(outputDir, topeName), Buffer.from(topeScreenshot.data, 'base64'));
      }

      results.push({
        url: targetUrl,
        viewport: `${vp.width}px`,
        responseTimeMs,
        g8,
        g10,
        screenshotFile: path.join(outputRelDir, vp.name),
      });
    }

    ws.close();
    return results;
  } finally {
    browserProc.kill();
  }
}
