<script>
	import MemberCardScreen from '../../screens/MemberCardScreen.svelte';
	import { onMount, onDestroy, getContext } from 'svelte';

	const provider = getContext('provider');
	const redirect = getContext('redirect');
	const athlete = getContext('athlete');
	const lastSync = getContext('lastSync');

	const onLogOut = () => {
		$athlete = null;
		$lastSync = null;
	};

	function addHours(date, hours) {
		console.log(date)
		const hoursToAdd = hours * 60 * 60 * 1000;
		date.setTime(date.getTime() + hoursToAdd);
		console.log(date)
		return date;
	}

	onMount(async () => {
		let now = new Date();
		console.log(now)
		if ($athlete) {
			try {
				$athlete = await provider.getAthlete.handle($athlete.identification);
				$lastSync = new Date();
			} catch (error) {
				console.log(error);
			}
		}
	});

	$: {
		if (!$athlete) {
			redirect('/');
		}
	}
</script>

<MemberCardScreen bind:athlete={$athlete} {onLogOut} />
