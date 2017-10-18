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
            subscribeNotification();
        }
    });
}

function subscribeNotification() {
    if (!('serviceWorker' in navigator)) {
        return false;
    }

    var sw;
    navigator.serviceWorker.ready
        .then(function(swreg) {
            sw = swreg;
            return swreg.pushManager.getSubscription();
        })
        .then(function(sub) {
            console.log('old sub', sub);
            if (sub === null) {
                var publicKey = 'BPDi5D0KmKcRa7JPyTCuSuQF7nWatmgBVnnnnnGAzKEVitLdo1bcfpv2-i4IrmcrIil_3bDCu7rwrnEl6qX2vaY';
                var applicationServerKey = urlBase64ToUint8Array(publicKey);
                return sw.pushManager.subscribe({
                    applicationServerKey,
                    userVisibleOnly: true
                });
            } else {

            }
        })
        .then(function(newSub) {
            console.log('newSub', newSub);
            return fetch("https://my-first-pwa-ebf14.firebaseio.com/subscription.json", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify(newSub)
            })
        })
        .then(function(response) {
            if (response.ok) {
                sendNotification(sw);
            }
        })
        .catch(function(err) {
            console.log(err);
        });
}

function sendNotification(sw) {
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
}

if ('Notification' in window) {
    Array.from(enableNotificationBtns).forEach(function(btn) {
        btn.style.display = 'inline-block';
        btn.addEventListener('click', askForNotificationPermission);
    });
}