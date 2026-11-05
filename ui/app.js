// Интерфейс Fab Library. Данные приходят из main-процесса (window.api), превью — по протоколу thumb://.
window.LATEST_UE = '5.8';
// язык: сохранённый выбор или язык системы
let LANG = 'ru'; try { LANG = localStorage.getItem('lang') || I18N.detect(); } catch (e) { LANG = I18N.detect(); }
I18N.setLang(LANG);
const tr = I18N.tr;
document.documentElement.lang = LANG;
const $ = (id) => document.getElementById(id);
const fmt = (n) => (n || 0).toLocaleString(I18N.locale());
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = (v, c) => v == null ? '—' : esc(({ EUR: '€', USD: '$', RUB: '' }[c] ?? '')) + (+v).toLocaleString(I18N.locale(), { maximumFractionDigits: 2 }) + (c === 'RUB' ? ' ₽' : '');
const toast = (t) => { const el = $('toast'); el.textContent = t; el.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => el.hidden = true, 2600); };

let D = null, USER = null, LIB = [], QX = [], TAB = 'lib';
const PAGE = 120;
const TYPE_ORDER = ['Окружения и наборы', 'Здания и архитектура', 'Пропсы', 'Растительность и природа', 'Транспорт', 'Оружие', 'Персонажи и одежда', 'Анимации',
  'Quixel · 3D-модели', 'Quixel · растения', 'Quixel · материалы', 'Quixel · декали', 'Материалы, декали, HDRI', 'VFX', 'Аудио', 'Плагины и инструменты',
  'Геймплей: системы и шаблоны', 'UI и иконки', 'Примеры и обучение', 'Только в Vault лаунчера', 'Нет данных'];
const MH_ORDER = ['Готовые персонажи', 'Волосы и грумы', 'Одежда и аксессуары', 'Текстуры кожи и тела', 'Анимации и позы', 'Инструменты и системы'];

// ---------- состояние вкладок ----------
const S = {};
function tabState(t) { return S[t] || (S[t] = { q: '', f: {}, sort: CFG[t].sorts[0][0], view: 'grid', onlyFav: false, shown: 0, coll: null }); }

// ---------- подборки (custom-filters.json) ----------
// Видны только закреплённые и свежие (до 3 шт., за последние 3 дня); остальная история — в свёрнутой панели «Все подборки».
let CUST = { version: 1, items: [] }, CMAP = new Map();
const collsFor = (t) => (CUST.items || []).filter(c => !c.tab || c.tab === 'all' || c.tab === t);
function collSet(c) { let x = CMAP.get(c.id); if (!x) { x = new Set((c.ids || []).map(String)); CMAP.set(c.id, x); } return x; }
const inColl = (c, it) => { const s = collSet(c); return s.has(String(it.k)) || (it.id && s.has(String(it.id))) || (it.qid && s.has(String(it.qid))) || (it.fabId && s.has(String(it.fabId))); };
const isFresh = (c) => !c.pinned && c.created && (Date.now() - new Date(c.created)) < 3 * 864e5;
function visibleColls(t) {
  const all = collsFor(t), st = tabState(t);
  const fresh = all.filter(isFresh).sort((a, b) => String(b.created).localeCompare(String(a.created))).slice(0, 3);
  const vis = [...all.filter(c => c.pinned), ...fresh];
  const act = all.find(c => c.id === st.coll); if (act && !vis.includes(act)) vis.push(act);
  return vis;
}
function renderColls(all, st) {
  const box = $('colls'), list = collsFor(TAB);
  if (!list.length) { box.innerHTML = ''; $('cpanel').hidden = true; return; }
  const vis = visibleColls(TAB);
  const cnt = (c) => all.filter(it => inColl(c, it)).length;
  box.innerHTML = `<span class="flab">${tr('Мои подборки')}</span>` + vis.map(c => `<span class="chip coll${st.coll === c.id ? ' on' : ''}" data-coll="${esc(c.id)}" title="${esc(c.note || '')}">${c.pinned ? '📌 ' : ''}${esc(c.name)}${isFresh(c) ? ` <i>${tr('новая')}</i>` : ''}<b>${fmt(cnt(c))}</b></span>`).join('')
    + `<span class="chip ghost" id="callBtn">${tr('Все подборки ({n})', { n: list.length })} ${$('cpanel').hidden ? '▾' : '▴'}</span>`;
  if (!$('cpanel').hidden) renderCPanel(all, st);
}
function renderCPanel(all, st) {
  const q = ($('cq').value || '').toLowerCase();
  const list = collsFor(TAB).filter(c => !q || (c.name + ' ' + (c.note || '')).toLowerCase().includes(q)).sort((a, b) => (b.pinned - a.pinned) || String(b.created || '').localeCompare(String(a.created || '')));
  $('clist').innerHTML = list.map(c => `<div class="crow${st.coll === c.id ? ' on' : ''}"><button class="cpin${c.pinned ? ' on' : ''}" data-cpin="${esc(c.id)}" title="${tr(c.pinned ? 'Открепить' : 'Закрепить кнопкой')}">${c.pinned ? '★' : '☆'}</button>
    <span class="cname" data-coll="${esc(c.id)}">${esc(c.name)} <b>${fmt(all.filter(it => inColl(c, it)).length)}</b></span><span class="s">${esc(c.note || '')}</span><span class="s">${esc(c.created || '')}</span>
    <button class="cdel" data-cdel="${esc(c.id)}" title="${tr('Удалить подборку')}">×</button></div>`).join('') || `<div class="s">${tr('Ничего не найдено')}</div>`;
}
async function saveCust() { CMAP.clear(); await window.api.saveCustom(CUST); }

