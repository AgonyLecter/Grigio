// Crea l'eseguibile Windows (Electron, x64) a partire da dist/web, imposta icona e dati del file, e lo comprime.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { packager } from '@electron/packager';
import * as ResEdit from 'resedit';
import * as PELibrary from 'pe-library';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const r = (...p) => path.join(root, ...p);
const pkg = JSON.parse(fs.readFileSync(r('package.json'), 'utf8'));
if (!fs.existsSync(r('dist/web/index.html'))) throw new Error('Esegui prima: npm run build');
const ev = JSON.parse(fs.readFileSync(r('node_modules/electron/package.json'), 'utf8')).version;

// 1. cartella dell'app
const app = r('build/app');
fs.rmSync(r('build'), { recursive: true, force: true }); fs.mkdirSync(app, { recursive: true });
fs.copyFileSync(r('electron/main.js'), path.join(app, 'main.js'));
fs.copyFileSync(r('assets/icon.ico'), path.join(app, 'icon.ico'));
fs.cpSync(r('dist/web'), path.join(app, 'game'), { recursive: true });
fs.rmSync(path.join(app, 'game/sw.js'));
fs.writeFileSync(path.join(app, 'package.json'), JSON.stringify({ name: 'grigio', productName: 'GRIGIO', version: pkg.version, main: 'main.js', description: 'GRIGIO', author: 'GRIGIO' }, null, 1));

// 2. pacchetto Electron per Windows
const [dir] = await packager({ dir: app, out: r('build'), platform: 'win32', arch: 'x64', electronVersion: ev, name: 'GRIGIO', executableName: 'GRIGIO',
  appVersion: pkg.version, asar: true, overwrite: true, prune: false, quiet: true });
// solo le lingue che servono
for (const f of fs.readdirSync(path.join(dir, 'locales'))) if (!['en-US.pak', 'it.pak'].includes(f)) fs.rmSync(path.join(dir, 'locales', f));

// 3. icona e informazioni di versione dentro GRIGIO.exe
const exePath = path.join(dir, 'GRIGIO.exe');
const exe = PELibrary.NtExecutable.from(fs.readFileSync(exePath), { ignoreCert: true });
const res = PELibrary.NtExecutableResource.from(exe);
const ico = ResEdit.Data.IconFile.from(fs.readFileSync(r('assets/icon.ico')));
const groups = ResEdit.Resource.IconGroupEntry.fromEntries(res.entries);
const gid = groups.length ? groups[0].id : 1, lang = groups.length ? groups[0].lang : 1033;
ResEdit.Resource.IconGroupEntry.replaceIconsForResource(res.entries, gid, lang, ico.icons.map(i => i.data));
const vi = ResEdit.Resource.VersionInfo.fromEntries(res.entries)[0] || ResEdit.Resource.VersionInfo.createEmpty();
const [M, m, p] = pkg.version.split('.').map(Number);
vi.setFileVersion(M, m, p, 0, 1033); vi.setProductVersion(M, m, p, 0, 1033);
vi.setStringValues({ lang: 1033, codepage: 1200 }, { FileDescription: 'GRIGIO', ProductName: 'GRIGIO', CompanyName: 'GRIGIO', InternalName: 'GRIGIO',
  OriginalFilename: 'GRIGIO.exe', LegalCopyright: `© ${new Date().getFullYear()} GRIGIO. All rights reserved.`, FileVersion: pkg.version, ProductVersion: pkg.version });
vi.outputToResourceEntries(res.entries);
res.outputResource(exe);
fs.writeFileSync(exePath, Buffer.from(exe.generate()));

// 4. leggimi e zip
fs.writeFileSync(path.join(dir, 'LEGGIMI - README.txt'), `GRIGIO ${pkg.version}

IT  Avvia GRIGIO.exe. Non serve installare nulla.
    Se Windows mostra "Windows ha protetto il PC": clicca "Ulteriori informazioni" e poi "Esegui comunque".
    F11 = schermo intero. I salvataggi restano su questo computer.

EN  Run GRIGIO.exe. No installation needed.
    If Windows shows "Windows protected your PC": click "More info", then "Run anyway".
    F11 = fullscreen. Saves are stored on this computer.
`.replace(/\n/g, '\r\n'));
const final = r('build/GRIGIO');
fs.renameSync(dir, final);
const zip = r('build/GRIGIO-windows.zip');
execFileSync('zip', ['-r', '-9', '-q', '-X', zip, 'GRIGIO'], { cwd: r('build') });
console.log(`ok — ${zip} (${(fs.statSync(zip).size / 1048576).toFixed(1)} MB), Electron ${ev}`);
