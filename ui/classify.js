// Классификация паков: тип, стиль, сеттинг, MetaHuman, версии UE, покупки.
const STYLIZED = /stylized|stylised|cartoon|toon|cel shad|anime|chibi|kawaii|cute|pixel|voxel|hand ?painted/;
const LOWPOLY = /low ?poly|lowpoly|psx|ps1|polygon -|synty/;
const REAL = /realistic|photoreal|photogrammetry|scan|megascans|megaplants|rawscan|nanite|archviz|8k|4k/;
const SETTINGS = [
  ['Средневековье / фэнтези', /medieval|fantasy|viking|castle|knight|dungeon|\brpg\b|magic|wizard|sword|gothic|potion|alchemy|dragon|elf|orc|spell/],
  ['Sci‑fi / киберпанк', /sci-?fi|cyber|futur|space|robot|mech\b|mecha|plasma|laser|alien|spaceship/],
  ['СССР / постсовет', /soviet|post-soviet|ussr|russian|khrushch|sosnovka|сосновка|makarov|kalash|ak-?47|ppsh|mosin|kulich/],
  ['Хоррор', /horror|creepy|zombie|blood|halloween|scary|morgue|backrooms|gore|spooky|haunted|asylum|mutant|monster/],
  ['Постапокалипсис / заброшка', /post[- ]?apoc|apocalyp|abandoned|ruined|wasteland|derelict|survival|decay/],
  ['Современный город', /\bcity\b|urban|street|downtown|office|apartment|store|shop|mall|airport|subway|metro|traffic|parking|gas station|fuel station|cafe|restaurant|hotel|lobby|storefront|new[- ]york|london|lisbon|amsterdam|rome/],
  ['Интерьер / архвиз', /interior|furniture|sofa|chair|table|kitchen|bed\b|bathroom|living ?room|wardrobe|lamp|archviz|archvis|penthouse|house/],
  ['Индустрия', /industrial|factory|warehouse|pipe|power plant|construction|electrical|substation|generator|pallet|crate|container|garage|workshop/],
  ['Природа', /forest|tree|foliage|biome|grass|plant|flower|bush|shrub|rock|cliff|mountain|desert|coast|beach|river|lake|landscape|terrain|nature|moss|fern|jungle|island/],
  ['Военное', /military|\bwar\b|ww2|wwii|army|tactical|soldier|tank|grenade|ammo|bunker|rifle|pistol|shotgun|smg|sniper|gun/],
  ['Восток / Азия', /japan|chinese|china|korea|asian|samurai|katana|ninja|tokyo|temple|pagoda|hanok|joseon/],
  ['История / ретро', /victorian|ancient|roman|egypt|histor|retro|vintage|antique|1920|1940|colonial|western|wild west|cowboy|steampunk|baroque/],
];
const blob = (x) => `${x.t || ''} ${x.tags || ''} ${x.c || ''}`.toLowerCase();

function ptype(x) {
  const s = x.s || '', lt = x.lt || '', top = (x.c || '').split('/')[0];
  if (/Quixel/.test(s)) {
    if (/Megaplants/.test(s) || top === 'nature-plants') return 'Quixel · растения';
    if (lt === 'material') return 'Quixel · материалы';
    if (lt === 'decal') return 'Quixel · декали';
    return 'Quixel · 3D-модели';
  }
  if (!lt) return 'Нет данных';
  const M = { 'tool-and-plugin': 'Плагины и инструменты', 'game-system': 'Геймплей: системы и шаблоны', 'game-template': 'Геймплей: системы и шаблоны',
    'tutorials-examples': 'Примеры и обучение', audio: 'Аудио', material: 'Материалы, декали, HDRI', decal: 'Материалы, декали, HDRI', hdri: 'Материалы, декали, HDRI',
    vfx: 'VFX', 'sprites-and-flipbooks': 'VFX', animation: 'Анимации', ui: 'UI и иконки' };
  if (M[lt]) return M[lt];
  const T = { environments: 'Окружения и наборы', 'buildings-architecture': 'Здания и архитектура', 'characters-creatures': 'Персонажи и одежда', 'clothing-accessories': 'Персонажи и одежда',
    'nature-plants': 'Растительность и природа', 'nature-terrain': 'Растительность и природа', 'vehicles-transportation': 'Транспорт', 'weapons-combat': 'Оружие' };
  return T[top] || 'Пропсы';
}
function style(x) { const b = blob(x); if (LOWPOLY.test(b)) return 'Low poly'; if (STYLIZED.test(b)) return 'Стилизация'; if (REAL.test(b) || /Quixel/.test(x.s || '')) return 'Реализм'; return ''; }
function settingsOf(x) { const b = blob(x); return SETTINGS.filter(([, rx]) => rx.test(b)).map(([n]) => n); }