const thumbImg = (sub, id) => id ? `<img loading="lazy" src="thumb://local/${sub}/${encodeURIComponent(id)}.jpg">` : '';
const favBtn = (k) => `<button class="fav${USER.fav.includes(k) ? ' on' : ''}" data-fav="${esc(k)}" title="${tr('В избранное')}">${USER.fav.includes(k) ? '★' : '☆'}</button>`;

// ---------- конфигурация вкладок ----------
const CFG = {
  lib: {
    items: () => LIB,
    search: (it) => `${it.t} ${it.s} ${it.tags || ''} ${it.ty} ${(it.se || []).join(' ')} ${it.mh || ''}`,
    groups: () => [
      { key: 'o', label: 'Откуда', vals: ['Куплено', 'Quixel', 'Бесплатно'] },
      { key: 'ty', label: 'Тип', vals: TYPE_ORDER },
      { key: 'mh', label: 'MetaHuman', vals: MH_ORDER },
      { key: 'st', label: 'Стиль', vals: ['Реализм', 'Стилизация', 'Low poly'] },
      { key: 'se', label: 'Сеттинг', multi: true, vals: SETTINGS.map(s => s[0]) },
      { key: 'en', label: 'Формат', vals: ['В движок', 'Только файлом'] },
      { key: 'uf', label: 'UE ' + LATEST_UE, vals: ['Есть ' + LATEST_UE, 'Нет ' + LATEST_UE, 'Версия не указана'] },
    ],
    sorts: [['ty', 'По типу'], ['new', 'Недавно добавленные'], ['t', 'По названию'], ['pd', 'Сначала новые покупки'], ['s', 'По автору'], ['fav', 'Сначала избранные']],
    sortFn: (by) => (a, b) => {
      const ti = (t) => { const i = TYPE_ORDER.indexOf(t); return i < 0 ? 99 : i; };
      if (by === 'ty') return ti(a.ty) - ti(b.ty) || a.t.localeCompare(b.t);
      if (by === 'new') return (b.created || '').localeCompare(a.created || '');
      if (by === 'pd') return (b.pd || '').localeCompare(a.pd || '') || a.t.localeCompare(b.t);
      if (by === 's') return (a.s || '').localeCompare(b.s || '') || a.t.localeCompare(b.t);
      if (by === 'fav') return (USER.fav.includes(b.k) - USER.fav.includes(a.k)) || a.t.localeCompare(b.t);
      return a.t.localeCompare(b.t);
    },
    card: (it) => {
      const b = [];
      if (it.o === 'Куплено') b.push(`<span class="bdg paid">${tr('Куплено')}${it.pd ? ' · ' + esc(String(it.pd).slice(0, 4)) : ''}</span>`);
      if (it.o === 'Quixel') b.push('<span class="bdg quix">Quixel</span>');
      if (it.en === 'Только файлом') b.push(`<span class="bdg file">${tr('Файлом')}</span>`);
      if (it.uf === 'Есть ' + LATEST_UE) b.push(`<span class="bdg ue">UE ${LATEST_UE} ✓</span>`);
      else if (it.uf === 'Нет ' + LATEST_UE) b.push(`<span class="bdg old">${esc(tr('до {v}', { v: (it.ue || []).slice(-1)[0] }))}</span>`);
      if (it.mh) b.push('<span class="bdg ue">MetaHuman</span>');
      const ue = it.ue && it.ue.length ? esc(`UE ${it.ue[0]}${it.ue.length > 1 ? '–' + it.ue[it.ue.length - 1] : ''}`) : '';
      const tags = [`<span class="tag ty">${esc(tr(it.ty))}</span>`, it.mh ? `<span class="tag">${esc(tr(it.mh))}</span>` : '', ...(it.se || []).slice(0, 2).map(s => `<span class="tag">${esc(tr(s))}</span>`), ue ? `<span class="tag">${ue}</span>` : ''].join('');
      return `<div class="card"><a class="thumb none" data-open="${esc(it.link)}">${it.noThumb ? '' : thumbImg('fab', it.id)}<span class="np">${tr('нет превью')}</span><div class="badges">${b.join('')}</div>${favBtn(it.k)}</a>
        <div class="body"><div class="t" data-open="${esc(it.link)}" title="${esc(it.t)}">${esc(it.t)}</div><div class="s">${esc(it.s || '—')}</div><div class="meta">${tags}</div></div></div>`;
    },
    row: (it) => `<tr><td class="favtd${USER.fav.includes(it.k) ? ' on' : ''}" data-fav="${esc(it.k)}">${USER.fav.includes(it.k) ? '★' : '☆'}</td><td class="n"><a data-open="${esc(it.link)}">${esc(it.t)}</a><div class="s">${esc(it.s)}</div></td><td>${esc(tr(it.ty))}</td><td>${esc(tr(it.mh || ''))}</td><td>${esc(tr(it.o))}${it.pd ? ' · ' + esc(it.pd) : ''}</td><td>${esc(tr(it.st))}</td><td>${esc((it.ue || []).join(', '))}</td></tr>`,
    head: ['', 'Название', 'Тип', 'MetaHuman', 'Откуда', 'Стиль', 'Версии UE'],
    summary: (all) => {
      const P = D.purchases;
      const spent = P ? Object.entries(P.totals || {}).map(([c, v]) => money(Math.round(v), c)).join(' + ') : '—';
      return [[fmt(all.length), 'всего паков'], [fmt(all.filter(i => i.o === 'Куплено').length), 'куплено'], [spent, 'потрачено всего'],
        [fmt(all.filter(i => i.mh).length), 'для MetaHuman'], [fmt(all.filter(i => i.en === 'Только файлом').length), 'только файлом']];
    },
    csv: (list) => [['Название', 'Автор', 'Тип', 'MetaHuman', 'Откуда', 'Дата покупки', 'Стиль', 'Сеттинг', 'Формат', 'Версии UE', 'Ссылка'],
      ...list.map(i => [i.t, i.s, i.ty, i.mh, i.o, i.pd, i.st, (i.se || []).join(', '), i.en, (i.ue || []).join(', '), i.link])],
    placeholder: 'Поиск по названию, автору, тегам…',
  },
  qx: {
    items: () => QX,
    search: (it) => `${it.t} ${it.qid} ${it.pack || ''} ${it.fabTitle || ''} ${it.tags || ''} ${(it.cat || []).join(' ')}`,
    groups: () => [
      { key: 'cat0', label: 'Категория', get: (it) => (it.cat || [])[0] || '—' },
      { key: 'cat1', label: 'Подкатегория', get: (it) => (it.cat || [])[1] || '—', dependsOn: 'cat0' },
      { key: 'cat2', label: 'Раздел', get: (it) => (it.cat || [])[2] || '', dependsOn: 'cat1' },
      { key: 'where', label: 'Где искать', vals: ['Fab и Quixel', 'Только Fab', 'Только Quixel / Bridge'] },
      { key: 'res', label: 'Разрешение', get: (it) => it.res >= 8192 ? '8K' : it.res >= 4096 ? '4K' : it.res >= 2048 ? '2K' : it.res ? 'до 1K' : (it.inFab ? 'на Fab' : '—'), vals: ['8K', '4K', '2K', 'до 1K', 'на Fab'] },
      { key: 'hasid', label: 'Quixel-ID', get: (it) => it.qid ? 'Есть ID' : 'ID не найден', vals: ['Есть ID', 'ID не найден'] },
    ],
    sorts: [['t', 'По названию'], ['cat', 'По категории'], ['fav', 'Сначала избранные']],
    sortFn: (by) => (a, b) => by === 'cat' ? (a.cat || []).join('/').localeCompare((b.cat || []).join('/')) || a.t.localeCompare(b.t)
      : by === 'fav' ? (USER.fav.includes(b.k) - USER.fav.includes(a.k)) || a.t.localeCompare(b.t) : a.t.localeCompare(b.t),
    card: (it) => {
      const w = it.where === 'Fab и Quixel' ? 'b' : (it.inFab ? 'f' : 'q');
      const img = it.fabId ? thumbImg('fab', it.fabId) : thumbImg('qx', it.qid);
      const fabUrl = it.fabId ? 'https://www.fab.com/listings/' + it.fabId : '';
      const qxUrl = it.inQx ? 'https://quixel.com/assets/' + it.qid : '';
      return `<div class="card"><a class="thumb none" data-open="${esc(fabUrl || qxUrl)}">${img}<span class="np">${tr('нет превью')}</span><div class="badges"><span class="where ${w}">${esc(tr(it.where))}</span></div>${favBtn(it.k)}</a>
        <div class="body"><div class="t" title="${esc(it.t)}">${esc(it.t)}</div>${it.fabTitle && it.fabTitle !== it.t ? `<div class="s">${esc(tr('на Fab: {v}', { v: it.fabTitle }))}</div>` : ''}${it.pack ? `<div class="s">${esc(tr('Пак: {v}', { v: it.pack }))}</div>` : ''}${it.pending ? `<div class="s">${tr('описание ещё загружается…')}</div>` : ''}${it.gone ? `<div class="s">${tr('снят с quixel.com, ищите по ID в Fab')}</div>` : ''}
        <div class="links">${it.qid ? `<span class="qid" data-copy="${esc(it.qid)}" title="${tr('Скопировать ID для поиска в Bridge / Fab')}">ID ${esc(it.qid)} ⧉</span>` : `<span class="s">${tr('ID не найден')}</span>`}
        ${fabUrl ? `<a class="lnk" data-open="${fabUrl}">Fab ↗</a>` : ''}${qxUrl ? `<a class="lnk" data-open="${qxUrl}">Quixel ↗</a>` : ''}</div>
        <div class="meta">${(it.cat || []).filter(Boolean).map(c => `<span class="tag">${esc(c)}</span>`).join('')}</div></div></div>`;
    },
    row: (it) => `<tr><td class="favtd${USER.fav.includes(it.k) ? ' on' : ''}" data-fav="${esc(it.k)}">${USER.fav.includes(it.k) ? '★' : '☆'}</td><td class="n">${esc(it.t)}</td><td><span class="qid" data-copy="${esc(it.qid)}">${esc(it.qid || '—')}</span></td><td>${esc((it.cat || []).join(' / '))}</td><td>${esc(tr(it.where))}</td></tr>`,
    head: ['', 'Название', 'Quixel-ID', 'Категория', 'Где искать'],
    summary: (all) => [[fmt(all.length), 'ассетов Megascans'], [fmt(all.filter(i => i.where === 'Fab и Quixel').length), 'и на Fab, и на Quixel'],
      [fmt(all.filter(i => i.where === 'Только Fab').length), 'только на Fab'], [fmt(all.filter(i => i.where === 'Только Quixel / Bridge').length), 'только в Quixel / Bridge']],
    csv: (list) => [['Название', 'Quixel-ID', 'Категория', 'Где искать', 'Fab'], ...list.map(i => [i.t, i.qid, (i.cat || []).join(' / '), i.where, i.fabId ? 'https://www.fab.com/listings/' + i.fabId : ''])],
    placeholder: 'Поиск по названию или Quixel-ID…',
  },
  wish: {
    items: () => wishItems(),
    search: (it) => `${it.t} ${it.s} ${it.ty || ''} ${it.note || ''} ${it.tags || ''}`,
    groups: () => [
      { key: 'pr$', label: 'Цена', multi: true, get: (it) => [it.pct ? 'Скидка сейчас' : '', it.target && nowPrice(it) != null && nowPrice(it) <= it.target ? 'Не дороже желаемой' : '', isLow(it) ? 'Минимум за всё время' : ''].filter(Boolean), vals: ['Скидка сейчас', 'Не дороже желаемой', 'Минимум за всё время'] },
      { key: 'prio', label: 'Приоритет', get: (it) => it.prio || 'Не задан', vals: ['Высокий', 'Средний', 'Низкий', 'Не задан'] },
      { key: 'ty', label: 'Тип', get: (it) => it.ty || '—', vals: TYPE_ORDER },
      { key: 'mh', label: 'MetaHuman', vals: MH_ORDER },
      { key: 'status', label: 'Статус', get: (it) => it.missing ? 'Удалён из магазина' : (it.pending ? 'Ждёт обновления' : 'В вишлисте'), vals: ['В вишлисте', 'Удалён из магазина', 'Ждёт обновления'] },
      { key: 'src', label: 'Откуда', get: (it) => (it.src || []).includes('fab') ? 'Официальный вишлист Fab' : 'Добавлено в приложении', vals: ['Официальный вишлист Fab', 'Добавлено в приложении'] },
    ],
    sorts: [['disc', 'Сначала скидки'], ['prio', 'По приоритету'], ['cheap', 'Сначала дешёвые'], ['exp', 'Сначала дорогие'], ['new', 'Недавно добавленные'], ['t', 'По названию']],
    sortFn: (by) => {
      const PR = { 'Высокий': 0, 'Средний': 1, 'Низкий': 2 };
      return (a, b) => by === 'disc' ? (b.pct || 0) - (a.pct || 0) || (PR[a.prio] ?? 3) - (PR[b.prio] ?? 3) || a.t.localeCompare(b.t)
        : by === 'prio' ? (PR[a.prio] ?? 3) - (PR[b.prio] ?? 3) || a.t.localeCompare(b.t)
        : by === 'cheap' ? (nowPrice(a) ?? 1e9) - (nowPrice(b) ?? 1e9)
        : by === 'exp' ? (nowPrice(b) ?? -1) - (nowPrice(a) ?? -1)
        : by === 'new' ? (b.added || '').localeCompare(a.added || '') : a.t.localeCompare(b.t);
    },
    card: (it) => wishCard(it),
    row: (it) => `<tr><td class="favtd"></td><td class="n"><a data-open="https://www.fab.com/listings/${esc(it.id)}">${esc(it.t)}</a><div class="s">${esc(it.s)}</div></td><td>${esc(tr(it.ty || ''))}</td><td>${it.pct ? '−' + esc(it.pct) + '% ' : ''}${money(nowPrice(it), it.cur)}</td><td>${esc(tr(it.prio || ''))}</td><td>${esc(it.note || '')}</td></tr>`,
    head: ['', 'Название', 'Тип', 'Цена', 'Приоритет', 'Заметка'],
    summary: (all) => {
      const priced = all.filter(i => !i.pending && !i.missing && !i.free && i.price != null);
      const cur = (priced[0] || {}).cur || '';
      const sum = priced.reduce((s, i) => s + i.price, 0), now = priced.reduce((s, i) => s + nowPrice(i), 0);
      return [[fmt(all.length), 'паков в вишлисте'], [fmt(all.filter(i => i.pct).length), 'со скидкой сейчас'], [money(Math.round(now), cur), 'всё сразу по текущим ценам'], [money(Math.round(sum - now), cur), 'экономия от скидок']];
    },
    csv: (list) => [['Название', 'Автор', 'Тип', 'Цена', 'Цена со скидкой', 'Скидка %', 'Приоритет', 'Желаемая цена', 'Заметка', 'Ссылка'],
      ...list.map(i => [i.t, i.s, i.ty, i.price, i.pct ? i.dp : '', i.pct || '', i.prio || '', i.target || '', i.note || '', 'https://www.fab.com/listings/' + i.id])],
    placeholder: 'Поиск по вишлисту: название, автор, заметка…',
  },
};

