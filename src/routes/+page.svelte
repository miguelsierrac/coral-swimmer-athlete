<script>
	import LoginScreen from "../screens/LoginScreen.svelte";
	import {getContext} from 'svelte';

	const redirect = getContext('redirect')
    const provider = getContext('provider')

	const onSubmit = async (id) => {
		let result = await provider.getAthlete.handle(id);
		let athleteStr = JSON.stringify(result);
		localStorage.setItem('ATHLETE', athleteStr);
		redirect('/member_card');
	}
</script>

<LoginScreen {onSubmit} />
