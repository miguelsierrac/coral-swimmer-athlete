<script>
	import MemberCardScreen from '$lib/screens/MemberCardScreen.svelte';
	import { onMount, onDestroy, getContext } from 'svelte';
	import { AthleteNotFoundError } from '$lib/actions/GetAthlete';

	const provider = getContext('provider');
	const redirect = getContext('redirect');
	const athlete = getContext('athlete');
	const lastSync = getContext('lastSync');
	const token = getContext('token');

	let stats = {};
	let badges = [];
	let level = null;
	let isLoading = true;

	const onLogOut = () => {
		$athlete = null;
		$lastSync = null;
	};

	function addHours(date, hours) {
		console.log(date);
		const hoursToAdd = hours * 60 * 60 * 1000;
		date.setTime(date.getTime() + hoursToAdd);
		console.log(date);
		return date;
	}

	onMount(async () => {
		let now = new Date();
		console.log(now);
		try {
			if ($athlete) {
				const [fetchedAthlete, information, measurements] = await Promise.all([
					provider.getAthlete.handle($athlete.identification),
					provider.getInformation.handle($athlete.id).catch((error) => {
						console.error('Error fetching information:', error);
						return null;
					}),
					provider.getMeasurements.execute($athlete.id).catch((error) => {
						console.error('Error fetching measurements:', error);
						return [];
					})
				]);
				$athlete = fetchedAthlete;
				if (information) {
					$athlete.total_distance = information.total_distance;
				}

				if ($token && $athlete.token !== $token) {
					$athlete.token = $token;
					await provider.saveToken.handle($athlete);
				}
				$lastSync = new Date();

				if (measurements && measurements.length > 0) {
					// Sort measurements by date to get the latest one
					measurements.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
					const latestMeasurement = measurements[0];
					const measurementValues = JSON.parse(latestMeasurement.valores);

					stats = {
						measurementDate: new Date(latestMeasurement.fecha),
						height: measurementValues.height || null,
						weight: measurementValues.weight || null,
						bmi: measurementValues.bmi || null,
						bodyFat: measurementValues.bodyFat || null,
						muscleMass: measurementValues.muscleMass || null
					};

					if ($athlete.tier === 'kids') {
						// Extract level and badgeIds from the latest measurement
						const measurementLevel = measurementValues.level;
						const badgeIds = measurementValues.badges;

						const [allBadges, fetchedLevel] = await Promise.all([
							provider.getAllBadges.handle(),
							provider.getLevel.handle(measurementLevel.id)
						]);
						badges = allBadges.filter((badge) => badgeIds.includes(badge.id));
						level = fetchedLevel;

						console.log('Fetched badges from measurement:', badges);
						console.log('Fetched level from measurement:', level);

						stats = {
							...stats,
							levelName: fetchedLevel.name,
							levelIcon: fetchedLevel.icon,
							levelColor: fetchedLevel.color,
							levelProgress: Math.round(
								(measurementLevel.skills.length / fetchedLevel.skills.length) * 100
							),
							levelCompletedSkills: measurementLevel.skills
						};
					} else if (['health','performance'].includes($athlete.tier)) {
						stats = {
							...stats,
							fatPercentage: measurementValues.fat || null,
							musclePercentage: measurementValues.muscle || null,
							waist: measurementValues.waist || null,
							hip: measurementValues.hip || null,
							visceralFat: measurementValues.visceral || null
						};
						console.log('Health stats:', stats);
					} else {
						badges = [];
						level = null;
					}
				} else {
					// If no measurements, default to empty badges and null level
					badges = [];
					level = null;
				}
			}
		} catch (error) {
			if (error instanceof AthleteNotFoundError) {
				$athlete = null;
				$lastSync = null;
				redirect('/');
				return;
			}
			console.error('Error during initial data fetch:', error);
		} finally {
			isLoading = false; // Set to false only after all async operations are attempted
		}
	});

	$: {
		if (!$athlete) {
			redirect('/');
		}
	}
</script>

<MemberCardScreen bind:athlete={$athlete} {onLogOut} {badges} {level} {stats} {isLoading} />