// ---------- вишлист ----------
const nowPrice = (it) => it.pct ? it.dp : it.price;
// «минимум за всё время» — только если цена сейчас минимальная И раньше бывала выше
const isLow = (it) => { const np = nowPrice(it), h = it.hist || []; return np != null && it.minSeen != null && np <= it.minSeen && h.some(p => p[1] > np); };
let WEDIT = null;
function wishItems() {
  const w = USER.wish, out = [], seen = new Set();
  for (const b of (D.wishlist || {}).items || []) {
    if (w.hidden[b.id]) continue; seen.add(b.id);
    out.push({ ...b, k: 'W:' + b.id, ty: b.lt ? ptype(b) : '', mh: metahuman(b), ...(w.meta[b.id] || {}) });
  }
  for (const [id, a] of Object.entries(w.add)) {
    if (seen.has(id) || w.hidden[id]) continue;
    out.push({ id, k: 'W:' + id, t: a.title || tr('Новый пак (ждёт обновления)'), s: '', pending: true, added: a.added, src: ['user'], ...(w.meta[id] || {}) });
  }
  return out;
}
function wishCard(it) {
  const url = esc('https://www.fab.com/listings/' + it.id);
  const b = [];
  if (it.pending) b.push(`<span class="bdg file">${tr('Ждёт обновления')}</span>`);
  if (it.missing) b.push(`<span class="bdg old">${tr('Удалён из магазина')}</span>`);
  let price = '';
  if (!it.pending && !it.missing) {
    const np = nowPrice(it), hints = [];
    if (it.pct && it.end) hints.push(esc(tr('скидка до {d}', { d: it.end.slice(8, 10) + '.' + it.end.slice(5, 7) })));
    if (isLow(it)) hints.push(`<span class="good">${tr('минимум за всё время')}</span>`);
    else if (it.minSeen != null && it.minSeen < np) hints.push(tr('мин. было {v}', { v: money(it.minSeen, it.cur) }));
    if (it.target) hints.push(np != null && np <= it.target ? `<span class="good">${tr('не дороже желаемой ({v})', { v: money(it.target, it.cur) })}</span>` : tr('желаемая: {v}', { v: money(it.target, it.cur) }));
    price = it.free ? `<div class="price"><span class="now">${tr('Бесплатно')}</span></div>`
      : `<div class="price">${it.pct ? `<span class="pct">−${esc(it.pct)}%</span><span class="now">${money(it.dp, it.cur)}</span><span class="old">${money(it.price, it.cur)}</span>` : `<span class="now">${money(it.price, it.cur)}</span>`}${hints.length ? `<span class="hint">${hints.join(' · ')}</span>` : ''}</div>`;
  }
  const editing = WEDIT === it.id;
  const ed = editing ? `<div class="wedit"><div class="wrow"><select data-f="prio"><option value="">${tr('Приоритет: не задан')}</option>${['Высокий', 'Средний', 'Низкий'].map(p => `<option value="${p}"${it.prio === p ? ' selected' : ''}>${esc(tr(p))}</option>`).join('')}</select>
      <input data-f="target" type="number" min="0" step="0.01" placeholder="${tr('Желаемая цена')}${it.cur ? ', ' + esc(it.cur) : ''}" value="${esc(it.target ?? '')}"></div>
      <textarea data-f="note" placeholder="${tr('Заметка: зачем нужен, под какой проект')}">${esc(it.note || '')}</textarea>
      <div class="wrow"><button class="btn" data-wsave="${esc(it.id)}">${tr('Сохранить')}</button><button class="btn" data-wcancel="1">${tr('Отмена')}</button><button class="lnk del" data-wdel="${esc(it.id)}">${tr('Убрать из вишлиста')}</button></div></div>` : '';
  const meta = [it.ty ? `<span class="tag ty">${esc(tr(it.ty))}</span>` : '', it.prio ? `<span class="pr${it.prio === 'Высокий' ? ' h' : ''}">${esc(tr(it.prio))}</span>` : ''].join('');
  return `<div class="wcard"><a class="thumb none" data-open="${url}">${thumbImg('fab', it.id)}<span class="np">${tr('нет превью')}</span><div class="badges">${b.join('')}</div></a>
    <div class="body"><div class="t" data-open="${url}" title="${esc(it.t)}">${esc(it.t)}</div><div class="s">${esc(it.s || '—')}</div>${price}
    ${it.note && !editing ? `<div class="note">${esc(it.note)}</div>` : ''}
    <div class="meta">${meta}${editing ? '' : `<button class="lnk" data-wedit="${esc(it.id)}">${tr('✎ заметка, приоритет, цена')}</button>`}</div>${ed}</div></div>`;
}
async function addWishUrl() {
  const inp = $('wurl'), v = inp.value.trim(), msg = $('wmsg');
  const m = v.match(/listings\/([0-9a-f-]{36})/i);
  if (!m) { msg.textContent = tr('Нужна ссылка вида https://www.fab.com/listings/…'); return; }
  const id = m[1].toLowerCase();
  if (LIB.some(i => i.id === id)) { msg.textContent = tr('Этот пак уже есть в твоей библиотеке.'); return; }
  msg.textContent = tr('Загружаю данные с Fab…');
  USER.wish.add[id] = { url: 'https://www.fab.com/listings/' + id, added: new Date().toISOString().slice(0, 10) };
  delete USER.wish.hidden[id];
  await window.api.saveUser(USER);
  inp.value = '';
  const r = await window.api.addWish(v);
  if (r.error) { msg.textContent = tr('{e} Пак сохранён и подтянется при следующем обновлении.', { e: tr(r.error) }); render(); return; }
  if (r.item.owned) msg.textContent = tr('Этот пак у тебя уже куплен — всё равно добавил.');
  else msg.textContent = r.item.pct ? tr('Добавлено: {t} — сейчас скидка {p}%.', { t: r.item.t, p: r.item.pct }) : tr('Добавлено: {t}.', { t: r.item.t });
  USER.wish.add[id].title = r.item.t;
  await window.api.saveUser(USER);
  D = await window.api.getData();
  render();
}

