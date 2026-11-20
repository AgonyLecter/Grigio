// GRIGIO — versione desktop (Windows). Carica il gioco da un protocollo interno app://
const { app, BrowserWindow, Menu, shell, protocol, net } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

const GAME = path.join(__dirname, 'game');
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }]);
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
if (!app.requestSingleInstanceLock()) app.quit();

let win = null;
function create() {
  Menu.setApplicationMenu(null);
  win = new BrowserWindow({
    width: 1600, height: 900, minWidth: 960, minHeight: 540, show: false, backgroundColor: '#0c0c0d',
    title: 'GRIGIO', icon: path.join(__dirname, 'icon.ico'), autoHideMenuBar: true,
    webPreferences: { devTools: false, contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false },
  });
  win.once('ready-to-show', () => { win.maximize(); win.show(); });
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:\/\//.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('app://')) e.preventDefault(); });
  win.webContents.on('before-input-event', (e, i) => {
    if (i.type !== 'keyDown') return;
    if (i.key === 'F11' || (i.alt && i.key === 'Enter')) { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    if (i.key === 'F12' || (i.control && i.shift && /^[ijc]$/i.test(i.key))) e.preventDefault();
  });
  win.loadURL('app://grigio/index.html');
}
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(() => {
  protocol.handle('app', req => {
    let p = decodeURIComponent(new URL(req.url).pathname);
    if (p === '/' || p === '') p = '/index.html';
    const f = path.normalize(path.join(GAME, p));
    if (!f.startsWith(GAME + path.sep)) return new Response('Not found', { status: 404 });
    return net.fetch(pathToFileURL(f).toString());
  });
  create();
});
app.on('window-all-closed', () => app.quit());
