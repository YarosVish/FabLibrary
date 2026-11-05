// Логика синхронизации. Код в строках выполняется внутри страниц fab.com / epicgames.com / quixel.com
// под сессией пользователя (как будто он сам открыл сайт), поэтому никакие ключи и пароли приложению не нужны.

const PRELUDE = `
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const pickImg = (thumbs, minW) => { const ims = ((thumbs || [])[0] || {}).images || []; const s = ims.slice().sort((a,b)=>a.width-b.width); const im = s.find(i => i.width >= minW) || s[s.length-1]; return im ? im.url : ((thumbs||[])[0]||{}).mediaUrl || ''; };
const getJSON = async (u) => { for (let a = 0; a < 4; a++) { const r = await fetch(u, { credentials: 'include' }); if (r.status === 429) { await sleep(4000); continue; } if (!r.ok) return { __status: r.status }; return await r.json(); } return { __status: 429 }; };
const pool = async (items, n, fn) => { const out = new Array(items.length); let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; try { out[k] = await fn(items[k]); } catch (e) { out[k] = null; } await sleep(80); } })); return out; };
`;

const LOGIN = {
  fab: {
    title: 'Вход в Fab',
    url: 'https://www.fab.com/i/users/context',
    loginUrl: 'https://www.fab.com/',
    check: `if (!location.host.endsWith('fab.com')) return null; const r = await fetch('/i/users/me', { credentials: 'include' }); if (!r.ok) return null; const j = await r.json(); return j && j.epicId ? { epicId: j.epicId, displayName: j.displayName } : null;`,
  },
  epic: {
    title: 'Вход в аккаунт Epic (история покупок)',
    url: 'https://accounts.epicgames.com/account/transactions/purchases',
    loginUrl: 'https://accounts.epicgames.com/account/transactions/purchases',
    check: `if (!location.host.endsWith('epicgames.com')) return null; const r = await fetch('/account/v2/payment/ajaxGetOrderHistory?sortDir=DESC&sortBy=DATE&locale=ru', { credentials: 'include' }); if (!r.ok) return null; const j = await r.json().catch(() => null); return j && j.orders ? true : null;`,
  },
  quixel: {
    title: 'Вход на quixel.com',
    url: 'https://quixel.com/megascans/purchased',
    loginUrl: 'https://quixel.com/megascans/purchased',
    // заполняется после проверки API quixel.com (см. QUIXEL ниже)
    check: `return null;`,
  },
};

const today = () => new Date().toISOString().slice(0, 10);
const ueList = (formats) => [...new Set((formats || []).flatMap(f => ((f.technicalSpecs || {}).unrealEngineEngineVersions || [])).map(v => String(v).replace(/^UE_/, '')))]
  .sort((a, b) => a.split('.').map(Number).reduce((s, x, i) => s || x - b.split('.').map(Number)[i], 0));

// ---------- Библиотека Fab ----------
async function syncLibrary(ctx) {
  const prev = ctx.readJSON('library.json', { items: [] });
  const prevMap = new Map(prev.items.map(i => [i.id, i]));
  let url = '/i/library/search?count=100&sort_by=-createdAt&source=acquired';
  const ents = [];
  let page = 0;
  while (url) {
    const r = await ctx.run(`const j = await getJSON(A); if (j.__status) return { err: j.__status };
      return { next: j.next, items: (j.results || []).map(x => { const L = x.listing || {}; return {
        eid: x.uid, created: (x.createdAt || '').slice(0, 10), id: L.uid, t: L.title, s: (L.publisher || {}).sellerName || '',
        lt: L.listingType, live: L.isActiveInLive !== false,
        f: (L.assetFormats || []).map(f => (f.assetFormatType || {}).code), fmt: L.assetFormats, img: pickImg(L.thumbnails, 320) }; }) };`, url);
    if (r.err) throw new Error('Fab вернул ошибку ' + r.err + ' при чтении библиотеки');
    for (const it of r.items) { it.ue = ueList(it.fmt); delete it.fmt; ents.push(it); }
    url = r.next;
    if (++page % 5 === 0) ctx.P('library', `Библиотека: получено ${ents.length}`);
  }
  // подробности (категория, теги) — только для новых паков
  const need = ents.filter(e => e.id && !(prevMap.get(e.id) || {}).c && !(prevMap.get(e.id) || {}).detailTried);
  for (let i = 0; i < need.length; i += 40) {
    const chunk = need.slice(i, i + 40).map(e => ({ id: e.id, eid: e.eid }));
    const det = await ctx.run(`return await pool(A, 5, async (e) => {
      let j = await getJSON('/i/listings/' + e.id); let L = j;
      if (j.__status) { const a = await getJSON('/i/library/assets/' + e.eid); L = a.__status ? null : a.listing; }
      if (!L) return { id: e.id, missing: true };
      return { id: e.id, c: (L.category || {}).path || '', tags: (L.tags || []).map(t => t.name).slice(0, 12).join(', '), free: !!L.isFree,
        img: pickImg(L.thumbnails, 320) || pickImg(L.medias, 320) };
    });`, chunk);
    for (const d of det) if (d) prevMap.set(d.id, { ...(prevMap.get(d.id) || {}), ...d, detailTried: true });
    ctx.P('library', `Подробности новых паков: ${Math.min(i + 40, need.length)} из ${need.length}`);
  }
  const items = ents.filter(e => e.id).map(e => { const p = prevMap.get(e.id) || {}; return { ...p, ...e, img: e.img || p.img || '' }; });
  const added = items.filter(i => !prev.items.some(p => p.id === i.id)).length;
  ctx.writeJSON('library.json', { updated: today(), items });
  return { items, added };
}

