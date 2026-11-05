// Fab Library — офлайн-каталог библиотеки Fab, Quixel и вишлиста.
// Данные каждого аккаунта хранятся отдельно: %APPDATA%/Fab Library/profiles/<epicId>/
const { app, BrowserWindow, ipcMain, session, protocol, net, shell, dialog, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const sync = require('./sync');
const I18N = require('./ui/i18n.js');

const PART = 'persist:fablibrary';
const ROOT = () => path.join(app.getPath('userData'), 'profiles');
let mainWin = null;
let profile = null; // { id, name, dir }

protocol.registerSchemesAsPrivileged([{ scheme: 'thumb', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }]);

// ---------- хранилище профиля ----------
function profileDir() { return profile ? profile.dir : null; }
function readJSON(name, def) {
  try { return JSON.parse(fs.readFileSync(path.join(profileDir(), name), 'utf8')); } catch (e) { return def; }
}
function writeJSON(name, data) {
  const f = path.join(profileDir(), name);
  fs.writeFileSync(f + '.tmp', JSON.stringify(data));
  fs.renameSync(f + '.tmp', f);
}
function setProfile(id, name) { qxIndex = null;
  const dir = path.join(ROOT(), id);
  fs.mkdirSync(path.join(dir, 'thumbs', 'fab'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'thumbs', 'qx'), { recursive: true });
  profile = { id, name, dir };
  fs.writeFileSync(path.join(ROOT(), 'last.json'), JSON.stringify({ id, name }));
  importSeed();
  watchCustom();
}
// Подборки (custom-filters.json) может дописывать Claude или сам пользователь — следим за файлом и обновляем окно.
let customWatch = null, customTimer = null;
function watchCustom() {
  if (customWatch) { try { customWatch.close(); } catch (e) {} customWatch = null; }
  if (!profile) return;
  try {
    customWatch = fs.watch(profile.dir, (ev, name) => {
      if (name !== 'custom-filters.json') return;
      clearTimeout(customTimer); customTimer = setTimeout(() => send('data:changed', 'custom'), 400);
    });
  } catch (e) { /* не критично */ }
}
function loadLastProfile() {
  try {
    fs.mkdirSync(ROOT(), { recursive: true });
    const last = JSON.parse(fs.readFileSync(path.join(ROOT(), 'last.json'), 'utf8'));
    if (last && last.id && fs.existsSync(path.join(ROOT(), last.id))) profile = { ...last, dir: path.join(ROOT(), last.id) };
  } catch (e) { /* первый запуск */ }
}
// Перенос данных из прежнего онлайн-каталога (seed/import-<epicId>.json рядом с приложением) — только для своего аккаунта.
function importSeed() {
  const f = path.join(__dirname, 'seed', `import-${profile.id}.json`);
  if (!fs.existsSync(f) || fs.existsSync(path.join(profile.dir, '.seeded'))) return;
  try {
    const seed = JSON.parse(fs.readFileSync(f, 'utf8'));
    const user = readJSON('user.json', { fav: [], wish: { add: {}, meta: {}, hidden: {} } });
    for (const k of seed.fav || []) if (!user.fav.includes(k)) user.fav.push(k);
    Object.assign(user.wish.add, seed.wishAdd || {});
    Object.assign(user.wish.meta, seed.wishMeta || {});
    Object.assign(user.wish.hidden, seed.wishHidden || {});
    writeJSON('user.json', user);
    if (seed.wishHist) writeJSON('wish-history.json', seed.wishHist);
    fs.writeFileSync(path.join(profile.dir, '.seeded'), new Date().toISOString());
  } catch (e) { console.error('seed import failed', e); }
}

// ---------- окна ----------
function createMain() {
  mainWin = new BrowserWindow({
    width: 1500, height: 950, backgroundColor: '#0f1012', title: 'Fab Library',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true, nodeIntegration: false },
  });
  Menu.setApplicationMenu(null);
  mainWin.loadFile(path.join(__dirname, 'ui', 'index.html'));
  mainWin.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:\/\//.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  mainWin.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file://')) { e.preventDefault(); if (/^https?:\/\//.test(url)) shell.openExternal(url); } });
}
const send = (ch, data) => { if (mainWin && !mainWin.isDestroyed()) mainWin.webContents.send(ch, data); };

