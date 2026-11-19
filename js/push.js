// Service worker + push notification (Firebase Cloud Messaging)
import { CONFIG } from './config.js';
import { conn, call } from './api.js';

const TOKEN_KEY = 'kalora.fcmToken';

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
export const firebaseReady = () => Boolean(CONFIG.FIREBASE.apiKey && CONFIG.FIREBASE.projectId && CONFIG.VAPID_KEY);
export const hasToken = () => Boolean(localStorage.getItem(TOKEN_KEY));

export async function registerSW() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('./firebase-messaging-sw.js', { scope: './' });
    sendConfToSW();
    return reg;
  } catch (e) {
    console.warn('Service worker gagal didaftarkan:', e);
    return null;
  }
}

// Service worker butuh URL & kode akses supaya tombol "Sudah" di notifikasi
// bisa langsung mencatat tanpa membuka aplikasi.
export async function sendConfToSW() {
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  const msg = conn.demo || !conn.ready ? { type: 'conf', url: '', token: '' } : { type: 'conf', url: conn.url, token: conn.token };
  reg.active?.postMessage(msg);
}

function deviceLabel() {
  const ua = navigator.userAgent;
  const os = /iphone|ipad/i.test(ua) ? 'iPhone/iPad' : /android/i.test(ua) ? 'Android' : /mac/i.test(ua) ? 'Mac' : /windows/i.test(ua) ? 'Windows' : 'Perangkat';
  const br = /edg\//i.test(ua) ? 'Edge' : /chrome|crios/i.test(ua) ? 'Chrome' : /safari/i.test(ua) ? 'Safari' : /firefox/i.test(ua) ? 'Firefox' : 'Browser';
  return `${os} · ${br}${isStandalone() ? ' (app)' : ''}`;
}

async function getFcmToken() {
  const v = CONFIG.FIREBASE_SDK_VERSION;
  const { initializeApp, getApps } = await import(`https://www.gstatic.com/firebasejs/${v}/firebase-app.js`);
  const { getMessaging, getToken, isSupported } = await import(`https://www.gstatic.com/firebasejs/${v}/firebase-messaging.js`);
  if (!(await isSupported())) {
    throw new Error(isIOS() ? 'Di iPhone, buka lewat Safari → Bagikan → "Add to Home Screen", lalu buka dari ikon di layar utama.' : 'Browser ini belum mendukung push notification.');
  }
  const app = getApps().length ? getApps()[0] : initializeApp(CONFIG.FIREBASE);
  const messaging = getMessaging(app);
  const reg = await navigator.serviceWorker.ready;
  return getToken(messaging, { vapidKey: CONFIG.VAPID_KEY, serviceWorkerRegistration: reg });
}

/** Dipanggil dari tombol (harus dari klik pengguna, terutama di iPhone). */
export async function enablePush() {
  if (!pushSupported()) {
    throw new Error(isIOS() && !isStandalone()
      ? 'Di iPhone, notifikasi hanya bisa setelah "Add to Home Screen". Buka Safari → Bagikan → Add to Home Screen.'
      : 'Browser ini belum mendukung push notification.');
  }
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Izin notifikasi ditolak. Aktifkan lewat pengaturan browser.');
  await registerSW();
  if (conn.demo) {
    await call('registerDevice', { fcmToken: 'demo-token-000000000000', label: deviceLabel() });
    localStorage.setItem(TOKEN_KEY, 'demo');
    return 'demo';
  }
  if (!firebaseReady()) throw new Error('Isi dulu FIREBASE & VAPID_KEY di js/config.js, lalu upload ulang ke GitHub.');
  const token = await getFcmToken();
  if (!token) throw new Error('Gagal mendapatkan token perangkat.');
  await call('registerDevice', { fcmToken: token, label: deviceLabel() });
  localStorage.setItem(TOKEN_KEY, token);
  return token;
}

/** Token FCM bisa berganti — perbarui diam-diam saat app dibuka. */
export async function refreshPush() {
  try {
    if (conn.demo || !conn.ready || !firebaseReady() || !pushSupported()) return;
    if (Notification.permission !== 'granted' || !hasToken()) return;
    const token = await getFcmToken();
    if (token && token !== localStorage.getItem(TOKEN_KEY)) {
      await call('registerDevice', { fcmToken: token, label: deviceLabel() });
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch (e) { console.warn('refreshPush:', e); }
}

export function pushState() {
  if (!pushSupported()) return isIOS() && !isStandalone() ? 'ios-install' : 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  if (Notification.permission === 'granted' && hasToken()) return 'on';
  return 'off';
}
