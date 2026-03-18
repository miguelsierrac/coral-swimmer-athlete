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
	import { getCardSkin } from '$lib/utils/cardSkin.js';
	import CardStickers from '$lib/components/CardStickers.svelte';

	// Fixed slots on the hero zone (top/left as % of card-face)
	const STICKER_SLOTS = [
		{ top: 37, left: 4,  rotate: -14 },
		{ top: 37, left: 78, rotate:  10 },
		{ top: 10, left: 78, rotate:  -8 },
		{ top: 10, left: 4,  rotate:  12 },
		{ top: 23, left: 80, rotate:  -4 },
	];

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

	// active sticker IDs chosen by the user (null = not yet initialised from storage)
	let activeStickerIds = null;

	// Initialise once athlete + completedBadges are ready
	$: if (athlete?.id && completedBadges && activeStickerIds === null) {
		const saved = loadCustom(athlete.id);
		if (saved?.stickers) {
			activeStickerIds = saved.stickers;
		} else {
			// First time: all earned stickers active by default
			activeStickerIds = allEarnedStickerFiles;
		}
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
		saveCustom(athlete.id, { stickers: activeStickerIds });
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

	$: skin = getCardSkin(level?.id ?? null);

	// Build radar stats by accumulating radar_stats from every completed objective across all levels
	$: radarStats = (() => {
		if (!gamificationProgress?.progreso_objetivos || !gamificationLevels?.length) return null;
		const completedIds = Object.keys(gamificationProgress.progreso_objetivos).filter(
			id => gamificationProgress.progreso_objetivos[id]
		);
		if (!completedIds.length) return null;
		const allObjectives = gamificationLevels.flatMap(l => l.objetivos ?? []);
		const acc = {};
		for (const id of completedIds) {
			const obj = allObjectives.find(o => o.id === id);
			const stats = obj?.meta_game?.radar_stats;
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

	// All unique sticker file IDs the user has earned
	$: allEarnedStickerFiles = (() => {
		const seen = new Set();
		const result = [];
		for (const badge of completedBadges) {
			const rewardId = badge.meta_game?.reward?.id;
			if (!rewardId || badge.meta_game?.reward?.tipo !== 'sticker') continue;
			const file = rewardId.replace(/^sticker_/, '');
			if (seen.has(file)) continue;
			seen.add(file);
			result.push(file);
		}
		return result;
	})();

	// Stickers to render on the card = active ones, positioned in STICKER_SLOTS
	$: displayedStickers = (activeStickerIds ?? allEarnedStickerFiles)
		.slice(0, STICKER_SLOTS.length)
		.map((fileId, i) => ({ id: fileId, ...STICKER_SLOTS[i] }));
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
		<div class="card-scene">
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
							on:click={() => (isFlipped = !isFlipped)}
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

						<!-- ── HERO: avatar + identity on gradient ── -->
						<div class="nc-hero {skin.textureClass}" class:nc-hero-dark={skin.isDark} style="--skin-gradient:{skin.gradient}">
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
						<CardStickers stickers={displayedStickers} {isEditMode} />
					{/if}

					<!-- Panel de edición -->
					{#if isEditMode}
						<!-- Backdrop para cerrar -->
						<button class="edit-backdrop" on:click={toggleEditMode} aria-label="Cerrar editor" />

						<div class="edit-panel">
							<div class="edit-panel-handle"></div>
							<p class="edit-panel-title">✏️ Personalizar Carnet</p>

							<section class="edit-section">
								<h4 class="edit-section-title">🏷️ Mis Stickers</h4>
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
												src="/stickers/{fileId}.svg"
												alt={fileId}
												on:error={(e) => { e.currentTarget.style.display = 'none'; }}
											/>
											{#if active}
												<span class="sticker-check">✓</span>
											{/if}
										</button>
									{/each}
								</div>
								<p class="edit-hint">{(activeStickerIds ?? []).length}/{STICKER_SLOTS.length} activos</p>
							</section>
						</div>
					{/if}
					<!-- Banner Teaser -->
					{#if hasNewAchievements && athlete.tier !== 'standard'}
						<button 
							class="teaser-banner"
							on:click={() => (isFlipped = !isFlipped)}
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
						on:flip={() => (isFlipped = !isFlipped)}
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

	.texture-bubbles {
		background-image:
			radial-gradient(circle at 20% 30%, rgba(255,255,255,0.28) 0%, transparent 40%),
			radial-gradient(circle at 75% 60%, rgba(255,255,255,0.22) 0%, transparent 35%),
			radial-gradient(circle at 50% 85%, rgba(255,255,255,0.2) 0%, transparent 30%),
			radial-gradient(circle at 85% 18%, rgba(255,255,255,0.18) 0%, transparent 25%),
			radial-gradient(circle at 10% 72%, rgba(255,255,255,0.22) 0%, transparent 28%),
			var(--skin-gradient, white);
	}

	.texture-waves {
		background-image:
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='20' viewBox='0 0 100 20'%3E%3Cpath d='M0 10 Q25 0 50 10 Q75 20 100 10' stroke='rgba(255,255,255,0.25)' stroke-width='2' fill='none'/%3E%3C/svg%3E"),
			var(--skin-gradient, white);
		background-size: 100px 20px, auto;
		background-repeat: repeat, no-repeat;
	}

	.texture-deep-water {
		background-image:
			linear-gradient(180deg, rgba(255,255,255,0.09) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px),
			var(--skin-gradient, white);
		background-size: 30px 30px, 30px 30px, auto;
	}

	.texture-mesh {
		background-image:
			linear-gradient(rgba(0,0,0,0.07) 1px, transparent 1px),
			linear-gradient(90deg, rgba(0,0,0,0.07) 1px, transparent 1px),
			var(--skin-gradient, white);
		background-size: 20px 20px, 20px 20px, auto;
	}

	.texture-speed-lines {
		background-image:
			repeating-linear-gradient(
				-45deg,
				transparent,
				transparent 8px,
				rgba(255,255,255,0.1) 8px,
				rgba(255,255,255,0.1) 9px
			),
			var(--skin-gradient, white);
	}

	.texture-carbon {
		background-image:
			repeating-linear-gradient(
				45deg,
				transparent,
				transparent 3px,
				rgba(255,255,255,0.12) 3px,
				rgba(255,255,255,0.12) 4px
			),
			repeating-linear-gradient(
				-45deg,
				transparent,
				transparent 3px,
				rgba(255,255,255,0.12) 3px,
				rgba(255,255,255,0.12) 4px
			),
			var(--skin-gradient, white);
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

	/* Edit panel backdrop */
	.edit-backdrop {
		position: absolute;
		inset: 0;
		z-index: 29;
		background: rgba(0,0,0,0.25);
		border: none;
		cursor: pointer;
		border-radius: 24px;
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
		padding: 8px 16px 24px;
		box-shadow: 0 -8px 32px rgba(0,0,0,0.18);
		animation: slide-up 0.25s cubic-bezier(0.32,0.72,0,1) both;
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
	.edit-panel-title {
		font-size: 14px;
		font-weight: 700;
		color: #1e293b;
		margin: 0 0 12px;
		text-align: center;
	}
	.edit-section { margin-bottom: 4px; }
	.edit-section-title {
		font-size: 12px;
		font-weight: 600;
		color: #64748b;
		margin: 0 0 8px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
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
