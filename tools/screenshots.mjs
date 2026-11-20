// Screenshot di gioco (IT/EN), copertina e banner per la pagina itch.io.
// Richiede: npm run build (usa dist/dev, la variante leggibile con i font incorporati).
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const r = (...p) => path.join(root, ...p);
const outDir = r('itch/page');

const srv = http.createServer((q, s) => { const f = r('dist/dev', decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
  fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); } else { s.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); s.end(d); } }); });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const URL0 = `http://127.0.0.1:${srv.address().port}/index.html`;

// ogni scena: stato del gioco + battuta mostrata
const SHOTS = [
  ['01-title', null],
  ['02-dawn', { scene: 'bedroom', time: '06:48', gray: 20, day: 3, colors: { arancio: 1 }, f: { tapOpen: 1 }, say: [null, 'Resti a guardarla un minuto intero. Arriverà il tram, arriverà il lavoro. Ma questo minuto è tuo.'] }],
  ['03-office', { scene: 'office', opts: { clockH: 9, martaSmile: true }, time: '09:40', gray: 32, day: 3, colors: { arancio: 1, verde: 1 }, f: { marta: 1, water: 2 }, say: ['MARTA', 'Sai che dipingevo? Acquerelli. Avevo fatto una mostra, una volta, in una libreria. Sei persone. Mia madre ha pianto.', '#b8a9c9'] }],
  ['04-claim', { scene: 'office', opts: { clockH: 9 }, time: '09:20', gray: 48, day: 3, colors: {}, claim: true }],
  ['05-mirror', { scene: 'bathroom', time: '06:52', gray: 88, day: 8, colors: {}, say: [null, "Nel vetro c'è una testa. Non ha occhi. Non ha bocca."] }],
  ['06-tram', { scene: 'tram', opts: { stopped: true, lakeView: true }, time: '07:31', gray: 30, day: 4, colors: { arancio: 1, giallo: 1 }, say: [null, 'Lungolago. Le porte si aprono. Il lago è lì, dietro gli alberi. Ti aspetta senza aspettarti.'], choices: ['Resta seduto.', 'Scendi.'] }],
  ['07-lake', { scene: 'lake', hud: false, time: '08:04', gray: 15, day: 4, colors: { arancio: 1, giallo: 1, blu: 1 }, say: [null, 'Resti lì. Dieci minuti. Venti. Un uccello si posa vicino a te e non ha paura.'] }],
  ['08-meeting', { scene: 'meeting', opts: { turn: true }, time: '11:30', gray: 62, day: 6, colors: { arancio: 1, giallo: 1, verde: 1 }, say: [null, 'Alzi la mano. Sei teste si girano verso di te. Tutte insieme. Nello stesso istante.'] }],
  ['09-kitchen', { scene: 'kitchen', opts: { gSmile: true }, time: '10:31', gray: 35, day: 5, colors: { giallo: 1, arancio: 1 }, say: ['GIANNI', 'Sai che facevo il cuoco? A Rimini, d\'estate. Mi alzavo alle cinque e cantavo. Cantavo, {N}.', '#c9c09a'] }],
  ['10-stairs', { scene: 'stairs', opts: { marta: true, land: { marks: [null, '#5cc46a'] } }, time: '??:??', gray: 40, day: 7, colors: { arancio: 1, giallo: 1, verde: 1, blu: 1, indaco: 1 }, choices: ['La porta a sinistra.', 'La porta a destra.', 'Torna su. Torna alla scrivania.'], prompt: "Su una delle due porte c'è un segno. Il tuo colore." }],
  ['11-outside', { scene: 'outside', opts: { together: true, t0: -6 }, hud: false, time: '', gray: 0, day: 7, colors: { rosso: 1, arancio: 1, giallo: 1, verde: 1, blu: 1, indaco: 1 }, say: ['MARTA', 'Guarda il cielo. Ha... dei colori. Dei colori veri.', '#b8a9c9'] }],
];

const b = await chromium.launch();
for (const lang of ['en', 'it']) {
  const dir = path.join(outDir, 'screenshots', lang); fs.mkdirSync(dir, { recursive: true });
  for (const [name, st] of SHOTS) {
    const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
    await p.addInitScript(l => localStorage.setItem('grigio_lang', l), lang);
    await p.goto(URL0); await p.waitForTimeout(1600);
    if (st) await p.evaluate(async st => {
      const G = window.__G, S = G.S();
      document.getElementById('title').classList.add('hide'); document.getElementById('black').style.opacity = 0;
      Object.assign(S, { gray: st.gray, day: st.day, colors: st.colors, f: Object.assign({}, st.f || {}) });
      G.setScene(st.scene, st.opts || {}); G.bgCache.clear(); G.applyFilter(); G.updateHUD(); G.setTime(st.time); G.hud(st.hud !== false);
      if (st.claim) {
        const p = { form: { nm: S.name + ' FERRI', pl: '— — —', pol: 'VITA-0001', d: G.LANG() === 'en' ? 'for years' : 'da anni', sig: true }, arch: { nm: S.name + ' FERRI', pl: '—', pol: 'VITA-0001', scad: '—' } };
        G.renderPratica(p, G.T("Descrizione del danno: «Non ricordo l'ultima volta che ho riso. Non ricordo la voce di mia sorella. Ogni mattina mi alzo e qualcuno usa il mio corpo per venire qui.»"));
        document.getElementById('pCount').textContent = (G.LANG() === 'en' ? 'CLAIM' : 'PRATICA') + ' 3/4';
        document.getElementById('prat').classList.remove('hide');
      }
      if (st.say) G.say(st.say[0], st.say[1], { col: st.say[2], speed: 1, raw: true });
      if (st.choices) { await new Promise(r => setTimeout(r, 300)); G.choose(st.choices.map((t, i) => ({ t, v: i, nw: i === 1 && st.choices.length === 2, rt: /Torna|Resta/.test(t) })), st.prompt); }
    }, st);
    await p.waitForTimeout(st ? 1700 : 600);
    await p.screenshot({ path: path.join(dir, name + '.jpg'), type: 'jpeg', quality: 90 });
    
    await p.close();
  }
}

