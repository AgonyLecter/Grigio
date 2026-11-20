// Assembla il pacchetto completo per itch.io: build/GRIGIO-itch/ e build/GRIGIO-itch.zip
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const r = (...p) => path.join(root, ...p);
for (const f of ['dist/web/index.html', 'build/GRIGIO-windows.zip']) if (!fs.existsSync(r(f))) throw new Error(`Manca ${f}: esegui prima npm run build e npm run win`);

const out = r('build/GRIGIO-itch'); fs.rmSync(out, { recursive: true, force: true });
const up = path.join(out, '1-CARICA-SU-ITCH'), page = path.join(out, '2-PAGINA'), txt = path.join(out, '3-TESTI');
[up, page, txt].forEach(d => fs.mkdirSync(d, { recursive: true }));

// web zip (senza service worker: dentro itch non serve)
const web = r('build/web'); fs.rmSync(web, { recursive: true, force: true }); fs.cpSync(r('dist/web'), web, { recursive: true }); fs.rmSync(path.join(web, 'sw.js'), { force: true });
fs.rmSync(path.join(up, 'GRIGIO-web.zip'), { force: true });
execFileSync('zip', ['-r', '-9', '-q', '-X', path.join(up, 'GRIGIO-web.zip'), '.'], { cwd: web });
fs.copyFileSync(r('build/GRIGIO-windows.zip'), path.join(up, 'GRIGIO-windows.zip'));

// pagina
fs.cpSync(r('itch/page'), page, { recursive: true });

// testi + descrizione HTML bilingue
const md = s => s.split(/\n{2,}/).map(b => {
  const inl = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
  if (/^---$/.test(b.trim())) return '<hr>';
  if (/^# /.test(b)) return `<h1>${inl(b.slice(2))}</h1>`;
  if (/^### /.test(b)) return b.split('\n').map(l => /^### /.test(l) ? `<h3>${inl(l.slice(4))}</h3>` : (/^- /.test(l) ? `<li>${inl(l.slice(2))}</li>` : `<p>${inl(l)}</p>`)).join('\n').replace(/(<li>[\s\S]*<\/li>)/, '<ul>$1</ul>');
  if (/^- /.test(b)) return `<ul>\n${b.split('\n').map(l => `<li>${inl(l.replace(/^- /, ''))}</li>`).join('\n')}\n</ul>`;
  return `<p>${b.split('\n').map(inl).join('<br>')}</p>`;
}).join('\n');
const en = fs.readFileSync(r('itch/description-en.md'), 'utf8'), it = fs.readFileSync(r('itch/description-it.md'), 'utf8');
fs.writeFileSync(path.join(txt, 'description-itch.html'), `${md(en)}\n<hr>\n<p><strong>🇮🇹 ITALIANO</strong></p>\n${md(it)}\n`);
for (const f of ['description-en.md', 'description-it.md', 'impostazioni-itch.txt']) fs.copyFileSync(r('itch', f), path.join(txt, f));
fs.copyFileSync(r('itch/LEGGIMI.txt'), path.join(out, 'LEGGIMI.txt'));

const zip = r('build/GRIGIO-itch.zip'); fs.rmSync(zip, { force: true });
execFileSync('zip', ['-r', '-q', '-X', '-0', zip, 'GRIGIO-itch'], { cwd: r('build') }); // le zip interne sono già compresse
fs.copyFileSync(path.join(up, 'GRIGIO-web.zip'), r('build/GRIGIO-web.zip'));
console.log(`ok — ${zip} (${(fs.statSync(zip).size / 1048576).toFixed(1)} MB)`);
