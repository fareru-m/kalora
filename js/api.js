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
    localStorage.removeItem(K.url);
    localStorage.removeItem(K.token);
    localStorage.removeItem(K.demo);
  },
};

export async function call(action, payload = {}) {
  if (conn.demo) return demoCall(action, payload);
  let res;
  try {
    // Body string → Content-Type text/plain → tidak ada preflight CORS ke Apps Script
    res = await fetch(conn.url, {
      method: 'POST',
      body: JSON.stringify({ action, token: conn.token, ...payload }),
      redirect: 'follow',
    });
  } catch (e) {
    throw new Error('Tidak bisa terhubung ke server. Cek internet atau URL Apps Script.');
  }
  if (!res.ok) throw new Error(`Server membalas ${res.status}.`);
  let data;
  try { data = await res.json(); } catch { throw new Error('Balasan server tidak valid. Pastikan URL berakhiran /exec dan akses "Anyone".'); }
  if (!data.ok) throw new Error(data.error || 'Terjadi kesalahan.');
  return data.data;
}