// MetaHuman: всё, что связано с MetaHuman, и подкатегория.
function metahuman(x) {
  const b = blob(x), f = x.f || [];
  const isMH = f.includes('metahuman') || /metahuman|meta human|\bmhc\b|\bmh\b|mhpkg|metaavatar/.test(b);
  const groom = /\bgroom|hair ?card|hairstyle|haircut|\bhair\b|\bbeard|eyebrow|eyelash|mustache|ponytail|\bbraid|\bbob\b|\bbun\b|sideburn/.test(b);
  if (!isMH && !(groom && /\bgroom/.test(b))) return '';
  const t = (x.t || '').toLowerCase();
  const CLOTH = /cloth|outfit|shirt|t-shirt|pants|jeans|shoes|boots|heels|sneaker|dress|jacket|coat|hoodie|skirt|underwear|underpants|thong|lingerie|uniform|armor|armour|suit|sportswear|tank top|camisole|singlet|sweat|\bhat\b|\bcap\b|glasses|backpack|watch|mask/;
  const HAIR = /\bgroom|hair|haircard|hairstyle|haircut|\bbeard|eyebrow|eyelash|mustache|ponytail|\bbraid|\bbob\b|\bbun\b|sideburn|crewcut|undercut|\bfade\b|\blob\b/;
  if (x.lt === 'tool-and-plugin' || x.lt === 'game-system' || /plugin|\btool|creator|customizer|generator|system|zenblink|zendyn|alpha mask|toolkit/.test(t)) return 'Инструменты и системы';
  if (x.lt === 'animation' || /animation|mocap|\bposes?\b/.test(t)) return 'Анимации и позы';
  if (HAIR.test(t)) return 'Волосы и грумы';
  if (CLOTH.test(t)) return 'Одежда и аксессуары';
  if (/character|editable|preset|\bkids?\b|\bgirl|\bboy|\bman\b|woman|\bhead\b|\bbase\b|tca:|metaavatar/.test(t)) return 'Готовые персонажи';
  if (/texture|skin|tattoo|makeup|overlay|decal/.test(t)) return 'Текстуры кожи и тела';
  if (groom && /\bgroom|hair/.test(b)) return 'Волосы и грумы';
  if (CLOTH.test(b)) return 'Одежда и аксессуары';
  return 'Готовые персонажи';
}
const ENGINE = new Set(['unreal-engine', 'uefn', 'uefn-source', 'metahuman']);
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const RENAMED = { 'fpsmultiplayertemplate5': 'fpsmultiplayertemplate6', '57dialoguemocapanimations': 'dialoguemocapanimationsvol1', 'waterlinepro': 'waterlinepro6',
  'lisbondowntown': 'lisbondowntowncitystreets', 'archmodelsvol8': 'citydistrictarchmodelsvol8', 'mccoremotionpack': 'mccoremotionanimationpack',
  'meditationyogaanimationandpropspack': 'yogaanimationsandpropspack', 'swimminganimationpack': 'swimminganimations', 'carinteractionanimationsvol01': 'carinteractionanimsetvol01',
  'cityshoppingmallmodularenvironmentv15': 'shoppingmallmodularenvironmentv15' };

