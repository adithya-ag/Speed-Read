const CACHE_NAME = 'speed-reader-v2';
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
    // Don't skip waiting - let the app control when to activate
});

// Activate: clean old caches and notify clients
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => {
            // Take control of all clients immediately
            return self.clients.claim();
        })
    );
});

// Listen for skip waiting message from the app
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Fetch: stale-while-revalidate for app shell, network-only for API
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

    // Stale-while-revalidate for same-origin requests
    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(cachedResponse => {
                // Fetch fresh version in background
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    // Only cache successful responses
                    if (networkResponse.ok) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => {
                    // Network failed, return cached or nothing
                    return cachedResponse;
                });

                // Return cached immediately, or wait for network
                return cachedResponse || fetchPromise;
            });
        })
    );
});
