<script>
	import MemberCardScreen from '../../screens/MemberCardScreen.svelte';
	import { getContext } from 'svelte';

	const redirect = getContext('redirect');
	var athlete;

	$: {
		if (typeof localStorage !== 'undefined') {
			let athleteStr = localStorage.getItem('ATHLETE');
			athlete = JSON.parse(athleteStr);
		}
	}
</script>

<MemberCardScreen {athlete} />
