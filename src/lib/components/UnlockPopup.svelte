<script>
	import { createEventDispatcher } from 'svelte';

	/**
	 * Unlock-reward popup with a Y-axis 360° flip animation on the card graphic.
	 * @prop {boolean} visible       - Whether to show the popup
	 * @prop {string}  message       - meta_game.unlock_message text
	 * @prop {string}  levelIcon     - Current level emoji icon
	 * @prop {string}  levelName     - Current level name
	 */
	export let visible = false;
	export let message = '';
	export let levelIcon = '🏆';
	export let levelName = '';

	const dispatch = createEventDispatcher();

	function dismiss() {
		dispatch('dismiss');
	}

	function handleKeyDown(e) {
		if (e.key === 'Escape') dismiss();
	}
</script>

{#if visible}
	<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
	<div
		class="unlock-overlay"
		role="dialog"
		aria-modal="true"
		aria-label="Recompensa desbloqueada"
		on:keydown={handleKeyDown}
	>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="unlock-backdrop" on:click={dismiss}></div>

		<div class="unlock-card">
			<!-- Animated card graphic -->
			<div class="unlock-coin">
				<span class="unlock-icon-inner">{levelIcon}</span>
			</div>

			<div class="unlock-sparkles" aria-hidden="true">
				<span class="spark s1">✦</span>
				<span class="spark s2">✦</span>
				<span class="spark s3">✦</span>
				<span class="spark s4">★</span>
			</div>

			<h3 class="unlock-title">¡Recompensa Desbloqueada!</h3>

			{#if levelName}
				<p class="unlock-sublabel">Nivel {levelName}</p>
			{/if}

			<p class="unlock-message">{message}</p>

			<button class="unlock-btn" on:click={dismiss}>
				¡Genial! 🎉
			</button>
		</div>
	</div>
{/if}

<style>
	.unlock-overlay {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
	}

	.unlock-backdrop {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.72);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
		cursor: pointer;
	}

	.unlock-card {
		position: relative;
		background: linear-gradient(145deg, #1e1b4b 0%, #2d1b69 50%, #0f0f23 100%);
		border: 1px solid rgba(168, 85, 247, 0.4);
		border-radius: 24px;
		padding: 36px 28px 28px;
		text-align: center;
		max-width: 300px;
		width: 88%;
		box-shadow:
			0 0 0 1px rgba(168, 85, 247, 0.2),
			0 0 40px rgba(168, 85, 247, 0.25),
			0 24px 60px rgba(0, 0, 0, 0.5);
		animation: slide-in 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
		perspective: 600px;
	}

	@keyframes slide-in {
		from {
			opacity: 0;
			transform: scale(0.7) translateY(30px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	/* 360° Y-axis flip on the coin icon */
	.unlock-coin {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 80px;
		height: 80px;
		border-radius: 50%;
		background: linear-gradient(135deg, #7c3aed, #a855f7);
		box-shadow: 0 0 24px rgba(168, 85, 247, 0.5);
		margin-bottom: 16px;
		animation: coin-flip 1s cubic-bezier(0.455, 0.03, 0.515, 0.955) 0.1s both;
	}

	@keyframes coin-flip {
		0%   { transform: rotateY(0deg);   }
		50%  { transform: rotateY(180deg); }
		100% { transform: rotateY(360deg); }
	}

	.unlock-icon-inner {
		font-size: 36px;
		line-height: 1;
	}

	/* Sparkle particles */
	.unlock-sparkles {
		position: absolute;
		top: 24px;
		left: 50%;
		transform: translateX(-50%);
		width: 100px;
		height: 80px;
		pointer-events: none;
	}

	.spark {
		position: absolute;
		font-size: 12px;
		color: #fbbf24;
		animation: spark-fade 1.2s ease-out both;
	}

	.s1 { top: 0;   left: 10px;  animation-delay: 0.2s; }
	.s2 { top: 5px; right: 10px; animation-delay: 0.35s; }
	.s3 { top: 20px; left: 5px;  animation-delay: 0.5s; }
	.s4 { top: 8px;  left: 40%;  animation-delay: 0.15s; font-size: 16px; color: #f59e0b; }

	@keyframes spark-fade {
		from { opacity: 0; transform: scale(0) translateY(0); }
		40%  { opacity: 1; transform: scale(1.2) translateY(-10px); }
		to   { opacity: 0; transform: scale(0.5) translateY(-24px); }
	}

	.unlock-title {
		color: #f1f5f9;
		font-size: 18px;
		font-weight: 800;
		margin: 0 0 4px;
		letter-spacing: -0.3px;
	}

	.unlock-sublabel {
		color: rgba(168, 85, 247, 0.8);
		font-size: 12px;
		font-weight: 600;
		margin: 0 0 12px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.unlock-message {
		color: #cbd5e1;
		font-size: 14px;
		line-height: 1.5;
		margin: 0 0 24px;
	}

	.unlock-btn {
		background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
		color: white;
		border: none;
		padding: 12px 28px;
		border-radius: 14px;
		font-weight: 700;
		font-size: 15px;
		cursor: pointer;
		box-shadow: 0 4px 16px rgba(168, 85, 247, 0.4);
		transition: transform 0.15s, box-shadow 0.15s;
	}

	.unlock-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 6px 20px rgba(168, 85, 247, 0.55);
	}

	.unlock-btn:active {
		transform: translateY(0);
	}
</style>