// ---------- Покупки (Epic) ----------
async function syncPurchases(ctx) {
  const orders = [];
  let tok = null;
  for (let p = 0; p < 200; p++) {
    const r = await ctx.run(`const j = await getJSON('/account/v2/payment/ajaxGetOrderHistory?sortDir=DESC&sortBy=DATE&locale=ru' + (A ? '&nextPageToken=' + encodeURIComponent(A) : ''));
      if (j.__status) return { err: j.__status };
      return { next: j.nextPageToken, orders: (j.orders || []).map(o => ({ d: new Date(o.createdAtMillis).toISOString().slice(0, 10), type: o.orderType,
        m: o.marketplaceName || o.merchantGroup, total: ((o.total || {}).amount || 0) / 100, cur: (o.total || {}).currency,
        items: (o.items || []).map(i => ({ t: i.description, a: (i.amount || 0) / 100 })) })) };`, tok);
    if (r.err) throw new Error('Epic вернул ошибку ' + r.err + ' при чтении покупок');
    orders.push(...r.orders);
    tok = r.next;
    if (!tok || !r.orders.length) break;
  }
  const fab = orders.filter(o => o.m !== 'Epic Games Store');
  const paid = fab.filter(o => o.type === 'PURCHASE' && o.total > 0);
  const refunds = fab.filter(o => o.type === 'REFUND');
  const totals = {}; const byYear = {};
  for (const o of paid) { totals[o.cur] = (totals[o.cur] || 0) + o.total; const y = o.d.slice(0, 4) + ' ' + o.cur; byYear[y] = (byYear[y] || 0) + o.total; }
  for (const o of refunds) totals[o.cur] = (totals[o.cur] || 0) - o.total;
  const items = [];
  for (const o of paid) { const sum = o.items.reduce((s, i) => s + i.a, 0) || 1; for (const i of o.items) items.push({ d: o.d, t: i.t, amt: Math.round(o.total * i.a / sum * 100) / 100, cur: o.cur }); }
  const out = { updated: today(), totals, byYear, paidOrders: paid.length, refunds: refunds.map(o => ({ d: o.d, total: o.total, cur: o.cur, items: o.items.map(i => i.t) })), items };
  ctx.writeJSON('purchases.json', out);
  return out;
}

// ---------- Вишлист ----------
const DETAIL_TO_WISH = `const toWish = (L, id) => { const sp = L.startingPrice || {}; const lic = (L.licenses || []).find(l => l.slug === 'personal') || (L.licenses || [])[0] || {};
  return { id, t: L.title, s: (L.user || {}).sellerName || '', c: (L.category || {}).path || '', lt: L.listingType, tags: (L.tags || []).map(t => t.name || t).slice(0, 10).join(', '),
    f: (L.assetFormats || []).map(a => (a.assetFormatType || {}).code), img: pickImg(L.thumbnails, 320), free: !!L.isFree,
    cur: sp.currencyCode || '', price: sp.price ?? null, dp: sp.discountedPrice ?? null, pct: sp.effectiveDiscountPercentage ?? null,
    end: (sp.discountEndDate || '').slice(0, 10) || null, low: sp.lowestPriorPrice ?? null, offer: lic.offerId || null }; };`;

