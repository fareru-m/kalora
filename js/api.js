// Penghubung ke backend Apps Script (atau backend demo lokal)
import { demoCall } from './demo.js';

const K = { url: 'kalora.apiUrl', token: 'kalora.apiToken', demo: 'kalora.demo' };

export const conn = {
  get url() { return localStorage.getItem(K.url) || ''; },
  get token() { return localStorage.getItem(K.token) || ''; },
  get demo() { return localStorage.getItem(K.demo) === '1'; },
  get ready() { return this.demo || Boolean(this.url && this.token); },
  save(url, token) {
    localStorage.setItem(K.url, url.trim());
    localStorage.setItem(K.token, token.trim());
    localStorage.removeItem(K.demo);
  },
  enableDemo() { localStorage.setItem(K.demo, '1'); },
  reset() {
    cache.clear();
    localStorage.removeItem(K.url);
    localStorage.removeItem(K.token);
    localStorage.removeItem(K.demo);
  },
};

// Cache lokal: data terakhir disimpan di HP supaya layar langsung tampil,
// lalu diperbarui diam-diam dari server (stale-while-revalidate).
const CK = 'kalora.cache.';
export const cache = {
  get(key) { try { return JSON.parse(localStorage.getItem(CK + key) || 'null'); } catch { return null; } },
  set(key, val) { try { localStorage.setItem(CK + key, JSON.stringify(val)); } catch { /* penuh → abaikan */ } },
  del(key) { localStorage.removeItem(CK + key); },
  clear() { Object.keys(localStorage).filter((k) => k.startsWith(CK)).forEach((k) => localStorage.removeItem(k)); },
};

export async function call(action, payload = {}, { timeout = 45000 } = {}) {
  if (conn.demo) return demoCall(action, payload);
  let res;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    // Body string → Content-Type text/plain → tidak ada preflight CORS ke Apps Script
    res = await fetch(conn.url, {
      method: 'POST',
      body: JSON.stringify({ action, token: conn.token, ...payload }),
      redirect: 'follow',
      signal: ctrl.signal,
    });
  } catch (e) {
    throw new Error(e.name === 'AbortError' ? 'Server terlalu lama merespons. Coba lagi.' : 'Tidak bisa terhubung ke server. Cek internet atau URL Apps Script.');
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new Error(`Server membalas ${res.status}.`);
  let data;
  try { data = await res.json(); } catch { throw new Error('Balasan server tidak valid. Pastikan URL berakhiran /exec dan akses "Anyone".'); }
  if (!data.ok) throw new Error(data.error || 'Terjadi kesalahan.');
  return data.data;
}
