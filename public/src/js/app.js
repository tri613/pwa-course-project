var deferredPrompt;
var enableNotificationBtns = document.querySelectorAll('.enable-notifications');

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

function askForNotificationPermission() {
    // this requests the `notification` and `push` permission at the same time
    // though these two things are actually independent apis
    Notification.requestPermission(function(res) {
        console.log('User choise', res);
        if (res !== 'granted') {
            alert('Why QQ Whyyyyy QQ');
        } else {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready
                    .then(function(sw) {
                        sw.showNotification('Successfully subscribed! (from sw)', {
                            icon: "/src/images/icons/app-icon-96x96.png",
                            body: "Thanks for subscribing! We will keep you updated ;)",
                            image: "/src/images/sf-boat.jpg",
                            badge: "/src/images/icons/app-icon-96x96.png",
                            tag: "cofirm-notification",
                            renotify: false,
                            actions: [
                                {
                                    action: 'confirm',
                                    title: 'Okay',
                                    icon: '/src/images/icons/app-icon-96x96.png'
                                },
                                {
                                    action: 'cancel',
                                    title: 'Cancel',
                                    icon: '/src/images/icons/app-icon-96x96.png'
                                }
                            ]
                        });
                    });
            }
        }
    });
}

if ('Notification' in window) {
    Array.from(enableNotificationBtns).forEach(function(btn) {
        btn.style.display = 'inline-block';
        btn.addEventListener('click', askForNotificationPermission);
    });
}