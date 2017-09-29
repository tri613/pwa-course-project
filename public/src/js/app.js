var deferredPrompt;

if (navigator.serviceWorker) {
    // the `register` code will executed every page load,
    // but the service worker won't be installed if the service worker file hasn't changed 
    navigator.serviceWorker
        .register('/sw.js')
        .then(done => console.log('Service worker is registered!'))
        .catch(err => console.error('Service Worker register failed', err));
}

window.addEventListener('beforeinstallprompt', function(e) {
    console.log('beforeinstallprompt');
    e.preventDefault();
    deferredPrompt = e;
});