<script>
	import MemberCardScreen from "../../screens/MemberCardScreen.svelte";
	var athlete

	$: {
		let athleteStr = localStorage.getItem('ATHLETE');
		athlete = JSON.parse(athleteStr);
	}

</script>

<MemberCardScreen {athlete} />
