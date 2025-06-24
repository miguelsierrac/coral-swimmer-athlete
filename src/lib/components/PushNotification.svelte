<script>
	import { toast } from '@zerodevx/svelte-toast';

	export let toastId = 0;
	export let title = '';
	export let content = '';
	export let confirmText = 'CONFIRM';
	export let cancelText = 'CANCEL';
	export let onConfirm = () => {};
	export let onCancel = () => {};

	const clicked = (/** @type {boolean} */ ok) => {
		toast.pop(toastId);
		ok ? onConfirm() : onCancel();
	};
	const accepted = () => clicked(true);
	const declined = () => clicked(false);
</script>

<div class="flex h-40 w-full flex-col bg-yellow-500 p-2">
	<div class="mb-1 flex h-6 flex-row items-center">
		<h1 class="font-bold">{title}</h1>
	</div>
	<p class="flex-1 overflow-y-scroll text-sm">{content}</p>
	<div class="flex h-10 flex-row justify-around">
		<button class="btn btn-sm" on:click={declined}>{cancelText}</button>
		<button class="btn btn-primary btn-sm" on:click={accepted} data-testid="dummyAccept"
			>{confirmText}</button
		>
	</div>
</div>
