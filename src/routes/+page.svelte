<script>
	import LoginScreen from '$lib/screens/LoginScreen.svelte';
	import { onMount, getContext } from 'svelte';

	const redirect = getContext('redirect');
	const provider = getContext('provider');
	const athlete = getContext('athlete');
	const lastSync = getContext('lastSync');

	onMount(async () => {
		if ($athlete) {
			redirect('/member_card');
		}
	});

	const onSubmit = async (id) => {
		let result = await provider.getAthlete.handle(id);
		$athlete = result;
		$lastSync = new Date();
		redirect('/member_card');
	};
</script>

<LoginScreen {onSubmit} />
