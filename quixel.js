// Quixel.com (легаси-библиотека Megascans).
// Код в строках выполняется на странице quixel.com под сессией пользователя — так же, как это делает сам сайт:
// токен берётся из cookie «auth», которую сайт ставит после входа, и передаётся в заголовке Authorization.
// Пароли и ключи приложение не видит и не хранит.

const Q_PRELUDE = `
const qtoken = () => { try { const c = document.cookie.split('; ').find(c => c.startsWith('auth=')); return c ? JSON.parse(decodeURIComponent(c.slice(5))).token : null; } catch (e) { return null; } };
const qget = async (u) => { for (let a = 0; a < 4; a++) { const t = qtoken(); if (!t) return { __status: 401 };
  const r = await fetch(u, { headers: { Authorization: 'Bearer ' + t } }); if (r.status === 429 || r.status >= 500) { await sleep(3000 * (a + 1)); continue; }
  if (!r.ok) return { __status: r.status }; return await r.json(); } return { __status: 429 }; };
`;

const check = `if (!location.host.endsWith('quixel.com')) return null; ${Q_PRELUDE.replace(/\n/g, ' ')}
  const t = qtoken(); if (!t) return null; const r = await fetch('/v1/users/self', { headers: { Authorization: 'Bearer ' + t } }); return r.ok ? true : null;`;

const TOP = { '3d asset': '3D Assets', '3d': '3D Assets', '3d plant': '3D Plants', 'plant': '3D Plants', 'surface': 'Surfaces', 'decal': 'Decals', 'atlas': 'Atlases',
  'imperfection': 'Imperfections', 'displacement': 'Displacements', 'brush': 'Brushes' };
const cap = (s) => String(s || '').trim().replace(/^./, c => c.toUpperCase());

// Путь категории как в Bridge: берём самую глубокую ветку из assetCategories.
function depth(n) { return n && typeof n === 'object' ? 1 + Math.max(0, ...Object.values(n).map(depth)) : 0; }
function catPath(ac, cats) {
  const p = [];
  let node = ac;
  while (node && typeof node === 'object' && Object.keys(node).length) {
    // несколько веток (например, «3D asset/historical» и «3D asset/props») — берём самую подробную
    const k = Object.keys(node).sort((a, b) => depth(node[b]) - depth(node[a]))[0];
    p.push(k); node = node[k];
  }
  const path = p.length ? p : (cats || []);
  if (!path.length) return ['Other'];
  return [TOP[String(path[0]).toLowerCase()] || cap(path[0]), ...path.slice(1, 3).map(cap)];
}

// Сжатая карточка ассета — считается прямо в странице, чтобы не гонять большие JSON.
const DETAIL = `return await pool(A, 8, async (id) => { const j = await qget('/v1/assets/' + id);
  if (j.__status) return { qid: id, err: j.__status };
  const ims = ((j.previews || {}).images || []).filter(x => (x.tags || []).includes('thumb'))
    .map(x => ({ u: x.uri, w: parseInt(x.resolution) || 0 })).sort((a, b) => a.w - b.w);
  const im = ims.find(x => x.w >= 300) || ims[0];
  const base = im ? im.u.split('/').pop().replace(/\\.[a-z]+$/i, '') : '';
  return { qid: id, t: j.name || id, ac: j.assetCategories || null, cats: j.categories || [], tags: (j.tags || []).slice(0, 12).join(', '),
    pack: j.pack ? (j.pack.name || '') : '', img: base ? 'https://ddinktqu5prvc.cloudfront.net/' + id + '/' + base + '_thumb.jpg' : '' }; });`;

async function syncQuixel(ctx) {
  const run = (body, arg) => ctx.run(Q_PRELUDE + body, arg);
  const acq = await run(`const j = await qget('/v1/assets/acquired'); if (j.__status) return { err: j.__status };
    return (Array.isArray(j) ? j : []).map(x => [x.assetID, x.resolution || 0]);`);
  if (!Array.isArray(acq)) throw new Error('quixel.com вернул ошибку ' + (acq && acq.err) + ' — войдите на quixel.com ещё раз');

  const prev = ctx.readJSON('quixel.json', { items: [] });
  const map = new Map(prev.items.map(i => [i.qid, i]));
  const res = new Map(acq);
  for (const [id] of acq) if (!map.has(id)) map.set(id, { qid: id, t: id, cat: ['Other'], tags: '', img: '', pending: true });
  for (const id of [...map.keys()]) if (!res.has(id)) map.delete(id); // убран из аккаунта
  for (const [id, r] of acq) map.get(id).res = r;

  const save = () => ctx.writeJSON('quixel.json', { updated: new Date().toISOString().slice(0, 10), items: [...map.values()] });
  const need = [...map.values()].filter(i => i.pending).map(i => i.qid);
  let authFail = 0;
  for (let i = 0; i < need.length; i += 160) {
    const out = await run(DETAIL, need.slice(i, i + 160));
    for (const d of out || []) {
      if (!d) continue;
      const it = map.get(d.qid);
      if (d.err) { if (d.err === 401) authFail++; else if (d.err === 404) { it.pending = false; it.gone = true; } continue; }
      Object.assign(it, { t: d.t, cat: catPath(d.ac, d.cats), tags: d.tags, pack: d.pack, img: d.img, pending: false });
    }
    save();
    ctx.P('quixel', `Quixel.com: описания ${Math.min(i + 160, need.length)} из ${need.length}`);
    if (authFail > 20) { save(); throw new Error('Сессия quixel.com истекла. Нажмите «Обновить → Только Quixel» ещё раз — загрузка продолжится с того же места.'); }
  }
  save();
  return { items: [...map.values()] };
}

module.exports = { check, syncQuixel, catPath };
