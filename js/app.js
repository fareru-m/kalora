// =============================================================
//  KALORA — aplikasi utama (vanilla JS, tanpa build step)
// =============================================================
import { call, conn, cache } from './api.js';
import { CONFIG } from './config.js';
import { resetDemo } from './demo.js';
import * as push from './push.js';

/* ---------------- utilitas ---------------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const N1 = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });
const N0 = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
const fmt = (n) => N1.format(Math.round((Number(n) || 0) * 10) / 10);
const fmt0 = (n) => N0.format(Math.round(Number(n) || 0));
const fmtQ = (q) => String(Math.round(q * 100) / 100).replace('.', ',');
const parseNum = (v) => { const n = parseFloat(String(v).replace(/\./g, '').replace(',', '.')); return isNaN(n) ? 0 : n; };
const inNum = (n) => String(Math.round((Number(n) || 0) * 10) / 10).replace('.', ',');
const pad = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => toISO(new Date());
const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseISO(s); d.setDate(d.getDate() + n); return toISO(d); };
const diffDays = (a, b) => Math.round((parseISO(a) - parseISO(b)) / 864e5);
const minDate = (a, b) => (a < b ? a : b);
const maxDate = (a, b) => (a > b ? a : b);
const nowHM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const addMinHM = (m) => { const d = new Date(Date.now() + m * 60000); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const dowMon = (s) => (parseISO(s).getDay() + 6) % 7;
const DAY = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const DAY3 = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MON = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const MON3 = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const longDate = (s) => { const d = parseISO(s); return `${DAY[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`; };
const midDate = (s) => { const d = parseISO(s); return `${DAY[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]}`; };
const shortDate = (s) => { const d = parseISO(s); return `${DAY3[d.getDay()]}, ${d.getDate()} ${MON3[d.getMonth()]}`; };
const DETAIL_DAYS = 7;
const inWindow = (s) => { const a = diffDays(today(), s); return a >= 0 && a < DETAIL_DAYS; };
const greet = () => { const h = new Date().getHours(); return h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam'; };

/* ---------------- ikon & logo ---------------- */
const P = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  chart: '<path d="M5 20V11M11 20V5M17 20v-7M3 20h18"/>',
  kilas: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 11h6M9 15h4"/>',
  bell: '<path d="M6 16v-5a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  label: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  left: '<path d="M15 5l-7 7 7 7"/>',
  right: '<path d="M9 5l7 7-7 7"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  refresh: '<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.01"/>',
  pill: '<rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-45 12 12)"/><path d="M8.5 8.5l7 7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  send: '<path d="M4 12l16-8-6 16-2-7z"/>',
  logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
  alert: '<path d="M12 6v7M12 17v.01"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18h2"/>',
  meal: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 21V3c-2 0-4 2-4 7v4h4"/>',
};
const icon = (n, s = 22, sw = 2) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;
const FLAME = 'M60 110 A36 36 0 0 1 24 74 C24 52 40 40 46 22 C49 14 54 8 60 2 C62 12 68 22 74 26 C76 20 78 16 82 10 C92 28 96 50 96 74 A36 36 0 0 1 60 110 Z';
const logo = (s = 40, c = {}) => {
  const k = { flame: '#FF5B22', face: '#FFFFFF', hands: '#15171C', legs: '#15171C', ...c };
  return `<svg width="${s}" height="${s}" viewBox="0 0 120 120" aria-hidden="true"><path d="M40 104 L33 115 M80 104 L87 115" stroke="${k.legs}" stroke-width="7" stroke-linecap="round" fill="none"/><path d="${FLAME}" fill="${k.flame}"/><circle cx="60" cy="74" r="24" fill="${k.face}"/><path d="M60 74 V59 M60 74 L71 81" stroke="${k.hands}" stroke-width="6" stroke-linecap="round" fill="none"/></svg>`;
};
const info = (text, label = 'Info', cls = '') =>
  `<details class="info ${cls}"><summary aria-label="Info: ${esc(label)}">${icon('info', 20)}</summary><div class="pop">${text}</div></details>`;

const SRC = {
  foto: { icon: 'camera', label: 'Foto makanan' },
  tabel: { icon: 'label', label: 'Tabel nutrisi' },
  manual: { icon: 'pencil', label: 'Tulis manual' },
};
const FIELDS = [
  { k: 'kcal', l: 'Kalori', u: 'kkal', c: 'var(--ember)' },
  { k: 'carb', l: 'Karbo', u: 'g', c: 'var(--carb)' },
  { k: 'protein', l: 'Protein', u: 'g', c: 'var(--protein)' },
  { k: 'fat', l: 'Lemak', u: 'g', c: 'var(--fat)' },
  { k: 'sugar', l: 'Gula', u: 'g', c: 'var(--grey)' },
  { k: 'fiber', l: 'Serat', u: 'g', c: 'var(--grey)' },
  { k: 'sodium', l: 'Natrium', u: 'mg', c: 'var(--grey)' },
];

/* ---------------- state ---------------- */
const S = {
  date: today(),
  days: new Map(),
  history: null,
  kilas: new Map(),
  rem: null,
  settings: null,
  draft: null,
  addTab: 'foto',
  manualText: '',
  hist: { tab: 'minggu', sel: today(), anchor: today() },
  autoDone: new Set(),
  busy: false,
};

/* Ambil data: tampilkan versi tersimpan di HP dulu (instan), lalu segarkan dari server. */
function swr(key, fetcher, onFresh, force = false) {
  const fresh = fetcher().then((v) => { if (!conn.demo) cache.set(key, v); return v; });
  const c = force || conn.demo ? null : cache.get(key);
  if (!c) return fresh;
  fresh.then((v) => { if (JSON.stringify(v) !== JSON.stringify(c)) onFresh(v); }).catch(() => {});
  return Promise.resolve(c);
}
// Render ulang diam-diam hanya kalau pengguna masih di layar itu & tidak sedang mengisi sesuatu
function refreshIf(paths, cond = () => true) {
  const { path } = parseHash();
  if (!paths.includes(path) || !cond() || $('#sheet-host .sheet') || document.activeElement?.matches('input, textarea, select')) return;
  rerender();
}

async function loadDay(date, force = false) {
  if (!force && S.days.has(date)) return S.days.get(date);
  const end = minDate(today(), addDays(date, 3));
  const d = await swr('day:' + date, () => call('getDay', { date, from: addDays(end, -6), to: end }), (v) => {
    S.days.set(date, v);
    S.settings = v.settings;
    refreshIf(['', 'riwayat'], () => S.date === date || S.hist.sel === date);
  }, force);
  S.days.set(date, d);
  S.settings = d.settings;
  return d;
}
function setHistory(r) {
  S.history = { map: new Map(r.days.map((x) => [x.date, x])), settings: r.settings };
  S.settings = r.settings;
}
async function loadHistory(force = false) {
  if (S.history && !force) return S.history;
  const to = today();
  const r = await swr('hist', () => call('getHistory', { from: addDays(to, -370), to }), (v) => { setHistory(v); refreshIf(['riwayat']); }, force);
  setHistory(r);
  return S.history;
}
async function loadReminders(force = false) {
  if (S.rem && !force) return S.rem;
  S.rem = await swr('rem', () => call('getReminders'), (v) => { S.rem = v; refreshIf(['pengingat', 'konfirmasi']); }, force);
  return S.rem;
}
function forgetReminders() {
  S.rem = null;
  S.days.delete(today());
  cache.del('rem');
  cache.del('day:' + today());
}
function invalidateFood(date) {
  S.days.delete(date);
  S.days.delete(today());
  S.kilas.delete(date);
  S.history = null;
  ['day:' + date, 'day:' + today(), 'kilas:' + date, 'hist'].forEach((k) => cache.del(k));
}
// buang cache hari lama supaya penyimpanan HP tidak menumpuk
function pruneCache() {
  const keep = addDays(today(), -8);
  Object.keys(localStorage).forEach((k) => {
    const m = k.match(/^kalora\.cache\.(?:day|kilas):(\d{4}-\d{2}-\d{2})$/);
    if (m && m[1] < keep) localStorage.removeItem(k);
  });
}

/* ---------------- UI helper ---------------- */
function toast(msg, kind = 'ok') {
  const host = $('#toast-host');
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = `${kind === 'err' ? icon('alert', 18, 2.4) : icon('check', 18, 2.6)}<span>${esc(msg)}</span>`;
  host.appendChild(el);
  setTimeout(() => { el.classList.add('leave'); setTimeout(() => el.remove(), 320); }, kind === 'err' ? 4200 : 2400);
}

function openSheet(html) {
  const host = $('#sheet-host');
  host.innerHTML = `<div class="sheet-backdrop" data-backdrop><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div></div>`;
  setTimeout(() => $('.sheet input, .sheet button', host)?.focus(), 60);
}
function closeSheet() {
  const bd = $('.sheet-backdrop');
  if (!bd) return;
  bd.classList.add('closing');
  setTimeout(() => { $('#sheet-host').innerHTML = ''; }, 220);
}
function confirmSheet(title, text, okLabel = 'Ya', danger = false) {
  return new Promise((resolve) => {
    openSheet(`<h2 style="font-size:20px">${esc(title)}</h2><p class="muted">${esc(text)}</p>
      <div class="row"><button class="btn btn-soft grow" data-sheet-no>Batal</button><button class="btn ${danger ? 'btn-danger' : 'btn-ink'} grow" data-sheet-yes>${esc(okLabel)}</button></div>`);
    const host = $('#sheet-host');
    const done = (v) => { host.removeEventListener('click', h); closeSheet(); resolve(v); };
    const h = (e) => {
      if (e.target.closest('[data-sheet-yes]')) done(true);
      else if (e.target.closest('[data-sheet-no]') || e.target.matches('[data-backdrop]')) done(false);
    };
    host.addEventListener('click', h);
  });
}

function countUp(root) {
  $$('[data-count]', root).forEach((el) => {
    const to = Number(el.dataset.count) || 0;
    const dur = 900;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt0(to * e);
      if (p < 1) requestAnimationFrame(step);
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) el.textContent = fmt0(to);
    else requestAnimationFrame(step);
  });
}

function burst(el) {
  const b = document.createElement('div');
  b.className = 'burst';
  const colors = ['#FF5B22', '#0E9F6E', '#F5A524', '#3B6CF6', '#E0457B', '#15171C'];
  b.innerHTML = Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    const r = 80 + Math.random() * 50;
    return `<i style="background:${colors[i % colors.length]};--x:calc(-50% + ${Math.cos(a) * r}px);--y:calc(-50% + ${Math.sin(a) * r}px);animation-delay:${Math.random() * 80}ms"></i>`;
  }).join('');
  el.appendChild(b);
  setTimeout(() => b.remove(), 1200);
}

function busyBtn(btn, on, label) {
  if (!btn) return;
  if (on) {
    btn.dataset.html = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spin" style="display:inline-grid">${icon('refresh', 18)}</span>${label || 'Memproses…'}`;
  } else if (btn.dataset.html) {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.html;
  }
}

/* ---------------- router ---------------- */
const ROUTES = {
  '': viewHome,
  tambah: viewTambah,
  periksa: viewPeriksa,
  edit: viewEdit,
  riwayat: viewRiwayat,
  kilas: viewKilas,
  pengingat: viewPengingat,
  konfirmasi: viewKonfirmasi,
  pengaturan: viewPengaturan,
};
const NAV_OF = { tambah: '', periksa: '', edit: '', konfirmasi: 'pengingat' };