async function syncWishlist(ctx) {
  const user = ctx.readJSON('user.json', { fav: [], wish: { add: {}, meta: {}, hidden: {} } });
  const hist = ctx.readJSON('wish-history.json', {});
  // 1) официальный вишлист Fab
  let url = '/i/listings/search?in=wishlist&sort_by=title';
  const official = [];
  while (url) {
    const r = await ctx.run(`const j = await getJSON(A); if (j.__status) return { err: j.__status };
      return { next: j.next, items: (j.results || []).map(x => ({ id: x.uid, t: x.title, s: (x.user || {}).sellerName || '', c: (x.category || {}).path || '', lt: x.listingType,
        tags: (x.tags || []).map(t => t.name || t).slice(0, 10).join(', '), f: (x.assetFormats || []).map(a => (a.assetFormatType || {}).code),
        img: pickImg(x.thumbnails, 320), free: !!x.isFree, offer: (x.startingPrice || {}).offerId || null })) };`, url);
    if (r.err) break;
    official.push(...r.items);
    url = r.next;
  }
  ctx.P('wish', `Официальный вишлист: ${official.length}`);
  const offers = official.map(o => o.offer).filter(Boolean);
  const pinfo = {};
  for (let i = 0; i < offers.length; i += 24) {
    const r = await ctx.run(`const j = await getJSON('/i/listings/prices-infos?' + A.map(o => 'offer_ids=' + o).join('&')); return j.offers || [];`, offers.slice(i, i + 24));
    for (const o of r) pinfo[o.offerId] = o;
  }
  for (const o of official) {
    const p = pinfo[o.offer] || {};
    Object.assign(o, { cur: p.currencyCode || '', price: p.price ?? null, dp: p.discountedPrice ?? null, pct: p.discountPercentage ?? p.effectiveDiscountPercentage ?? null,
      end: (p.discountEndDate || '').slice(0, 10) || null, low: p.lowestPriorPrice ?? null, src: ['fab'] });
  }
  // 2) паки, добавленные в приложении
  const offIds = new Set(official.map(o => o.id));
  const extra = Object.keys(user.wish.add || {}).filter(id => !offIds.has(id));
  const extraItems = [];
  for (let i = 0; i < extra.length; i += 40) {
    const r = await ctx.run(`${DETAIL_TO_WISH} return await pool(A, 5, async (id) => { const L = await getJSON('/i/listings/' + id); if (L.__status) return { id, missing: L.__status === 404, t: '' }; return toWish(L, id); });`, extra.slice(i, i + 40));
    extraItems.push(...r.filter(Boolean).map(x => ({ ...x, src: ['user'] })));
    ctx.P('wish', `Свои добавленные: ${Math.min(i + 40, extra.length)} из ${extra.length}`);
  }
  const all = [...official, ...extraItems];
  // 3) что уже куплено
  const owned = new Set();
  const ids = all.filter(x => !x.missing).map(x => x.id);
  for (let i = 0; i < ids.length; i += 24) {
    const r = await ctx.run(`const j = await getJSON('/i/users/me/listings-states?' + A.map(x => 'listing_ids=' + x).join('&')); return Array.isArray(j) ? j.filter(s => s.acquired).map(s => s.uid) : [];`, ids.slice(i, i + 24));
    r.forEach(id => owned.add(id));
  }
  const d = today();
  const items = all.filter(x => !owned.has(x.id)).map(x => {
    const np = x.pct ? x.dp : x.price;
    const h = hist[x.id] || [];
    if (np != null && (!h.length || h[h.length - 1][1] !== np)) h.push([d, np]);
    hist[x.id] = h;
    return { ...x, hist: h, minSeen: h.length ? Math.min(...h.map(p => p[1])) : null, added: (user.wish.add[x.id] || {}).added || x.added || '' };
  });
  ctx.writeJSON('wish-history.json', hist);
  const out = { updated: d, items, ownedRemoved: [...owned] };
  ctx.writeJSON('wishlist.json', out);
  return { items, onSale: items.filter(i => i.pct).length };
}

