importScripts('/src/js/idb.js');
importScripts('/src/js/db.js');

var CACHE_STATIC_NAME = 'static-v10';
var CACHE_DYNAMIC_NAME = 'dynamic-v2';
var STATIC_ASSETS = [
    '/',
    '/index.html',
    '/offline.html',
    'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
    'https://fonts.googleapis.com/css?family=Roboto:400,700',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    '/src/css/app.css',
    '/src/css/feed.css',
    '/src/js/app.js',
    '/src/js/feed.js',
    '/src/images/main-image.jpg',
    '/src/js/idb.js'
];

function isInArray(url, target) {
    return target.some(asset => {
      let cachedPath = url;
      if (url.includes(self.origin)) {
        cachedPath = url.substring(self.origin.length);
      }
      return asset.includes(url);
    });
  }

self.addEventListener('install', function(event) {
    // fires on the first time install (?)
    console.info('[Serivice Worker] Installing Service Worker...');

    // it's a good timing to precache the app shell
    event.waitUntil(
        caches.open(CACHE_STATIC_NAME)
            .then(function(cache) {
                console.info('[Serivice Worker] Precaching app shell');
                cache.addAll(STATIC_ASSETS);
            })
    );
});

self.addEventListener('activate', function(event) {
    // `activate` is only triggered on 'first load' or 'tab reopened' 
    // but not 'tab reload' because the page might be communicating with the old service worker
    // and might break if activate the new service worker
    console.info('[Serivice Worker] Activating Service Worker...');

    // it's a good timing to delete old cache storages
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

// self.addEventListener('fetch', function(event) {
//     event.respondWith(
//         caches.match(event.request)
//             .then(function(response) {
//                 if (response) {
//                     return response;
//                 } else {
//                     return fetch(event.request)
//                         .then(function(res) {
//                             return caches.open(CACHE_DYNAMIC_NAME)
//                                 .then(cache => cache.put(event.request.url, res.clone()))
//                                 .then(done => res);
//                         })
//                         .catch(function(err) {
//                             return caches.open(CACHE_STATIC_NAME)
//                                 .then(cache => cache.match("/offline.html"))
//                         })
//                 }
//             })
//     );
// });

// network first with cache fallback
// not the best solution due to timeout problem
// self.addEventListener('fetch', function(event) {
//     event.respondWith(
//        fetch(event.request)
//         .then(response => {
//             return caches.open(CACHE_DYNAMIC_NAME)
//                 .then(cache => cache.put(event.request.url, response.clone()))
//                 .then(done => response);
//         })
//         .catch(err => {
//             caches.match(event.request.url)
//                 .then(response => {
//                     if (response) {
//                         return response;
//                     } else {
//                         return caches.open(CACHE_STATIC_NAME)
//                             .then(cache => cache.match("/offline.html"))
//                     }
//                 })
//         })
//     );
// });

self.addEventListener('fetch', function(event) {
    var url = 'https://my-first-pwa-ebf14.firebaseio.com/posts.json';
    // cache then network -- update cache result
    if (event.request.url.indexOf(url) > -1) {
        event.respondWith(
            caches.open(CACHE_DYNAMIC_NAME)
                .then(function(cache) {
                    return fetch(event.request)
                        .then(function(response) {
                            response.clone().json()
                                .then(data => {
                                    clearAllData('posts');
                                    for (let row of Object.values(data)) {
                                        writeData('posts', row);
                                    }
                                })
                            return response;
                        });
                })
        );
    } else if (isInArray(event.request.url, STATIC_ASSETS)) {
        event.respondWith(
            caches.match(event.request.url)
        );
    } else {
        // cache with network fallback
        event.respondWith(
            caches.match(event.request)
                .then(function(response) {
                    if (response) {
                        return response;
                    } else {
                        return fetch(event.request)
                            .then(function(res) {
                                return caches.open(CACHE_DYNAMIC_NAME)
                                    .then(cache => cache.put(event.request.url, res.clone()))
                                    .then(done => res);
                            })
                            .catch(function(err) {
                                if (event.request.headers.get('accept').includes('text/html')) {
                                    return caches.open(CACHE_STATIC_NAME)
                                        .then(cache => cache.match("/offline.html"))
                                }
                            })
                    }
                })
        );
    }
});

// whenever the service worker thinks it has network connection
// this event will be triggered
self.addEventListener('sync', function(event) {
    console.log('[Service Worker] sync event triggered!', event);
    if (event.tag === 'sync-new-posts') {
        console.log('[Service Worker] sync-new-posts!');
        event.waitUntil(
            readAllData('sync-posts')
                .then(data => {
                    data.forEach(post => {
                        fetch('https://us-central1-my-first-pwa-ebf14.cloudfunctions.net/storePostData', {
                            method: "POST",
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                            },
                            body: JSON.stringify(post)
                        })
                            .then(res => res.json())
                            .then(res => {
                                console.log('[Service worker] post sync is sent!', res);
                                deleteData('sync-posts', res.id);
                            })
                            .catch(err => console.log('Error while sending sync data', err));
                    })
                })
        );
    }
})