function parseHash() {
  const h = location.hash.replace(/^#\/?/, '');
  const [path, qs] = h.split('?');
  return { path: path || '', params: new URLSearchParams(qs || '') };
}

let seq = 0;
async function render({ quiet = false } = {}) {
  const my = ++seq;
  const { path, params } = parseHash();
  document.body.classList.toggle('no-chrome', !conn.ready || path === 'konfirmasi');
  if (!conn.ready) { mount(viewSetup()); setNav(null); return; }
  const fn = ROUTES[path] || viewHome;
  setNav(NAV_OF[path] ?? path);
  let t;
  if (!quiet) t = setTimeout(() => { if (my === seq) mount(skeleton()); }, 140);
  try {
    const html = await fn(params);
    clearTimeout(t);
    if (my !== seq || html == null) return;
    mount(html, quiet);
    AFTER[path]?.(params);
  } catch (e) {
    clearTimeout(t);
    console.error(e);
    if (my === seq) mount(viewError(e));
  }
}
const rerender = () => render({ quiet: true });

function mount(html, quiet = false) {
  const host = $('#view');
  host.innerHTML = `<div class="view${quiet ? ' no-anim' : ''}">${html}</div>`;
  const v = host.firstElementChild;
  [...v.children].forEach((c, i) => c.style.setProperty('--i', i));
  if (!quiet) { window.scrollTo({ top: 0 }); countUp(v); } else $$('[data-count]', v).forEach((el) => { el.textContent = fmt0(el.dataset.count); });
}
function setNav(key) {
  $$('[data-nav]').forEach((a) => {
    const on = key !== null && a.dataset.nav === key;
    a.classList.toggle('active', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}
const go = (hash) => { if (location.hash === hash) render(); else location.hash = hash; };

function skeleton() {
  return `<div class="row"><div class="skel" style="width:44px;height:44px;border-radius:14px"></div><div class="stack grow" style="gap:8px"><div class="skel" style="height:12px;width:40%"></div><div class="skel" style="height:22px;width:60%"></div></div></div>
    <div class="skel" style="height:170px;border-radius:22px"></div>
    <div class="skel" style="height:96px;border-radius:22px"></div>
    <div class="skel" style="height:70px;border-radius:18px"></div>
    <div class="skel" style="height:70px;border-radius:18px"></div>`;
}
function viewError(e) {
  return `<section class="card stack" style="align-items:flex-start">
    <span class="k-ic" style="background:#FDECEC;color:#B42318">${icon('alert', 16, 3)}</span>
    <h2>Ups, ada masalah</h2>
    <p class="muted">${esc(e.message || e)}</p>
    <div class="row" style="flex-wrap:wrap"><button class="btn btn-ink" data-act="retry">${icon('refresh', 18)}Coba lagi</button><a class="btn btn-soft" href="#/pengaturan">Cek koneksi</a></div>
  </section>`;
}

/* =============================================================
 *  VIEW: SETUP / HUBUNGKAN
 * ============================================================= */
function viewSetup() {
  return `<section class="setup">
    <div class="setup-logo">${logo(84, { legs: '#FFFFFF' })}</div>
    <div class="stack" style="gap:4px;align-items:center">
      <h1>kalora</h1>
      <p class="muted">Catat kalori. Tepat waktu.</p>
    </div>
    <form class="card setup-card" data-form="connect">
      <div class="row-between"><h2>Hubungkan ke Apps Script</h2>${info('URL didapat setelah <b>Deploy → Web app</b> di Apps Script (berakhiran <code>/exec</code>). Kode akses = nilai <b>API_TOKEN</b> yang muncul di log setelah menjalankan <code>setup()</code>.', 'cara menghubungkan')}</div>
      <label class="field"><span>URL Web App</span><input name="url" type="url" required placeholder="https://script.google.com/macros/s/…/exec" autocomplete="off"></label>
      <label class="field"><span>Kode akses</span><input name="token" type="password" required autocomplete="off" placeholder="API_TOKEN"></label>
      <button class="btn btn-ink btn-lg btn-block" type="submit">${icon('bolt', 20)}Hubungkan</button>
    </form>
    <button class="btn btn-ghost" data-act="demo">Coba mode demo dulu</button>
  </section>`;
}

/* =============================================================
 *  VIEW: HARI INI
 * ============================================================= */
async function viewHome() {
  S.date = today();
  const date = S.date;
  const d = await loadDay(date);
  return `
  <header class="home-head">
    <div class="who">
      <div class="mobile-only">${logo(42)}</div>
      <div class="stack" style="gap:1px">
        <span class="small muted" style="font-weight:600">${longDate(date)}</span>
        <h1>${greet()}</h1>
      </div>
    </div>
    <a class="icon-btn mobile-only" href="#/pengaturan" aria-label="Pengaturan">${icon('gear', 20)}</a>
  </header>
  <div class="home-grid">
    <div class="col">
      ${ringCard(d.totals, d.settings)}
      ${todayReminders(d.reminders || [])}
    </div>
    <div class="col">${foodsSection(d, true)}</div>
  </div>`;
}

function ringCard(T, st) {
  const R = 62, LEN = 2 * Math.PI * R;
  const pct = Math.min(1, T.kcal / st.targetKcal);
  const over = T.kcal > st.targetKcal;
  const sisa = Math.round(st.targetKcal - T.kcal);
  const macro = (name, v, tgt, color) => {
    const p = tgt ? Math.min(100, (v / tgt) * 100) : 0;
    return `<div class="macro"><div class="top"><span style="font-weight:700">${name}</span><span class="muted num">${fmt0(v)}/${fmt0(tgt)} g</span></div><div class="meter"><span style="width:${p}%;background:${color}"></span></div></div>`;
  };
  return `<section class="card ring-card" aria-label="Kalori hari ini">
    <div class="ring ${over ? 'over' : ''}">
      <svg width="148" height="148" viewBox="0 0 148 148" role="img" aria-label="${fmt0(T.kcal)} dari ${fmt0(st.targetKcal)} kkal">
        <circle class="track" cx="74" cy="74" r="${R}" fill="none" stroke-width="16"/>
        ${pct > 0 ? `<circle class="bar" cx="74" cy="74" r="${R}" fill="none" stroke-width="16" stroke-dasharray="${LEN.toFixed(1)}" style="--len:${LEN.toFixed(1)};stroke-dashoffset:${(LEN * (1 - pct)).toFixed(1)}"/>` : ''}
      </svg>
      <div class="center"><span class="big" data-count="${Math.round(T.kcal)}">0</span><span class="small muted">/ ${fmt0(st.targetKcal)} kkal</span></div>
    </div>
    <div class="stack grow" style="gap:11px">
      <div class="stack" style="gap:0">
        <span class="small muted">${over ? 'Lewat target' : 'Sisa hari ini'}</span>
        <span style="font-size:22px;font-weight:800;letter-spacing:-.02em;${over ? 'color:var(--ember-text)' : ''}" class="num">${fmt0(Math.abs(sisa))} <span class="small muted" style="font-weight:600">kkal</span></span>
      </div>
      ${macro('Karbo', T.carb, st.targetCarb, 'var(--carb)')}
      ${macro('Protein', T.protein, st.targetProtein, 'var(--protein)')}
      ${macro('Lemak', T.fat, st.targetFat, 'var(--fat)')}
    </div>
  </section>`;
}

const repeatShort = (m) => (m >= 60 ? `${m / 60} jam` : `${m} menit`);

function todayReminders(views) {
  const head = `<div class="row-between"><h2>Pengingat hari ini</h2><a href="#/pengingat" class="small" style="font-weight:700;text-decoration:none">Atur</a></div>`;
  if (!views.length) return `<section class="stack">${head}<div class="empty small">Belum ada pengingat aktif. <a href="#/pengingat">Tambah pengingat</a></div></section>`;
  const sorted = [...views].sort((a, b) => a.time.localeCompare(b.time));
  const done = sorted.filter((v) => v.status === 'done');
  const rest = sorted.filter((v) => v.status !== 'done');
  const row = (v) => {
    const meal = v.type === 'makan';
    const due = v.status === 'pending' || v.status === 'snoozed' || v.status === 'sent';
    let sub;
    if (v.status === 'snoozed') sub = `Ditunda sampai ${v.nextAt}`;
    else if (due && meal) sub = v.repeatMin > 0 && v.status === 'pending' ? `Belum ada catatan · diulang ${v.nextAt}` : 'Belum ada catatan makan';
    else if (due) sub = `Belum ditandai${v.repeatMin > 0 && v.nextAt ? ` · diulang ${v.nextAt}` : ''}`;
    else sub = `Akan berbunyi${v.repeatMin > 0 ? ` · ulang tiap ${repeatShort(v.repeatMin)}` : ''}`;
    const action = !due
      ? '<span class="badge">Nanti</span>'
      : meal
        ? `<a class="btn btn-sm btn-ember" href="#/tambah">Catat</a>`
        : `<button class="btn btn-sm btn-ink" data-act="rem-done" data-rid="${esc(v.rid)}">Sudah</button>`;
    const title = meal || !due ? `<b class="tr-name">${esc(v.title)}</b>` : `<a class="tr-name" href="#/konfirmasi?rid=${encodeURIComponent(v.rid)}">${esc(v.title)}</a>`;
    return `<div class="tr-row ${due ? 'due' : ''} ${meal ? 'meal' : ''}"><span class="t">${esc(v.time)}</span><div class="grow">${title}<div class="small ${due ? 'due-sub' : 'muted'}">${sub}</div></div>${action}</div>`;
  };
  return `<section class="stack" aria-label="Pengingat hari ini">${head}
    <div class="card today-rems">
      ${rest.map(row).join('')}
      ${done.length ? `<div class="tr-done"><span class="k-ic" style="width:22px;height:22px;background:var(--mint-soft);color:var(--mint-text)">${icon('check', 13, 3)}</span><span>${done.length} selesai: ${done.map((v) => esc(v.title)).join(', ')}</span></div>` : ''}
    </div>
  </section>`;
}

function foodsSection(d, isToday) {
  const head = `<div class="row-between"><h2>${isToday ? 'Makanan hari ini' : 'Makanan'}</h2>
    <div class="row" style="gap:4px"><span class="small muted">${d.detailAvailable ? `${d.foods.length} catatan · ${fmt0(d.totals.kcal)} kkal` : ''}</span>${info('Rincian makanan disimpan 7 hari, lalu terhapus otomatis. Total kalori harian tetap tersimpan sampai 1 tahun. Ketuk catatan untuk mengubah atau menghapus.', 'penyimpanan')}</div></div>`;
  if (!d.detailAvailable) {
    return `<section class="stack">${head}<div class="notice">${icon('clock', 18)}<span>Rincian makanan tanggal ini sudah dihapus otomatis. Total kalorinya (${fmt0(d.totals.kcal)} kkal) tetap tersimpan.</span></div></section>`;
  }
  if (!d.foods.length) {
    return `<section class="stack">${head}<div class="empty">${logo(54)}<b style="color:var(--ink)">Belum ada catatan</b><span class="small">Foto makananmu atau tulis manual.</span><a class="btn btn-ember btn-sm" href="#/tambah">${icon('plus', 18, 2.4)}Tambah makanan</a></div></section>`;
  }
  return `<section class="stack" aria-label="Daftar makanan">${head}
    ${d.foods.map((f, j) => {
      const s = SRC[f.source] || SRC.manual;
      return `<a class="food" href="#/edit?id=${encodeURIComponent(f.id)}" style="--j:${j}">
        <span class="ic ${f.source in SRC ? f.source : 'manual'}">${icon(s.icon, 22)}</span>
        <span class="grow"><span style="font-weight:800;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(f.name)}${f.portion !== 1 ? ` <span class="badge">×${fmtQ(f.portion)}</span>` : ''}</span><span class="small muted">${esc(f.time)} · ${s.label}</span></span>
        <span class="kc"><b>${fmt0(f.kcal * f.portion)}</b><span class="small muted">kkal</span></span>
      </a>`;
    }).join('')}
  </section>`;
}

/* =============================================================
 *  VIEW: TAMBAH (foto / tulis manual)
 * ============================================================= */
function viewTambah() {
  const tab = S.addTab;
  return `
  <header class="page-head">
    <a class="icon-btn" href="#/" aria-label="Tutup">${icon('x', 20)}</a>
    <h1>Tambah makanan</h1>
    ${S.date !== today() && inWindow(S.date) ? `<span class="badge ember">${shortDate(S.date)}</span>` : ''}
  </header>
  <div class="seg" role="tablist" aria-label="Cara menambah" style="align-self:flex-start">
    <button role="tab" data-act="add-tab" data-tab="foto" aria-selected="${tab === 'foto'}">${'Foto / galeri'}</button>
    <button role="tab" data-act="add-tab" data-tab="manual" aria-selected="${tab === 'manual'}">Tulis manual</button>
  </div>
  <div id="add-body">${tab === 'foto' ? fotoPane() : manualPane()}</div>`;
}

function fotoPane() {
  return `<section class="drop" data-drop>
    <div class="drop-art" aria-hidden="true"><span class="corner c1"></span><span class="corner c2"></span><span class="corner c3"></span><span class="corner c4"></span><div class="plate">${icon('camera', 40, 1.8)}</div></div>
    <div class="row" style="gap:2px;justify-content:center"><h2>Foto makanan atau tabel nutrisi</h2>${info('Satu kamera untuk semua: Kalora mengenali otomatis apakah fotonya makanan atau tabel nutrisi, lalu menghitung kalori &amp; gizinya. Kamu bisa memeriksa dan mengubah hasilnya sebelum disimpan.', 'deteksi otomatis')}</div>
    <div class="drop-actions">
      <button class="btn btn-ember btn-lg" data-act="pick-file" data-target="file-cam">${icon('camera', 20)}Kamera</button>
      <button class="btn btn-soft btn-lg" data-act="pick-file" data-target="file-gal">${icon('image', 20)}Galeri</button>
    </div>
    <p class="small muted desktop-only">atau tarik &amp; lepas foto ke sini · Ctrl+V untuk menempel</p>
    <input type="file" accept="image/*" capture="environment" id="file-cam" data-on="file" hidden>
    <input type="file" accept="image/*" id="file-gal" data-on="file" hidden>
  </section>`;
}

function manualPane() {
  const chips = ['2 telur rebus', '1 piring nasi goreng', '1 gelas kopi susu', '1 onigiri'];
  return `<section class="card stack">
    <div class="row-between"><label class="label" for="manual-text" style="font-size:14px;color:var(--ink)">Kamu makan apa?</label>${info('Tulis seperti biasa, pisahkan dengan koma. Contoh: “1 pisang, 3 apel, 1 gelas susu”. Angkanya perkiraan dari ukuran porsi umum.', 'tulis manual')}</div>
    <textarea id="manual-text" class="input" rows="3" placeholder="contoh: 1 pisang, 3 apel, 1 gelas susu" data-on="manual-text">${esc(S.manualText)}</textarea>
    <div class="row" style="flex-wrap:wrap;gap:6px">${chips.map((c) => `<button class="chip" data-act="chip" data-text="${esc(c)}">+ ${esc(c)}</button>`).join('')}</div>
    <button class="btn btn-ember btn-lg btn-block" data-act="analyze-text">${icon('bolt', 20)}Hitung nutrisi</button>
  </section>`;
}

function scanHTML(src, kind = 'foto') {
  if (kind === 'teks') {
    return `<section class="card stack" aria-busy="true">
      <div class="row"><span class="badge ember">AI</span><b id="scan-text">Memisahkan tiap makanan</b><span class="dots"><span></span><span></span><span></span></span></div>
      <div class="skel" style="height:56px"></div><div class="skel" style="height:56px"></div><div class="skel" style="height:56px;width:70%"></div>
    </section>`;
  }
  return `<section class="stack" aria-busy="true">
    <div class="scan"><img src="${src}" alt="Foto yang sedang dianalisis"><div class="line"></div>
      <div class="status"><span class="auto">AUTO</span><span id="scan-text">Mengenali jenis foto</span><span class="dots"><span></span><span></span><span></span></span></div>
    </div>
    <div class="card stack"><div class="skel" style="height:16px;width:55%"></div><div class="skel" style="height:12px;width:80%"></div><div class="skel" style="height:12px;width:65%"></div></div>
  </section>`;
}

function cycleText(lines) {
  let i = 0;
  const t = setInterval(() => {
    const el = $('#scan-text');
    if (!el) return clearInterval(t);
    i = (i + 1) % lines.length;
    el.textContent = lines[i];
    el.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 300 });
  }, 1600);
  return () => clearInterval(t);
}

async function compressImage(file, max, q) {
  let src;
  try { src = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch {
    src = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = URL.createObjectURL(file); });
  }
  const w0 = src.width, h0 = src.height;
  const s = Math.min(1, max / Math.max(w0, h0));
  const c = document.createElement('canvas');
  c.width = Math.round(w0 * s);
  c.height = Math.round(h0 * s);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(src, 0, 0, c.width, c.height);
  const dataUrl = c.toDataURL('image/jpeg', q);
  return { dataUrl, base64: dataUrl.split(',')[1] };
}

function draftDate() {
  return inWindow(S.date) ? S.date : today();
}
function normItem(it) {
  const o = { name: String(it.name || ''), qty: Number(it.qty ?? it.portion) || 1, unit: it.unit || 'porsi' };
  FIELDS.forEach((f) => { o[f.k] = Number(it[f.k]) || 0; });
  return o;
}
function newDraft(source, r, image) {
  const date = draftDate();
  return { mode: 'new', source, kind: r.kind, note: r.note || '', image, items: r.items.map(normItem), date, time: date === today() ? nowHM() : '12:00' };
}

async function handleImage(file) {
  if (!file || !/^image\//.test(file.type)) { toast('File harus berupa gambar.', 'err'); return; }
  if (S.busy) return;
  const body = $('#add-body');
  if (!body) return;
  S.busy = true;
  let img;
  try { img = await compressImage(file, 1280, 0.82); } catch { S.busy = false; toast('Gambar tidak bisa dibaca.', 'err'); return; }
  body.innerHTML = scanHTML(img.dataUrl);
  const stop = cycleText(['Mengenali jenis foto', 'Membaca nilai gizi', 'Menghitung kalori']);
  try {
    const r = await call('analyzeImage', { image: img.base64, mime: 'image/jpeg' });
    if (r.kind === 'bukan_makanan' || !r.items.length) {
      toast('Tidak terlihat makanan atau tabel nutrisi. Coba foto ulang.', 'err');
      if ($('#add-body')) $('#add-body').innerHTML = fotoPane();
      return;
    }
    const thumb = (await compressImage(file, 220, 0.7)).dataUrl;
    S.draft = newDraft(r.kind === 'tabel_nutrisi' ? 'tabel' : 'foto', r, thumb);
    go('#/periksa');
  } catch (e) {
    toast(e.message, 'err');
    if ($('#add-body')) $('#add-body').innerHTML = fotoPane();
  } finally { stop(); S.busy = false; }
}

async function analyzeText() {
  const text = ($('#manual-text')?.value || '').trim();
  S.manualText = text;
  if (!text) { toast('Tulis dulu makanan yang kamu makan.', 'err'); $('#manual-text')?.focus(); return; }
  if (S.busy) return;
  S.busy = true;
  const body = $('#add-body');
  body.innerHTML = scanHTML('', 'teks');
  const stop = cycleText(['Memisahkan tiap makanan', 'Memperkirakan porsi', 'Menghitung kalori']);
  try {
    const r = await call('analyzeText', { text });
    if (!r.items.length) throw new Error('Tidak ada makanan yang dikenali. Coba tulis lebih jelas.');
    S.draft = newDraft('manual', r, '');
    S.manualText = '';
    go('#/periksa');
  } catch (e) {
    toast(e.message, 'err');
    if ($('#add-body')) $('#add-body').innerHTML = manualPane();
  } finally { stop(); S.busy = false; }
}

/* =============================================================
 *  VIEW: PERIKSA & EDIT
 * ============================================================= */
function draftTotal() {
  return (S.draft?.items || []).reduce((a, it) => a + it.kcal * it.qty, 0);
}

function viewPeriksa() {
  const d = S.draft;
  if (!d) { setTimeout(() => go('#/tambah'), 0); return null; }
  const isEdit = d.mode === 'edit';
  const kindMap = {
    tabel_nutrisi: ['blue', 'label', 'Dibaca dari tabel nutrisi'],
    makanan: ['ember', 'camera', 'Terdeteksi dari foto makanan'],
    teks: ['', 'pencil', 'Diperkirakan dari tulisan'],
    edit: ['', SRC[d.source]?.icon || 'pencil', `Dicatat lewat ${SRC[d.source]?.label.toLowerCase() || 'manual'}`],
  };
  const [bc, bi, bl] = kindMap[isEdit ? 'edit' : d.kind] || kindMap.teks;
  return `
  <header class="page-head">
    <a class="icon-btn" href="${isEdit ? '#/' : '#/tambah'}" aria-label="Kembali">${icon('left', 20)}</a>
    <h1>${isEdit ? 'Ubah catatan' : 'Periksa hasil'}</h1>
    ${isEdit ? `<button class="icon-btn" data-act="delete-food" aria-label="Hapus catatan">${icon('trash', 20)}</button>` : ''}
  </header>
  <section class="card source-card">
    ${d.image ? `<img class="thumb" src="${d.image}" alt="">` : `<span class="thumb" style="display:grid;place-items:center;background:var(--soft)">${icon(bi, 26)}</span>`}
    <div class="grow stack" style="gap:4px">
      <span class="badge ${bc}" style="align-self:flex-start">${icon(bi, 13, 2.4)}${bl}</span>
      <span style="font-weight:800">${d.items.length} item · <span id="draft-total-top" class="num">${fmt0(draftTotal())}</span> kkal</span>
    </div>
    ${info(`${d.note ? esc(d.note) + '<br><br>' : ''}Angka dari AI adalah perkiraan. Ketuk angka untuk mengoreksi, dan atur porsi kalau kamu makan lebih/kurang dari satu. Total = nilai per porsi × porsi.`, 'tentang hasil')}
  </section>
  <div class="stack" id="items">${d.items.map(itemCard).join('')}</div>
  ${isEdit ? '' : `<button class="btn btn-soft" data-act="item-add" style="align-self:flex-start">${icon('plus', 18, 2.4)}Tambah item</button>`}
  <section class="card stack">
    <div class="row-between"><h2>Waktu makan</h2>${info('Otomatis diisi waktu sekarang. Ubah kalau kamu makan di waktu lain. Hanya bisa 7 hari terakhir.', 'waktu makan')}</div>
    <div class="row" style="align-items:flex-end">
      <label class="field grow"><span>Tanggal</span><input type="date" data-on="draft-date" value="${d.date}" min="${addDays(today(), -(DETAIL_DAYS - 1))}" max="${today()}"></label>
      <label class="field" style="width:130px"><span>Jam</span><input type="time" data-on="draft-time" value="${d.time}"></label>
    </div>
  </section>
  <div class="save-bar"><button class="btn btn-ember btn-lg btn-block" data-act="save-draft">${icon('check', 20, 2.6)}Simpan · <span id="draft-total" class="num">${fmt0(draftTotal())}</span> kkal</button></div>`;
}

function itemCard(it, i) {
  const canRemove = S.draft.mode === 'new' && S.draft.items.length > 1;
  return `<article class="card item-card" data-idx="${i}" style="--j:${i}">
    <div class="row">
      <input class="item-name" value="${esc(it.name)}" data-on="item-name" aria-label="Nama makanan" placeholder="Nama makanan">
      ${canRemove ? `<button class="icon-btn" data-act="item-remove" aria-label="Hapus item ini">${icon('trash', 18)}</button>` : ''}
    </div>
    <span class="small muted" style="margin-top:-6px">Nilai gizi per 1 ${esc(it.unit)}</span>
    <div class="portion">
      <div class="stack" style="gap:0"><span class="small" style="color:var(--on-dark-muted)">Porsi</span><b class="num" style="font-size:18px"><span data-tot="kcal">${fmt0(it.kcal * it.qty)}</span> kkal</b></div>
      <div class="stepper" role="group" aria-label="Jumlah porsi">
        <button class="minus" data-act="qty" data-d="-0.5" aria-label="Kurangi porsi">−</button>
        <output>×${fmtQ(it.qty)}</output>
        <button class="plus" data-act="qty" data-d="0.5" aria-label="Tambah porsi">+</button>
      </div>
      <div class="quick">${[0.5, 1, 2, 3].map((q) => `<button data-act="qty-set" data-q="${q}" class="${q === it.qty ? 'on' : ''}" aria-pressed="${q === it.qty}">×${fmtQ(q)}</button>`).join('')}</div>
    </div>
    <div class="nutri-grid">${FIELDS.map((f) => `<div class="nutri">
      <label for="n-${i}-${f.k}"><i class="dot" style="background:${f.c}"></i>${f.l}</label>
      <div class="val"><input id="n-${i}-${f.k}" inputmode="decimal" value="${inNum(it[f.k])}" data-on="item-num" data-k="${f.k}"><span class="small muted">${f.u}</span></div>
      <span class="tot">total <b data-tot="${f.k}" class="num">${fmt(it[f.k] * it.qty)}</b> ${f.u}</span>
    </div>`).join('')}</div>
  </article>`;
}

function refreshItem(i, bump = false) {
  const card = $(`.item-card[data-idx="${i}"]`);
  const it = S.draft.items[i];
  if (!card || !it) return;
  FIELDS.forEach((f) => $$(`[data-tot="${f.k}"]`, card).forEach((el) => { el.textContent = f.k === 'kcal' ? fmt0(it.kcal * it.qty) : fmt(it[f.k] * it.qty); }));
  const out = $('output', card);
  out.textContent = `×${fmtQ(it.qty)}`;
  if (bump) { out.classList.remove('bump'); void out.offsetWidth; out.classList.add('bump'); }
  $$('.quick button', card).forEach((b) => { const on = Number(b.dataset.q) === it.qty; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  const tot = fmt0(draftTotal());
  if ($('#draft-total')) $('#draft-total').textContent = tot;
  if ($('#draft-total-top')) $('#draft-total-top').textContent = tot;
}
function rerenderItems() {
  $('#items').innerHTML = S.draft.items.map(itemCard).join('');
  const tot = fmt0(draftTotal());
  if ($('#draft-total')) $('#draft-total').textContent = tot;
  if ($('#draft-total-top')) $('#draft-total-top').textContent = tot;
}

async function viewEdit(params) {
  const id = params.get('id');
  let food = null;
  for (const d of S.days.values()) { food = d.foods.find((f) => f.id === id); if (food) break; }
  if (!food) {
    const d = await loadDay(S.date, true);
    food = d.foods.find((f) => f.id === id);
  }
  if (!food) { toast('Catatan tidak ditemukan.', 'err'); setTimeout(() => go('#/'), 0); return null; }
  S.draft = { mode: 'edit', id: food.id, source: food.source, kind: 'edit', note: '', image: '', items: [normItem(food)], date: food.date, time: food.time };
  return viewPeriksa();
}

async function saveDraft(btn) {
  const d = S.draft;
  if (!d) return;
  const items = d.items.filter((it) => it.name.trim());
  if (!items.length) { toast('Isi nama makanannya dulu.', 'err'); return; }
  if (!d.date || !inWindow(d.date)) { toast('Tanggal harus dalam 7 hari terakhir.', 'err'); return; }
  busyBtn(btn, true, 'Menyimpan…');
  try {
    if (d.mode === 'edit') {
      const old = [...S.days.values()].find((x) => x.foods.some((f) => f.id === d.id));
      await call('updateFood', { id: d.id, date: d.date, time: d.time, item: items[0] });
      if (old) invalidateFood(old.date);
    } else {
      await call('saveFoods', { date: d.date, time: d.time, source: d.source, items });
    }
    invalidateFood(d.date);
    S.date = d.date;
    S.draft = null;
    toast(d.mode === 'edit' ? 'Perubahan disimpan' : `${items.length} makanan tersimpan`);
    go('#/');
  } catch (e) {
    busyBtn(btn, false);
    toast(e.message, 'err');
  }
}

/* =============================================================
 *  VIEW: RIWAYAT
 * ============================================================= */
function dateRange(from, to) {
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}
function periodOf(tab, anchor) {
  if (tab === 'bulan') {
    const a = parseISO(anchor);
    const y = a.getFullYear(), m = a.getMonth();
    return {
      days: dateRange(toISO(new Date(y, m, 1)), toISO(new Date(y, m + 1, 0))),
      prev: dateRange(toISO(new Date(y, m - 1, 1)), toISO(new Date(y, m, 0))),
      label: `${MON[m]} ${y}`,
    };
  }
  return {
    days: dateRange(addDays(anchor, -6), anchor),
    prev: dateRange(addDays(anchor, -13), addDays(anchor, -7)),
    label: `${shortDate(addDays(anchor, -6))} – ${shortDate(anchor)}`,
  };
}
function periodStats(days, map, T) {
  const t = today();
  const logged = days.filter((ds) => ds < t && (map.get(ds)?.kcal || 0) > 0);
  const k = (ds) => map.get(ds)?.kcal || 0;
  const n = logged.length;
  const avg = n ? logged.reduce((a, ds) => a + k(ds), 0) / n : 0;
  const pDays = logged.filter((ds) => (map.get(ds)?.protein || 0) > 0);
  const avgP = pDays.length ? pDays.reduce((a, ds) => a + map.get(ds).protein, 0) / pDays.length : 0;
  const ok = logged.filter((ds) => k(ds) <= T).length;
  const top = logged.reduce((m, ds) => (!m || k(ds) > k(m) ? ds : m), null);
  return { n, avg, avgP, ok, over: n - ok, top, topK: top ? k(top) : 0 };
}

async function viewRiwayat() {
  const h = await loadHistory();
  const H = S.hist;
  if (H.tab !== 'minggu' && H.tab !== 'bulan') H.tab = 'minggu';
  const st = h.settings;
  const T = st.targetKcal;
  const map = h.map;
  const t = today();
  const week = H.tab === 'minggu';
  const P = periodOf(H.tab, H.anchor);
  const s = periodStats(P.days, map, T);
  const prev = periodStats(P.prev, map, T);

  // --- recap
  let recap;
  if (!s.n) recap = 'Belum ada data lengkap di periode ini. Catat makananmu tiap hari supaya recap-nya bisa dibuat.';
  else {
    const td = s.top ? parseISO(s.top) : null;
    recap = `Rata-rata ${fmt0(s.avg)} kkal/hari — ${s.ok} dari ${s.n} hari sesuai target.`;
    if (s.over && td) recap += ` Tertinggi ${DAY[td.getDay()]}, ${td.getDate()} ${MON3[td.getMonth()]} (${fmt0(s.topK)} kkal).`;
    if (s.avgP) recap += ` Protein rata-rata ${fmt0(s.avgP)} g${s.avgP < st.targetProtein * 0.9 ? `, masih di bawah target ${fmt0(st.targetProtein)} g` : ''}.`;
  }
  const chips = [];
  if (s.n && prev.n) {
    const diff = Math.round(((s.avg - prev.avg) / prev.avg) * 100);
    chips.push([`${diff >= 0 ? '↑' : '↓'} ${Math.abs(diff)}% dari ${week ? 'minggu' : 'bulan'} lalu`, '']);
  }
  if (s.n) chips.push([`${s.n} hari tercatat`, 'good']);
  if (s.avgP && s.avgP < st.targetProtein * 0.8) chips.push(['Protein kurang', '']);
  const recapTitle = week ? (H.anchor === t ? 'Recap 7 hari terakhir' : `Recap ${P.label}`) : `Recap ${P.label}`;

  // --- grafik
  const vals = P.days.map((ds) => (ds <= t ? map.get(ds)?.kcal || 0 : null));
  const maxV = Math.max(T * 1.2, ...vals.filter((v) => v));
  const PX = 150, BASE = 22;
  const canNext = week ? H.anchor < t : toISO(new Date(parseISO(H.anchor).getFullYear(), parseISO(H.anchor).getMonth() + 1, 1)) <= t;
  const bars = P.days.map((ds, i) => {
    const v = vals[i];
    const dd = parseISO(ds);
    const future = v === null;
    const cls = future ? 'future' : ds === t ? 'today' : !v ? 'none' : v > T ? 'over' : '';
    const lbl = week ? `${DAY3[dd.getDay()]} ${dd.getDate()}` : (dd.getDate() === 1 || dd.getDate() % 5 === 0 ? String(dd.getDate()) : '');
    return `<button class="bar-col" ${future ? 'disabled' : `data-act="hist-sel" data-date="${ds}"`} aria-pressed="${ds === H.sel}" aria-label="${midDate(ds)}${v ? ': ' + fmt0(v) + ' kkal' : ''}" style="--k:${i}">
      <span class="val">${week && v ? fmt0(v) : ''}</span>
      <span class="b ${cls}" style="height:${future ? 4 : Math.max(5, (v / maxV) * PX)}px"></span>
      <span class="lbl">${lbl}</span>
    </button>`;
  }).join('');

  // --- harian
  const sel = H.sel;
  let selDay = null;
  if (inWindow(sel)) { try { selDay = await loadDay(sel); } catch { selDay = null; } }
  const selK = selDay ? selDay.totals.kcal : map.get(sel)?.kcal || 0;
  const [sc, stext] = sel === t ? ['', 'Hari ini'] : statusOf(selK, T);
  const selMacro = selDay ? selDay.totals : map.get(sel);

  return `
  <header class="page-head"><h1>Riwayat</h1>${info('Total kalori harian disimpan sampai 1 tahun. Rincian makanan hanya disimpan 7 hari terakhir, lalu terhapus otomatis.', 'riwayat')}</header>

  <section class="card-dark recap" aria-label="Recap">
    <span class="eyebrow light" style="position:relative">${esc(recapTitle)}</span>
    <p>${esc(recap)}</p>
    ${chips.length ? `<div class="chips">${chips.map(([c, cls]) => `<span class="${cls}">${esc(c)}</span>`).join('')}</div>` : ''}
  </section>

  <div class="seg full" role="tablist" aria-label="Periode">
    <button role="tab" data-act="hist-tab" data-tab="minggu" aria-selected="${week}">Minggu</button>
    <button role="tab" data-act="hist-tab" data-tab="bulan" aria-selected="${!week}">Bulan</button>
  </div>

  <section class="card stack" aria-label="Grafik kalori">
    <div class="row-between">
      <div class="stack" style="gap:0"><span class="small muted">Konsumsi kalori</span><h2>${esc(P.label)}</h2></div>
      <div class="row" style="gap:6px">
        <button class="icon-btn" data-act="${week ? 'hist-shift' : 'hist-month'}" data-n="${week ? -7 : -1}" aria-label="Periode sebelumnya">${icon('left', 18)}</button>
        <button class="icon-btn" data-act="${week ? 'hist-shift' : 'hist-month'}" data-n="${week ? 7 : 1}" aria-label="Periode berikutnya" ${canNext ? '' : 'disabled style="opacity:.4"'}>${icon('right', 18)}</button>
      </div>
    </div>
    <div class="bars ${week ? '' : 'month'}" style="height:${PX + 58}px;grid-template-columns:repeat(${P.days.length}, minmax(0, 1fr))" role="group" aria-label="Kalori per hari, rata-rata ${fmt0(s.avg)} kkal">
      <div class="target" style="bottom:${BASE + (T / maxV) * PX}px"></div>
      ${s.n ? `<div class="avg" style="bottom:${BASE + (s.avg / maxV) * PX}px"></div>` : ''}
      ${bars}
    </div>
    <div class="legend">
      ${s.n ? `<span><i style="height:0;border-top:2px solid var(--protein);border-radius:0"></i>Rata-rata ${fmt0(s.avg)}</span>` : ''}
      <span><i style="height:0;border-top:2px dashed var(--grey);border-radius:0"></i>Target ${fmt0(T)}</span>
      <span><i style="background:var(--ember)"></i>Lewat target</span>
    </div>
  </section>

  <div class="stats3">
    <div class="card stat"><span class="small muted">Rata-rata</span><div class="v">${s.n ? fmt0(s.avg) : '—'}</div><span class="small muted">kkal/hari</span></div>
    <div class="card stat"><span class="small muted">Sesuai target</span><div class="v">${s.ok}</div><span class="small muted">dari ${s.n} hari</span></div>
    <div class="card stat"><span class="small muted">Tertinggi</span><div class="v" style="color:var(--ember-text)">${s.top ? fmt0(s.topK) : '—'}</div><span class="small muted">${s.top ? shortDate(s.top) : ''}</span></div>
  </div>

  <section class="stack" aria-label="Harian" style="margin-top:6px">
    <h2 style="font-size:18px">Harian</h2>
    <label class="jump wide">${icon('calendar', 20)}<span class="lbl">Loncat ke tanggal</span><input type="date" data-on="hist-jump" value="${sel}" min="${addDays(t, -365)}" max="${t}"></label>
    <div class="card day-card">
      <div class="day-top">
        <div class="stack" style="gap:2px"><span class="small muted" style="font-weight:600">${longDate(sel)}</span><span style="font-size:26px;font-weight:800;letter-spacing:-.03em" class="num"><span data-count="${Math.round(selK)}">0</span> <span class="small muted" style="font-weight:600">kkal</span></span>
          ${selMacro && selK ? `<span class="small muted">Karbo ${fmt0(selMacro.carb)} g · Protein ${fmt0(selMacro.protein)} g · Lemak ${fmt0(selMacro.fat)} g</span>` : ''}</div>
        <span class="badge ${sc}">${stext}</span>
      </div>
      ${selDay && selDay.foods.length
        ? `<div class="day-foods">${selDay.foods.map((f) => `<a href="#/edit?id=${encodeURIComponent(f.id)}" data-act="edit-from-hist" data-date="${sel}"><span class="small muted" style="width:44px">${esc(f.time)}</span><span class="grow" style="font-weight:700">${esc(f.name)}${f.portion !== 1 ? ` <span class="badge">×${fmtQ(f.portion)}</span>` : ''}</span><b class="num">${fmt0(f.kcal * f.portion)}</b></a>`).join('')}</div>`
        : `<div class="notice" style="border-radius:0;background:transparent">${icon('clock', 18)}<span>${selK && !inWindow(sel) ? 'Rincian makanan tanggal ini sudah dihapus otomatis (lebih dari 7 hari). Total kalorinya tetap tersimpan.' : 'Belum ada catatan di tanggal ini.'}</span></div>`}
    </div>
  </section>`;
}

function statusOf(k, T) {
  if (!k) return ['', 'Tidak tercatat'];
  if (k > T) return ['ember', `Lewat target +${fmt0(k - T)}`];
  return ['mint', 'Sesuai target'];
}

/* =============================================================
 *  VIEW: KILAS HARIAN
 * ============================================================= */
async function viewKilas(params) {
  const date = params.get('date') || S.date;
  let r = S.kilas.get(date);
  if (!r) {
    r = await swr('kilas:' + date, () => call('getKilas', { date }, { timeout: 90000 }), (v) => { S.kilas.set(date, v); refreshIf(['kilas']); });
    S.kilas.set(date, r);
  }
  const st = r.settings;
  const T = r.totals;
  const isToday = date === today();
  const head = `<header class="page-head">
    <div class="grow stack" style="gap:2px"><span class="eyebrow ember">Kilas Harian</span><h1>${midDate(date)}</h1></div>
    ${info('Kilas Harian merangkum catatan makanmu dan memberi arahan untuk makan berikutnya. Dibuat otomatis oleh AI dan diperbarui tiap ada catatan baru — bukan saran medis.', 'Kilas Harian')}
    <button class="icon-btn" data-act="kilas-nav" data-n="-1" aria-label="Hari sebelumnya">${icon('left', 18)}</button>
    <button class="icon-btn" data-act="kilas-nav" data-n="1" aria-label="Hari berikutnya" ${isToday ? 'disabled style="opacity:.4"' : ''}>${icon('right', 18)}</button>
  </header>`;
  if (!r.foods.length && !r.kilas) {
    return `${head}<div class="empty">${logo(54)}<b style="color:var(--ink)">Belum ada catatan di tanggal ini</b><span class="small">Kilas Harian dibuat dari makanan yang kamu catat.</span>${inWindow(date) ? `<a class="btn btn-ember btn-sm" href="#/tambah">${icon('plus', 18, 2.4)}Tambah makanan</a>` : ''}</div>`;
  }
  const k = r.kilas || { ringkasan: 'Rangkuman belum tersedia.', bagus: [], perhatian: [], ide: [] };
  const upd = r.updatedAt ? new Date(r.updatedAt) : null;
  const hab = isToday ? (S.days.get(date)?.reminders || []).filter((x) => x.type === 'kebiasaan') : [];
  const buckets = [['Pagi', 0, 11 * 60, 'var(--carb)'], ['Siang', 11 * 60, 15 * 60, 'var(--ember)'], ['Sore', 15 * 60, 18 * 60, 'var(--protein)'], ['Malam', 18 * 60, 24 * 60, 'var(--ink)']].map(([n, a, b, c]) => {
    const kc = r.foods.filter((f) => { const [hh, mm] = f.time.split(':').map(Number); const x = hh * 60 + mm; return x >= a && x < b; }).reduce((s, f) => s + f.kcal * f.portion, 0);
    return { n, kc, c };
  }).filter((x) => x.kc > 0);
  const sumB = buckets.reduce((a, b) => a + b.kc, 0) || 1;

  return `${head}
  <section class="card-dark kilas-hero" id="kilas-hero">
    <div class="row-between" style="position:relative">
      <span class="small" style="color:var(--on-dark-muted)">${upd ? `Diperbarui ${pad(upd.getHours())}:${pad(upd.getMinutes())}` : ''} · ${r.foods.length} catatan</span>
      <button class="btn btn-sm btn-outline-dark" data-act="kilas-refresh" data-date="${date}">${icon('refresh', 16)}Perbarui</button>
    </div>
    <p class="lead" style="position:relative">${esc(k.ringkasan)}</p>
    <div class="tiles" style="position:relative">
      <div class="tile"><span>Kalori</span><b>${fmt0(T.kcal)} / ${fmt0(st.targetKcal)}</b></div>
      <div class="tile"><span>Protein</span><b style="${T.protein < st.targetProtein * 0.8 ? 'color:var(--ember-light)' : ''}">${fmt0(T.protein)} / ${fmt0(st.targetProtein)} g</b></div>
      <div class="tile"><span>Karbo · Lemak</span><b>${fmt0(T.carb)} · ${fmt0(T.fat)} g</b></div>
      <div class="tile"><span>${hab.length ? esc(hab[0].title) : 'Sisa kalori'}</span><b>${hab.length ? (hab[0].status === 'done' ? 'Sudah ✓' : 'Belum') : fmt0(Math.max(0, st.targetKcal - T.kcal)) + ' kkal'}</b></div>
    </div>
  </section>
  <div class="kilas-grid">
    <div class="col">
      ${k.bagus.length ? `<section class="card stack"><h2 class="row" style="gap:8px"><span class="k-ic" style="background:var(--mint-soft);color:var(--mint-text)">${icon('check', 14, 3)}</span>Yang sudah bagus</h2><ul class="k-list">${k.bagus.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}
      ${k.perhatian.length ? `<section class="card stack"><h2 class="row" style="gap:8px"><span class="k-ic" style="background:var(--ember-soft);color:var(--ember-text)">${icon('alert', 14, 3)}</span>Perlu diperhatikan</h2><ul class="k-list">${k.perhatian.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}
      ${buckets.length ? `<section class="card stack"><h2>Sebaran kalori</h2>
        <div class="split" role="img" aria-label="${buckets.map((b) => `${b.n} ${fmt0(b.kc)} kkal`).join(', ')}">${buckets.map((b, i) => `<span style="width:${(b.kc / sumB) * 100}%;background:${b.c};--k:${i}"></span>`).join('')}</div>
        <div class="legend">${buckets.map((b) => `<span><i style="background:${b.c}"></i><b style="color:var(--ink)">${b.n}</b> ${fmt0(b.kc)} kkal · ${Math.round((b.kc / sumB) * 100)}%</span>`).join('')}</div></section>` : ''}
    </div>
    <section class="col" aria-label="Ide makan">
      <h2>${isToday ? 'Ide makan berikutnya' : 'Ide untuk besok'}</h2>
      ${k.ide.map((x) => `<div class="card idea lift">
        <div class="grow stack" style="gap:2px"><b>${esc(x.nama)}</b><span class="small muted">±${fmt0(x.kkal)} kkal · protein ${fmt0(x.protein)} g</span></div>
        ${inWindow(date) ? `<button class="btn btn-sm btn-soft" data-act="idea-log" data-text="${esc(x.nama)}">Catat</button>` : ''}
      </div>`).join('') || '<p class="muted small">Belum ada ide.</p>'}
    </section>
  </div>`;
}

/* =============================================================
 *  VIEW: PENGINGAT
 * ============================================================= */
const REPEATS = [[0, 'Tidak'], [30, '30 mnt'], [60, '1 jam'], [120, '2 jam']];
const repeatText = (m) => (m > 0 ? `Ulang tiap ${repeatShort(m)} jika diabaikan` : 'Sekali, tidak diulang');
const isWide = () => window.matchMedia('(min-width: 1100px)').matches;

async function viewPengingat() {
  const r = await loadReminders();
  const list = [...r.reminders].sort((a, b) => a.time.localeCompare(b.time));
  if (!S.remSel || (S.remSel !== 'new' && !list.some((x) => x.id === S.remSel))) S.remSel = list[0]?.id || 'new';
  const active = list.filter((x) => x.enabled).length;
  const ps = push.pushState();
  const dot = ps === 'on' ? 'var(--mint)' : ps === 'off' ? 'var(--grey)' : 'var(--ember)';
  return `
  <header class="page-head">
    <h1>Pengingat</h1>
    <button class="icon-btn" data-act="bell" aria-label="Pengaturan notifikasi">${icon('bell', 21)}<i class="dot-badge" style="background:${dot}"></i></button>
    <button class="icon-btn ink" data-act="rem-new" aria-label="Tambah pengingat">${icon('plus', 20, 2.6)}</button>
  </header>
  <div class="row-between" style="margin-top:-8px">
    <span class="small muted" style="font-weight:600">${active} aktif · berbunyi setiap hari</span>
    ${info('Semua pengingat berbunyi setiap hari. Kalau diabaikan, notifikasi diulang sesuai pengaturan sampai kamu tekan “Sudah”. Pengingat catat makan otomatis dilewati kalau kamu sudah mencatat makanan di sekitar jam itu.', 'pengingat')}
  </div>
  ${ps !== 'on' ? `<button class="notice notice-btn" data-act="bell">${icon('bell', 18)}<span>Notifikasi belum aktif di perangkat ini. Ketuk untuk mengatur.</span>${icon('right', 16)}</button>` : ''}
  ${r.quiet?.now ? `<div class="notice">${icon('clock', 18)}<span>Sekarang jam tenang (${esc(r.quiet.after)}–${esc(r.quiet.before)}): pengingat ditahan dulu.</span></div>` : ''}
  <div class="rem-layout">
    <section class="card rem-list" aria-label="Daftar pengingat">
      ${list.map(remRow).join('') || `<div class="empty" style="border:0">Belum ada pengingat.<button class="btn btn-ink btn-sm" data-act="rem-new">${icon('plus', 16, 2.6)}Tambah pengingat</button></div>`}
    </section>
    <section class="card rem-panel" aria-label="Ubah pengingat">${remForm(S.remSel)}</section>
  </div>`;
}

function remRow(x) {
  const meal = x.type === 'makan';
  return `<div class="rem-row ${x.enabled ? '' : 'off'} ${S.remSel === x.id ? 'sel' : ''}" data-rid="${esc(x.id)}">
    <span class="rem-ic ${meal ? 'meal' : 'pill'}">${icon(meal ? 'meal' : 'pill', 20)}</span>
    <div class="grow" style="min-width:0">
      <b class="rem-time num">${esc(x.time)}</b>
      <div class="rem-name">${esc(x.title)}</div>
      <span class="small muted">${Number(x.repeatMin) > 0 ? `Ulang tiap ${repeatShort(Number(x.repeatMin))}` : 'Tidak diulang'}</span>
    </div>
    <button class="icon-btn soft" data-act="rem-edit" aria-label="Ubah ${esc(x.title)}">${icon('pencil', 17)}</button>
    <button class="switch" data-act="rem-toggle" aria-pressed="${x.enabled}" aria-label="Aktifkan ${esc(x.title)}"></button>
  </div>`;
}

function remForm(id) {
  const isNew = id === 'new';
  const x = isNew
    ? { id: '', title: '', time: '20:00', repeatMin: 60, type: 'kebiasaan', enabled: true }
    : S.rem?.reminders.find((r) => r.id === id);
  if (!x) return '';
  const rep = Number(x.repeatMin) || 0;
  return `<form class="stack" data-form="rem" style="gap:14px">
    <h2 style="font-size:19px">${isNew ? 'Pengingat baru' : 'Ubah pengingat'}</h2>
    <label class="field"><span>Nama</span><input name="title" class="input" required maxlength="60" value="${esc(x.title)}" placeholder="mis. Minum air 2 gelas"></label>
    <label class="field"><span>Jam</span><input name="time" type="time" class="input big" required value="${esc(x.time)}"></label>
    <div class="field"><span>Ulangi jika diabaikan</span>
      <div class="opts" role="group" aria-label="Ulangi jika diabaikan">${REPEATS.map(([v, l]) => `<button type="button" data-act="rep-pick" data-v="${v}" aria-pressed="${rep === v}">${l}</button>`).join('')}</div>
      <input type="hidden" name="repeat" value="${rep}">
    </div>
    <input type="hidden" name="id" value="${esc(x.id)}">
    <input type="hidden" name="type" value="${esc(x.type)}">
    <button class="btn btn-ink btn-lg btn-block" type="submit">${icon('check', 18, 2.6)}Simpan</button>
    ${isNew ? '' : `<button type="button" class="btn btn-ghost danger-text" data-act="rem-delete" data-rid="${esc(x.id)}">Hapus pengingat</button>`}
  </form>`;
}

function bellSheet() {
  const r = S.rem || {};
  const ps = push.pushState();
  const live = !conn.demo;
  const needFb = live && !push.firebaseReady();
  const status = {
    on: ['var(--mint-soft)', 'var(--mint-text)', 'check', 'Aktif di perangkat ini'],
    off: ['var(--soft)', 'var(--ink)', 'bell', 'Belum aktif di perangkat ini'],
    denied: ['var(--ember-soft)', 'var(--ember-text)', 'alert', 'Izin notifikasi diblokir'],
    'ios-install': ['var(--ember-soft)', 'var(--ember-text)', 'phone', 'iPhone: pasang ke layar utama dulu'],
    unsupported: ['var(--ember-soft)', 'var(--ember-text)', 'alert', 'Browser ini belum mendukung notifikasi'],
  }[ps];
  const help = {
    denied: 'Buka pengaturan situs di browser → Notifikasi → Izinkan, lalu muat ulang halaman.',
    'ios-install': 'Buka Kalora di Safari → tombol Bagikan → “Add to Home Screen”. Setelah itu buka Kalora dari ikon di layar utama dan aktifkan di sini.',
    unsupported: 'Coba pakai Chrome, Edge, atau Safari versi terbaru.',
  }[ps];
  openSheet(`<div class="row-between"><h2 style="font-size:20px">Notifikasi</h2><button class="icon-btn soft" data-sheet-close aria-label="Tutup">${icon('x', 18)}</button></div>
    <div class="row" style="background:${status[0]};border-radius:18px;padding:14px">
      <span class="k-ic" style="width:42px;height:42px;border-radius:14px;background:#fff;color:${status[1]}">${icon(status[2], 20, 2.4)}</span>
      <div class="grow"><b>${status[3]}</b><div class="small muted">${esc(push.deviceLabel())}</div></div>
    </div>
    ${help ? `<p class="small muted" style="margin:0">${help}</p>` : ''}
    ${needFb ? `<div class="notice">${icon('alert', 18)}<span>Firebase belum diatur. Isi <b>FIREBASE</b> &amp; <b>VAPID_KEY</b> di <code>js/config.js</code>, lalu upload ulang ke GitHub.</span></div>` : ''}
    <div>
      <div class="row-between" style="min-height:44px;border-bottom:1px solid var(--line-2)"><span>Perangkat terdaftar</span><b>${r.devices ?? '—'}</b></div>
      <div class="row-between" style="min-height:44px"><span>Jam tenang</span><a href="#/pengaturan" style="font-weight:800;text-decoration:none">${esc(r.quiet?.after || S.settings?.quietAfter || '22:30')} – ${esc(r.quiet?.before || S.settings?.quietBefore || '07:00')}</a></div>
    </div>
    ${ps === 'off' ? `<button class="btn btn-ember btn-lg btn-block" data-act="push-enable" ${needFb ? 'disabled' : ''}>${icon('bell', 18)}Aktifkan di perangkat ini</button>` : ''}
    ${ps === 'on' ? `<button class="btn btn-soft btn-lg btn-block" data-act="push-test">${icon('send', 18)}Kirim notifikasi uji</button>` : ''}`);
}

/* =============================================================
 *  VIEW: KONFIRMASI KEBIASAAN
 * ============================================================= */
async function viewKonfirmasi(params) {
  const r = await loadReminders();
  const habits = r.reminders.filter((x) => x.type === 'kebiasaan');
  const rid = params.get('rid') || habits.find((h) => h.enabled)?.id || habits[0]?.id;
  const h = r.reminders.find((x) => x.id === rid);
  if (!h) return `<section class="card stack"><h2>Pengingat tidak ditemukan</h2><a class="btn btn-ink" href="#/pengingat">Ke pengingat</a></section>`;
  const date = params.get('date') || today();
  const v = r.today.find((x) => x.rid === rid) || { status: 'nanti', time: h.time, nextAt: h.time, sentCount: 0, doneAt: '', repeatMin: h.repeatMin };
  const auto = params.get('do');
  const key = `${rid}|${date}|${auto}`;
  if (auto && !S.autoDone.has(key) && v.status !== 'done') {
    S.autoDone.add(key);
    setTimeout(() => remAction(rid, auto === 'done' ? 'done' : 'snooze', auto === 'snooze' ? addMinHM(30) : undefined, date, true), 80);
  }
  const done = v.status === 'done';
  const title = done ? 'Mantap, tercatat!' : v.status === 'snoozed' ? 'Oke, ditunda' : `Sudah ${esc(h.title.toLowerCase())}?`;
  const sub = done ? `Ditandai ${v.doneAt} · streak ${r.streaks[rid] || 1} hari`
    : v.status === 'snoozed' ? `Kalora akan mengingatkan lagi jam <b>${v.nextAt}</b>.`
    : `Dijadwalkan ${h.time}`;
  return `<div class="confirm">
    <header class="row-between">
      <a class="icon-btn" href="#/" aria-label="Tutup">${icon('x', 20)}</a>
      <span class="small" style="font-weight:700;color:var(--mint-ink)">${v.sentCount > 1 ? `Pengingat ke-${v.sentCount}` : 'Pengingat'} · ${shortDate(date)}</span>
      <a class="icon-btn" href="#/pengingat" aria-label="Pengaturan pengingat">${icon('gear', 20)}</a>
    </header>
    <div class="confirm-hero">
      <div class="confirm-badge ${done ? 'done' : ''}" id="confirm-badge">${done ? icon('check', 72, 2.6) : icon('pill', 78, 1.6)}</div>
      <h1>${title}</h1>
      <div class="row" style="gap:2px;justify-content:center;color:var(--mint-ink)"><span>${sub}</span>${!done ? info(`Kalau belum ditandai, Kalora mengingatkan lagi ${h.repeatMin > 0 ? `tiap ${h.repeatMin >= 60 ? h.repeatMin / 60 + ' jam' : h.repeatMin + ' menit'}` : 'sesuai jadwal'} sampai kamu tekan “Sudah” atau menundanya.`, 'pengingat ulang', 'left') : ''}</div>
    </div>
    <section class="confirm-sheet">
      ${done ? `<a class="btn btn-ink btn-lg btn-block" href="#/">Kembali ke Hari ini</a>
        <button class="btn btn-ghost" data-act="rem-undo" data-rid="${esc(rid)}" data-date="${date}">Batalkan</button>`
      : `<button class="btn btn-ink btn-lg btn-block" style="height:62px;font-size:17px" data-act="rem-done" data-rid="${esc(rid)}" data-date="${date}">${icon('check', 22, 2.6)}Sudah</button>
        <span class="label">Tunda ke…</span>
        <div class="row" style="gap:8px">${[[15, '+15 mnt'], [30, '+30 mnt'], [60, '+1 jam']].map(([m, l]) => `<button class="btn btn-soft grow" data-act="snooze-quick" data-rid="${esc(rid)}" data-date="${date}" data-min="${m}">${l}</button>`).join('')}</div>
        <div class="row" style="align-items:flex-end">
          <label class="field grow"><span>Atau pilih jam sendiri</span><input type="time" class="input big" id="snooze-time" value="${addMinHM(120)}"></label>
          <button class="btn btn-ember" style="height:54px" data-act="snooze-custom" data-rid="${esc(rid)}" data-date="${date}">Tunda</button>
        </div>`}
    </section>
  </div>`;
}

async function remAction(rid, what, until, date = today(), celebrate = false) {
  try {
    const r = await call('reminderAction', { rid, date, do: what, until });
    forgetReminders();
    const v = r.view;
    toast(what === 'done' ? 'Tercatat ✓' : what === 'snooze' ? `Ditunda sampai ${v.nextAt}` : 'Dibatalkan');
    await rerender();
    if ((what === 'done' || celebrate) && $('#confirm-badge')) burst($('#confirm-badge'));
    return v;
  } catch (e) { toast(e.message, 'err'); return null; }
}

function pushResultSheet(r) {
  const rows = (r.results || []).map((x) => `<div class="row" style="align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--line-2)">
    <span class="k-ic" style="background:${x.ok ? 'var(--mint-soft);color:var(--mint-text)' : '#FDECEC;color:#B42318'}">${icon(x.ok ? 'check' : 'alert', 14, 3)}</span>
    <div class="grow"><b>${esc(x.label)}</b><div class="small muted">${x.ok ? 'Terkirim ke FCM' : esc(x.error || 'Gagal')}</div></div></div>`).join('');
  openSheet(`<h2 style="font-size:20px">Hasil kirim uji</h2>
    <p class="muted small">${r.sent || 0} dari ${r.total || 0} perangkat berhasil.</p>
    <div>${rows || '<p class="muted">Belum ada perangkat terdaftar.</p>'}</div>
    <div class="notice">${icon('info', 18)}<span>Kalau terkirim tapi tidak muncul: cek izin notifikasi browser/HP, mode Fokus/Jangan Ganggu, dan di iPhone pastikan Kalora dibuka dari ikon layar utama.</span></div>
    <button class="btn btn-ink btn-block" data-sheet-close>Tutup</button>`);
}

function snoozeSheet(rid, date = today()) {
  openSheet(`<h2 style="font-size:20px">Tunda pengingat</h2>
    <div class="row" style="gap:8px">${[[15, '+15 mnt'], [30, '+30 mnt'], [60, '+1 jam']].map(([m, l]) => `<button class="btn btn-soft grow" data-act="snooze-quick" data-rid="${esc(rid)}" data-date="${date}" data-min="${m}">${l}</button>`).join('')}</div>
    <div class="row" style="align-items:flex-end">
      <label class="field grow"><span>Atau pilih jam</span><input type="time" class="input big" id="snooze-time" value="${addMinHM(120)}"></label>
      <button class="btn btn-ember" style="height:54px" data-act="snooze-custom" data-rid="${esc(rid)}" data-date="${date}">Tunda</button>
    </div>`);
}

/* =============================================================
 *  VIEW: PENGATURAN
 * ============================================================= */
async function viewPengaturan() {
  let st = S.settings;
  if (!st) { st = await call('getSettings'); S.settings = st; }
  const num = (name, label, val, unit) => `<label class="field"><span>${label}</span><div class="row" style="gap:8px"><input class="input" name="${name}" inputmode="numeric" value="${val}"><span class="small muted" style="width:34px">${unit}</span></div></label>`;
  return `
  <header class="page-head"><a class="icon-btn mobile-only" href="#/" aria-label="Kembali">${icon('left', 20)}</a><h1>Pengaturan</h1></header>
  <form class="card stack" data-form="settings" style="gap:14px">
    <div class="row-between"><h2>Target harian</h2>${info('Dipakai untuk ring kalori, grafik riwayat, dan Kilas Harian. Sesuaikan dengan kebutuhanmu.', 'target')}</div>
    <div class="nutri-grid">
      ${num('targetKcal', 'Kalori', st.targetKcal, 'kkal')}
      ${num('targetProtein', 'Protein', st.targetProtein, 'g')}
      ${num('targetCarb', 'Karbohidrat', st.targetCarb, 'g')}
      ${num('targetFat', 'Lemak', st.targetFat, 'g')}
    </div>
    <div class="row-between"><h2>Jam tenang</h2>${info('Di antara jam ini tidak ada notifikasi yang dikirim.', 'jam tenang')}</div>
    <div class="row">
      <label class="field grow"><span>Mulai</span><input class="input" type="time" name="quietAfter" value="${st.quietAfter}"></label>
      <label class="field grow"><span>Selesai</span><input class="input" type="time" name="quietBefore" value="${st.quietBefore}"></label>
    </div>
    <button class="btn btn-ink btn-block" type="submit">${icon('check', 18, 2.6)}Simpan pengaturan</button>
  </form>
  <section class="card stack">
    <h2>Koneksi</h2>
    <div class="row-between"><span class="muted">Mode</span><b>${conn.demo ? 'Demo (data di browser ini)' : 'Apps Script'}</b></div>
    ${conn.demo ? '' : `<div class="row-between"><span class="muted">Server</span><span class="small" style="max-width:60%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(conn.url.replace(/^https:\/\//, '').slice(0, 48))}…</span></div>`}
    <div class="row" style="flex-wrap:wrap">
      <button class="btn btn-soft" data-act="disconnect">${icon('logout', 18)}${conn.demo ? 'Keluar dari demo' : 'Putuskan koneksi'}</button>
      ${conn.demo ? `<button class="btn btn-ghost" data-act="demo-reset">${icon('refresh', 18)}Reset data demo</button>` : ''}
    </div>
  </section>
  <p class="small muted" style="text-align:center">Kalora v${CONFIG.VERSION}</p>`;
}

/* =============================================================
 *  HOOK SETELAH MOUNT
 * ============================================================= */
const AFTER = {
  riwayat() { const h = $('#heat'); if (h) h.scrollLeft = h.scrollWidth; },
};

/* =============================================================
 *  EVENT
 * ============================================================= */
const ACT = {
  retry: () => render(),
  demo() { conn.enableDemo(); push.sendConfToSW(); toast('Mode demo aktif — data hanya di browser ini'); go('#/'); render(); },
  async disconnect() {
    if (!(await confirmSheet('Putuskan koneksi?', 'Kamu perlu memasukkan URL & kode akses lagi untuk memakai Kalora.', 'Putuskan'))) return;
    conn.reset(); S.days.clear(); S.history = null; S.rem = null; S.kilas.clear(); S.settings = null;
    push.sendConfToSW();
    go('#/');
    render();
  },
  async 'demo-reset'() {
    if (!(await confirmSheet('Reset data demo?', 'Semua data contoh akan dibuat ulang.', 'Reset', true))) return;
    resetDemo(); S.days.clear(); S.history = null; S.rem = null; S.kilas.clear(); toast('Data demo dibuat ulang'); go('#/');
  },
  'open-day': (el) => { S.date = el.dataset.date; go('#/'); },
  'edit-from-hist': (el) => { S.date = el.dataset.date; location.hash = el.getAttribute('href'); },
  'add-tab': (el) => {
    if (S.busy) return;
    S.addTab = el.dataset.tab;
    $$('[data-act="add-tab"]').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === S.addTab));
    const body = $('#add-body');
    body.innerHTML = S.addTab === 'foto' ? fotoPane() : manualPane();
    body.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 280, easing: 'cubic-bezier(.2,.8,.2,1)' });
    if (S.addTab === 'manual') $('#manual-text')?.focus();
  },
  'pick-file': (el) => $('#' + el.dataset.target)?.click(),
  chip(el) {
    const ta = $('#manual-text');
    ta.value = ta.value.trim() ? `${ta.value.trim().replace(/,$/, '')}, ${el.dataset.text}` : el.dataset.text;
    S.manualText = ta.value;
    ta.focus();
  },
  'analyze-text': () => analyzeText(),
  qty(el) {
    const i = Number(el.closest('.item-card').dataset.idx);
    const it = S.draft.items[i];
    it.qty = Math.max(0.5, Math.round((it.qty + Number(el.dataset.d)) * 2) / 2);
    refreshItem(i, true);
  },
  'qty-set'(el) {
    const i = Number(el.closest('.item-card').dataset.idx);
    S.draft.items[i].qty = Number(el.dataset.q);
    refreshItem(i, true);
  },
  'item-remove'(el) {
    const card = el.closest('.item-card');
    const i = Number(card.dataset.idx);
    card.classList.add('removing');
    setTimeout(() => { S.draft.items.splice(i, 1); rerenderItems(); }, 280);
  },
  'item-add'() {
    S.draft.items.push(normItem({ name: '', qty: 1, unit: 'porsi' }));
    rerenderItems();
    const inputs = $$('.item-name');
    inputs[inputs.length - 1]?.focus();
  },
  'save-draft': (el) => saveDraft(el),
  async 'delete-food'() {
    if (!(await confirmSheet('Hapus catatan ini?', 'Kalori harinya akan dihitung ulang.', 'Hapus', true))) return;
    try {
      await call('deleteFood', { id: S.draft.id });
      invalidateFood(S.draft.date);
      S.date = S.draft.date;
      S.draft = null;
      toast('Catatan dihapus');
      go('#/');
    } catch (e) { toast(e.message, 'err'); }
  },
  'hist-tab': (el) => { S.hist.tab = el.dataset.tab; S.hist.anchor = minDate(today(), S.hist.sel); render(); },
  'hist-sel': (el) => { S.hist.sel = el.dataset.date; rerender(); },
  'hist-shift': (el) => {
    const n = Number(el.dataset.n);
    S.hist.anchor = minDate(today(), maxDate(addDays(today(), -365), addDays(S.hist.anchor, n)));
    render();
  },
  'hist-month': (el) => {
    const a = parseISO(S.hist.anchor);
    const d = new Date(a.getFullYear(), a.getMonth() + Number(el.dataset.n), 1);
    S.hist.anchor = minDate(today(), toISO(new Date(d.getFullYear(), d.getMonth() + 1, 0)));
    render();
  },
  'kilas-nav': (el) => {
    const { params } = parseHash();
    const cur = params.get('date') || S.date;
    const next = minDate(today(), addDays(cur, Number(el.dataset.n)));
    S.date = next;
    go(`#/kilas?date=${next}`);
  },
  async 'kilas-refresh'(el) {
    const date = el.dataset.date;
    busyBtn(el, true, 'Merangkum…');
    $('#kilas-hero p.lead')?.classList.add('skel');
    try {
      const r = await call('getKilas', { date, refresh: true }, { timeout: 90000 });
      S.kilas.set(date, r);
      if (!conn.demo) cache.set('kilas:' + date, r);
      S.days.delete(date);
      await render();
      toast('Kilas Harian diperbarui');
    } catch (e) { busyBtn(el, false); $('#kilas-hero p.lead')?.classList.remove('skel'); toast(e.message, 'err'); }
  },
  'idea-log': (el) => { S.addTab = 'manual'; S.manualText = `1 porsi ${el.dataset.text}`; go('#/tambah'); },
  'rem-done': (el) => remAction(el.dataset.rid, 'done', undefined, el.dataset.date || today(), true),
  'rem-undo': (el) => remAction(el.dataset.rid, 'undo', undefined, el.dataset.date || today()),
  'rem-snooze': (el) => snoozeSheet(el.dataset.rid),
  'snooze-quick': (el) => { closeSheet(); remAction(el.dataset.rid, 'snooze', addMinHM(Number(el.dataset.min)), el.dataset.date || today()); },
  'snooze-custom': (el) => {
    const v = $('#snooze-time')?.value;
    if (!v) return;
    closeSheet();
    remAction(el.dataset.rid, 'snooze', v, el.dataset.date || today());
  },
  'rem-toggle'(el) {
    const rid = el.closest('[data-rid]').dataset.rid;
    const r = S.rem.reminders.find((x) => x.id === rid);
    r.enabled = !r.enabled;
    el.setAttribute('aria-pressed', r.enabled);
    el.closest('.rem-row')?.classList.toggle('off', !r.enabled);
    saveReminder(r, 0);
  },
  bell: () => bellSheet(),
  'rem-new'() {
    if (isWide()) { S.remSel = 'new'; rerender().then(() => $('.rem-panel input[name=title]')?.focus()); }
    else openSheet(remForm('new'));
  },
  'rem-edit'(el) {
    const rid = el.closest('[data-rid]').dataset.rid;
    if (isWide()) { S.remSel = rid; rerender(); }
    else openSheet(remForm(rid));
  },
  'rep-pick'(el) {
    const f = el.closest('form');
    $$('[data-act="rep-pick"]', f).forEach((b) => b.setAttribute('aria-pressed', b === el));
    f.repeat.value = el.dataset.v;
  },
  async 'rem-delete'(el) {
    const rid = el.dataset.rid;
    const x = S.rem?.reminders.find((r) => r.id === rid);
    if (!(await confirmSheet('Hapus pengingat ini?', `“${x?.title || ''}” tidak akan berbunyi lagi.`, 'Hapus', true))) return;
    try { await call('deleteReminder', { id: rid }); forgetReminders(); S.remSel = null; toast('Pengingat dihapus'); render({ quiet: true }); } catch (e) { toast(e.message, 'err'); }
  },
  async 'push-enable'(el) {
    busyBtn(el, true, 'Mengaktifkan…');
    try { await push.enablePush(); closeSheet(); toast('Notifikasi aktif di perangkat ini'); forgetReminders(); render({ quiet: true }); } catch (e) { busyBtn(el, false); toast(e.message, 'err'); }
  },
  async 'push-test'(el) {
    busyBtn(el, true, 'Mengirim…');
    try {
      const r = await call('testPush');
      busyBtn(el, false);
      if (r.total && r.sent === r.total) { toast(`Terkirim ke ${r.sent} perangkat — cek notifikasimu`); return; }
      pushResultSheet(r);
    } catch (e) { busyBtn(el, false); toast(e.message, 'err'); }
  },
};

const saveTimers = new Map();
function saveReminder(r, delay = 700) {
  clearTimeout(saveTimers.get(r.id));
  saveTimers.set(r.id, setTimeout(async () => {
    try { await call('saveReminder', { reminder: r }); cache.del('rem'); cache.del('day:' + today()); S.days.delete(today()); toast('Pengingat disimpan'); } catch (e) { toast(e.message, 'err'); }
  }, delay));
}

const ON = {
  'manual-text': (el) => { S.manualText = el.value; },
  file: (el) => { const f = el.files?.[0]; el.value = ''; handleImage(f); },
  'item-name': (el) => { S.draft.items[Number(el.closest('.item-card').dataset.idx)].name = el.value; },
  'item-num': (el) => {
    const i = Number(el.closest('.item-card').dataset.idx);
    S.draft.items[i][el.dataset.k] = Math.max(0, parseNum(el.value));
    refreshItem(i);
  },
  'draft-date': (el) => { S.draft.date = el.value; },
  'draft-time': (el) => { S.draft.time = el.value; },
  'hist-jump': (el) => { if (el.value) { S.hist.sel = el.value; S.hist.anchor = el.value; render(); } },
};
const ON_CHANGE_ONLY = new Set(['pick-date', 'file', 'draft-date', 'draft-time', 'hist-jump', 'rem-time', 'rem-repeat']);

const FORMS = {
  async connect(form) {
    const url = form.url.value.trim();
    const token = form.token.value.trim();
    if (!/^https:\/\/script\.google(usercontent)?\.com\//.test(url)) { toast('URL harus dari script.google.com dan berakhiran /exec.', 'err'); return; }
    const btn = $('button[type=submit]', form);
    busyBtn(btn, true, 'Menghubungkan…');
    conn.save(url, token);
    try {
      await call('ping');
      push.sendConfToSW();
      toast('Terhubung! Selamat datang di Kalora');
      go('#/');
      render();
    } catch (e) {
      conn.reset();
      busyBtn(btn, false);
      toast(e.message, 'err');
    }
  },
  async settings(form) {
    const btn = $('button[type=submit]', form);
    busyBtn(btn, true, 'Menyimpan…');
    const fd = Object.fromEntries(new FormData(form));
    try {
      S.settings = await call('saveSettings', { settings: { ...fd, targetKcal: parseNum(fd.targetKcal), targetProtein: parseNum(fd.targetProtein), targetCarb: parseNum(fd.targetCarb), targetFat: parseNum(fd.targetFat) } });
      S.days.clear(); S.history = null; S.kilas.clear(); S.rem = null; cache.clear();
      busyBtn(btn, false);
      toast('Pengaturan disimpan');
    } catch (e) { busyBtn(btn, false); toast(e.message, 'err'); }
  },
  async rem(form) {
    const btn = $('button[type=submit]', form);
    const fd = Object.fromEntries(new FormData(form));
    const old = S.rem?.reminders.find((x) => x.id === fd.id);
    const reminder = {
      id: fd.id || undefined,
      type: fd.type === 'makan' ? 'makan' : 'kebiasaan',
      title: String(fd.title || '').trim(),
      time: fd.time,
      repeatMin: Number(fd.repeat) || 0,
      days: '1111111',
      enabled: old ? old.enabled : true,
      order: old ? old.order : 50,
    };
    if (!reminder.title) { toast('Isi nama pengingatnya dulu.', 'err'); return; }
    busyBtn(btn, true, 'Menyimpan…');
    try {
      const r = await call('saveReminder', { reminder });
      forgetReminders();
      S.remSel = r.reminder.id;
      closeSheet();
      toast(old ? 'Pengingat disimpan' : 'Pengingat ditambahkan');
      render({ quiet: true });
    } catch (e) { busyBtn(btn, false); toast(e.message, 'err'); }
  },
};

function bindEvents() {
  document.addEventListener('click', (e) => {
    // tutup popover info lain
    $$('details.info[open]').forEach((d) => { if (!d.contains(e.target)) d.open = false; });
    if (e.target.matches('[data-backdrop]') || e.target.closest('[data-sheet-close]')) { closeSheet(); return; }
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const fn = ACT[el.dataset.act];
    if (!fn) return;
    if (el.tagName === 'A' && el.dataset.act !== 'edit-from-hist') e.preventDefault();
    if (el.dataset.act === 'edit-from-hist') e.preventDefault();
    fn(el, e);
  });
  const onInput = (e) => {
    const el = e.target.closest('[data-on]');
    if (!el) return;
    const key = el.dataset.on;
    if (e.type === 'input' && ON_CHANGE_ONLY.has(key)) return;
    ON[key]?.(el, e);
  };
  document.addEventListener('input', onInput);
  document.addEventListener('change', onInput);
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-form]');
    if (!f) return;
    e.preventDefault();
    FORMS[f.dataset.form]?.(f);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeSheet(); $$('details.info[open]').forEach((d) => { d.open = false; }); }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && e.target.id === 'manual-text') analyzeText();
  });
  // tarik & lepas / tempel foto
  document.addEventListener('dragover', (e) => {
    const z = e.target.closest?.('[data-drop]');
    if (!z) return;
    e.preventDefault();
    z.classList.add('drag');
  });
  document.addEventListener('dragleave', (e) => { e.target.closest?.('[data-drop]')?.classList.remove('drag'); });
  document.addEventListener('drop', (e) => {
    const z = e.target.closest?.('[data-drop]');
    if (!z) return;
    e.preventDefault();
    z.classList.remove('drag');
    handleImage(e.dataTransfer.files?.[0]);
  });
  document.addEventListener('paste', (e) => {
    if (parseHash().path !== 'tambah' || S.addTab !== 'foto') return;
    const f = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith('image/'));
    if (f) { e.preventDefault(); handleImage(f); }
  });
  // popover info: geser supaya tidak keluar layar
  document.addEventListener('toggle', (e) => {
    const d = e.target;
    if (!d.matches?.('details.info') || !d.open) return;
    const pop = $('.pop', d);
    // ukur dari layout (bukan getBoundingClientRect) karena popover sedang beranimasi scale
    const a = d.getBoundingClientRect();
    const w = pop.offsetWidth;
    const left = d.classList.contains('left') ? a.left - 6 : a.right + 6 - w;
    const right = left + w;
    let shift = 0;
    if (left < 10) shift = 10 - left;
    else if (right > window.innerWidth - 10) shift = window.innerWidth - 10 - right;
    pop.style.translate = `${shift}px 0`;
  }, true);
  window.addEventListener('hashchange', () => { closeSheet(); render(); });
  // kembali ke app setelah lama → segarkan data hari ini
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && conn.ready) {
      if (S.date !== today() && S.date === addDays(today(), -1)) S.date = today();
      S.days.delete(today()); S.rem = null; // cache lokal tetap dipakai untuk tampilan instan
      const p = parseHash().path;
      if (p === '' || p === 'pengingat') rerender();
    }
  });
}

function hydrateStatic() {
  $$('[data-icon]').forEach((el) => { el.outerHTML = icon(el.dataset.icon, Number(el.dataset.size) || 20, Number(el.dataset.stroke) || 2); });
  $$('[data-logo]').forEach((el) => { el.insertAdjacentHTML('afterbegin', logo(Number(el.dataset.logo), { legs: '#FFFFFF' })); el.removeAttribute('data-logo'); });
}

/* ---------------- mulai ---------------- */
hydrateStatic();
bindEvents();
pruneCache();
render();
push.registerSW().then(() => setTimeout(() => push.refreshPush(), 6000));