// Скрытые окна-«рабочие», которые ходят на сайты под сессией пользователя.
const workers = {};
async function worker(key, url) {
  let w = workers[key];
  if (!w || w.isDestroyed()) {
    w = new BrowserWindow({ show: false, width: 1200, height: 900, webPreferences: { partition: PART, contextIsolation: true, sandbox: true, nodeIntegration: false } });
    w.webContents.setAudioMuted(true);
    workers[key] = w;
    await w.loadURL(url);
  } else if (!w.webContents.getURL().startsWith(new URL(url).origin)) {
    await w.loadURL(url);
  }
  return w;
}
async function run(key, url, body, arg) {
  const w = await worker(key, url);
  const code = `(async (A) => { ${sync.PRELUDE}\n${body} })(${JSON.stringify(arg === undefined ? null : arg)})`;
  return w.webContents.executeJavaScript(code, true);
}
// Окно входа: пользователь сам вводит логин и пароль на сайте, приложение только ждёт, пока вход состоится.
function loginWindow(url, title, check) {
  return new Promise((resolve) => {
    const w = new BrowserWindow({ width: 1100, height: 820, title: I18N.tr(title), parent: mainWin, webPreferences: { partition: PART, contextIsolation: true, sandbox: true, nodeIntegration: false } });
    // всплывающие окна входа (Google/Apple) разрешены только по https, без доступа к Node
    w.webContents.setWindowOpenHandler(({ url }) => /^https:\/\//.test(url) ? { action: 'allow', overrideBrowserWindowOptions: { parent: w, webPreferences: { partition: PART, contextIsolation: true, sandbox: true, nodeIntegration: false } } } : { action: 'deny' });
    w.setMenu(null);
    w.loadURL(url);
    send('sync:progress', { stage: 'login', msg: `${title}: войдите в аккаунт в открывшемся окне` });
    let done = false;
    const timer = setInterval(async () => {
      if (done || w.isDestroyed()) return;
      try {
        const res = await w.webContents.executeJavaScript(`(async()=>{ ${check} })()`, true);
        if (res) { done = true; clearInterval(timer); w.close(); resolve(res); }
      } catch (e) { /* страница ещё грузится */ }
    }, 2500);
    w.on('closed', () => { clearInterval(timer); if (!done) resolve(null); });
  });
}
async function ensureLogin(kind) {
  const L = sync.LOGIN[kind];
  let res = null;
  try { res = await run(kind, L.url, L.check); } catch (e) { res = null; }
  if (res) return res;
  res = await loginWindow(L.loginUrl, L.title, L.check);
  if (workers[kind] && !workers[kind].isDestroyed()) { workers[kind].destroy(); delete workers[kind]; }
  return res;
}

// ---------- загрузка превью ----------
async function downloadThumbs(list, sub, label) {
  // list: [{id, url}]
  const dir = path.join(profileDir(), 'thumbs', sub);
  const todo = list.filter(x => x.url && !fs.existsSync(path.join(dir, safe(x.id) + '.jpg')));
  let done = 0;
  const ses = session.fromPartition(PART);
  const workerFn = async () => {
    while (todo.length) {
      const x = todo.shift();
      try {
        const r = await ses.fetch(x.url);
        if (r.ok) fs.writeFileSync(path.join(dir, safe(x.id) + '.jpg'), shrink(Buffer.from(await r.arrayBuffer())));
      } catch (e) { /* пропускаем */ }
      done++;
      if (done % 25 === 0) send('sync:progress', { stage: 'thumbs', msg: `${label}: превью ${done}`, done });
    }
  };
  await Promise.all(Array.from({ length: 8 }, workerFn));
}
// Превью ужимаем до 320 px — так кэш на ~20 тыс. ассетов занимает сотни мегабайт, а не гигабайты.
function shrink(buf) {
  try { const im = nativeImage.createFromBuffer(buf); const { width } = im.getSize(); if (!width) return buf;
    return (width > 320 ? im.resize({ width: 320, quality: 'good' }) : im).toJPEG(82); } catch (e) { return buf; }
}
// Превью Quixel.com (их ~20 тыс.) не качаем пачкой, а догружаем, когда карточка появляется на экране.
let qxIndex = null;
async function lazyQx(id, file) {
  if (!qxIndex) { qxIndex = new Map(readJSON('quixel.json', { items: [] }).items.map(i => [i.qid, i.img])); }
  const url = qxIndex.get(id);
  if (!url) return false;
  try { const r = await session.fromPartition(PART).fetch(url); if (!r.ok) return false;
    fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, shrink(Buffer.from(await r.arrayBuffer()))); return true; } catch (e) { return false; }
}
const safe = (s) => String(s).replace(/[^a-zA-Z0-9_-]/g, '_');

