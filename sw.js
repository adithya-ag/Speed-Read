const CACHE_NAME = 'speed-reader-v1';
const APP_SHELL = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/config.js',
    '/js/db.js',
    '/js/supabase-client.js',
    '/js/sync.js',
    '/js/parser.js',
    '/js/reader.js',
    '/js/stats.js',
    '/js/app.js',
    '/assets/logo/SpeedReadFavicon.png',
    '/assets/logo/logoSpeedRead.png',
    '/manifest.json'
];

// Install: cache app shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: cache-first for app shell, network-only for API
self.addEventListener('fetch', (event) => {
    // Network only for Supabase API calls
    if (event.request.url.includes('supabase.co')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Skip cross-origin CDN requests (supabase-js, idb, pdf.js)
    if (!event.request.url.startsWith(self.location.origin)) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cached => {
            return cached || fetch(event.request).then(response => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            });
        })
    );
});
