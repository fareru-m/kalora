/* Kalora service worker
 * - cache aplikasi supaya cepat dibuka & tetap tampil saat offline
 * - menerima push dari Firebase Cloud Messaging dan menampilkan notifikasi
 * - tombol "Sudah" / "Tunda 30 mnt" langsung dicatat ke Apps Script
 */
const VERSION = 'kalora-v1.2.0';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './css/app.css',
  './js/app.js', './js/api.js', './js/demo.js', './js/push.js', './js/config.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/badge-96.png', './icons/logo.svg',
];
const CONF_CACHE = 'kalora-conf';
const CONF_URL = './__conf.json';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION && k !== CONF_CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Strategi cache (supaya app cepat dibuka):
// - halaman (HTML): coba internet maks 3 detik, kalau lambat/offline pakai cache
// - file lain (JS, CSS, ikon): langsung dari cache, lalu diperbarui diam-diam
async function fromNetwork(req) {
  const res = await fetch(req);
  if (res.ok) (await caches.open(VERSION)).put(req, res.clone());
  return res;
}
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const net = fromNetwork(req);
      const timeout = new Promise((r) => setTimeout(r, 3000));
      try {
        const res = await Promise.race([net, timeout]);
        if (res) return res;
      } catch { /* offline */ }
      const hit = await caches.match('./index.html');
      return hit || net;
    })());
    return;
  }
  event.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true });
    const net = fromNetwork(req).catch(() => null);
    if (hit) { event.waitUntil(net); return hit; }
    return (await net) || Response.error();
  })());
});

// Halaman mengirim URL Apps Script & kode akses ke sini
self.addEventListener('message', (event) => {
  const d = event.data || {};
  if (d.type === 'conf') {
    event.waitUntil(caches.open(CONF_CACHE).then((c) => c.put(CONF_URL, new Response(JSON.stringify({ url: d.url, token: d.token })))));
  }
});

async function readConf() {
  try {
    const c = await caches.open(CONF_CACHE);
    const r = await c.match(CONF_URL);
    return r ? r.json() : null;
  } catch { return null; }
}

self.addEventListener('push', (event) => {
  let p = {};
  try { p = event.data ? event.data.json() : {}; } catch { p = { data: { title: 'Kalora', body: event.data ? event.data.text() : '' } }; }
  const d = p.data || {};
  const n = p.notification || {};
  const title = d.title || n.title || 'Kalora';
  const isHabit = d.type === 'kebiasaan';
  const options = {
    body: d.body || n.body || '',
    icon: './icons/icon-192.png',
    badge: './icons/badge-96.png',
    tag: d.tag || 'kalora',
    renotify: true,
    requireInteraction: isHabit,
    vibrate: [80, 40, 80],
    data: d,
    actions: isHabit
      ? [{ action: 'done', title: 'Sudah' }, { action: 'snooze', title: 'Tunda 30 mnt' }]
      : d.type === 'makan' ? [{ action: 'open', title: 'Catat sekarang' }] : [],
  };
  // Selalu tampilkan notifikasi (iPhone mencabut izin push kalau tidak ditampilkan).
  // Kalau opsi tertentu tidak didukung browser, ulangi dengan opsi minimal.
  event.waitUntil(
    self.registration.showNotification(title, options)
      .catch(() => self.registration.showNotification(title, { body: options.body, icon: options.icon, tag: options.tag, data: d }))
  );
});

async function openApp(path) {
  const url = new URL(path || './', self.registration.scope).href;
  const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const w of wins) {
    if (w.url.startsWith(self.registration.scope)) {
      await w.focus();
      return w.navigate ? w.navigate(url) : null;
    }
  }
  return self.clients.openWindow(url);
}

async function callApi(body) {
  const conf = await readConf();
  if (!conf || !conf.url || !conf.token) return false;
  try {
    const res = await fetch(conf.url, { method: 'POST', body: JSON.stringify({ ...body, token: conf.token }) });
    const j = await res.json();
    return Boolean(j.ok);
  } catch { return false; }
}

const pad = (n) => String(n).padStart(2, '0');

self.addEventListener('notificationclick', (event) => {
  const d = event.notification.data || {};
  event.notification.close();
  event.waitUntil((async () => {
    const confirmPath = `./#/konfirmasi?rid=${encodeURIComponent(d.rid || '')}&date=${d.date || ''}`;
    if (event.action === 'done' || event.action === 'snooze') {
      const t = new Date(Date.now() + 30 * 60000);
      const until = `${pad(t.getHours())}:${pad(t.getMinutes())}`;
      const ok = await callApi(event.action === 'done'
        ? { action: 'reminderAction', rid: d.rid, date: d.date, do: 'done' }
        : { action: 'reminderAction', rid: d.rid, date: d.date, do: 'snooze', until });
      if (ok) {
        await self.registration.showNotification(event.action === 'done' ? 'Tercatat ✓' : `Ditunda sampai ${until}`, {
          body: d.title || '', icon: './icons/icon-192.png', badge: './icons/badge-96.png', tag: d.tag || 'kalora', silent: true,
        });
        return;
      }
      return openApp(`${confirmPath}&do=${event.action}`);
    }
    if (d.type === 'kebiasaan') return openApp(confirmPath);
    return openApp(d.url || './#/');
  })());
});
