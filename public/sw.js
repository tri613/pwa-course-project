var CACHE_STATIC_NAME = 'static-v3';
var CACHE_DYNAMIC_NAME = 'dynamic-v2';

self.addEventListener('install', function(event) {
    // fires on the first time install (?)
    console.info('[Serivice Worker] Installing Service Worker...');
    event.waitUntil(
        caches.open(CACHE_STATIC_NAME)
            .then(function(cache) {
                console.info('[Serivice Worker] Precaching app shell');
                cache.addAll([
                    '/',
                    '/index.html',
                    'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
                    'https://fonts.googleapis.com/css?family=Roboto:400,700',
                    'https://fonts.googleapis.com/icon?family=Material+Icons',
                    '/src/css/app.css',
                    '/src/css/feed.css',
                    '/src/js/app.js',
                    '/src/js/feed.js',
                    '/src/images/main-image.jpg'
                ]);
            })
    );
});

self.addEventListener('activate', function(event) {
    // `activate` is only triggered on 'first load' or 'tab reopened' 
    // but not 'tab reload' because the page might be communicating with the old service worker
    // and might break if activate the new service worker
    console.info('[Serivice Worker] Activating Service Worker...');
    event.waitUntil(
        caches.keys()
            .then(function(keyList) {
                return Promise.all(keyList.map(function (key) {
                    console.log('[Serivice Worker] removing old cache');
                    if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
                        return caches.delete(key);
                    }
                }));
            })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                if (response) {
                    return response;
                } else {
                    return fetch(event.request)
                        .then(function(res) {
                            return Promise.all([caches.open(CACHE_DYNAMIC_NAME), res])
                        })
                        .then(function([cache, res]) {
                            cache.put(event.request.url, res.clone())
                            return res;
                        })
                        .catch(function(err) {
                            // do nothing
                        })
                }
            })
    );
});