// ---------- фильтрация и отрисовка ----------
function groupVal(g, it) { return g.get ? g.get(it) : it[g.key]; }
function matches(it, st, skip) {
  const cfg = CFG[TAB];
  if (st.onlyFav && !USER.fav.includes(it.k)) return false;
  if (st.coll) { const c = (CUST.items || []).find(x => x.id === st.coll); if (c && !inColl(c, it)) return false; }
  if (st.q) { const s = cfg.search(it).toLowerCase(); for (const w of st.q.split(/\s+/)) if (w && !s.includes(w)) return false; }
  for (const g of cfg.groups()) {
    if (g.key === skip) continue;
    const sel = st.f[g.key]; if (!sel || !sel.size) continue;
    const v = groupVal(g, it);
    if (Array.isArray(v) ? !v.some(x => sel.has(x)) : !sel.has(v)) return false;
  }
  return true;
}
function renderFilters(all, st) {
  const box = $('filters'); box.innerHTML = '';
  for (const g of CFG[TAB].groups()) {
    if (g.dependsOn && !(st.f[g.dependsOn] && st.f[g.dependsOn].size)) continue;
    const counts = new Map();
    for (const it of all) { if (!matches(it, st, g.key)) continue; const v = groupVal(g, it); for (const x of (Array.isArray(v) ? v : [v])) if (x) counts.set(x, (counts.get(x) || 0) + 1); }
    const vals = g.vals ? g.vals.filter(v => counts.has(v) || (st.f[g.key] && st.f[g.key].has(v))) : [...counts.keys()].sort((a, b) => counts.get(b) - counts.get(a));
    if (!vals.length) continue;
    const row = document.createElement('div'); row.className = 'frow';
    row.innerHTML = `<span class="flab">${esc(tr(g.label))}</span>` + vals.map(v => `<span class="chip${st.f[g.key] && st.f[g.key].has(v) ? ' on' : ''}" data-g="${esc(g.key)}" data-v="${esc(v)}">${esc(tr(v))}<b>${fmt(counts.get(v) || 0)}</b></span>`).join('');
    box.appendChild(row);
  }
}
let current = [];
function render(keepScroll) {
  const cfg = CFG[TAB], st = tabState(TAB);
  if (!D || !D.profile) { $('welcome').hidden = false; for (const id of ['filters', 'summary', 'out', 'count']) $(id).innerHTML = ''; return; }
  $('welcome').hidden = true;
  $('wadd').hidden = TAB !== 'wish';
  if (TAB !== 'wish') $('wmsg').textContent = '';
  $('q').placeholder = tr(cfg.placeholder);
  const all = cfg.items();
  current = all.filter(it => matches(it, st)).sort(cfg.sortFn(st.sort));
  renderColls(all, st);
  renderFilters(all, st);
  $('summary').innerHTML = cfg.summary(all).map(([v, k]) => `<div class="stat"><div class="v">${v}</div><div class="k">${esc(tr(k))}</div></div>`).join('');
  $('count').textContent = tr('Найдено: {n}', { n: fmt(current.length) });
  $('reset').hidden = !(st.q || st.onlyFav || st.coll || Object.values(st.f).some(s => s.size));
  $('favn').textContent = USER.fav.length;
  $('favbtn').classList.toggle('on', st.onlyFav);
  $('favbtn').hidden = TAB === 'wish';
  $('view').textContent = tr(st.view === 'grid' ? 'Таблица' : 'Сетка');
  $('nLib').textContent = fmt(LIB.length); $('nQx').textContent = fmt(QX.length); $('nWish').textContent = fmt(wishItems().length);
  const y = scrollY;
  st.shown = 0;
  $('out').innerHTML = !current.length ? `<div class="empty">${tr('Ничего не найдено.')}</div>`
    : st.view === 'grid' ? '<div class="grid" id="g"></div>' : `<table><thead><tr>${cfg.head.map(h => `<th>${esc(tr(h))}</th>`).join('')}</tr></thead><tbody id="g"></tbody></table>`;
  more();
  if (keepScroll) scrollTo(0, y);
  const upd = TAB === 'lib' ? D.library.updated : TAB === 'wish' ? D.wishlist.updated : (D.megascans.updated || D.quixel.updated);
  $('note').textContent = upd ? tr('Данные обновлены {d}. Тип, стиль, сеттинг и MetaHuman определены автоматически по тегам и названию — возможны неточности.', { d: upd }) : tr('Данных пока нет — нажми «⟳ Обновить».');
}
function more() {
  const st = tabState(TAB), cfg = CFG[TAB], g = $('g'); if (!g) { $('more').hidden = true; return; }
  const step = st.view === 'grid' ? PAGE : 500;
  const slice = current.slice(st.shown, st.shown + step);
  g.insertAdjacentHTML('beforeend', slice.map(st.view === 'grid' ? cfg.card : cfg.row).join(''));
  st.shown += slice.length;
  $('more').hidden = st.shown >= current.length;
  $('more').textContent = tr('Показать ещё (осталось {n})', { n: fmt(current.length - st.shown) });
}
function setSorts() { const st = tabState(TAB); $('sort').innerHTML = CFG[TAB].sorts.map(([v, l]) => `<option value="${v}"${st.sort === v ? ' selected' : ''}>${esc(tr(l))}</option>`).join(''); $('q').value = st.q; }

