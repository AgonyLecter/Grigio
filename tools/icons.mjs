// Genera l'icona del gioco (PNG di varie misure + .ico per Windows) disegnandola su canvas.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const font = f => 'data:font/woff2;base64,' + fs.readFileSync(path.join(root, 'node_modules/@fontsource/ibm-plex-mono/files', f)).toString('base64');
const html = `<!doctype html><html><head><style>
@font-face{font-family:'Plex';src:url(${font('ibm-plex-mono-latin-600-normal.woff2')});font-weight:600}
body{margin:0;background:transparent}</style></head><body><canvas id="c" width="1024" height="1024"></canvas><script>
async function draw(maskable){
  await document.fonts.load('600 100px Plex');
  const c=document.getElementById('c'),x=c.getContext('2d');x.clearRect(0,0,1024,1024);
  const S=maskable?1:0.92, o=(1024-1024*S)/2; x.save(); x.translate(o,o); x.scale(S,S);
  const r=maskable?0:190; x.beginPath(); x.roundRect(0,0,1024,1024,r); x.clip();
  let g=x.createRadialGradient(512,430,40,512,512,760); g.addColorStop(0,'#2a2a2c'); g.addColorStop(.6,'#121213'); g.addColorStop(1,'#050505'); x.fillStyle=g; x.fillRect(0,0,1024,1024);
  // grana
  for(let i=0;i<9000;i++){x.fillStyle='rgba(255,255,255,'+(Math.random()*.035)+')';x.fillRect(Math.random()*1024,Math.random()*1024,2,2);}
  const k=maskable?.78:1; x.save(); x.translate(512,512); x.scale(k,k); x.translate(-512,-512);
  // G
  x.font='600 640px Plex'; x.textAlign='center'; x.textBaseline='middle';
  x.shadowColor='rgba(255,255,255,.18)'; x.shadowBlur=60; x.fillStyle='#c9c7c1'; x.fillText('G',512,440); x.shadowBlur=0;
  // crepa di luce attraverso la G
  x.save(); x.globalCompositeOperation='source-atop';
  x.restore();
  // prisma: 7 frammenti
  const cols=['#e0473a','#f08a2c','#f2d03b','#5cc46a','#3d8fe0','#6a5fd8','#b45ad6'];
  const w=74,h=118,gap=26,tot=7*w+6*gap,x0=512-tot/2,y0=790;
  cols.forEach((col,i)=>{x.save();x.translate(x0+i*(w+gap)+w/2,y0+h/2);x.transform(1,0,-.25,1,0,0);
    x.shadowColor=col;x.shadowBlur=36;x.fillStyle=col;x.fillRect(-w/2,-h/2,w,h);x.shadowBlur=0;
    x.strokeStyle='rgba(255,255,255,.35)';x.lineWidth=4;x.strokeRect(-w/2,-h/2,w,h);x.restore();});
  x.restore();
  // vignetta
  g=x.createRadialGradient(512,500,300,512,512,760); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,.55)'); x.fillStyle=g; x.fillRect(0,0,1024,1024);
  x.restore();
  return c.toDataURL('image/png');
}
</script></body></html>`;
const b = await chromium.launch(); const p = await b.newPage();
await p.setContent(html);
const out = path.join(root, 'assets');
const big = Buffer.from((await p.evaluate(() => draw(false))).split(',')[1], 'base64');
const mask = Buffer.from((await p.evaluate(() => draw(true))).split(',')[1], 'base64');
fs.writeFileSync(path.join(out, 'icons/icon-1024.png'), big);
fs.writeFileSync(path.join(out, 'icons/icon-maskable-512.png'), await resize(p, mask, 512));
const sizes = [16, 24, 32, 48, 64, 128, 180, 192, 256, 512];
const bufs = {};
for (const s of sizes) { bufs[s] = await resize(p, big, s); fs.writeFileSync(path.join(out, `icons/icon-${s}.png`), bufs[s]); }
// .ico con immagini PNG incorporate (supportato da Windows Vista in poi)
const icoSizes = [16, 24, 32, 48, 64, 128, 256];
const head = Buffer.alloc(6 + 16 * icoSizes.length); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(icoSizes.length, 4);
let off = head.length; const parts = [head];
icoSizes.forEach((s, i) => { const d = bufs[s], e = 6 + i * 16; head.writeUInt8(s >= 256 ? 0 : s, e); head.writeUInt8(s >= 256 ? 0 : s, e + 1); head.writeUInt8(0, e + 2); head.writeUInt8(0, e + 3); head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6); head.writeUInt32LE(d.length, e + 8); head.writeUInt32LE(off, e + 12); off += d.length; parts.push(d); });
fs.writeFileSync(path.join(out, 'icon.ico'), Buffer.concat(parts));
await b.close();
console.log('icone generate in assets/');
async function resize(page, buf, s) {
  const d = await page.evaluate(async ([src, s]) => { const im = new Image(); im.src = src; await im.decode(); let cur = im, w = im.width;
    while (w / 2 >= s) { const c = document.createElement('canvas'); w = Math.round(w / 2); c.width = c.height = w; const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(cur, 0, 0, w, w); cur = c; }
    const c = document.createElement('canvas'); c.width = c.height = s; const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(cur, 0, 0, s, s); return c.toDataURL('image/png'); }, ['data:image/png;base64,' + buf.toString('base64'), s]);
  return Buffer.from(d.split(',')[1], 'base64');
}
