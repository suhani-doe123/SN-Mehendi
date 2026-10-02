const CACHE_NAME = 'sn-mehendi-v1.01.6';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './logo.jpg',
  './logo-192.png',
  './logo-512.png',
  './background.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {

  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;

  /*
   * HTML pages:
   * Always try the latest version from GitHub Pages.
   */
  if (
    event.request.mode === 'navigate' ||
    url.pathname.endsWith('/index.html')
  ) {

    event.respondWith(

      fetch(event.request, {
        cache: 'no-cache'
      })

      .then(response => {

        if (response && response.ok) {

          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, copy));

        }

        return response;

      })

      .catch(() =>
        caches.match(event.request)
          .then(cached =>
            cached || caches.match('./index.html')
          )
      )

    );

    return;
  }

  /*
   * Static files:
   * Cache first → network fallback.
   */
  event.respondWith(

    caches.match(event.request)

      .then(cached => {

        if (cached) return cached;

        return fetch(event.request)

          .then(response => {

            if (response && response.ok) {

              const copy = response.clone();

              caches.open(CACHE_NAME)
                .then(cache =>
                  cache.put(event.request, copy)
                );

            }

            return response;

          });

      })

  );

});
