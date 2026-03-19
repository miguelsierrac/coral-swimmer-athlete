<script>
	import { createEventDispatcher } from 'svelte';
	import { trackWhatsNewShown, trackWhatsNewDismissed } from '$lib/infrastructure/AnalyticsService.js';

	export let visible = false;

	const dispatch = createEventDispatcher();
	const STORAGE_KEY = 'whats_new_v2_seen';

	let neverShowAgain = false;
	let currentSlide = 0;

	$: if (visible) { currentSlide = 0; trackWhatsNewShown(); }

	function close() {
		trackWhatsNewDismissed(neverShowAgain);
		if (neverShowAgain) {
			try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
		}
		dispatch('close');
	}

	function nextSlide() {
		currentSlide = 1;
	}

	function handleKeyDown(e) {
		if (e.key === 'Escape') close();
		if (e.key === 'ArrowRight' && currentSlide === 0) nextSlide();
	}

	const slides = [
		{
			badge: '¡Novedad!',
			title: 'Bitácora de Entrenamiento',
			subtitle: 'Registra tus sesiones directamente desde tu carnet. Toca el pill <strong style="color:#e2e8f0">＋ Bitácora</strong> en la tarjeta de Kilometraje Acumulado para comenzar.',
			features: [
				{
					emoji: '⚡',
					title: 'Registro rápido',
					desc: 'Anota el volumen total de tu sesión en segundos para que el entrenador lo valide.'
				},
				{
					emoji: '📋',
					title: 'Registro detallado',
					desc: 'Describe cada serie con repeticiones, distancia y estilo para un seguimiento más preciso.'
				},
				{
					emoji: '🏆',
					title: 'Gana puntos por entrenar',
					desc: 'Cada sesión validada te otorga puntos de experiencia. ¡Más entrenas, más subes de nivel!'
				}
			]
		},
		{
			badge: 'También nuevo',
			title: 'Personaliza tu Carnet',
			subtitle: 'Nuevas recompensas desbloqueables para hacer único tu carnet de atleta. Toca el ícono <strong style="color:#e2e8f0">✏️</strong> en tu carnet para personalizar.',
			features: [
				{
					emoji: '🎨',
					title: 'Fondos personalizados',
					desc: 'Desbloquea fondos exclusivos completando objetivos y cámbialos desde el modo edición de tu carnet.'
				},
				{
					emoji: '🖼️',
					title: 'Bordes de carnet',
					desc: 'Gana bordes únicos como recompensa y elige el que más te identifique para decorar tu carnet.'
				},
				{
					emoji: '✨',
					title: 'Stickers coleccionables',
					desc: 'Cada logro que completes puede premiarte con un sticker. ¡Colecciónalos y pégalos en tu carnet!'
				}
			]
		}
	];

	$: slide = slides[currentSlide];
</script>

