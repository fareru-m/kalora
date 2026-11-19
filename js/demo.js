// =============================================================
//  MODE DEMO — backend tiruan di localStorage.
//  Dipakai saat belum terhubung ke Apps Script, supaya semua
//  layar bisa dicoba. AI-nya juga tiruan (tidak memanggil Gemini).
// =============================================================
const KEY = 'kalora.demo.db';
const DETAIL_DAYS = 7;
const NUM = ['kcal', 'carb', 'protein', 'fat', 'sugar', 'fiber', 'sodium'];
const DEFAULT_SETTINGS = { targetKcal: 2000, targetProtein: 100, targetCarb: 250, targetFat: 65, quietAfter: '22:30', quietBefore: '07:00' };

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => iso(new Date());
const addDays = (s, n) => { const [y, m, d] = s.split('-').map(Number); return iso(new Date(y, m - 1, d + n)); };
const daysAgo = (s) => { const [y, m, d] = s.split('-').map(Number); const a = new Date(); a.setHours(0, 0, 0, 0); return Math.round((a - new Date(y, m - 1, d)) / 864e5); };
const nowHM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const hm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const at = (date, time) => new Date(`${date}T${time}:00`);
const dow = (s) => (new Date(`${s}T12:00:00`).getDay() + 6) % 7; // 0 = Senin
const r1 = (n) => Math.round(n * 10) / 10;
const num = (v) => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isNaN(n) ? 0 : n; };
const mins = (t) => { const [h, m] = String(t || '0:0').split(':').map(Number); return h * 60 + m; };
const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const POOL = [
  ['Oatmeal + susu', 'Roti + selai kacang', 'Sereal + susu', 'Onigiri ×2', 'Roti gandum + telur'],
  ['Bento ayam teriyaki', 'Kare nasi', 'Gyudon (kecil)', 'Nasi ayam bakar', 'Ramen shoyu'],
  ['Salmon + nasi', 'Tahu tempe + sayur', 'Ayam panggang + salad', 'Mi goreng + telur', 'Sup ayam + nasi'],
];

function macros(kcal, rand) {
  const c = 0.45 + rand() * 0.1, p = 0.14 + rand() * 0.06;
  return { carb: r1((kcal * c) / 4), protein: r1((kcal * p) / 4), fat: r1((kcal * (1 - c - p)) / 9), sugar: r1(kcal * 0.02), fiber: r1(2 + rand() * 4), sodium: Math.round(300 + rand() * 900) };
}

function seed() {
  const t = today();
  const rand = rng(42);
  const db = {
    foods: [], daily: {}, status: {}, kilas: {}, devices: 0, imgCount: 0,
    settings: { ...DEFAULT_SETTINGS },
    reminders: [
      { id: 'vitamin', type: 'kebiasaan', title: 'Minum vitamin', time: '08:00', repeatMin: 120, days: '1111111', enabled: true, order: 1 },
      { id: 'makan-pagi', type: 'makan', title: 'Catat sarapan', time: '09:00', repeatMin: 0, days: '1111111', enabled: true, order: 2 },
      { id: 'makan-siang', type: 'makan', title: 'Catat makan siang', time: '12:00', repeatMin: 0, days: '1111111', enabled: true, order: 3 },
      { id: 'makan-sore', type: 'makan', title: 'Catat camilan / makan malam', time: '17:00', repeatMin: 0, days: '1111111', enabled: true, order: 4 },
    ],
  };
  for (let i = 1; i <= 365; i++) {
    const date = addDays(t, -i);
    const r = rand();
    if (r < 0.06) continue; // hari tidak tercatat
    const kcal = Math.round(1450 + rand() * 950);
    if (i < DETAIL_DAYS) {
      const parts = [0.25, 0.4, 0.35];
      const times = ['07:45', '12:30', '19:10'];
      parts.forEach((p, k) => {
        const kk = Math.round(kcal * p);
        db.foods.push({ id: id() + k + i, date, time: times[k], name: POOL[k][Math.floor(rand() * 5)], source: ['foto', 'foto', 'manual'][k], portion: 1, unit: 'porsi', kcal: kk, ...macros(kk, rand) });
      });
    }
    const m = macros(kcal, rand);
    db.daily[date] = { kcal, carb: m.carb, protein: m.protein, fat: m.fat, count: 3 };
    if (i <= 40 && rand() > 0.12) db.status[`${date}|vitamin`] = { status: 'done', doneAt: at(date, '08:0' + Math.floor(rand() * 9)).toISOString(), sentCount: 1 };
  }
  const tf = [
    ['07:40', 'Roti gandum + telur', 'foto', 1, 'porsi', { kcal: 320, carb: 34, protein: 18, fat: 12, sugar: 4, fiber: 5, sodium: 420 }],
    ['12:15', 'Nasi ayam bakar', 'foto', 1, 'porsi', { kcal: 640, carb: 92, protein: 26, fat: 16, sugar: 6, fiber: 2, sodium: 980 }],
    ['15:30', 'Greek yogurt plain', 'tabel', 2, 'sajian (100 g)', { kcal: 130, carb: 6, protein: 11, fat: 7, sugar: 5, fiber: 0, sodium: 45 }],
  ];
  tf.forEach(([time, name, source, portion, unit, n]) => db.foods.push({ id: id() + name.length, date: t, time, name, source, portion, unit, ...n }));
  recompute(db, t);
  return db;
}