function buildLibrary(lib, purchases) {
  const byNorm = new Map();
  for (const x of lib.items) { const k = norm(x.t); if (!byNorm.has(k)) byNorm.set(k, []); byNorm.get(k).push(x); }
  const paid = new Map(); const vault = [];
  for (const p of (purchases && purchases.items) || []) {
    let k = norm(p.t); k = RENAMED[k] || k;
    let hits = byNorm.get(k);
    if (!hits && k.length >= 12) hits = [...byNorm.entries()].filter(([kk]) => kk.startsWith(k) || (kk.length >= 10 && k.startsWith(kk))).flatMap(([, v]) => v);
    if (hits && hits.length) hits.forEach(h => { if (!paid.has(h.id)) paid.set(h.id, p); });
    else vault.push(p);
  }
  const items = lib.items.map(x => {
    const fm = new Set(x.f || []);
    const pv = paid.get(x.id);
    const it = { ...x, k: x.id, ty: ptype(x), st: style(x), se: settingsOf(x), mh: metahuman(x),
      o: pv ? 'Куплено' : (/Quixel/.test(x.s || '') ? 'Quixel' : 'Бесплатно'), pd: pv ? pv.d : '', paidAmt: pv ? pv.amt : null, paidCur: pv ? pv.cur : '',
      en: [...fm].some(f => ENGINE.has(f)) ? 'В движок' : (fm.size ? 'Только файлом' : ''),
      link: 'https://www.fab.com/listings/' + x.id };
    if (['tool-and-plugin', 'game-system', 'game-template'].includes(x.lt)) it.uf = (x.ue || []).length ? ((x.ue || []).includes(window.LATEST_UE) ? 'Есть ' + window.LATEST_UE : 'Нет ' + window.LATEST_UE) : 'Версия не указана';
    return it;
  });
  // старые покупки Unreal Marketplace, которых нет на Fab
  const seen = new Set();
  for (const p of vault) { const k = norm(p.t); if (seen.has(k)) continue; seen.add(k);
    items.push({ k: 'V:' + k, id: '', t: p.t, s: '', ty: 'Только в Vault лаунчера', st: style({ t: p.t }), se: settingsOf({ t: p.t }), mh: metahuman({ t: p.t }), o: 'Куплено', pd: p.d,
      paidAmt: p.amt, paidCur: p.cur, en: '', link: 'https://www.unrealengine.com/marketplace/en-US/store?q=' + encodeURIComponent(p.t), noThumb: true }); }
  return items;
}

// ---------- Quixel ----------
// Если есть данные quixel.com — используем его дерево категорий (как в Bridge). Для паков только с Fab — переводим категории Fab в похожую схему.
const QX_TOP = { material: 'Surfaces', decal: 'Decals' };
function fabMegaCategory(x) {
  const top = (x.c || '').split('/')[0], last = (x.c || '').split('/').slice(-1)[0] || '';
  const sub = last.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase());
  if (QX_TOP[x.lt]) return [QX_TOP[x.lt], sub];
  if (top === 'nature-plants') return ['3D Plants', sub];
  return ['3D Assets', sub];
}
function buildQuixel(fabMega, qx) {
  const byQid = new Map();
  const out = [];
  for (const q of (qx && qx.items) || []) {
    const it = { k: 'Q:' + q.qid, qid: q.qid, t: q.t, cat: q.cat || [], tags: q.tags || '', pack: q.pack || '', res: q.res || 0, gone: !!q.gone, pending: !!q.pending, inQx: true, inFab: false, qimg: true, fabId: null };
    byQid.set(String(q.qid).toLowerCase(), it); out.push(it);
  }
  for (const f of (fabMega && fabMega.items) || []) {
    if (!f.own) continue;
    const ex = f.qid && byQid.get(String(f.qid).toLowerCase());
    if (ex) { ex.inFab = true; ex.fabId = f.id; ex.fabTitle = f.t; continue; }
    const it = { k: 'F:' + f.id, qid: f.qid || '', t: f.t, cat: fabMegaCategory(f), tags: f.tags || '', inQx: false, inFab: true, fabId: f.id };
    if (f.qid) byQid.set(String(f.qid).toLowerCase(), it);
    out.push(it);
  }
  for (const it of out) it.where = it.inFab && it.inQx ? 'Fab и Quixel' : (it.inFab ? 'Только Fab' : 'Только Quixel / Bridge');
  return out;
}