{#if visible}
	<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
	<div
		class="wn-overlay"
		role="dialog"
		aria-modal="true"
		aria-label="Novedades"
		on:keydown={handleKeyDown}
	>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="wn-backdrop" on:click={close}></div>

		<div class="wn-card">
			<button class="wn-close" on:click={close} aria-label="Cerrar">✕</button>

			<div class="wn-dots">
				{#each slides as _, i}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<span
						class="wn-dot"
						class:wn-dot-active={i === currentSlide}
						on:click={() => { if (i < currentSlide || (i === 1 && currentSlide === 0)) { if (i === 1) nextSlide(); else currentSlide = i; } }}
					></span>
				{/each}
			</div>

			<div class="wn-slides">
				<div class="wn-slide-track" style="transform: translateX(-{currentSlide * 100}%)">
					{#each slides as s}
						<div class="wn-slide">
							<div class="wn-header">
								<span class="wn-badge">{s.badge}</span>
								<h2 class="wn-title">{s.title}</h2>
								<p class="wn-subtitle">{@html s.subtitle}</p>
							</div>

							<ul class="wn-features">
								{#each s.features as f}
									<li class="wn-feature">
										<span class="wn-feature-emoji">{f.emoji}</span>
										<div>
											<strong class="wn-feature-title">{f.title}</strong>
											<p class="wn-feature-desc">{f.desc}</p>
										</div>
									</li>
								{/each}
							</ul>
						</div>
					{/each}
				</div>
			</div>

			<div class="wn-footer">
				{#if currentSlide === slides.length - 1}
					<label class="wn-checkbox-label">
						<input type="checkbox" bind:checked={neverShowAgain} />
						<span>No volver a mostrar</span>
					</label>
					<button class="wn-btn" on:click={close}>¡Entendido! 🚀</button>
				{:else}
					<button class="wn-btn wn-btn-next" on:click={nextSlide}>Siguiente →</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.wn-overlay {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10000;
		padding: 16px;
	}

	.wn-backdrop {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
		cursor: pointer;
	}

	.wn-card {
		position: relative;
		background: linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
		border: 1px solid rgba(99, 179, 237, 0.3);
		border-radius: 24px;
		padding: 28px 24px 24px;
		max-width: 360px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow:
			0 0 0 1px rgba(99, 179, 237, 0.15),
			0 0 48px rgba(99, 102, 241, 0.25),
			0 24px 60px rgba(0, 0, 0, 0.6);
		animation: wn-enter 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
	}

	@keyframes wn-enter {
		from { opacity: 0; transform: scale(0.8) translateY(20px); }
		to   { opacity: 1; transform: scale(1) translateY(0); }
	}

	.wn-close {
		position: absolute;
		top: 14px;
		right: 14px;
		background: rgba(255, 255, 255, 0.08);
		border: none;
		color: #94a3b8;
		width: 30px;
		height: 30px;
		border-radius: 50%;
		font-size: 13px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s, color 0.2s;
	}
	.wn-close:hover {
		background: rgba(255, 255, 255, 0.16);
		color: #f1f5f9;
	}

	.wn-header {
		text-align: center;
		margin-bottom: 20px;
	}

	.wn-badge {
		display: inline-block;
		background: linear-gradient(90deg, #6366f1, #a855f7);
		color: white;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.8px;
		text-transform: uppercase;
		padding: 3px 10px;
		border-radius: 20px;
		margin-bottom: 10px;
	}

	.wn-title {
		color: #f1f5f9;
		font-size: 20px;
		font-weight: 800;
		margin: 0 0 6px;
	}

	.wn-subtitle {
		color: #94a3b8;
		font-size: 13px;
		line-height: 1.5;
		margin: 0;
	}

	.wn-features {
		list-style: none;
		padding: 0;
		margin: 0 0 20px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.wn-feature {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 14px;
		padding: 12px 14px;
	}

	.wn-feature-emoji {
		font-size: 24px;
		line-height: 1;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.wn-feature-title {
		color: #e2e8f0;
		font-size: 14px;
		display: block;
		margin-bottom: 3px;
	}

	.wn-feature-desc {
		color: #64748b;
		font-size: 12px;
		line-height: 1.5;
		margin: 0;
	}

	.wn-footer {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 14px;
	}

	.wn-checkbox-label {
		display: flex;
		align-items: center;
		gap: 8px;
		color: #94a3b8;
		font-size: 13px;
		cursor: pointer;
		user-select: none;
	}
	.wn-checkbox-label input[type='checkbox'] {
		width: 16px;
		height: 16px;
		accent-color: #6366f1;
		cursor: pointer;
	}

	.wn-btn {
		background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
		color: white;
		border: none;
		padding: 12px 32px;
		border-radius: 14px;
		font-weight: 700;
		font-size: 15px;
		cursor: pointer;
		width: 100%;
		transition: opacity 0.2s;
	}
	.wn-btn:hover {
		opacity: 0.88;
	}
	.wn-btn-next {
		background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%);
	}

	/* ── Dots ───────────────────────────────────────────────────── */
	.wn-dots {
		display: flex;
		justify-content: center;
		gap: 7px;
		margin-bottom: 18px;
	}
	.wn-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.18);
		transition: background 0.25s, transform 0.25s;
		cursor: default;
	}
	.wn-dot-active {
		background: #6366f1;
		transform: scale(1.3);
	}

	/* ── Carousel ───────────────────────────────────────────────── */
	.wn-slides {
		overflow: hidden;
	}
	.wn-slide-track {
		display: flex;
		transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
		will-change: transform;
	}
	.wn-slide {
		min-width: 100%;
		box-sizing: border-box;
	}
</style>
