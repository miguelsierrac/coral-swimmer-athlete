<script>
	import '../app.css';
	import Provider from '../Provider';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { setContext } from 'svelte';

	const provider = Provider;

	setContext('provider', provider);

	const redirect = async (destination) => {
		await goto(base + destination);
	};

	setContext('redirect', redirect);
</script>

<slot />
