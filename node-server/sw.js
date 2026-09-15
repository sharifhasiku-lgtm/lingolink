// LingoLink AI Service Worker
const CACHE_NAME = 'lingolink-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/translator.html',
    '/admin.html',
    '/manifest.json'
];

// Install: cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch((err) => {
                console.log('[SW] Some assets failed to cache:', err);
            });
        })
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then((names) => {
            return Promise.all(
                names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
            );
        })
    );
    self.clients.claim();
});

// Fetch: serve from cache first, fall back to network
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Never cache API calls to backend
    if (url.pathname.startsWith('/auth/') || 
        url.pathname.startsWith('/translate_') || 
        url.pathname.startsWith('/admin/') ||
        url.pathname.startsWith('/data/audio/') ||
        url.pathname.startsWith('/history/') ||
        url.pathname.startsWith('/detect_language/')) {
        return; // let it go to network normally
    }
    
    // For static HTML/CSS/JS — cache first
    if (event.request.method === 'GET' && 
        (url.pathname.endsWith('.html') || 
         url.pathname.endsWith('.json') || 
         url.pathname.endsWith('.js') ||
         url.pathname === '/' ||
         url.pathname.endsWith('.svg'))) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                return cached || fetch(event.request).then((response) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, response.clone());
                        return response;
                    });
                });
            })
        );
        return;
    }
});