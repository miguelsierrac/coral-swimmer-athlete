<script>
	/**
	 * Renders decorative stickers positioned absolutely over the card.
	 * Each sticker: { id: string, top: number, left: number, rotate?: number }
	 * Images expected at /stickers/{id}.png (or .webp/.svg).
	 * Falls back gracefully if the image 404s (hidden via onerror).
	 */
	export let stickers = [];
</script>

{#each stickers as sticker (sticker.id + sticker.top + sticker.left)}
	<img
		src="/stickers/{sticker.id}.svg"
		alt=""
		role="presentation"
		aria-hidden="true"
		class="sticker"
		style="
			top: {sticker.top}%;
			left: {sticker.left}%;
			transform: rotate({sticker.rotate ?? 0}deg);
		"
		on:error={(e) => {
			e.currentTarget.style.display = 'none';
		}}
	/>
{/each}

<style>
	.sticker {
		position: absolute;
		width: 44px;
		height: 44px;
		object-fit: contain;
		pointer-events: none;
		user-select: none;

		/* Simulate physically-stuck sticker */
		filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.35));
		z-index: 12;

		/* Subtle entrance animation */
		animation: sticker-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
	}

	@keyframes sticker-pop {
		from {
			opacity: 0;
			transform: scale(0.3) rotate(var(--r, 0deg));
		}
		to {
			opacity: 1;
			transform: scale(1) rotate(var(--r, 0deg));
		}
	}
</style>
