/* Quinzo service worker: funciona sem internet e pega versões novas sozinho */
var V = 'beta-2';
var CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(V).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function (r) { var cp = r.clone(); caches.open(V).then(function (c) { c.put('index.html', cp); }); return r; })
      .catch(function () { return caches.match('index.html').then(function (r) { return r || caches.match('./'); }); }));
    return;
  }
  if (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (r) { if (r && (r.ok || r.type === 'opaque')) { var cp = r.clone(); caches.open(V).then(function (c) { c.put(req, cp); }); } return r; }).catch(function () { return hit; });
      return hit || net;
    }));
  }
});
