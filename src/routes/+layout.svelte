<script>
	import '../app.css';
	import Provider from '../Provider';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import { onMount, setContext } from 'svelte';
	import { athlete, lastSync, token } from '../stores.js';
	import { initializeApp } from 'firebase/app';
	import { getMessaging, getToken, onMessage } from 'firebase/messaging';

	const firebaseConfig = {
		apiKey: 'AIzaSyD2JWxdRU6AhI5WMBHgvLMb6v8x9tLzqw0',
		authDomain: 'coral-swimmer.firebaseapp.com',
		projectId: 'coral-swimmer',
		storageBucket: 'coral-swimmer.appspot.com',
		messagingSenderId: '528677262049',
		appId: '1:528677262049:web:89c2b229471e4cef505da0',
		measurementId: 'G-Q61LGSCMEX'
	};

	console.log('Initialize Firebase...');
	// Initialize Firebase
	const app = initializeApp(firebaseConfig);
	const messaging = getMessaging(app);

	const provider = Provider;

	setContext('provider', provider);

	const redirect = async (destination) => {
		if (!browser) {
			return;
		}
		await goto(base + destination);
	};

	setContext('redirect', redirect);

	setContext('athlete', athlete);
	setContext('lastSync', lastSync);
	setContext('token', token);

	async function requestNotificationPermission() {
		console.log('Requesting permission...');
		let permission = await Notification.requestPermission();

		return permission === 'granted';
	}

	async function registerServiceWorker() {
		if ('serviceWorker' in navigator) {
			try {
				let registration = await navigator.serviceWorker.register('../firebase-messaging-sw.js');
				console.log('Registration successful, scope is:', registration.scope);
			} catch (err) {
				console.log('Service worker registration failed, error:', err);
			}
		}
	}

	onMount(async () => {
		await registerServiceWorker();
		let permissionGranted = await requestNotificationPermission();
		if (permissionGranted) {
			console.log('Notification permission granted.');

			console.log('Messaging get token...');
			getToken(messaging, {
				vapidKey:
					'BIxDq1HszvHFhbBARVJcPokYfOFQo74ZAzq2LZCBVn2K740j0TnvCJMBAgHweAGIG5bPlJTfHcE9cdr_du4Gqc4'
			})
				.then((currentToken) => {
					if (currentToken) {
						// Send the token to your server and update the UI if necessary
						// ...
						console.log('Token available: ', currentToken);
						$token = currentToken;
					} else {
						// Show permission request UI
						console.log('No registration token available. Request permission to generate one.');
						// ...
					}
				})
				.catch((err) => {
					console.log('An error occurred while retrieving token. ', err);
					// ...
				});

			onMessage(messaging, (payload) => {
				console.log('Message received. ', payload);

				const notificationTitle = payload.notification.title;
				const notificationOptions = {
					body: payload.notification.body,
					icon: '/logo_512.png'
				};

				var notification = new Notification(notificationTitle, notificationOptions);
				notification.onclick = () => {
					notification.close();
					window.parent.focus();
				};
			});
		} else {
			console.log('Unable to get permission to notify.');
		}
	});
</script>

<slot />