// ---------- синхронизация ----------
let syncing = false;
async function doSync(what) {
  if (syncing) return { error: 'Обновление уже идёт' };
  syncing = true;
  const log = [];
  const P = (stage, msg, extra) => { send('sync:progress', { stage, msg, ...(extra || {}) }); };
  try {
    const me = await ensureLogin('fab');
    if (!me) throw new Error('Вход в Fab не выполнен');
    setProfile(me.epicId, me.displayName);
    send('profile', { id: profile.id, name: profile.name });
    const ctx = { run: (body, arg) => run('fab', sync.LOGIN.fab.url, body, arg), P, readJSON, writeJSON };

    if (what === 'all' || what === 'library') {
      const lib = await sync.syncLibrary(ctx);
      await downloadThumbs(lib.items.map(i => ({ id: i.id, url: i.img })), 'fab', 'Библиотека');
      log.push(`Библиотека: ${lib.items.length} паков (новых ${lib.added})`);
      const ep = await ensureLogin('epic');
      if (ep) {
        const pur = await sync.syncPurchases({ ...ctx, run: (body, arg) => run('epic', sync.LOGIN.epic.url, body, arg) });
        log.push(`Покупки: ${pur.paidOrders} оплаченных заказов`);
      } else log.push('Покупки: вход в аккаунт Epic не выполнен — пропущено');
    }
    if (what === 'all' || what === 'wish') {
      const w = await sync.syncWishlist(ctx);
      await downloadThumbs(w.items.filter(i => i.img).map(i => ({ id: i.id, url: i.img })), 'fab', 'Вишлист');
      log.push(`Вишлист: ${w.items.length} паков, со скидкой ${w.onSale}`);
    }
    if (what === 'all' || what === 'quixel') {
      const mf = await sync.syncFabMegascans(ctx);
      await downloadThumbs(mf.items.map(i => ({ id: i.id, url: i.img })), 'fab', 'Megascans на Fab');
      log.push(`Megascans на Fab: ${mf.items.length}`);
      const qx = await ensureLogin('quixel');
      if (qx) {
        const q = await sync.syncQuixel({ ...ctx, run: (body, arg) => run('quixel', sync.LOGIN.quixel.url, body, arg) });
        qxIndex = null;
        log.push(`Quixel.com: ${q.items.length} ассетов`);
      } else log.push('Quixel.com: вход не выполнен — пропущено');
      const ids = await sync.syncMegascanIds(ctx);
      log.push(`Quixel-ID найдены для ${ids.withId} паков Fab`);
    }
    const settings = readJSON('settings.json', {});
    settings.lastSync = new Date().toISOString();
    writeJSON('settings.json', settings);
    P('done', 'Готово', { log });
    return { ok: true, log };
  } catch (e) {
    P('error', String(e.message || e));
    return { error: String(e.message || e), log };
  } finally { syncing = false; }
}