function load() {
  try {
    const db = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (db) return db;
  } catch { /* data rusak → buat ulang */ }
  const db = seed();
  save(db);
  return db;
}
function save(db) { localStorage.setItem(KEY, JSON.stringify(db)); }

function foodsOn(db, date) { return db.foods.filter((f) => f.date === date).sort((a, b) => a.time.localeCompare(b.time)); }
function sum(foods) {
  const t = { kcal: 0, carb: 0, protein: 0, fat: 0, count: foods.length };
  foods.forEach((f) => { ['kcal', 'carb', 'protein', 'fat'].forEach((k) => { t[k] += num(f[k]) * (num(f.portion) || 1); }); });
  ['kcal', 'carb', 'protein', 'fat'].forEach((k) => { t[k] = r1(t[k]); });
  return t;
}
function recompute(db, date) {
  const f = foodsOn(db, date);
  if (!f.length) delete db.daily[date]; else db.daily[date] = sum(f);
}
function clean(it) {
  const o = { name: String(it.name || '').trim().slice(0, 80), qty: Math.max(0.25, r1(num(it.qty ?? it.portion) || 1)), unit: String(it.unit || 'porsi').slice(0, 40) };
  NUM.forEach((k) => { o[k] = Math.max(0, r1(num(it[k]))); });
  return o;
}
function settings(db) { return { ...DEFAULT_SETTINGS, ...db.settings }; }

function hasFoodNear(db, date, time) {
  const a = mins(time);
  return db.foods.some((f) => f.date === date && mins(f.time) >= a - 120 && mins(f.time) <= a + 90);
}
function view(db, r, date) {
  const st = db.status[`${date}|${r.id}`];
  const now = new Date();
  const v = { rid: r.id, type: r.type, title: r.title, time: r.time, repeatMin: r.repeatMin, status: 'nanti', nextAt: r.time, sentCount: 0, doneAt: '' };
  if (st) {
    v.status = st.status;
    v.nextAt = st.nextAt ? hm(new Date(st.nextAt)) : r.time;
    v.sentCount = st.sentCount || 0;
    v.doneAt = st.doneAt ? hm(new Date(st.doneAt)) : '';
  } else if (now >= at(date, r.time)) {
    v.status = 'pending';
    if (r.repeatMin > 0) {
      const n = Math.floor((now - at(date, r.time)) / (r.repeatMin * 60000)) + 1;
      v.sentCount = n;
      v.nextAt = hm(new Date(at(date, r.time).getTime() + n * r.repeatMin * 60000));
    }
  }
  if (r.type === 'makan' && v.status !== 'done' && hasFoodNear(db, date, r.time)) v.status = 'done';
  return v;
}
function views(db, date) {
  return db.reminders.filter((r) => r.enabled).sort((a, b) => a.time.localeCompare(b.time)).map((r) => view(db, r, date));
}

