<script>
	import MemberCardScreen from '$lib/screens/MemberCardScreen.svelte';
	import { onMount, getContext } from 'svelte';
	import { AthleteNotFoundError } from '$lib/actions/GetAthlete';
	import { popup } from '$lib/stores';

	const provider = getContext('provider');
	const redirect = getContext('redirect');
	const athlete = getContext('athlete');
	const lastSync = getContext('lastSync');
	const token = getContext('token');
	const lastMeasurement = getContext('lastMeasurement');

	let stats = {};
	let badges = [];
	let level = null;
	let isLoading = true;

	const onLogOut = () => {
		$athlete = null;
		$lastSync = null;
	};

	onMount(async () => {
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
						const lastMeasurementValues = $lastMeasurement
							? JSON.parse($lastMeasurement.valores)
							: null;
						const oldLevel = lastMeasurementValues?.level;
						const oldBadges = lastMeasurementValues?.badges;
						const measurementLevel = measurementValues.level;
						const badgeIds = measurementValues.badges;

						const [allBadges, fetchedLevel] = await Promise.all([
							provider.getAllBadges.handle(),
							provider.getLevel.handle(measurementLevel.id)
						]);
						badges = allBadges.filter((badge) => badgeIds.includes(badge.id));
						level = fetchedLevel;

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

						const newAchievements = [];
						if (oldLevel && level && oldLevel.id !== level.id) {
							newAchievements.push({
								name: level.name,
								icon: level.icon,
								type: 'level'
							});
						}
						if (oldBadges && badges) {
							const newBadges = badges.filter((badge) => !oldBadges.includes(badge.id));
							newBadges.forEach((badge) => {
								newAchievements.push({ name: badge.name, icon: badge.icon, type: 'badge' });
							});
						}

						if (newAchievements.length > 0) {
							$popup = {
								title: '¡Felicitaciones!',
								message: 'Has logrado nuevos hitos:',
								achievements: newAchievements
							};
						}
					} else if (['health','performance'].includes($athlete.tier)) {
						stats = {
							...stats,
							fatPercentage: measurementValues.fat || null,
							musclePercentage: measurementValues.muscle || null,
							waist: measurementValues.waist || null,
							hip: measurementValues.hip || null,
							visceralFat: measurementValues.visceral || null
						};
					} else {
						badges = [];
						level = null;
					}

					$lastMeasurement = latestMeasurement;
				} else {
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
			isLoading = false;
		}
	});

	$: {
		if (!$athlete) {
			redirect('/');
		}
	}
</script>

<MemberCardScreen bind:athlete={$athlete} {onLogOut} {badges} {level} {stats} {isLoading} />