// ---------- события ----------
document.addEventListener('error', e => { if (e.target && e.target.tagName === 'IMG') e.target.remove(); }, true);
$('tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (!b) return; TAB = b.dataset.tab; document.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('on', x === b)); setSorts(); render(); scrollTo(0, 0); });
let qt; $('q').addEventListener('input', e => { clearTimeout(qt); qt = setTimeout(() => { tabState(TAB).q = e.target.value.trim().toLowerCase(); render(); }, 150); });
$('sort').onchange = e => { tabState(TAB).sort = e.target.value; render(); };
$('view').onclick = () => { const st = tabState(TAB); st.view = st.view === 'grid' ? 'table' : 'grid'; render(); };
$('favbtn').onclick = () => { const st = tabState(TAB); st.onlyFav = !st.onlyFav; render(); };
$('reset').onclick = () => { const st = tabState(TAB); st.q = ''; st.f = {}; st.onlyFav = false; st.coll = null; $('q').value = ''; render(); };
$('more').onclick = more;
const collClick = async (e) => {
  let el;
  if (e.target.closest('#callBtn')) { $('cpanel').hidden = !$('cpanel').hidden; if (!$('cpanel').hidden) $('cq').focus(); render(true); return; }
  if ((el = e.target.closest('[data-coll]'))) { const st = tabState(TAB); st.coll = st.coll === el.dataset.coll ? null : el.dataset.coll; render(); return; }
  if ((el = e.target.closest('[data-cpin]'))) { const c = CUST.items.find(x => x.id === el.dataset.cpin); if (c) { c.pinned = !c.pinned; await saveCust(); render(true); } return; }
  if ((el = e.target.closest('[data-cdel]'))) { const c = CUST.items.find(x => x.id === el.dataset.cdel); if (!c || !confirm(tr('Удалить подборку «{n}»?', { n: c.name }))) return;
    CUST.items = CUST.items.filter(x => x !== c); for (const t in S) if (S[t].coll === c.id) S[t].coll = null; await saveCust(); render(true); }
};
$('colls').addEventListener('click', collClick);
$('cpanel').addEventListener('click', collClick);
$('cclose').onclick = () => { $('cpanel').hidden = true; render(true); };
$('cq').addEventListener('input', () => render(true));
window.addEventListener('scroll', () => { const m = $('more'); if (!m.hidden && m.getBoundingClientRect().top < innerHeight + 600) more(); }, { passive: true });
$('filters').addEventListener('click', e => {
  const c = e.target.closest('[data-g]'); if (!c) return;
  const st = tabState(TAB), k = c.dataset.g, v = c.dataset.v;
  const s = st.f[k] || (st.f[k] = new Set()); s.has(v) ? s.delete(v) : s.add(v);
  // при смене категории Quixel сбрасываем вложенные уровни
  if (k === 'cat0') { delete st.f.cat1; delete st.f.cat2; } if (k === 'cat1') delete st.f.cat2;
  render();
});
$('out').addEventListener('click', async e => {
  let el;
  if ((el = e.target.closest('[data-fav]'))) { e.preventDefault(); const k = el.dataset.fav; const i = USER.fav.indexOf(k); i < 0 ? USER.fav.push(k) : USER.fav.splice(i, 1); window.api.saveUser(USER); el.classList.toggle('on', i < 0); el.textContent = i < 0 ? '★' : '☆'; $('favn').textContent = USER.fav.length; return; }
  if ((el = e.target.closest('[data-copy]'))) { if (el.dataset.copy) { await window.api.copy(el.dataset.copy); toast(tr('ID {id} скопирован', { id: el.dataset.copy })); } return; }
  if ((el = e.target.closest('[data-wedit]'))) { WEDIT = el.dataset.wedit; render(true); return; }
  if (e.target.closest('[data-wcancel]')) { WEDIT = null; render(true); return; }
  if ((el = e.target.closest('[data-wsave]'))) {
    const id = el.dataset.wsave, box = el.closest('.wedit');
    const m = {}; const prio = box.querySelector('[data-f=prio]').value, tg = box.querySelector('[data-f=target]').value, note = box.querySelector('[data-f=note]').value.trim();
    if (prio) m.prio = prio; if (tg !== '') m.target = +tg; if (note) m.note = note;
    if (Object.keys(m).length) USER.wish.meta[id] = m; else delete USER.wish.meta[id];
    WEDIT = null; await window.api.saveUser(USER); render(true); return;
  }
  if ((el = e.target.closest('[data-wdel]'))) { const id = el.dataset.wdel; delete USER.wish.add[id]; USER.wish.hidden[id] = true; delete USER.wish.meta[id]; WEDIT = null; await window.api.saveUser(USER); render(true); return; }
  if ((el = e.target.closest('[data-open]'))) { e.preventDefault(); if (el.dataset.open) window.api.open(el.dataset.open); }
});
$('wbtn').onclick = addWishUrl;
$('wurl').addEventListener('keydown', e => { if (e.key === 'Enter') addWishUrl(); });
for (const id of ['syncMenu', 'profMenu']) $(id).firstElementChild.addEventListener('click', e => { e.stopPropagation(); $(id).classList.toggle('open'); });
document.addEventListener('click', () => { $('syncMenu').classList.remove('open'); $('profMenu').classList.remove('open'); });
$('profMenu').querySelector('.drop').addEventListener('click', e => e.stopPropagation());
async function runSync(what) {
  $('status').classList.add('busy'); $('status').textContent = tr(what === 'all' ? 'Открываю окно входа…' : 'Обновление…');
  const r = await window.api.sync(what);
  $('status').classList.remove('busy');
  $('status').textContent = r.error ? tr('Ошибка: {e}', { e: tr(r.error) }) : tr('Готово: {l}', { l: (r.log || []).map(x => tr(x)).join(' · ') });
  await reload();
}
$('syncMenu').addEventListener('click', e => {
  const b = e.target.closest('[data-sync]'); if (!b) return;
  $('syncMenu').classList.remove('open');
  runSync(b.dataset.sync);
});
$('loginBtn').onclick = () => runSync('all');
window.api.onProgress(d => { if (d.stage === 'done' || d.stage === 'error') return; $('status').classList.add('busy'); const m = tr(d.msg); $('status').textContent = m; $('status').title = m; });
$('autoWish').onchange = async e => { D.settings.autoWish = e.target.checked; await window.api.saveSettings(D.settings); };
$('folderBtn').onclick = () => window.api.openFolder();
$('logoutBtn').onclick = async () => { if (!confirm(tr('Выйти из аккаунтов Fab, Epic и Quixel в приложении? Данные на диске останутся.'))) return; await window.api.logout(); await reload(); toast(tr('Вы вышли. Нажмите «Войти», чтобы зайти другим аккаунтом')); };
$('exportBtn').onclick = async () => {
  const rows = CFG[TAB].csv(current); rows[0] = rows[0].map(h => tr(h));
  const cell = (v) => { let t = String(v ?? ''); if (/^[=+\-@\t\r]/.test(t)) t = "'" + t; return `"${t.replace(/"/g, '""')}"`; }; // защита от формул в Excel
  const csv = rows.map(r => r.map(cell).join(';')).join('\r\n');
  if (await window.api.exportCsv(csv)) toast(tr('CSV сохранён'));
};

async function reload() {
  D = await window.api.getData();
  USER = D.user || { fav: [], wish: { add: {}, meta: {}, hidden: {} } };
  USER.wish = Object.assign({ add: {}, meta: {}, hidden: {} }, USER.wish || {});
  CUST = D.custom || { version: 1, items: [] }; if (!Array.isArray(CUST.items)) CUST.items = []; CMAP.clear();
  if (D.profile) {
    LIB = buildLibrary(D.library || { items: [] }, D.purchases);
    QX = buildQuixel(D.megascans, D.quixel);
    $('profName').textContent = tr('Аккаунт: {n}', { n: D.profile.name });
    $('autoWish').checked = !!(D.settings || {}).autoWish;
  } else { LIB = []; QX = []; $('profName').textContent = tr('Не выполнен вход'); }
  setSorts();
  render(true);
}
if (window.api.onChanged) window.api.onChanged(async () => { await reload(); toast(tr('Подборки обновлены')); });
// язык интерфейса
I18N.localizeDom(document.body);
$('lang').innerHTML = Object.entries(I18N.LANGS).map(([k, v]) => `<option value="${k}"${k === LANG ? ' selected' : ''}>${v}</option>`).join('');
$('lang').onchange = (e) => { try { localStorage.setItem('lang', e.target.value); } catch (err) {} if (window.api.setLang) window.api.setLang(e.target.value); location.reload(); };
if (window.api.setLang) window.api.setLang(LANG);
reload();
