<script>
	import '../app.css';
	import Provider from '../Provider';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import { setContext } from 'svelte';
	import { athlete, lastSync } from '../stores.js'

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
</script>

<slot />