// ---- AI tiruan -------------------------------------------------
const DICT = [
  ['nasi goreng', 'piring', 450, 60, 12, 17, 3, 2, 900], ['kopi susu', 'gelas', 120, 15, 3, 5, 14, 0, 50],
  ['ayam bakar', 'potong', 230, 2, 27, 13, 1, 0, 380], ['greek yogurt', 'cup', 130, 6, 11, 7, 5, 0, 45],
  ['pisang', 'buah', 105, 27, 1.3, 0.4, 14, 3.1, 1], ['apel', 'buah', 95, 25, 0.5, 0.3, 19, 4.4, 2],
  ['jeruk', 'buah', 62, 15, 1.2, 0.2, 12, 3.1, 0], ['susu', 'gelas', 150, 12, 8, 8, 12, 0, 105],
  ['telur', 'butir', 78, 0.6, 6.3, 5.3, 0.6, 0, 62], ['nasi', 'piring', 260, 57, 5, 0.5, 0, 0.6, 2],
  ['roti', 'lembar', 80, 14, 3, 1, 1.5, 1.9, 140], ['ayam', 'potong', 230, 0, 27, 13, 0, 0, 80],
  ['tahu', 'potong', 80, 2, 8, 4.5, 0.5, 0.5, 8], ['tempe', 'potong', 120, 6, 11, 6, 0, 1, 5],
  ['kopi', 'gelas', 5, 0, 0.3, 0, 0, 0, 5], ['teh', 'gelas', 30, 8, 0, 0, 8, 0, 5],
  ['mie', 'porsi', 380, 50, 9, 16, 3, 2, 1200], ['ramen', 'mangkuk', 500, 65, 20, 18, 3, 3, 2200],
  ['onigiri', 'buah', 180, 38, 4, 1, 0.5, 0.5, 300], ['yogurt', 'cup', 100, 7, 10, 4, 6, 0, 40],
  ['salad', 'mangkuk', 120, 10, 3, 8, 5, 3, 200], ['gyudon', 'mangkuk', 650, 85, 22, 22, 8, 2, 1500],
  ['bento', 'kotak', 700, 90, 25, 25, 6, 3, 1400], ['salmon', 'potong', 280, 0, 25, 19, 0, 0, 70],
];
const WORDS = { setengah: 0.5, satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5, sebuah: 1, sebutir: 1, segelas: 1, sepiring: 1 };

function fakeText(text) {
  const parts = text.split(/,|\n|\+|;|\bdan\b|&/i).map((s) => s.trim()).filter(Boolean);
  const items = parts.map((p) => {
    const m = p.match(/^(\d+(?:[.,]\d+)?|setengah|satu|dua|tiga|empat|lima|sebuah|sebutir|segelas|sepiring)?\s*(.*)$/i);
    const q = m[1] ? (WORDS[m[1].toLowerCase()] ?? num(m[1])) : 1;
    const rest = (m[2] || p).replace(/^(buah|butir|gelas|piring|potong|porsi|lembar|mangkuk|cup)\s+/i, '');
    const hit = DICT.find(([k]) => rest.toLowerCase().includes(k));
    const name = rest.charAt(0).toUpperCase() + rest.slice(1);
    if (!hit) return clean({ name, qty: q, unit: 'porsi', kcal: 200, carb: 25, protein: 8, fat: 7, sugar: 4, fiber: 2, sodium: 300 });
    const [, unit, kcal, carb, protein, fat, sugar, fiber, sodium] = hit;
    return clean({ name, qty: q, unit, kcal, carb, protein, fat, sugar, fiber, sodium });
  });
  return { kind: 'teks', items, note: 'Mode demo: angka berasal dari daftar contoh, bukan AI.' };
}

function fakeImage(db) {
  db.imgCount = (db.imgCount || 0) + 1;
  if (db.imgCount % 2 === 1) {
    return { kind: 'tabel_nutrisi', items: [clean({ name: 'Greek yogurt plain', qty: 1, unit: 'sajian (100 g)', kcal: 130, carb: 6, protein: 11, fat: 7, sugar: 5, fiber: 0, sodium: 45 })], note: 'Mode demo: hasil contoh pembacaan tabel nutrisi.' };
  }
  return {
    kind: 'makanan',
    items: [
      clean({ name: 'Nasi putih', qty: 1, unit: 'piring', kcal: 260, carb: 57, protein: 5, fat: 0.5, sugar: 0, fiber: 0.6, sodium: 2 }),
      clean({ name: 'Ayam bakar', qty: 1, unit: 'potong', kcal: 230, carb: 2, protein: 27, fat: 13, sugar: 1, fiber: 0, sodium: 380 }),
      clean({ name: 'Lalapan + sambal', qty: 1, unit: 'porsi', kcal: 45, carb: 6, protein: 1, fat: 2, sugar: 3, fiber: 2, sodium: 210 }),
    ],
    note: 'Mode demo: hasil contoh deteksi foto makanan.',
  };
}