async function addWish(ctx, url) {
  const m = String(url).match(/listings\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (!m) throw new Error('Нужна ссылка вида https://www.fab.com/listings/…');
  const id = m[1].toLowerCase();
  const r = await ctx.run(`${DETAIL_TO_WISH} const L = await getJSON('/i/listings/' + A); if (L.__status) return { err: L.__status };
    const st = await getJSON('/i/users/me/listings-states?listing_ids=' + A); const own = Array.isArray(st) && st[0] && st[0].acquired;
    return { ...toWish(L, A), owned: !!own };`, id);
  if (r.err) throw new Error(r.err === 404 ? 'Такого пака на Fab нет (возможно, удалён)' : 'Fab вернул ошибку ' + r.err);
  const hist = ctx.readJSON('wish-history.json', {});
  const np = r.pct ? r.dp : r.price;
  if (np != null) hist[id] = [...(hist[id] || []).filter(h => h[0] !== today()), [today(), np]];
  ctx.writeJSON('wish-history.json', hist);
  const w = ctx.readJSON('wishlist.json', { items: [] });
  const item = { ...r, src: ['user'], hist: hist[id] || [], minSeen: np, added: today() };
  w.items = w.items.filter(x => x.id !== id).concat(item);
  ctx.writeJSON('wishlist.json', w);
  return item;
}

// ---------- Megascans на Fab ----------
async function syncFabMegascans(ctx) {
  const prev = ctx.readJSON('megascans-fab.json', { items: [] });
  const prevMap = new Map(prev.items.map(i => [i.id, i]));
  let url = '/i/listings/search?seller=Quixel%20Megascans&sort_by=title';
  const items = [];
  let page = 0;
  while (url) {
    const r = await ctx.run(`const j = await getJSON(A); if (j.__status) return { err: j.__status };
      return { next: j.next, items: (j.results || []).map(x => ({ id: x.uid, t: x.title, c: (x.category || {}).path || '', lt: x.listingType,
        tags: (x.tags || []).map(t => t.name || t).slice(0, 10).join(', '), img: pickImg(x.thumbnails, 160), free: !!x.isFree })) };`, url);
    if (r.err) throw new Error('Fab вернул ошибку ' + r.err + ' при чтении Megascans');
    for (const it of r.items) items.push({ ...(prevMap.get(it.id) || {}), ...it });
    url = r.next;
    if (++page % 10 === 0) ctx.P('quixel', `Megascans на Fab: ${items.length}`);
  }
  // принадлежность: проверяем только то, что ещё не проверяли
  const need = items.filter(i => i.own === undefined).map(i => i.id);
  const own = new Set();
  for (let i = 0; i < need.length; i += 24) {
    const r = await ctx.run(`const j = await getJSON('/i/users/me/listings-states?' + A.map(x => 'listing_ids=' + x).join('&')); return Array.isArray(j) ? j.map(s => [s.uid, !!s.acquired]) : [];`, need.slice(i, i + 24));
    for (const [id, a] of r) if (a) own.add(id);
    if ((i / 24) % 20 === 0) ctx.P('quixel', `Проверка, какие Megascans уже твои: ${Math.min(i + 24, need.length)} из ${need.length}`);
  }
  for (const it of items) if (it.own === undefined) it.own = own.has(it.id);
  ctx.writeJSON('megascans-fab.json', { updated: today(), items });
  return { items };
}

// Quixel-ID зашит в имена файлов паков Megascans на Fab: «…_we1jdig_high.zip». Ищем один раз и запоминаем.
async function syncMegascanIds(ctx) {
  const data = ctx.readJSON('megascans-fab.json', { items: [] });
  const need = data.items.filter(i => i.own && !i.qid && (!i.qidTried || i.qidV !== 2)); // v2: исправлен поиск ID вида «_omfre0_4k»
  for (let i = 0; i < need.length; i += 60) {
    const chunk = need.slice(i, i + 60).map(x => x.id);
    const r = await ctx.run(`return await pool(A, 6, async (id) => { const j = await getJSON('/i/listings/' + id + '/asset-formats'); if (j.__status) return [id, null];
      const names = (Array.isArray(j) ? j : []).flatMap(f => (f.files || []).map(x => x.name || ''));
      for (const n of names) { const m = n.match(/_([a-z0-9]{5,10})_(?:raw|high|mid|medium|low|nanite|ue|source|\\d+k)[._]/i); if (m) return [id, m[1].toLowerCase()]; }
      return [id, null]; });`, chunk);
    const map = new Map(r.filter(Boolean));
    for (const it of data.items) if (map.has(it.id)) { it.qidTried = true; it.qidV = 2; if (map.get(it.id)) it.qid = map.get(it.id); }
    if ((i / 60) % 5 === 0) { ctx.writeJSON('megascans-fab.json', data); ctx.P('quixel', `Quixel-ID: ${Math.min(i + 60, need.length)} из ${need.length}`); }
  }
  ctx.writeJSON('megascans-fab.json', data);
  return { withId: data.items.filter(i => i.qid).length };
}

// ---------- Quixel.com (легаси-библиотека) ----------
// Реализация — в quixel.js после проверки формата ответов API quixel.com.
let QUIXEL = { syncQuixel: async () => ({ items: [] }) };
try { QUIXEL = require('./quixel'); if (QUIXEL.check) LOGIN.quixel.check = QUIXEL.check; } catch (e) { /* модуль появится позже */ }
const syncQuixel = (ctx) => QUIXEL.syncQuixel(ctx);

module.exports = { PRELUDE, LOGIN, syncLibrary, syncPurchases, syncWishlist, addWish, syncFabMegascans, syncMegascanIds, syncQuixel };
