/* Service worker: permite instalar la app y abrirla sin conexión.
   Cuando cambies cualquier archivo de la app, subí el número de VERSION
   para que los dispositivos descarguen la versión nueva. */
const VERSION = 'v13';
const CACHE = 'consultorio-' + VERSION;
const APP = ['./', 'index.html', 'styles.css', 'app.js', 'manifest.webmanifest', 'firebase.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Archivos de la app: primero la red (para tener siempre lo último), si no hay conexión, la copia guardada.
  if (url.origin === location.origin) {
    e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => {
      const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
    return;
  }
  // Tipografías de Google y librerías de Firebase: se guardan la primera vez que se usan.
  if (url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com') || (url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/')) || url.hostname === 'cdnjs.cloudflare.com') {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r;
    })));
  }
});
