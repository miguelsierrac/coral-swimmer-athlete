<script>
	import LoginScreen from "../screens/LoginScreen.svelte";
	import {getContext} from 'svelte';

	const redirect = getContext('redirect')
    const provider = getContext('provider')

	const onGetAthlete = async (id) => {
		return provider.getAthlete.handle(id);
	}
</script>

<LoginScreen {onGetAthlete} {redirect} />