// ---------- IPC ----------
// Принимаем вызовы только от главного окна приложения (не от сайтов во вспомогательных окнах).
const handle = (ch, fn) => ipcMain.handle(ch, (e, ...a) => {
  if (!mainWin || mainWin.isDestroyed() || e.sender !== mainWin.webContents) throw new Error('IPC denied');
  return fn(e, ...a);
});
handle('data:get', () => {
  if (!profile) return { profile: null };
  return {
    profile: { id: profile.id, name: profile.name },
    library: readJSON('library.json', { items: [] }),
    purchases: readJSON('purchases.json', null),
    wishlist: readJSON('wishlist.json', { items: [] }),
    megascans: readJSON('megascans-fab.json', { items: [] }),
    quixel: readJSON('quixel.json', { items: [], categories: [] }),
    user: readJSON('user.json', { fav: [], wish: { add: {}, meta: {}, hidden: {} } }),
    settings: readJSON('settings.json', {}),
    custom: readJSON('custom-filters.json', { version: 1, items: [] }),
  };
});
handle('user:save', (e, user) => { if (profile) writeJSON('user.json', user); return true; });
handle('lang:set', (e, l) => { I18N.setLang(String(l || 'ru')); return true; });
handle('custom:save', (e, c) => { if (profile) writeJSON('custom-filters.json', c); return true; });
handle('settings:save', (e, s) => { if (profile) writeJSON('settings.json', s); return true; });
handle('sync:run', (e, what) => doSync(what || 'all'));
handle('wish:add', async (e, url) => {
  try {
    const me = await ensureLogin('fab');
    if (!me) return { error: 'Нужен вход в Fab' };
    if (!profile) setProfile(me.epicId, me.displayName);
    const ctx = { run: (body, arg) => run('fab', sync.LOGIN.fab.url, body, arg), readJSON, writeJSON, P: () => {} };
    const item = await sync.addWish(ctx, url);
    if (item && item.img) await downloadThumbs([{ id: item.id, url: item.img }], 'fab', 'Вишлист');
    return { item };
  } catch (err) { return { error: String(err.message || err) }; }
});
// Во внешнем браузере открываем только обычные веб-ссылки (не file:, не программы).
handle('open:external', (e, url) => { try { const u = new URL(String(url)); if (u.protocol === 'https:' || u.protocol === 'http:') return shell.openExternal(u.href); } catch (err) {} return false; });
handle('clipboard:copy', (e, text) => { require('electron').clipboard.writeText(text); return true; });
handle('profile:logout', async () => {
  await session.fromPartition(PART).clearStorageData();
  for (const k of Object.keys(workers)) { try { workers[k].destroy(); } catch (e) {} delete workers[k]; }
  profile = null;
  try { fs.unlinkSync(path.join(ROOT(), 'last.json')); } catch (e) {}
  return true;
});
handle('profile:folder', () => profile && shell.openPath(profile.dir));
handle('export:csv', async (e, csv) => {
  const r = await dialog.showSaveDialog(mainWin, { defaultPath: 'fab_catalog.csv', filters: [{ name: 'CSV', extensions: ['csv'] }] });
  if (r.canceled) return false;
  fs.writeFileSync(r.filePath, '﻿' + csv, 'utf8');
  return true;
});

app.whenReady().then(() => {
  // Обычный браузерный User-Agent (без «Electron»), чтобы сайты Epic/Fab/Quixel показывали стандартный вход.
  const ses = session.fromPartition(PART);
  // Сайтам внутри приложения не нужны камера, микрофон, геолокация и т.п. — запрещаем всё.
  for (const sx of [ses, session.defaultSession]) { sx.setPermissionRequestHandler((wc, perm, cb) => cb(false)); sx.setPermissionCheckHandler(() => false); }
  ses.setUserAgent(ses.getUserAgent().replace(/\s*Electron\/[\d.]+/, '').replace(/\s*fab-library\/[\d.]+/i, ''));
  protocol.handle('thumb', (req) => {
    // thumb://local/<sub>/<id>.jpg
    const u = new URL(req.url);
    const parts = decodeURIComponent(u.pathname).split('/').filter(Boolean);
    if (!profile || parts.length !== 2 || !['fab', 'qx'].includes(parts[0])) return new Response('', { status: 404 });
    const f = path.join(profile.dir, 'thumbs', parts[0], safe(parts[1].replace(/\.jpg$/, '')) + '.jpg');
    if (!fs.existsSync(f)) {
      if (parts[0] !== 'qx') return new Response('', { status: 404 });
      return lazyQx(parts[1].replace(/\.jpg$/, ''), f).then(ok => ok ? net.fetch('file:///' + f.replace(/\\/g, '/')) : new Response('', { status: 404 }));
    }
    return net.fetch('file:///' + f.replace(/\\/g, '/'));
  });
  loadLastProfile();
  watchCustom();
  createMain();
  // Автообновление цен вишлиста при запуске (если включено в настройках и прошло больше суток).
  mainWin.webContents.once('did-finish-load', () => {
    if (!profile) return;
    const s = readJSON('settings.json', {});
    if (s.autoWish && (!s.lastSync || Date.now() - new Date(s.lastSync) > 20 * 3600 * 1000)) setTimeout(() => doSync('wish'), 4000);
  });
});
app.on('window-all-closed', () => app.quit());