// copertina 630x500 (+ @2x) e banner 960x300
const bg = 'data:image/jpeg;base64,' + fs.readFileSync(r('itch/page/screenshots/en/02-dawn.jpg')).toString('base64');
const bg2 = 'data:image/jpeg;base64,' + fs.readFileSync(r('itch/page/screenshots/en/05-mirror.jpg')).toString('base64');
const fontB64 = f => 'data:font/woff2;base64,' + fs.readFileSync(r('node_modules/@fontsource', f.split('/')[0], 'files', f.split('/')[1])).toString('base64');
const art = (w, h, kind) => `<!doctype html><html><head><style>
@font-face{font-family:M;src:url(${fontB64('ibm-plex-mono/ibm-plex-mono-latin-600-normal.woff2')});font-weight:600}
@font-face{font-family:Si;src:url(${fontB64('ibm-plex-serif/ibm-plex-serif-latin-400-italic.woff2')});font-style:italic}
@font-face{font-family:Mr;src:url(${fontB64('ibm-plex-mono/ibm-plex-mono-latin-400-normal.woff2')})}
*{margin:0;box-sizing:border-box}body{width:${w}px;height:${h}px;overflow:hidden;background:#000;position:relative;color:#d9d7d2}
.bg{position:absolute;inset:0;background:url(${kind === 'cover' ? bg2 : bg}) center/cover;filter:grayscale(${kind === 'cover' ? .55 : .25}) contrast(1.15) brightness(.8)}
.bg.r{left:${kind === 'cover' ? '0' : '48%'};background-position:${kind === 'cover' ? '50% 30%' : '70% 50%'};}
.sh{position:absolute;inset:0;background:${kind === 'cover' ? 'radial-gradient(ellipse at 50% 40%,rgba(0,0,0,.15),rgba(0,0,0,.85) 75%),linear-gradient(transparent 45%,rgba(0,0,0,.9))' : 'linear-gradient(90deg,#060606 46%,rgba(6,6,6,.6) 62%,rgba(0,0,0,.2))'}}
.t{position:absolute;${kind === 'cover' ? `left:0;right:0;bottom:${h * .2}px;text-align:center` : `left:${w * .05}px;top:50%;transform:translateY(-55%)`}}
h1{font:600 ${kind === 'cover' ? w * .135 : h * .3}px/1 M;letter-spacing:.3em;margin-right:-.3em;color:#cfcdc8;text-shadow:0 0 ${w * .04}px rgba(255,255,255,.15)}
p{font:italic ${kind === 'cover' ? w * .036 : h * .085}px Si;color:#a9a7a2;margin-top:${h * .025}px}
.c{font:${kind === 'cover' ? w * .017 : h * .045}px Mr;letter-spacing:.25em;color:#77756f;margin-top:${h * .02}px;text-transform:uppercase}
.pr{display:flex;gap:${w * .008}px;${kind === 'cover' ? 'justify-content:center;' : ''}margin-top:${h * .045}px}
.pr i{display:block;width:${kind === 'cover' ? w * .022 : h * .045}px;height:${kind === 'cover' ? w * .038 : h * .08}px;transform:skewX(-14deg);border:1px solid rgba(255,255,255,.3)}
.g{position:absolute;inset:0;opacity:.09;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.9'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")}
</style></head><body><div class="bg r"></div><div class="sh"></div><div class="g"></div><div class="t"><h1>GRIGIO</h1><p>Every day is Monday.</p>
<div class="c">a psychological horror about routine</div>
<div class="pr">${['#e0473a', '#f08a2c', '#f2d03b', '#5cc46a', '#3d8fe0', '#6a5fd8', '#b45ad6'].map((c, i) => `<i style="background:${i < 3 ? c : 'rgba(255,255,255,.04)'};box-shadow:${i < 3 ? `0 0 12px ${c}` : 'none'};border-color:${i < 3 ? c : ''}"></i>`).join('')}</div></div></body></html>`;
for (const [file, w, h, kind, scale] of [['cover.png', 630, 500, 'cover', 1], ['cover@2x.png', 630, 500, 'cover', 2], ['banner.png', 960, 300, 'banner', 2]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
  await p.setContent(art(w, h, kind)); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(outDir, file) }); await p.close();
}
fs.copyFileSync(r('assets/icons/icon-512.png'), path.join(outDir, 'icon.png'));
await b.close(); srv.close();
console.log('screenshot, copertina e banner in itch/page/');
