// Offline shell for All Ages College. Bump VERSION whenever you change any file.
const VERSION = 'aac-v3';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css',
  'js/app.js', 'js/data.js', 'js/config.js', 'js/ui.js', 'js/schema.js', 'js/manage.js', 'js/portal.js', 'js/chat.js',
  'assets/logo.png', 'assets/students.jpg',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/favicon-48.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return; // never cache Supabase, fonts or CDN calls
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('index.html')).then(r => r || new Response('<!doctype html><meta name=viewport content="width=device-width"><body style="font-family:sans-serif;padding:24px"><h1>You are offline</h1><p>Please check your internet connection and refresh.</p>', { status: 503, headers: { 'Content-Type': 'text/html' } })));
    return;
  }
  // stale-while-revalidate for our own files
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(res => { if (res.ok) caches.open(VERSION).then(c => c.put(req, res.clone())); return res; }).catch(() => hit);
    return hit || net;
  }));
});
