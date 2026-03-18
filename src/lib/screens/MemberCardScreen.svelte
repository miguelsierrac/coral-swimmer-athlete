<script>
	import { toast } from '@zerodevx/svelte-toast';
	import TechnicalSheet from '$lib/screens/TechnicalSheet.svelte';
	import ProductTour from '$lib/components/ProductTour.svelte';
	import NotificationsDrawer from '$lib/components/NotificationsDrawer.svelte';
	import UnlockPopup from '$lib/components/UnlockPopup.svelte';
	import { notifications } from '$lib/stores.js';
	import { tick } from 'svelte';
	import {
		trackNotificationDrawerOpened,
		trackNotificationDismissed,
		trackNotificationClearedAll
	} from '$lib/infrastructure/AnalyticsService.js';
	import { getCardSkin, getSkinById, getAllSkins, getFrameById, getAllFrames } from '$lib/utils/cardSkin.js';
	import CardStickers from '$lib/components/CardStickers.svelte';

	// Fixed slots on the hero zone (top/left as % of card-face)
	const STICKER_SLOTS = [
		{ top: 37, left: 4,  rotate: -14 },
		{ top: 37, left: 78, rotate:  10 },
		{ top: 10, left: 78, rotate:  -8 },
		{ top: 10, left: 4,  rotate:  12 },
		{ top: 23, left: 80, rotate:  -4 },
	];
	// The drag-canvas height represents the top HERO_H% of the card face
	const HERO_HEIGHT_PCT = 55;
	const DRAG_TOP_MIN  =  5, DRAG_TOP_MAX  = 60;
	const DRAG_LEFT_MIN = -8, DRAG_LEFT_MAX = 82;

	// ── Card customisation (localStorage) ───────────────────────
	function customKey(id) { return `card_custom_${id}`; }

	function loadCustom(athleteId) {
		try {
			const raw = localStorage.getItem(customKey(athleteId));
			return raw ? JSON.parse(raw) : null;
		} catch { return null; }
	}

	function saveCustom(athleteId, data) {
		try { localStorage.setItem(customKey(athleteId), JSON.stringify(data)); } catch {}
	}

	// Edit-mode state
	let isEditMode = false;
	let activeTab = 'stickers'; // 'stickers' | 'fondo' | 'borde'

	// active sticker IDs chosen by the user (null = not yet initialised from storage)
	let activeStickerIds = null;
	// custom positions per fileId: { [fileId]: { top: number, left: number } }
	let stickerPositions = {};
	// custom skin ID chosen by the user (null = use level default)
	let customSkinId = null;
	// custom frame ID chosen by the user (null = no frame)
	let customFrameId = null;
	// all available skin/frame swatches for the picker (constant — catalog never changes at runtime)
	const SKINS_LIST = getAllSkins();
	const FRAMES_LIST = getAllFrames();

	// Initialise once athlete + completedBadges are ready
	$: if (athlete?.id && completedBadges && activeStickerIds === null) {
		const saved = loadCustom(athlete.id);
		if (saved?.stickers) {
			activeStickerIds = saved.stickers;
		} else {
			// First time: all earned stickers active by default
			activeStickerIds = allEarnedStickerFiles;
		}
		if (saved?.positions) stickerPositions = saved.positions;
		if (saved?.skinId) customSkinId = saved.skinId;
		if (saved?.frameId) customFrameId = saved.frameId;
	}

	function toggleEditMode() {
		isEditMode = !isEditMode;
	}

	function toggleSticker(fileId) {
		if (activeStickerIds.includes(fileId)) {
			activeStickerIds = activeStickerIds.filter(id => id !== fileId);
		} else {
			activeStickerIds = [...activeStickerIds, fileId];
		}
		saveCustom(athlete.id, { stickers: activeStickerIds, positions: stickerPositions, skinId: customSkinId, frameId: customFrameId });
	}

	function moveStickerPosition(id, top, left) {
		stickerPositions = { ...stickerPositions, [id]: { top, left } };
		saveCustom(athlete.id, { stickers: activeStickerIds, positions: stickerPositions, skinId: customSkinId, frameId: customFrameId });
	}

	function selectSkin(skinId) {
		customSkinId = skinId === 'default' ? null : skinId;
		saveCustom(athlete.id, { stickers: activeStickerIds, positions: stickerPositions, skinId: customSkinId, frameId: customFrameId });
	}

	function selectFrame(frameId) {
		customFrameId = frameId === 'none' ? null : frameId;
		saveCustom(athlete.id, { stickers: activeStickerIds, positions: stickerPositions, skinId: customSkinId, frameId: customFrameId });
	}

	export let athlete;
	export let onLogOut;
	export let badges = [];
	export let level = null;
	export let stats = {};
	export let isLoading = false;
	export let gamificationLevels = [];
	export let currentUserID;
	export let gamificationProgress = null;

	$: levelSkin = getCardSkin(level?.id ?? null);
	$: skin = customSkinId ? (getSkinById(customSkinId) ?? levelSkin) : levelSkin;
	$: activeFrameClass = customFrameId ? (getFrameById(customFrameId)?.frameClass ?? '') : '';

	// Build radar stats by accumulating radar_stats from every completed objective
	// (current level real progress + all previous levels assumed fully earned)
	$: radarStats = (() => {
		if (!allCompletedBadges?.length) return null;
		const acc = {};
		for (const badge of allCompletedBadges) {
			const stats = badge?.meta_game?.radar_stats;
			if (!stats) continue;
			for (const [key, val] of Object.entries(stats)) {
				acc[key] = (acc[key] ?? 0) + val;
			}
		}
		return Object.keys(acc).length >= 2 ? acc : null;
	})();

	// Collect unlock messages from newly-completed badges (those with a progress grade and an unlock_message)
	$: pendingUnlockMessages = (() => {
		if (!badges || !badges.length) return [];
		return badges
			.filter(b => b.progress && b.meta_game?.unlock_message)
			.map(b => ({ msg: b.meta_game.unlock_message, key: `unlock_seen_${b.id}_${b.progress}` }));
	})();

	let showUnlockPopup = false;
	let currentUnlock = null; // { msg, key }
	let unlockQueue = [];

	$: {
		const unseen = pendingUnlockMessages.filter(u => {
			try { return !localStorage.getItem(u.key); } catch { return false; }
		});
		if (unseen.length > 0 && !showUnlockPopup) {
			unlockQueue = unseen;
			showNextUnlock();
		}
	}

	function showNextUnlock() {
		if (unlockQueue.length === 0) return;
		currentUnlock = unlockQueue[0];
		unlockQueue = unlockQueue.slice(1);
		showUnlockPopup = true;
	}

	function dismissUnlockPopup() {
		if (currentUnlock) {
			try { localStorage.setItem(currentUnlock.key, '1'); } catch {}
			currentUnlock = null;
		}
		showUnlockPopup = false;
		// Show next in queue after short delay
		if (unlockQueue.length > 0) setTimeout(showNextUnlock, 400);
	}

	let isFlipped = false;
	let showNotifDrawer = false;
	let tourInstance;
	let isTransitioning = false;
	let tourInitialized = false;
	let hasViewedAchievements = false; // Track if user has viewed the back

	$: unreadCount = $notifications.filter((n) => !n.read).length;

	function openNotifDrawer() {
		trackNotificationDrawerOpened(unreadCount);
		showNotifDrawer = true;
	}

	function closeNotifDrawer() {
		showNotifDrawer = false;
	}

	function markAllRead() {
		notifications.set($notifications.map((n) => ({ ...n, read: true })));
	}

	function deleteNotification(id) {
		trackNotificationDismissed();
		notifications.set($notifications.filter((n) => n.id !== id));
	}

	function clearAllNotifications() {
		trackNotificationClearedAll($notifications.length);
		notifications.set([]);
	}

	// Puntajes guardados localmente para detectar cambios
	function readStoredScores() {
		try {
			const saved = typeof localStorage !== 'undefined' && localStorage.getItem('last_seen_scores');
			return saved ? JSON.parse(saved) : { asistencia: 0, distancia: 0 };
		} catch { return { asistencia: 0, distancia: 0 }; }
	}
	function saveStoredScores(asistencia, distancia) {
		try {
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem('last_seen_scores', JSON.stringify({ asistencia: asistencia ?? 0, distancia: distancia ?? 0 }));
			}
		} catch {}
	}

	// Detectar novedades en gamificación
	$: completedBadges = badges.filter(b => b.progress !== null && b.progress !== undefined);
	$: hasPendingRewards = completedBadges.length > 0;

	// Completed badges expanded with all previous-level objectives (assumed fully earned)
	$: allCompletedBadges = (() => {
		const result = [...completedBadges];
		if (!level || !gamificationLevels?.length) return result;
		let prevLevelId = level.nivel_anterior;
		while (prevLevelId !== null && prevLevelId !== undefined) {
			const prevLevel = gamificationLevels.find(l => l.id === prevLevelId);
			if (!prevLevel) break;
			for (const obj of prevLevel.objetivos ?? []) {
				result.push({ ...obj, progress: 'oro' });
			}
			prevLevelId = prevLevel.nivel_anterior;
		}
		return result;
	})();

	// All unique sticker file IDs the user has earned
	$: allEarnedStickerFiles = (() => {
		const seen = new Set();
		const result = [];
		for (const badge of allCompletedBadges) {
			const rewardId = badge.meta_game?.reward?.id;
			if (!rewardId || badge.meta_game?.reward?.tipo !== 'sticker') continue;
			const file = rewardId.replace(/^sticker_/, '');
			if (seen.has(file)) continue;
			seen.add(file);
			result.push(file);
		}
		return result;
	})();

	// All unique frame IDs the user has earned
	$: allEarnedFrameIds = (() => {
		const result = [];
		for (const badge of allCompletedBadges) {
			const r = badge.meta_game?.reward;
			if (r?.tipo === 'borde' && !result.includes(r.id)) result.push(r.id);
		}
		return result;
	})();

	// All unique skin IDs the user has earned
	$: allEarnedSkinIds = (() => {
		const result = [];
		for (const badge of allCompletedBadges) {
			const r = badge.meta_game?.reward;
			if (r?.tipo === 'fondo' && !result.includes(r.id)) result.push(r.id);
		}
		return result;
	})();

	// Stickers to render on the card = active ones, positioned in STICKER_SLOTS
	$: displayedStickers = (activeStickerIds ?? allEarnedStickerFiles)
		.slice(0, STICKER_SLOTS.length)
		.map((fileId, i) => {
			const slot = STICKER_SLOTS[i];
			const custom = stickerPositions[fileId];
			return { id: fileId, top: custom?.top ?? slot.top, left: custom?.left ?? slot.left, rotate: slot.rotate };
		});
	$: recentAchievements = completedBadges.filter(b => {
		// Opcional: si tienes timestamp de cuándo se completó, puedes filtrar por recientes
		// Por ahora, cualquier badge completado cuenta como "reciente"
		return true;
	});
	$: hasScorePoints = (() => {
		const stored = readStoredScores();
		return (athlete?.puntaje_asistencia ?? 0) > stored.asistencia ||
		       (athlete?.puntaje_distancia ?? 0) > stored.distancia;
	})();
	$: hasNewAchievements = (recentAchievements.length > 0 || hasScorePoints) && !hasViewedAchievements;

	// Mark achievements as viewed when card is flipped, and save current scores
	$: if (isFlipped && !hasViewedAchievements) {
		hasViewedAchievements = true;
		saveStoredScores(athlete?.puntaje_asistencia, athlete?.puntaje_distancia);
	}

	// Configure tour steps based on athlete tier
	let tourSteps = [];
	$: if (athlete && athlete.tier !== 'standard') {
		tourSteps = [
			{
				element: '.flip-btn',
				popover: {
					title: '🔄 Voltea tu Carnet',
					description:
						'¡Bienvenido! Haz click en este botón para voltear tu carnet y acceder a tu <strong>Ficha Técnica</strong> con toda tu información de progreso.',
					side: 'bottom',
					align: 'center',
					onNextClick: async () => {
						if (isTransitioning) return;
						isTransitioning = true;
						isFlipped = true;
						await tick();
						setTimeout(() => {
							const driver = tourInstance?.getInstance();
							if (driver) driver.moveNext();
							isTransitioning = false;
						}, 600);
					}
				}
			},
			{
				element: '#tech-sheet-header',
				popover: {
					title: '📊 Tu Ficha Técnica',
					description:
						'Aquí encontrarás toda tu información de progreso y desarrollo. Vamos a explorar las secciones principales.',
					side: 'bottom',
					align: 'start',
					onPrevClick: async () => {
						if (isTransitioning) return;
						isTransitioning = true;
						isFlipped = false;
						await tick();
						setTimeout(() => {
							const driver = tourInstance?.getInstance();
							if (driver) driver.movePrevious();
							isTransitioning = false;
						}, 600);
					}
				}
			},
			{
				element: '#basic-stats-section',
				popover: {
					title: '⚖️ Estadísticas Básicas',
					description: 'Tus medidas básicas de peso y talla, actualizadas regularmente.',
					side: 'bottom',
					align: 'center'
				}
			},
			{
				element: '#level-section',
				popover: {
					title: '🎯 Tu Nivel y Objetivos',
					description:
						'Aquí ves tu nivel actual y progreso. <strong>Haz click</strong> para ver todos tus objetivos en detalle.',
					side: 'bottom',
					align: 'center'
				}
			},
			{
				element: '#leaderboard-section',
				popover: {
					title: '🏆 Tabla de Posiciones',
					description:
						'Accede al ranking para ver cómo te comparas con otros atletas de tu nivel. ¡Compite y mejora tu posición!',
					side: 'top',
					align: 'center'
				}
			}
		];
	}

	// Ensure card is not flipped when tour starts
	$: if (!isLoading && tourSteps.length > 0 && !tourInitialized) {
		const hasSeenTour = typeof localStorage !== 'undefined' && localStorage.getItem('hasSeenMemberCardTour');
		if (!hasSeenTour) {
			isFlipped = false;
			tourInitialized = true;
		}
	}

	function convertDateToUTC(date) {
		return new Date(
			date.getUTCFullYear(),
			date.getUTCMonth(),
			date.getUTCDate(),
			date.getUTCHours(),
			date.getUTCMinutes(),
			date.getUTCSeconds()
		);
	}

	function expired(date) {
		let now = convertDateToUTC(new Date());

		return now > date;
	}

	function showNotification(title, body, message, duration = undefined) {
		var options = {
			target: 'critical-notifications'
		};
		if (duration) {
			options['duration'] = duration;
		} else {
			options['initial'] = 0;
		}
		toast.push(
			'<strong>' +
				title +
				'</strong><br>' +
				body +
				'<br><br><a class="bg-red-500 hover:bg-red-700 text-white py-1 px-1 rounded" aria-label="Contactarme" href="https://wa.me/573215384134?text=' +
				encodeURIComponent(message) +
				'">💬 CONTACTARSE<a />',
			options
		);
	}

	$: {
		toast.pop({ target: 'critical-notifications' });
		if (athlete) {
			if (
				expired(convertDateToUTC(new Date(athlete.expiration_date))) ||
				athlete.remaining_days <= 0
			) {
				showNotification(
					'IMPORTANTE ‼',
					'Tu plan ha expirado o ya no te quedan clases disponibles, si deseas continuar con nosotros, puedes contactarnos para renovar tu plan o solicitar días adicionales, puedes hacerlo dando click aquí:',
					'Quiero renovar mi plan o solicitar clases adicionales'
				);
			} else if (athlete.remaining_days < 2) {
				showNotification(
					'Recordatorio',
					'Ya solo te quedan ' +
						athlete.remaining_days +
						' clases restantes. Si lo deseas, puedes contactarnos para cambiar tu plan o solicitar días adicionales, puedes hacerlo dando click aquí:',
					'Quiero cambiar mi plan o solicitar clases adicionales',
					8000
				);
			}
		}
	}
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.gstatic.com/" crossorigin="" />
	<link
		rel="stylesheet"
		as="style"
		onload="this.rel='stylesheet'"
		href="https://fonts.googleapis.com/css2?display=swap&amp;family=Lexend%3Awght%40400%3B500%3B700%3B900&amp;family=Noto+Sans%3Awght%40400%3B500%3B700%3B900"
	/>
	<link rel="icon" type="image/x-icon" href="data:image/x-icon;base64," />
