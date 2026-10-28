// Offline shell for All Ages College. Bump VERSION whenever you change any file.
const VERSION = 'aac-v13';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css',
  'js/app.js', 'js/data.js', 'js/config.js', 'js/ui.js', 'js/schema.js', 'js/manage.js', 'js/portal.js', 'js/chat.js', 'js/curriculum-data.js', 'js/notebooks-data.js', 'js/questions-data.js',
  'assets/logo.png', 'assets/students.jpg',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/favicon-48.png', 'icons/apple-touch-icon.png'
];

// A cached response that came from a redirect (e.g. /index.html -> /) cannot be used for a page navigation.
// Rebuild it as a plain response so the browser accepts it.
const clean = async r => { if (!r || !r.redirected) return r; const b = await r.blob(); return new Response(b, { status: 200, statusText: 'OK', headers: r.headers }); };
const offline = () => new Response('<!doctype html><meta name=viewport content="width=device-width"><body style="font-family:sans-serif;padding:24px"><h1>You are offline</h1><p>Please check your internet connection and refresh.</p>', { status: 503, headers: { 'Content-Type': 'text/html' } });
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
    e.respondWith((async () => {
      try { return await fetch(req); } catch (err) {
        try { const hit = (await caches.match('index.html')) || (await caches.match('./')); return (await clean(hit)) || offline(); } catch (e2) { return offline(); }
      }
    })());
    return;
  }
  // stale-while-revalidate for our own files
  e.respondWith(caches.match(req).then(async hit => { hit = await clean(hit).catch(() => hit);
    const net = fetch(req).then(res => { if (res.ok) caches.open(VERSION).then(c => c.put(req, res.clone())); return res; }).catch(() => hit);
    return hit || net;
  }));
});
