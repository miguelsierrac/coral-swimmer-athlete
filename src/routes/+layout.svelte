<script>
	import '../app.css';
	import Provider from '../Provider';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import { setContext } from 'svelte';
	import { athlete, lastSync, token } from '../stores.js';

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
</script>

<svelte:head>
	<script type="module">
		// Import the functions you need from the SDKs you need
		import { token } from './src/stores.js';
		import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js';
		import { getAnalytics } from 'https://www.gstatic.com/firebasejs/11.3.0/firebase-analytics.js';
		import {
			getMessaging,
			getToken,
			onMessage
		} from 'https://www.gstatic.com/firebasejs/11.3.0/firebase-messaging.js';

		// TODO: Add SDKs for Firebase products that you want to use
		// https://firebase.google.com/docs/web/setup#available-libraries

		// Your web app's Firebase configuration
		// For Firebase JS SDK v7.20.0 and later, measurementId is optional
		const firebaseConfig = {
			apiKey: 'AIzaSyD2JWxdRU6AhI5WMBHgvLMb6v8x9tLzqw0',
			authDomain: 'coral-swimmer.firebaseapp.com',
			projectId: 'coral-swimmer',
			storageBucket: 'coral-swimmer.appspot.com',
			messagingSenderId: '528677262049',
			appId: '1:528677262049:web:89c2b229471e4cef505da0',
			measurementId: 'G-Q61LGSCMEX'
		};

		// Initialize Firebase
		const app = initializeApp(firebaseConfig);
		const analytics = getAnalytics(app);
		const messaging = getMessaging(app);
		console.log('Requesting permission...');
		Notification.requestPermission().then((permission) => {
			if (permission === 'granted') {
				console.log('Notification permission granted.');
				getToken(messaging, {
					vapidKey:
						'BIxDq1HszvHFhbBARVJcPokYfOFQo74ZAzq2LZCBVn2K740j0TnvCJMBAgHweAGIG5bPlJTfHcE9cdr_du4Gqc4'
				})
					.then((currentToken) => {
						if (currentToken) {
							// Send the token to your server and update the UI if necessary
							// ...
							console.log('Token available: ', currentToken);
							token.set(currentToken);
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
</svelte:head>

<slot />