</svelte:head>

{#if athlete}
	<ProductTour
		steps={tourSteps}
		storageKey="hasSeenMemberCardTour"
		shouldStart={!isLoading}
		bind:this={tourInstance}
	/>

	<!-- Help button to restart tour -->
	{#if athlete.tier !== 'standard' && !isFlipped}
		<button
			class="help-tour-btn"
			on:click={() => {
				if (tourInstance) tourInstance.restart();
			}}
			title="Ver tutorial"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<circle cx="12" cy="12" r="10"></circle>
				<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
				<line x1="12" y1="17" x2="12.01" y2="17"></line>
			</svg>
		</button>
	{/if}

	<div class="page-wrapper">
		<div class="card-scene {activeFrameClass}">
			<div class="card-inner" class:is-flipped={isFlipped}>
				<!-- Capas para simular grosor 3D -->
				<div class="thickness-layer" style="transform: translateZ(-2px)"></div>
				<div class="thickness-layer" style="transform: translateZ(-1px)"></div>
				<div class="thickness-layer" style="transform: translateZ(0px)"></div>
				<div class="thickness-layer" style="transform: translateZ(1px)"></div>
				<div class="thickness-layer" style="transform: translateZ(2px)"></div>

				<!-- CARA FRONTAL -->
				<div class="card-face card-front">
					<!-- Botón campana: historial de notificaciones -->
					<button
						class="bell-btn"
						class:has-unread={unreadCount > 0}
						on:click={openNotifDrawer}
						title={unreadCount > 0 ? `${unreadCount} notificacion${unreadCount === 1 ? '' : 'es'} nueva${unreadCount === 1 ? '' : 's'}` : 'Ver notificaciones'}
					>
						{#if unreadCount > 0}
							<span class="bell-unread-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>
						{/if}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
							<path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
						</svg>
					</button>

					{#if athlete.tier !== 'standard'}
						<button 
							class="flip-btn" 
							class:has-notifications={hasNewAchievements}
							on:click={() => { isFlipped = !isFlipped; isEditMode = false; }}
							title={hasNewAchievements ? '¡Tienes logros nuevos!' : 'Ver ficha técnica'}
						>
							{#if hasNewAchievements}
								<span class="notification-dot"></span>
							{/if}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
							</svg>
						</button>

					<!-- Botón editar carnet -->
					{#if allEarnedStickerFiles.length > 0}
						<button
							class="edit-btn"
							class:edit-btn-active={isEditMode}
							on:click={toggleEditMode}
							title="Personalizar carnet"
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
								<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
								<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
							</svg>
						</button>
					{/if}
				{/if}
					<div class="nc-root" style="--skin-accent:{skin.accent};">
						<!-- ── CLUB HEADER ── -->
						<div class="nc-header" class:nc-header-dark={skin.isDark}>
							<div class="nc-brand">
								<div class="nc-logo" style="background-image: url('logo_512.png');"></div>
								<div class="nc-brand-text">
									<span class="nc-club-name">CORAL SWIMMER</span>
									<span class="nc-club-id">ID: {athlete.identification}</span>
								</div>
							</div>
						</div>

						<!-- ── HERO: avatar + identity on gradient (drag zone when editing) ── -->
						<div class="nc-hero {skin.textureClass}" class:nc-hero-dark={skin.isDark} class:nc-hero-edit={isEditMode} style="--skin-gradient:{skin.gradient}">
							{#if isEditMode && displayedStickers.length > 0}
								<div class="drag-zone-hint">↔ Arrastra los stickers aquí</div>
							{/if}
							{#if athlete.photo}
								<div class="nc-av" style="background-image: url({athlete.photo});"></div>
							{:else}
								<div class="nc-av nc-av-ph">
									<svg width="36" height="36" fill="rgba(255,255,255,0.5)" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
								</div>
							{/if}
							<p class="nc-name">{athlete.forename} {athlete.surname}</p>
							{#if !athlete.expiration_date}
								<span class="nc-validity nc-validity-exp">Membresía expirada</span>
							{:else if expired(convertDateToUTC(new Date(athlete.expiration_date)))}
								<span class="nc-validity nc-validity-exp">Expiró {convertDateToUTC(new Date(athlete.expiration_date)).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
							{:else}
								<span class="nc-validity nc-validity-ok">Válido hasta {convertDateToUTC(new Date(athlete.expiration_date)).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
							{/if}
							{#if athlete.total_distance}
								<div class="nc-medals">
									{#if athlete.total_distance >= 1000}<img src="medal_1k.png" alt="1k" width="22" height="22"/>{/if}
									{#if athlete.total_distance >= 2000}<img src="medal_2k.png" alt="2k" width="22" height="22"/>{/if}
									{#if athlete.total_distance >= 5000}<img src="medal_5k.png" alt="5k" width="22" height="22"/>{/if}
									{#if athlete.total_distance >= 10000}<img src="medal_10k.png" alt="10k" width="22" height="22"/>{/if}
									{#if athlete.total_distance >= 20000}<img src="medal_20k.png" alt="20k" width="22" height="22"/>{/if}
								</div>
							{/if}
						</div>

						<!-- ── WHITE PANEL: data rows + footer ── -->
						<div class="nc-panel" class:nc-panel-tinted={skin.gradient !== 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)'}>
							<div class="nc-rows">
								<div class="nc-row">
									<svg class="nc-row-icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 256 256"><path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z"/></svg>
									<span class="nc-row-label">Miembro desde</span>
									<span class="nc-row-val">{convertDateToUTC(new Date(athlete.start_date)).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</span>
								</div>
								<div class="nc-row">
									<svg class="nc-row-icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 256 256"><path d="M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z"/></svg>
									<span class="nc-row-label">Clases restantes</span>
									<span class="nc-row-val">
										{#if athlete.remaining_days >= 0}{athlete.remaining_days}{:else}0 <small class="text-red-500">({athlete.remaining_days} extras)</small>{/if}
									</span>
								</div>
								{#if athlete.phone}
									<div class="nc-row">
										<svg class="nc-row-icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 256 256"><path d="M222.37,158.46l-47.11-21.11-.13-.06a16,16,0,0,0-15.17,1.4,8.12,8.12,0,0,0-.75.56L134.87,160c-15.42-7.49-31.34-23.29-38.83-38.51l20.78-24.71c.2-.25.39-.5.57-.77a16,16,0,0,0,1.32-15.06l0-.12L97.54,33.64a16,16,0,0,0-16.62-9.52A56.26,56.26,0,0,0,32,80c0,79.4,64.6,144,144,144a56.26,56.26,0,0,0,55.88-48.92A16,16,0,0,0,222.37,158.46Z"/></svg>
										<span class="nc-row-label">Teléfono</span>
										<span class="nc-row-val">{athlete.phone}</span>
									</div>
								{/if}
							</div>
							<div class="nc-foot">
								<img
									id="barcode"
									src="https://api.qrserver.com/v1/create-qr-code/?data={athlete.id}&size=56x56"
									alt="QR"
									title="ID"
									width="52"
									height="52"
									class="nc-qr"
								/>
								<button class="nc-logout" on:click={onLogOut()}>Cerrar Sesión</button>
							</div>
						</div>

					</div>
					<!-- Stickers ganados superpuestos sobre la cara frontal -->
					{#if displayedStickers.length > 0}
						<CardStickers
							stickers={displayedStickers}
							{isEditMode}
							on:move={(e) => moveStickerPosition(e.detail.id, e.detail.top, e.detail.left)}
						/>
					{/if}

					<!-- Panel de edición -->
					{#if isEditMode}
						<div class="edit-panel">
							<div class="edit-panel-handle"></div>
							<div class="edit-panel-header">
								<p class="edit-panel-title">✏️ Personalizar Carnet</p>
								<button class="edit-panel-close" on:click={toggleEditMode} aria-label="Cerrar">Listo</button>
							</div>

							<!-- Tab bar -->
							<div class="edit-tabs" role="tablist">
								<button class="edit-tab" class:edit-tab-active={activeTab === 'stickers'} role="tab" on:click={() => activeTab = 'stickers'}>🏷️ Stickers</button>
								<button class="edit-tab" class:edit-tab-active={activeTab === 'fondo'}    role="tab" on:click={() => activeTab = 'fondo'}>🎨 Fondo</button>
								<button class="edit-tab" class:edit-tab-active={activeTab === 'borde'}    role="tab" on:click={() => activeTab = 'borde'}>🖼️ Borde</button>
							</div>

							<!-- Tab body (scrollable) -->
							<div class="edit-tab-body">
								{#if activeTab === 'stickers'}
									<div class="sticker-grid">
										{#each allEarnedStickerFiles as fileId}
											{@const active = (activeStickerIds ?? []).includes(fileId)}
											{@const atLimit = (activeStickerIds ?? []).length >= STICKER_SLOTS.length && !active}
											<button
												class="sticker-thumb"
												class:sticker-thumb-active={active}
												class:sticker-thumb-limit={atLimit}
												on:click={() => !atLimit && toggleSticker(fileId)}
												title={active ? 'Quitar sticker' : atLimit ? `Máximo ${STICKER_SLOTS.length} stickers` : 'Agregar sticker'}
											>
												<img
													src="/stickers/{fileId.replace('_holo', '')}.svg"
													alt={fileId}
													on:error={(e) => { e.currentTarget.style.display = 'none'; }}
												/>
												{#if active}
													<span class="sticker-check">✓</span>
												{/if}
											</button>
										{/each}
									</div>
									<p class="edit-hint">{(activeStickerIds ?? []).length}/{STICKER_SLOTS.length} activos · Arrastra para reposicionar</p>
								{:else if activeTab === 'fondo'}
									<div class="skin-grid">
										<button
											class="skin-swatch"
											class:skin-swatch-active={!customSkinId}
											on:click={() => selectSkin('default')}
											title="Original"
										>
											<span class="skin-preview" style="background:{levelSkin.gradient}"></span>
											<span class="skin-label">Original</span>
										</button>
										{#each SKINS_LIST as sk}
											{@const unlocked = allEarnedSkinIds.includes(sk.id)}
											<button
												class="skin-swatch"
												class:skin-swatch-active={customSkinId === sk.id}
												class:skin-swatch-locked={!unlocked}
												disabled={!unlocked}
												on:click={() => unlocked && selectSkin(sk.id)}
												title={unlocked ? sk.label : '🔒 Bloqueado'}
											>
												<span class="skin-preview" style="background:{sk.gradient}"></span>
												{#if !unlocked}<span class="skin-lock">🔒</span>{/if}
												<span class="skin-label">{sk.label}</span>
											</button>
										{/each}
									</div>
								{:else if activeTab === 'borde'}
									<div class="frame-grid">
										<button
											class="frame-thumb"
											class:frame-thumb-active={!customFrameId}
											on:click={() => selectFrame('none')}
											title="Sin borde"
										>
											<span class="frame-preview frame-preview-none"></span>
											<span class="frame-label">Ninguno</span>
										</button>
										{#each FRAMES_LIST as fr}
											{@const unlocked = allEarnedFrameIds.includes(fr.id)}
											<button
												class="frame-thumb"
												class:frame-thumb-active={customFrameId === fr.id}
												class:frame-thumb-locked={!unlocked}
												disabled={!unlocked}
												on:click={() => unlocked && selectFrame(fr.id)}
												title={unlocked ? fr.label : '🔒 Bloqueado'}
											>
												<span class="frame-preview" style="border-color:{fr.color}; box-shadow:0 0 6px {fr.color};"></span>
												{#if !unlocked}<span class="frame-lock">🔒</span>{/if}
												<span class="frame-label">{fr.label}</span>
											</button>
										{/each}
									</div>
								{/if}
							</div>
						</div>
					{/if}
					<!-- Banner Teaser -->
					{#if hasNewAchievements && athlete.tier !== 'standard'}
						<button 
							class="teaser-banner"
							on:click={() => { isFlipped = !isFlipped; isEditMode = false; }}
						>
							<span class="teaser-icon">🌟</span>
							<span class="teaser-text">
								{#if completedBadges.length === 1 && hasScorePoints}
									¡Tienes 1 objetivo y puntos nuevos este mes! Gira el carnet
								{:else if completedBadges.length > 1 && hasScorePoints}
									¡Tienes {completedBadges.length} objetivos y puntos nuevos este mes! Gira el carnet
								{:else if completedBadges.length === 1}
									¡Tienes 1 objetivo completado! Gira el carnet
								{:else if completedBadges.length > 1}
									¡Tienes {completedBadges.length} objetivos completados! Gira el carnet
								{:else}
									¡Ganaste puntos este mes! Gira el carnet
								{/if}
								{#if athlete.puntaje_asistencia || athlete.puntaje_distancia}
									<span class="teaser-points">
										{#if athlete.puntaje_asistencia}+{athlete.puntaje_asistencia} pts asistencia{/if}
										{#if athlete.puntaje_asistencia && athlete.puntaje_distancia}<br>{/if}
										{#if athlete.puntaje_distancia}+{athlete.puntaje_distancia} pts volumen{/if}
									</span>
								{/if}
							</span>
							<span class="teaser-chevron">›</span>
						</button>
					{/if}

					{#if !athlete.expiration_date || expired(convertDateToUTC(new Date(athlete.expiration_date)))}
						<div class="absolute top-60 right-8 left-8 z-10">
							<span class="stamp is-nope">Vencido</span>
						</div>
					{/if}
				</div>

				<!-- CARA TRASERA -->
				<div class="card-face card-back">
					<TechnicalSheet
						tier={athlete.tier}
						weeklyDistance={athlete.weeklyDistance}
						monthlyRecord={athlete.monthlyRecord}
						monthlyRecordDate={athlete.monthlyRecordDate}
						totalDistance={athlete.total_distance}
						{stats}
						{badges}
						{level}
						{isLoading}
						allLevels={gamificationLevels}
						{currentUserID}
						{radarStats}
						newBadges={recentAchievements}
						showNewIndicators={isFlipped && recentAchievements.length > 0}
						on:flip={() => { isFlipped = !isFlipped; isEditMode = false; }}
					/>
				</div>
			</div>
		</div>
	</div>

	<NotificationsDrawer
		open={showNotifDrawer}
		notificationList={$notifications}
		onClose={closeNotifDrawer}
		onMarkAllRead={markAllRead}
		onDelete={deleteNotification}
		onClearAll={clearAllNotifications}
	/>

	<UnlockPopup
		visible={showUnlockPopup}
		message={currentUnlock?.msg ?? ''}
		levelIcon={level?.icono ?? '🏆'}
		levelName={level?.nombre ?? ''}
		on:dismiss={dismissUnlockPopup}
	/>
{/if}

<style>
	:root {
		--primary-blue: #4285f4;
		--secondary-green: #34a853;
		--kids-color: #ff6d00;
		--accent-gold: #ffc107;
		--bg-icon: #f7f3ef;
		--text-dark: #2c3e50;
		--text-muted: #7f8c8d;
	}

	.page-wrapper {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		background-color: #f0f2f5;
		perspective: 1000px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.card-scene {
		width: 90%;
		height: 90%;
		position: absolute;
	}

	.card-inner {
		position: relative;
		width: 100%;
		height: 100%;
		text-align: center;
		transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
		transform-style: preserve-3d;
	}

	.card-inner.is-flipped {
		transform: rotateY(180deg);
	}

	.card-face {
		position: absolute;
		width: 100%;
		height: 100%;
		-webkit-backface-visibility: hidden;
		backface-visibility: hidden;
		background: white;
		border-radius: 24px;
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.04),
			0 8px 16px rgba(0, 0, 0, 0.04),
			0 24px 48px rgba(0, 0, 0, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 0.6);
		overflow: hidden;
		-webkit-mask-image: -webkit-radial-gradient(
			white,
			black
		); /* Fix Safari border-radius overflow */
		transform: translateZ(3px);
		z-index: 1;
		border: 1px solid rgba(0, 0, 0, 0.08);
	}

	.card-back {
		transform: rotateY(180deg) translateZ(3px);
	}

	.thickness-layer {
		position: absolute;
		width: 100%;
		height: 100%;
		background-color: #e2e8f0;
		border-radius: 24px;
		border: 1px solid #cbd5e1;
	}

	/* ── New card design (nc-*) ── */
	/* Base is WHITE. Skin/level system overrides nc-hero background. */

	.nc-root {
		height: 100%;
		display: flex;
		flex-direction: column;
		background: white;
		--skin-accent: #4285f4;
	}

	.nc-header {
		padding: 54px 20px 12px;
		text-align: center;
		background: white;
		transition: background 0.4s;
	}

	.nc-header-dark {
		background: color-mix(in srgb, var(--skin-accent) 18%, white);
	}

	.nc-header-dark .nc-club-name {
		color: color-mix(in srgb, var(--skin-accent) 70%, #0f172a);
	}

	.nc-header-dark .nc-club-id {
		color: color-mix(in srgb, var(--skin-accent) 50%, #64748b);
	}

	.nc-brand {
		display: inline-flex;
		align-items: center;
		gap: 12px;
	}

	.nc-logo {
		width: 52px;
		height: 52px;
		border-radius: 12px;
		background-size: cover;
		background-position: center;
		flex-shrink: 0;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.14);
	}

	.nc-brand-text {
		display: flex;
		flex-direction: column;
		line-height: 1.25;
		text-align: left;
	}

	.nc-club-name {
		font-size: 17px;
		font-weight: 800;
		color: #0f172a;
		letter-spacing: 0.3px;
	}

	.nc-club-id {
		font-size: 11px;
		color: #64748b;
	}

	/* Hero — skin applies background via inline style; default is white */
	.nc-hero {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 10px 16px 24px;
		gap: 10px;
		background: var(--skin-gradient, white);
	}

	.nc-av {
		width: 130px;
		height: 130px;
		border-radius: 50%;
		border: 4px solid white;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.08), 0 6px 24px rgba(0, 0, 0, 0.18);
	}

	.nc-av-ph {
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.07);
	}

	.nc-name {
		margin: 0;
		font-size: 22px;
		font-weight: 700;
		color: #0f172a;
		letter-spacing: -0.3px;
	}

	/* Dark skin overrides */
	.nc-hero-dark .nc-name {
		color: white;
		text-shadow: 0 1px 6px rgba(0, 0, 0, 0.4);
	}

	.nc-validity {
		display: inline-block;
		padding: 5px 14px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 600;
	}

	.nc-validity-ok {
		background: #e0f2fe;
		color: #0369a1;
		border: 1px solid #bae6fd;
	}

	.nc-hero-dark .nc-validity-ok {
		background: rgba(255, 255, 255, 0.18);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.35);
	}

	.nc-validity-exp {
		background: #fee2e2;
		color: #dc2626;
		border: 1px solid #fca5a5;
	}

	.nc-hero-dark .nc-validity-exp {
		background: rgba(220, 38, 38, 0.35);
		color: #fca5a5;
		border: 1px solid rgba(220, 38, 38, 0.5);
	}

	.nc-medals {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 4px;
	}

	.nc-panel {
		background: white;
		border-radius: 20px 20px 0 0;
		box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.07);
		overflow: hidden;
	}

	.nc-panel-tinted .nc-row-icon {
		color: var(--skin-accent);
	}

	.nc-panel-tinted .nc-foot {
		background: color-mix(in srgb, var(--skin-accent) 8%, #f8fafc);
		border-top: 1px solid color-mix(in srgb, var(--skin-accent) 20%, transparent);
	}

	.nc-panel-tinted .nc-logout {
		background: linear-gradient(135deg, var(--skin-accent) 0%, color-mix(in srgb, var(--skin-accent) 70%, black) 100%);
	}

	.nc-rows {
		padding: 6px 6px 0;
	}

	.nc-row {
		display: flex;
		align-items: center;
		padding: 13px 16px;
		gap: 11px;
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
	}

	.nc-row-icon {
		flex-shrink: 0;
		color: #0891b2;
	}

	.nc-row-label {
		font-size: 13px;
		color: #64748b;
	}

	.nc-row-val {
		font-size: 14px;
		font-weight: 600;
		color: #0f172a;
		margin-left: auto;
		text-align: right;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 55%;
	}

	.nc-foot {
		display: flex;
		align-items: center;
		padding: 10px 14px 16px;
		gap: 12px;
		border-top: 1px solid rgba(0, 0, 0, 0.07);
		background: #f8fafc;
	}

	.nc-qr {
		flex-shrink: 0;
		border-radius: 6px;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
	}

	.nc-logout {
		flex: 1;
		background: linear-gradient(135deg, #0369a1 0%, #0891b2 100%);
		color: white;
		font-size: 15px;
		font-weight: 700;
		border: none;
		border-radius: 10px;
		padding: 13px 16px;
		cursor: pointer;
		transition: opacity 0.15s;
	}

	.nc-logout:hover {
		opacity: 0.9;
	}

	/* ── Textures (applied to nc-hero) ──
	   Each texture class must include var(--skin-gradient) as the last background-image
	   layer because background-image overrides the background shorthand set on .nc-hero.
	*/

	/* Sunny / Kids 1-2: real bubble circles with outline + inner glint */
	.texture-bubbles {
		background-image:
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Ccircle cx='22' cy='32' r='10' fill='rgba(255,255,255,0.12)' stroke='rgba(255,255,255,0.7)' stroke-width='2'/%3E%3Ccircle cx='19' cy='27' r='3' fill='rgba(255,255,255,0.6)'/%3E%3Ccircle cx='88' cy='62' r='15' fill='rgba(255,255,255,0.1)' stroke='rgba(255,255,255,0.55)' stroke-width='2'/%3E%3Ccircle cx='84' cy='56' r='4' fill='rgba(255,255,255,0.45)'/%3E%3Ccircle cx='52' cy='97' r='8' fill='rgba(255,255,255,0.1)' stroke='rgba(255,255,255,0.6)' stroke-width='1.5'/%3E%3Ccircle cx='50' cy='93' r='2' fill='rgba(255,255,255,0.5)'/%3E%3Ccircle cx='98' cy='17' r='5' fill='rgba(255,255,255,0.1)' stroke='rgba(255,255,255,0.5)' stroke-width='1.5'/%3E%3Ccircle cx='8' cy='72' r='12' fill='rgba(255,255,255,0.1)' stroke='rgba(255,255,255,0.5)' stroke-width='1.8'/%3E%3Ccircle cx='5' cy='67' r='3' fill='rgba(255,255,255,0.42)'/%3E%3Ccircle cx='62' cy='12' r='4' fill='rgba(255,255,255,0.55)' stroke='rgba(255,255,255,0.7)' stroke-width='1'/%3E%3C/svg%3E"),
			var(--skin-gradient, white);
		background-size: 120px 120px, auto;
		background-repeat: repeat, no-repeat;
	}

	/* Reef / Cobalto: double wave layer — wide slow + narrow fast */
	.texture-waves {
		background-image:
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='18' viewBox='0 0 120 18'%3E%3Cpath d='M0 9 Q30 0 60 9 Q90 18 120 9' stroke='rgba(255,255,255,0.4)' stroke-width='2.5' fill='none'/%3E%3C/svg%3E"),
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='70' height='11' viewBox='0 0 70 11'%3E%3Cpath d='M0 5.5 Q17.5 0 35 5.5 Q52.5 11 70 5.5' stroke='rgba(255,255,255,0.22)' stroke-width='1.5' fill='none'/%3E%3C/svg%3E"),
			var(--skin-gradient, white);
		background-size: 120px 18px, 70px 11px, auto;
		background-repeat: repeat, repeat, no-repeat;
	}

	/* Ocean / Midnight: grid + diagonal light rays from surface */
	.texture-deep-water {
		background-image:
			linear-gradient(168deg, rgba(255,255,255,0.22) 0%, transparent 38%),
			linear-gradient(182deg, rgba(255,255,255,0.14) 0%, transparent 32%),
			linear-gradient(173deg, rgba(255,255,255,0.1) 0%, transparent 28%),
			linear-gradient(180deg, rgba(255,255,255,0.06) 1px, transparent 1px),
			linear-gradient(90deg,  rgba(255,255,255,0.04) 1px, transparent 1px),
			var(--skin-gradient, white);
		background-size: auto, auto, auto, 32px 32px, 32px 32px, auto;
	}

	/* Hi-Tech (level default): subtle grid for light backgrounds */
	.texture-mesh {
		background-image:
			radial-gradient(circle at 50% 0%, rgba(0,200,255,0.12) 0%, transparent 60%),
			linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px),
			linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px),
			var(--skin-gradient, white);
		background-size: auto, 20px 20px, 20px 20px, auto;
	}

	/* Speed lines (level default adults intermediate) */
	.texture-speed-lines {
		background-image:
			repeating-linear-gradient(
				-48deg,
				transparent,
				transparent 10px,
				rgba(255,255,255,0.14) 10px,
				rgba(255,255,255,0.14) 11px
			),
			repeating-linear-gradient(
				-48deg,
				transparent,
				transparent 22px,
				rgba(255,255,255,0.08) 22px,
				rgba(255,255,255,0.08) 24px
			),
			var(--skin-gradient, white);
	}

	/* Carbon (level default elite) */
	.texture-carbon {
		background-image:
			repeating-linear-gradient(
				45deg,
				transparent,
				transparent 4px,
				rgba(255,255,255,0.14) 4px,
				rgba(255,255,255,0.14) 5px
			),
			repeating-linear-gradient(
				-45deg,
				transparent,
				transparent 4px,
				rgba(255,255,255,0.14) 4px,
				rgba(255,255,255,0.14) 5px
			),
			radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.35) 0%, transparent 65%),
			var(--skin-gradient, white);
	}

	/* Hi-Tech custom skin: hexagonal honeycomb grid + glow */
	.texture-hitech {
		background-color: #F0F9FF;
		background-image:
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='32'%3E%3Cpath d='M28,2 L40,9 L40,23 L28,30 L16,23 L16,9 Z' fill='rgba(0,180,255,0.04)' stroke='rgba(0,100,180,0.45)' stroke-width='1'/%3E%3C/svg%3E"),
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='32'%3E%3Cpath d='M28,2 L40,9 L40,23 L28,30 L16,23 L16,9 Z' fill='rgba(0,180,255,0.04)' stroke='rgba(0,100,180,0.45)' stroke-width='1'/%3E%3C/svg%3E"),
			radial-gradient(ellipse at 50% 30%, rgba(0,180,255,0.22) 0%, transparent 60%),
			var(--skin-gradient, white);
		background-size: 56px 32px, 56px 32px, auto, auto;
		background-position: 0 0, 28px 16px, 0 0, 0 0;
		background-repeat: repeat, repeat, no-repeat, no-repeat;
	}

	/* Vortex: perspective whirlpool — tilted ellipses converging to a glowing core */
	.texture-vortex {
		background-image:
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cellipse cx='100' cy='100' rx='88' ry='34' fill='none' stroke='rgba(0,200,255,0.35)' stroke-width='1.5' transform='rotate(-15 100 100)'/%3E%3Cellipse cx='100' cy='100' rx='70' ry='27' fill='none' stroke='rgba(0,200,255,0.45)' stroke-width='1.5' transform='rotate(-10 100 100)'/%3E%3Cellipse cx='100' cy='100' rx='53' ry='21' fill='none' stroke='rgba(0,200,255,0.56)' stroke-width='1.5' transform='rotate(-5 100 100)'/%3E%3Cellipse cx='100' cy='100' rx='37' ry='15' fill='none' stroke='rgba(0,200,255,0.68)' stroke-width='2'/%3E%3Cellipse cx='100' cy='100' rx='22' ry='9' fill='none' stroke='rgba(0,210,255,0.8)' stroke-width='2'/%3E%3Cellipse cx='100' cy='100' rx='10' ry='4' fill='none' stroke='rgba(0,220,255,0.9)' stroke-width='2'/%3E%3Ccircle cx='100' cy='100' r='3' fill='rgba(0,235,255,0.95)'/%3E%3C/svg%3E"),
			radial-gradient(circle at 50% 50%, rgba(0,200,255,0.3) 0%, transparent 50%),
			var(--skin-gradient, black);
		background-size: cover, auto, auto;
		background-position: center, 0 0, 0 0;
		background-repeat: no-repeat, no-repeat, no-repeat;
		box-shadow: inset 0 0 0 1.5px rgba(0,200,255,0.7), inset 0 0 30px rgba(0,86,145,0.5);
	}

	/* Abyssal: metallic blue shimmer bands — "Final Boss" */
	.texture-abyssal {
		background-image:
			/* primary diagonal metallic highlight */
			linear-gradient(118deg,
				transparent 28%,
				rgba(0,86,145,0.55) 44%,
				rgba(0,200,255,0.3) 50%,
				rgba(0,86,145,0.55) 56%,
				transparent 72%
			),
			/* secondary offset band */
			linear-gradient(62deg,
				transparent 15%,
				rgba(0,86,145,0.35) 38%,
				rgba(0,150,200,0.2) 48%,
				transparent 68%
			),
			/* top-right corner glow */
			radial-gradient(ellipse at 85% 10%, rgba(0,200,255,0.25) 0%, transparent 40%),
			/* bottom-left corner depth */
			radial-gradient(ellipse at 15% 90%, rgba(0,86,145,0.45) 0%, transparent 38%),
			var(--skin-gradient, black);
		box-shadow: inset 0 0 60px rgba(0,20,60,0.9), inset 0 0 0 1px rgba(0,200,255,0.15);
	}

	/* Océano: fish-scale / mermaid-scale scallop arches — bright shallow water */
	.texture-ocean {
		background-image:
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='25'%3E%3Cpath d='M0,25 Q25,-4 50,25' fill='none' stroke='rgba(255,255,255,0.52)' stroke-width='2'/%3E%3C/svg%3E"),
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='25'%3E%3Cpath d='M0,25 Q25,-4 50,25' fill='none' stroke='rgba(255,255,255,0.28)' stroke-width='1.2'/%3E%3C/svg%3E"),
			linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 38%),
			var(--skin-gradient, white);
		background-size: 50px 25px, 50px 25px, auto, auto;
		background-position: 0 0, 25px 12px, 0 0, 0 0;
		background-repeat: repeat, repeat, no-repeat, no-repeat;
	}

	/* Medianoche: bioluminescent particles floating in the deep */
	.texture-midnight {
		background-image:
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Ccircle cx='15' cy='22' r='1.5' fill='rgba(0,200,255,0.8)'/%3E%3Ccircle cx='45' cy='8' r='1' fill='rgba(0,200,255,0.65)'/%3E%3Ccircle cx='78' cy='38' r='2' fill='rgba(0,210,255,0.75)'/%3E%3Ccircle cx='92' cy='73' r='1' fill='rgba(100,220,255,0.6)'/%3E%3Ccircle cx='33' cy='62' r='1.5' fill='rgba(0,200,255,0.7)'/%3E%3Ccircle cx='65' cy='52' r='1' fill='rgba(0,200,255,0.65)'/%3E%3Ccircle cx='8' cy='88' r='1.5' fill='rgba(0,170,220,0.75)'/%3E%3Ccircle cx='55' cy='84' r='1' fill='rgba(0,200,255,0.55)'/%3E%3Ccircle cx='88' cy='12' r='1.5' fill='rgba(0,200,255,0.7)'/%3E%3Ccircle cx='28' cy='95' r='1' fill='rgba(100,220,255,0.5)'/%3E%3Ccircle cx='72' cy='28' r='1' fill='rgba(0,200,255,0.6)'/%3E%3C/svg%3E"),
			repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,100,200,0.1) 40px, rgba(0,100,200,0.1) 41px),
			radial-gradient(ellipse at 60% 40%, rgba(0,80,160,0.35) 0%, transparent 55%),
			var(--skin-gradient, white);
		background-size: 100px 100px, auto, auto, auto;
		background-repeat: repeat, repeat, no-repeat, no-repeat;
	}

	/* Botón campana – espejo del flip-btn, en la esquina opuesta */
	.bell-btn {
		position: absolute;
		top: 20px;
		left: 20px;
		background: var(--bg-icon);
		border: none;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		cursor: pointer;
		font-size: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 20;
		color: var(--text-muted);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s, box-shadow 0.2s;
		-webkit-backface-visibility: hidden;
		backface-visibility: hidden;
	}

	.bell-btn:hover {
		transform: scale(1.08);
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
	}

	.bell-btn.has-unread {
		background: linear-gradient(135deg, #4285f4 0%, #3b82f6 100%);
		color: white;
		box-shadow: 0 4px 14px rgba(66, 133, 244, 0.45);
		animation: pulse-attention 2s infinite;
	}

	.bell-unread-dot {
		position: absolute;
		top: -4px;
		right: -4px;
		min-width: 16px;
		height: 16px;
		background: #ff4444;
		border: 2px solid white;
		border-radius: 8px;
		font-size: 9px;
		font-weight: 700;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 3px;
		line-height: 1;
	}

	/* Hide bell btn when card is flipped */
	.card-inner.is-flipped .card-front .bell-btn {
		opacity: 0;
		pointer-events: none;
		transition: opacity 0s 0s, transform 0.2s;
	}

	/* Edit button */
	.edit-btn {
		position: absolute;
		top: 68px;
		right: 20px;
		background: var(--bg-icon);
		border: none;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 20;
		color: var(--text-muted);
		box-shadow: 0 2px 8px rgba(0,0,0,0.10);
		transition: transform 0.2s, box-shadow 0.2s, background 0.2s, color 0.2s;
		-webkit-backface-visibility: hidden;
		backface-visibility: hidden;
	}
	.edit-btn:hover { transform: scale(1.08); box-shadow: 0 4px 14px rgba(0,0,0,0.15); }
	.edit-btn-active {
		background: var(--primary-blue);
		color: white;
		box-shadow: 0 4px 14px rgba(66,133,244,0.45);
	}
	.card-inner.is-flipped .card-front .edit-btn { opacity: 0; pointer-events: none; }

	/* Hero drag zone highlight */
	.nc-hero-edit {
		box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.5);
	}
	.drag-zone-hint {
		position: absolute;
		bottom: 7px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(0, 0, 0, 0.4);
		color: rgba(255, 255, 255, 0.95);
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.3px;
		padding: 3px 10px;
		border-radius: 20px;
		pointer-events: none;
		z-index: 13;
		white-space: nowrap;
	}

	/* Edit bottom sheet */
	.edit-panel {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 30;
		background: white;
		border-radius: 20px 20px 0 0;
		padding: 8px 16px 0;
		box-shadow: 0 -8px 32px rgba(0,0,0,0.18);
		animation: slide-up 0.25s cubic-bezier(0.32,0.72,0,1) both;
		display: flex;
		flex-direction: column;
		max-height: 46%;
	}
	@keyframes slide-up {
		from { transform: translateY(100%); }
		to   { transform: translateY(0); }
	}
	.edit-panel-handle {
		width: 36px;
		height: 4px;
		background: #e2e8f0;
		border-radius: 2px;
		margin: 0 auto 10px;
	}
	.edit-panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: 0 0 12px;
	}
	.edit-panel-title {
		font-size: 14px;
		font-weight: 700;
		color: #1e293b;
		margin: 0;
	}
	.edit-panel-close {
		background: var(--primary-blue);
		border: none;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 700;
		color: white;
		cursor: pointer;
		padding: 5px 14px;
		line-height: 1;
	}
	/* Tab bar */
	.edit-tabs {
		display: flex;
		gap: 4px;
		margin-bottom: 2px;
		border-bottom: 1.5px solid #f1f5f9;
		flex-shrink: 0;
	}
	.edit-tab {
		flex: 1;
		background: none;
		border: none;
		padding: 7px 4px;
		font-size: 12px;
		font-weight: 500;
		color: #94a3b8;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		margin-bottom: -1.5px;
		transition: color 0.15s, border-color 0.15s;
		white-space: nowrap;
	}
	.edit-tab-active {
		color: var(--primary-blue);
		border-bottom-color: var(--primary-blue);
		font-weight: 700;
	}
	/* Scrollable tab body */
	.edit-tab-body {
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		padding: 10px 4px 20px;
		margin: 0 -4px;
		flex: 1;
	}
	.sticker-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.sticker-thumb {
		position: relative;
		width: 52px;
		height: 52px;
		border-radius: 12px;
		border: 2px solid #e2e8f0;
		background: #f8fafc;
		cursor: pointer;
		padding: 4px;
		transition: border-color 0.15s, transform 0.15s, opacity 0.15s;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.sticker-thumb img { width: 100%; height: 100%; object-fit: contain; }
	.sticker-thumb-active {
		border-color: var(--primary-blue);
		background: #eff6ff;
		transform: scale(1.06);
	}
	.sticker-thumb-limit { opacity: 0.38; cursor: not-allowed; }
	.sticker-check {
		position: absolute;
		bottom: -5px;
		right: -5px;
		width: 16px;
		height: 16px;
		background: var(--primary-blue);
		color: white;
		border-radius: 50%;
		font-size: 9px;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1.5px solid white;
	}
	.edit-hint {
		font-size: 11px;
		color: #94a3b8;
		margin: 6px 0 0;
	}

	.skin-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.skin-swatch {
		position: relative;
		width: 56px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3px;
		border: 2px solid transparent;
		border-radius: 10px;
		background: none;
		cursor: pointer;
		padding: 2px;
		transition: border-color 0.15s, transform 0.15s, opacity 0.15s;
	}
	.skin-preview {
		display: block;
		width: 48px;
		height: 34px;
		border-radius: 7px;
		border: 1.5px solid rgba(0,0,0,0.08);
	}
	.skin-swatch-active {
		border-color: var(--primary-blue);
		transform: scale(1.06);
	}
	.skin-swatch-locked {
		opacity: 0.38;
		cursor: not-allowed;
	}
	.skin-label {
		font-size: 9px;
		font-weight: 500;
		color: #64748b;
		line-height: 1;
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 52px;
	}
	.skin-lock {
		position: absolute;
		top: 4px;
		right: 4px;
		font-size: 9px;
		line-height: 1;
	}

	/* ── Frame picker ── */
	.frame-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.frame-thumb {
		position: relative;
		width: 56px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3px;
		border: 2px solid transparent;
		border-radius: 10px;
		background: none;
		cursor: pointer;
		padding: 2px;
		transition: border-color 0.15s, transform 0.15s, opacity 0.15s;
	}
	.frame-preview {
		display: block;
		width: 44px;
		height: 32px;
		border-radius: 7px;
		border: 3px solid currentColor;
		background: #f8fafc;
	}
	.frame-preview-none {
		border: 2px dashed #cbd5e1;
		background: transparent;
	}
	.frame-thumb-active {
		border-color: var(--primary-blue);
		transform: scale(1.06);
	}
	.frame-thumb-locked {
		opacity: 0.38;
		cursor: not-allowed;
	}
	.frame-label {
		font-size: 9px;
		font-weight: 500;
		color: #64748b;
		line-height: 1;
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 52px;
	}
	.frame-lock {
		position: absolute;
		top: 4px;
		right: 4px;
		font-size: 9px;
		line-height: 1;
	}
	/* Frame animation classes are defined in app.css (global scope)
	   to avoid Svelte hashing @keyframes names. */


	.flip-btn {
		position: absolute;
		top: 20px;
		right: 20px;
		background: var(--bg-icon);
		border: none;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		cursor: pointer;
		font-size: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 20;
		color: var(--primary-blue);
		box-shadow: 0 4px 12px rgba(66, 133, 244, 0.25);
		transition:
			transform 0.2s,
			opacity 0s 0.4s;
		opacity: 1;
		-webkit-backface-visibility: hidden;
		backface-visibility: hidden;
		animation: pulse-attention 2s infinite;
	}

	/* Botón de flip con notificaciones */
	.flip-btn.has-notifications {
		background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
		color: white;
		box-shadow: 0 4px 16px rgba(66, 133, 244, 0.5);
		animation: bounce-attention 1s ease-in-out infinite;
	}

	.flip-btn.has-notifications:hover {
		transform: scale(1.1);
		box-shadow: 0 6px 20px rgba(66, 133, 244, 0.6);
	}

	/* Punto de notificación en el botón */
	.notification-dot {
		position: absolute;
		top: -2px;
		right: -2px;
		width: 12px;
		height: 12px;
		background: #ff4444;
		border: 2px solid white;
		border-radius: 50%;
		animation: pulse-dot 1.5s ease-in-out infinite;
	}

	/* Banner Teaser */
	.teaser-banner {
		position: absolute;
		bottom: 16px;
		left: 16px;
		right: 16px;
		background: rgba(66, 133, 244, 0.95);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border: none;
		padding: 12px 16px;
		border-radius: 16px;
		display: flex;
		align-items: center;
		gap: 10px;
		cursor: pointer;
		z-index: 15;
		box-shadow: 0 8px 24px rgba(66, 133, 244, 0.4);
		transition: all 0.3s ease;
		animation: slide-up 0.5s ease-out;
	}

	.teaser-banner:hover {
		transform: translateY(-2px);
		box-shadow: 0 12px 32px rgba(66, 133, 244, 0.5);
		background: rgba(66, 133, 244, 1);
	}

	.teaser-banner:active {
		transform: translateY(0);
	}

	.teaser-icon {
		font-size: 20px;
		animation: spin-subtle 3s linear infinite;
	}

	.teaser-text {
		flex: 1;
		color: white;
		font-size: 13px;
		font-weight: 600;
		text-align: left;
		line-height: 1.3;
	}

	.teaser-points {
		display: block;
		font-size: 11px;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.8);
		margin-top: 2px;
	}

	.teaser-chevron {
		font-size: 24px;
		color: white;
		font-weight: 700;
	}

	/* Animaciones */
	@keyframes bounce-attention {
		0%, 100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.05);
		}
	}

	@keyframes pulse-dot {
		0%, 100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.2);
			opacity: 0.8;
		}
	}

	@keyframes slide-up {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes spin-subtle {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.help-tour-btn {
		position: fixed;
		bottom: 20px;
		right: 20px;
		background: #4285f4;
		border: none;
		width: 56px;
		height: 56px;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 999;
		color: white;
		box-shadow: 0 4px 16px rgba(66, 133, 244, 0.4);
		transition: all 0.3s ease;
	}

	.help-tour-btn:hover {
		background: #3c78d8;
		transform: translateY(-2px) scale(1.05);
		box-shadow: 0 6px 20px rgba(66, 133, 244, 0.5);
	}

	.help-tour-btn:active {
		transform: translateY(0) scale(0.98);
	}

	@keyframes pulse-attention {
		0% {
			box-shadow: 0 0 0 0 rgba(66, 133, 244, 0.4);
		}
		70% {
			box-shadow: 0 0 0 8px rgba(66, 133, 244, 0);
		}
		100% {
			box-shadow: 0 0 0 0 rgba(66, 133, 244, 0);
		}
	}

	.card-inner.is-flipped .card-front .flip-btn {
		opacity: 0;
		pointer-events: none;
		transition:
			opacity 0s 0s,
			transform 0.2s;
	}

	.card-inner.is-flipped .card-front .teaser-banner {
		opacity: 0;
		pointer-events: none;
		transition: opacity 0s 0s;
	}

	.stamp {
		transform: rotate(12deg);
		color: #555;
		font-size: 3rem;
		font-weight: 700;
		border: 0.25rem solid #555;
		display: inline-block;
		padding: 0.25rem 1rem;
		text-transform: uppercase;
		border-radius: 1rem;
		font-family: 'Courier';
		-webkit-mask-image: url('https://s3-us-west-2.amazonaws.com/s.cdpn.io/8399/grunge.png');
		-webkit-mask-size: 944px 604px;
		mix-blend-mode: multiply;
	}

	.is-nope {
		color: #d23;
		border: 0.5rem double #d23;
		transform: rotate(12deg);
		-webkit-mask-position: 2rem 3rem;
		font-size: 4rem;
	}
</style>
