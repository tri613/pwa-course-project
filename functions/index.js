const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const webpush = require('web-push');

const serviceAccount = require("./keys/my-first-pwa-ebf14-firebase-adminsdk-7wy1m-ed94885bf3.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://my-first-pwa-ebf14.firebaseio.com"
});
 
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from Firebase!");
});

exports.storePostData = functions.https.onRequest((request, response) => {
	cors(request, response, function() {
		admin.database().ref('posts').push({
			id: request.body.id,
			title: request.body.title,
			location: request.body.location,
			image: request.body.image
		})
			.then(() => {
				webpush.setVapidDetails('mailto:tri613@gmail.com', 
					'BPDi5D0KmKcRa7JPyTCuSuQF7nWatmgBVnnnnnGAzKEVitLdo1bcfpv2-i4IrmcrIil_3bDCu7rwrnEl6qX2vaY', 
					'U4uY0DYLqFurf3uTgbgjlrtmGiqP6PBkGCVqCakLp4I');
				
				return admin.database().ref('subscription').once('value');
			})
			.then(subscriptions => {
				subscriptions.forEach(sub => {
					var pushConfig = {
						endpoint: sub.val().endpoint,
						keys: {
							auth: sub.val().keys.auth,
							p256dh: sub.val().keys.p256dh
						}
					};
					
					webpush.sendNotification(pushConfig, JSON.stringify({
						title: "New Post!",
						content: `New post ${request.body.title} is added!`
					}));
				});
				response.status(201).json({message: 'Data stored', id: request.body.id});
			})
			.catch(err => {
				response.status(500).json({error: err});
			});
	});
});