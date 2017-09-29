if (navigator.serviceWorker) {
    navigator.serviceWorker
        .register('/sw.js')
        .then(function(done) {
            console.log(done, 'Service worker is registered!');
        });
}