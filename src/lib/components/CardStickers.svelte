<script>
	import { createEventDispatcher } from 'svelte';

	/** @type {{ id: string, top: number, left: number, rotate?: number }[]} */
	export let stickers = [];
	/** When true, stickers are draggable */
	export let isEditMode = false;

	const dispatch = createEventDispatcher();

	let dragging = null;
	let dragTop = 0, dragLeft = 0;
	let pendingX = 0, pendingY = 0;
	let rafId = null;

	function blockScroll(e) { e.preventDefault(); }

	function onPointerDown(e, sticker) {
		if (!isEditMode) return;
		e.preventDefault();
		const cardFace = e.currentTarget.closest('.card-face') ?? e.currentTarget.parentElement;
		const { width, height } = cardFace.getBoundingClientRect();
		e.currentTarget.setPointerCapture(e.pointerId);
		dragging = { id: sticker.id, startX: e.clientX, startY: e.clientY,
			origTop: sticker.top, origLeft: sticker.left, cardW: width, cardH: height };
		dragTop  = sticker.top;
		dragLeft = sticker.left;
		window.addEventListener('touchmove', blockScroll, { passive: false });
	}

	function applyMove() {
		rafId = null;
		if (!dragging) return;
		dragTop  = Math.max(5,  Math.min(60, dragging.origTop  + (pendingY / dragging.cardH * 100)));
		dragLeft = Math.max(-8, Math.min(82, dragging.origLeft + (pendingX / dragging.cardW * 100)));
	}

	function onPointerMove(e) {
		if (!dragging) return;
		e.preventDefault();
		pendingX = e.clientX - dragging.startX;
		pendingY = e.clientY - dragging.startY;
		if (!rafId) rafId = requestAnimationFrame(applyMove);
	}

	function finishDrag() {
		if (!dragging) return;
		if (rafId) { cancelAnimationFrame(rafId); rafId = null; applyMove(); }
		dispatch('move', { id: dragging.id, top: dragTop, left: dragLeft });
		dragging = null;
		window.removeEventListener('touchmove', blockScroll);
	}
</script>

{#each stickers as sticker (sticker.id)}
	<img
		src="/stickers/{sticker.id.replace('_holo', '')}.svg"
		alt=""
		role="presentation"
		aria-hidden="true"
		class="sticker"
		class:sticker-edit={isEditMode}
		class:sticker-holo={sticker.id.includes('_holo')}
		class:sticker-dragging={dragging?.id === sticker.id}
		style="top: {dragging?.id === sticker.id ? dragTop : sticker.top}%; left: {dragging?.id === sticker.id ? dragLeft : sticker.left}%; transform: rotate({sticker.rotate ?? 0}deg);"
		on:pointerdown={(e) => onPointerDown(e, sticker)}
		on:pointermove|nonpassive={onPointerMove}
		on:pointerup={finishDrag}
		on:pointercancel={finishDrag}
		on:error={(e) => { e.currentTarget.style.display = 'none'; }}
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
		filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.35));
		z-index: 12;
		animation: sticker-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
	}

	/* Edit mode: draggable stickers */
	.sticker-edit {
		pointer-events: auto;
		cursor: grab;
		touch-action: none;
		outline: 2px dashed rgba(255, 255, 255, 0.8);
		outline-offset: 3px;
		border-radius: 4px;
	}
	.sticker-dragging {
		cursor: grabbing !important;
		z-index: 20;
		filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.6));
		animation: none;
		outline-style: solid;
	}

	/* Holographic rainbow glow for _holo stickers */
	.sticker-holo {
		animation:
			sticker-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both,
			sticker-holo-glow 2.4s 0.4s linear infinite;
	}
	/* Keep drag override working for holo stickers too */
	.sticker-holo.sticker-dragging {
		animation: none;
	}

	@keyframes sticker-holo-glow {
		0%   { filter: drop-shadow(0 2px 8px rgba(0,0,0,0.4)) hue-rotate(0deg)   saturate(1.8) brightness(1.15); }
		100% { filter: drop-shadow(0 2px 8px rgba(0,0,0,0.4)) hue-rotate(360deg) saturate(1.8) brightness(1.15); }
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