function fakeKilas(db, date) {
  const s = settings(db);
  const t = sum(foodsOn(db, date));
  const sisa = Math.round(s.targetKcal - t.kcal);
  const kurangP = Math.round(s.targetProtein - t.protein);
  const bagus = [];
  const perhatian = [];
  if (foodsOn(db, date).some((f) => mins(f.time) < 9 * 60)) bagus.push('Sarapan tercatat pagi — energi untuk mulai hari aman.');
  if (t.fat <= s.targetFat) bagus.push('Lemak masih dalam batas target.');
  if (!bagus.length) bagus.push('Kamu rajin mencatat — ini langkah paling penting.');
  if (kurangP > 15) perhatian.push(`Protein kurang ±${kurangP} g dari target.`);
  if (sisa < 0) perhatian.push(`Kalori sudah lewat ${Math.abs(sisa)} kkal dari target.`);
  const big = foodsOn(db, date).map((f) => ({ f, k: f.kcal * f.portion })).sort((a, b) => b.k - a.k)[0];
  if (big && t.kcal && big.k / t.kcal > 0.4) perhatian.push(`${big.f.name} menyumbang ${Math.round((big.k / t.kcal) * 100)}% kalori hari ini.`);
  return {
    ringkasan: sisa >= 0
      ? `Hari ini cukup seimbang. Kalori masih sisa ${sisa} kkal${kurangP > 15 ? ', tapi protein masih kurang — makan berikutnya sebaiknya tinggi protein' : ''}.`
      : `Kalori hari ini sudah lewat target ${Math.abs(sisa)} kkal. Pilih makanan ringan dan banyak sayur untuk sisa hari.`,
    bagus: bagus.slice(0, 2),
    perhatian: perhatian.slice(0, 3),
    ide: [
      { nama: 'Dada ayam panggang + sayur + ½ nasi', kkal: 520, protein: 42 },
      { nama: 'Tahu + tempe bacem, sup bening', kkal: 480, protein: 30 },
      { nama: '2 telur dadar + salad + roti gandum', kkal: 430, protein: 22 },
    ],
  };
}

