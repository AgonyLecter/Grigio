// Build di produzione: src/index.html -> dist/web (offuscato, font incorporati, PWA)
// e copia della versione web nella radice del repository (GitHub Pages).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import JavaScriptObfuscator from 'javascript-obfuscator';
import { minify } from 'html-minifier-terser';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const r = (...p) => path.join(root, ...p);
const out = r('dist/web');
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(path.join(out, 'icons'), { recursive: true });

let html = fs.readFileSync(r('src/index.html'), 'utf8');
const src0 = html;
// 1. via gli agganci di sviluppo
html = html.replace(/\/\*@DEV\*\/[\s\S]*?\/\*@\/DEV\*\//g, '');
// 2. separa lo script
const open = '<script type="module">', a = html.indexOf(open), b = html.lastIndexOf('</script>');
let js = html.slice(a + open.length, b);
html = html.slice(0, a) + '<script type="module">__GAME__</script>' + html.slice(b + 9);
// 3. font incorporati al posto di Google Fonts (il gioco funziona anche offline)
const ff = (fam, pkg, w, st) => `@font-face{font-family:'${fam}';font-style:${st};font-weight:${w};font-display:swap;src:url(data:font/woff2;base64,${fs.readFileSync(r('node_modules/@fontsource', pkg, 'files', `${pkg}-latin-${w}-${st}.woff2`)).toString('base64')}) format('woff2')}`;
const fonts = [ff('IBM Plex Mono', 'ibm-plex-mono', 400, 'normal'), ff('IBM Plex Mono', 'ibm-plex-mono', 600, 'normal'),
  ff('IBM Plex Serif', 'ibm-plex-serif', 400, 'normal'), ff('IBM Plex Serif', 'ibm-plex-serif', 600, 'normal'), ff('IBM Plex Serif', 'ibm-plex-serif', 400, 'italic')].join('');
html = html.replace(/<link rel="preconnect"[^>]*>\s*<link href="https:\/\/fonts\.googleapis\.com[^>]*>/, `<style>${fonts}</style>`);
if (html.includes('fonts.googleapis')) throw new Error('link ai font non sostituito');
// variante di sviluppo (solo locale, per gli screenshot): codice leggibile + font incorporati
fs.mkdirSync(r('dist/dev/icons'), { recursive: true });
fs.writeFileSync(r('dist/dev/index.html'), src0.replace(/<link rel="preconnect"[^>]*>\s*<link href="https:\/\/fonts\.googleapis\.com[^>]*>/, `<style>${fonts}</style>`));
// 4. offuscamento
const obf = JavaScriptObfuscator.obfuscate(js, {
  target: 'browser', sourceType: 'module', compact: true, seed: 7,
  renameGlobals: true, identifierNamesGenerator: 'hexadecimal',
  stringArray: true, stringArrayThreshold: 1, stringArrayEncoding: ['base64'], stringArrayRotate: true, stringArrayShuffle: true,
  stringArrayIndexShift: true, stringArrayWrappersCount: 2, stringArrayWrappersType: 'function', stringArrayCallsTransform: true,
  splitStrings: true, splitStringsChunkLength: 16, transformObjectKeys: true,
  controlFlowFlattening: false, deadCodeInjection: false, numbersToExpressions: false, simplify: true,
  selfDefending: true, debugProtection: true, debugProtectionInterval: 2500, disableConsoleOutput: true,
}).getObfuscatedCode().replace(/<\/script/gi, '<\\/script');
// 5. minificazione HTML/CSS
html = await minify(html, { collapseWhitespace: true, removeComments: true, minifyCSS: true, minifyJS: false, removeAttributeQuotes: false });
html = '<!-- GRIGIO (c) Perpetua Assicurazioni S.p.A. Tutti i diritti riservati. All rights reserved. -->\n' + html.replace('__GAME__', () => obf);
fs.writeFileSync(path.join(out, 'index.html'), html);
// 6. icone, manifest, service worker
for (const f of ['icon-32.png', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png']) fs.copyFileSync(r('assets/icons', f), path.join(out, 'icons', f));
fs.writeFileSync(path.join(out, 'manifest.webmanifest'), JSON.stringify({
  name: 'GRIGIO', short_name: 'GRIGIO', description: 'Every day is Monday. / Ogni giorno è lunedì.',
  start_url: './', scope: './', display: 'fullscreen', orientation: 'landscape', background_color: '#0c0c0d', theme_color: '#0c0c0d',
  icons: [{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }],
}, null, 1));
const ver = crypto.createHash('sha1').update(html).digest('hex').slice(0, 10);
fs.writeFileSync(path.join(out, 'sw.js'), `const C='grigio-${ver}',CORE=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const q=e.request;if(q.method!=='GET'||new URL(q.url).origin!==location.origin)return;
e.respondWith(fetch(q).then(s=>{if(s.ok){const c=s.clone();caches.open(C).then(x=>x.put(q,c));}return s;}).catch(()=>caches.match(q).then(m=>m||caches.match('./index.html'))));});
`);
// 7. copia nella radice del repo (sito online)
fs.copyFileSync(path.join(out, 'index.html'), r('index.html'));
fs.copyFileSync(path.join(out, 'manifest.webmanifest'), r('manifest.webmanifest'));
fs.copyFileSync(path.join(out, 'sw.js'), r('sw.js'));
fs.rmSync(r('icons'), { recursive: true, force: true }); fs.cpSync(path.join(out, 'icons'), r('icons'), { recursive: true });
console.log(`build ok — index.html ${(html.length / 1024).toFixed(0)} KB, versione ${ver}`);
