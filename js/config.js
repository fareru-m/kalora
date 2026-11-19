// =============================================================
//  KONFIGURASI KALORA
//  Isi bagian FIREBASE & VAPID_KEY dari Firebase Console.
//  (Nilai-nilai ini memang publik — aman ditaruh di GitHub.)
//  URL Apps Script & kode akses TIDAK ditulis di sini: diisi di
//  layar "Hubungkan" saat aplikasi pertama kali dibuka.
// =============================================================
export const CONFIG = {
  APP_NAME: 'Kalora',
  VERSION: '1.0.0',

  // Firebase Console → Project settings → General → Your apps → SDK setup and configuration → Config
  FIREBASE: {
    apiKey: 'AIzaSyBuJl2a8Rt_Zi6cHW9tfUjyk-OKq-N0L0E',
    authDomain: 'kalora-89b8c.firebaseapp.com',
    projectId: 'kalora-89b8c',
    storageBucket: 'kalora-89b8c.firebasestorage.app',
    messagingSenderId: '127753640970',
    appId: '1:127753640970:web:287c0497670737527413f3',
  },

  // Firebase Console → Project settings → Cloud Messaging → Web Push certificates → Key pair
  VAPID_KEY: 'BKhq8zDdBUYrVnFmaG8A-FBk0BoTXyelwoDLzTH1a8wLfGCjCSPMD-HIDUZHQU6A8v5BEi5S1-blT7Eo_r8SRW4',

  // Versi Firebase JS SDK yang dimuat dari CDN gstatic
  FIREBASE_SDK_VERSION: '13.2.0',
};