// ---- Aksi ------------------------------------------------------
const A = {
  ping: () => ({ app: 'Kalora (demo)', version: 'demo', now: nowHM(), date: today() }),
  getDay(db, p) {
    const date = p.date || today();
    const foods = foodsOn(db, date);
    const strip = Object.entries(db.daily).filter(([d]) => d >= (p.from || date) && d <= (p.to || date)).map(([d, v]) => ({ date: d, kcal: v.kcal }));
    return {
      date, foods, totals: foods.length ? sum(foods) : (db.daily[date] || { kcal: 0, carb: 0, protein: 0, fat: 0, count: 0 }),
      detailAvailable: daysAgo(date) < DETAIL_DAYS, strip, settings: settings(db),
      reminders: date === today() ? views(db, date) : [], kilas: db.kilas[date]?.kilas || null,
    };
  },
  getHistory(db, p) {
    const days = Object.entries(db.daily).filter(([d]) => d >= p.from && d <= p.to).map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date));
    return { days, settings: settings(db) };
  },
  async analyzeImage(db) { await wait(1600); return fakeImage(db); },
  async analyzeText(db, p) {
    if (!String(p.text || '').trim()) throw new Error('Tulis dulu makanan yang kamu makan.');
    await wait(900);
    return fakeText(p.text);
  },
  saveFoods(db, p) {
    const items = (p.items || []).map(clean).filter((i) => i.name);
    if (!items.length) throw new Error('Tidak ada makanan untuk disimpan.');
    const ids = items.map((it) => {
      const o = { id: id(), date: p.date, time: p.time, name: it.name, source: p.source || 'manual', portion: it.qty, unit: it.unit };
      NUM.forEach((k) => { o[k] = it[k]; });
      db.foods.push(o);
      return o.id;
    });
    recompute(db, p.date);
    delete db.kilas[p.date];
    return { ids };
  },
  updateFood(db, p) {
    const f = db.foods.find((x) => x.id === p.id);
    if (!f) throw new Error('Catatan tidak ditemukan.');
    const old = f.date;
    const it = clean(p.item || {});
    Object.assign(f, { date: p.date || f.date, time: p.time || f.time, name: it.name || f.name, portion: it.qty, unit: it.unit });
    NUM.forEach((k) => { f[k] = it[k]; });
    recompute(db, old); recompute(db, f.date);
    delete db.kilas[old]; delete db.kilas[f.date];
    return { id: f.id };
  },
  deleteFood(db, p) {
    const f = db.foods.find((x) => x.id === p.id);
    db.foods = db.foods.filter((x) => x.id !== p.id);
    if (f) { recompute(db, f.date); delete db.kilas[f.date]; }
    return { deleted: f ? 1 : 0 };
  },
  async getKilas(db, p) {
    const date = p.date || today();
    const foods = foodsOn(db, date);
    const out = { date, foods, totals: foods.length ? sum(foods) : (db.daily[date] || { kcal: 0, carb: 0, protein: 0, fat: 0, count: 0 }), settings: settings(db), kilas: null, updatedAt: '' };
    if (db.kilas[date] && !p.refresh) return { ...out, ...db.kilas[date] };
    if (!foods.length) return out;
    await wait(1200);
    db.kilas[date] = { kilas: fakeKilas(db, date), updatedAt: new Date().toISOString() };
    return { ...out, ...db.kilas[date] };
  },
  getReminders(db) {
    const date = today();
    const streaks = {}, last14 = {};
    db.reminders.filter((r) => r.type === 'kebiasaan').forEach((r) => {
      const done = (d) => db.status[`${d}|${r.id}`]?.status === 'done';
      let n = 0, d = done(date) ? date : addDays(date, -1);
      while (done(d)) { n++; d = addDays(d, -1); }
      streaks[r.id] = n;
      last14[r.id] = Array.from({ length: 14 }, (_, i) => { const dd = addDays(date, i - 13); return done(dd) ? 1 : (i === 13 ? null : 0); });
    });
    return { date, now: nowHM(), reminders: [...db.reminders].sort((a, b) => a.order - b.order), today: views(db, date), streaks, last14, devices: db.devices };
  },
  saveReminder(db, p) {
    const r = p.reminder || {};
    const obj = {
      id: r.id || 'k-' + id(), type: r.type === 'makan' ? 'makan' : 'kebiasaan', title: String(r.title || 'Pengingat').slice(0, 60),
      time: r.time || '08:00', repeatMin: Math.max(0, parseInt(r.repeatMin, 10) || 0), days: '1111111',
      enabled: r.enabled !== false, order: r.order || 99,
    };
    const i = db.reminders.findIndex((x) => x.id === obj.id);
    if (i >= 0) db.reminders[i] = obj; else db.reminders.push(obj);
    return { reminder: obj };
  },
  deleteReminder(db, p) { db.reminders = db.reminders.filter((r) => r.id !== p.id); return { deleted: 1 }; },
  reminderAction(db, p) {
    const date = p.date || today();
    const r = db.reminders.find((x) => x.id === p.rid);
    if (!r) throw new Error('Pengingat tidak ditemukan.');
    const key = `${date}|${r.id}`;
    const st = db.status[key] || { status: 'pending', sentCount: 0 };
    const now = new Date();
    if (p.do === 'done') { st.status = 'done'; st.doneAt = now.toISOString(); }
    if (p.do === 'snooze') {
      let until = p.until ? at(date, p.until) : new Date(now.getTime() + 30 * 60000);
      if (until <= now) until = new Date(now.getTime() + 30 * 60000);
      st.status = 'snoozed'; st.nextAt = until.toISOString();
    }
    if (p.do === 'undo') { st.status = 'pending'; st.doneAt = ''; st.nextAt = new Date(now.getTime() + Math.max(r.repeatMin, 30) * 60000).toISOString(); }
    db.status[key] = st;
    return { view: view(db, r, date) };
  },
  registerDevice(db) { db.devices = Math.max(1, db.devices || 0); return { devices: db.devices }; },
  async testPush() {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg && Notification.permission === 'granted') {
      await reg.showNotification('Kalora siap!', { body: 'Contoh notifikasi (mode demo).', icon: './icons/icon-192.png', badge: './icons/badge-96.png', tag: 'demo-test' });
      return { sent: 1 };
    }
    return { sent: 0 };
  },
  getSettings: (db) => settings(db),
  saveSettings(db, p) { db.settings = { ...settings(db), ...p.settings }; return settings(db); },
};

export async function demoCall(action, payload) {
  const fn = A[action];
  if (!fn) throw new Error('Aksi tidak dikenal: ' + action);
  await wait(250 + Math.random() * 250);
  const db = load();
  const out = await fn(db, payload);
  save(db);
  return JSON.parse(JSON.stringify(out));
}

export function resetDemo() { localStorage.removeItem(KEY); }
