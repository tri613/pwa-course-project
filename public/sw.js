self.addEventListener('install', function(e) {
    // fires on the first time install (?)
    console.info('[Serivice Worker] Installing Service Worker...');
});

self.addEventListener('activate', function(e) {
    // `activate` is only triggered on 'first load' or 'tab reopened' 
    // but not 'tab reload' because the page might be communicating with the old service worker
    // and might break if activate the new service worker
    console.info('[Serivice Worker] Activating Service Worker...');
    return self.clients.claim();
});

self.addEventListener('fetch', function(e) {
    console.info('[Serivice Worker] fetching...');
    e.respondWith(fetch(e.request));
});