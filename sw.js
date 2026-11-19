// Kpal: guarda la app en el móvil para que abra sin internet.
// Con internet, siempre busca primero la versión nueva; sin internet, usa la guardada.
const CACHE = 'kpal-app-2.8';
const ARCHIVOS = ['./', './index.html', './style.css', './app.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('kpal-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const propio = url.origin === self.location.origin;
  const fuentes = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!propio && !fuentes) return;
  const guardada = () => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined));
  const red = fetch(req).then(res => {
    if (res && (res.ok || res.type === 'opaque')) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
    return res;
  });
  // Si la señal es mala y tarda más de 4 segundos, abre la versión guardada.
  const espera = new Promise(ok => setTimeout(ok, 4000)).then(guardada);
  e.respondWith(
    Promise.race([red, espera.then(r => r || red)]).then(r => r || red).catch(() => guardada().then(r => r || Response.error()))
  );
});
