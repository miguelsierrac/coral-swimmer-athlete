<script>
	import { createEventDispatcher } from 'svelte';
	import { getContext } from 'svelte';

	export let athleteId;
	export let visible = false;

	const dispatch = createEventDispatcher();
	const provider = getContext('provider');

	// ── State ────────────────────────────────────────────────────
	let activeTab = 'rapido'; // 'rapido' | 'detallado'
	let isSubmitting = false;
	let submitError = null;
	let submitSuccess = false;

	// Today's date formatted for the date input (YYYY-MM-DD)
	function todayInputValue() {
		const d = new Date();
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}

	let selectedDate = todayInputValue();

	// Rápido mode
	let rapido_volume = '';

	// Detallado mode – each row: { repetitions, distance, description }
	let series = [
		{ repetitions: '', distance: '', description: '' }
	];

	// ── Derived: total meters ────────────────────────────────────
	$: totalMeters = (() => {
		if (activeTab === 'rapido') {
			const v = parseInt(rapido_volume, 10);
			return isNaN(v) || v < 0 ? 0 : v;
		}
		return series.reduce((sum, row) => {
			const r = parseInt(row.repetitions, 10);
			const d = parseInt(row.distance, 10);
			if (isNaN(r) || isNaN(d) || r < 0 || d < 0) return sum;
			return sum + r * d;
		}, 0);
	})();

	// 50 pts per 1,000 metres
	$: estimatedPoints = Math.floor(totalMeters / 1000) * 50;

	// ── Helpers ──────────────────────────────────────────────────
	function addSeries() {
		series = [...series, { repetitions: '', distance: '', description: '' }];
	}

	function removeSeries(index) {
		if (series.length <= 1) return;
		series = series.filter((_, i) => i !== index);
	}

	function formatDateForAPI(inputValue) {
		// inputValue is YYYY-MM-DD, API expects DD/MM/YYYY
		const [yyyy, mm, dd] = inputValue.split('-');
		return `${dd}/${mm}/${yyyy}`;
	}

	function currentHHMM() {
		const now = new Date();
		return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
	}

	function buildEjercicios() {
		if (activeTab === 'rapido') {
			return [
				{
					descripcion: 'Distancia total',
					repeticiones: 1,
					distancia: parseInt(rapido_volume, 10) || 0,
					times: []
				}
			];
		}
		return series
			.filter(
				(row) =>
					parseInt(row.repetitions, 10) > 0 && parseInt(row.distance, 10) > 0
			)
			.map((row) => ({
				descripcion: row.description.trim() || 'Sin descripción',
				repeticiones: parseInt(row.repetitions, 10),
				distancia: parseInt(row.distance, 10),
				times: []
			}));
	}

	async function handleSubmit() {
		submitError = null;

		const ejercicios = buildEjercicios();
		if (ejercicios.length === 0 || totalMeters === 0) {
			submitError = 'Ingresa al menos una serie con distancia válida.';
			return;
		}

		isSubmitting = true;
		try {
			await provider.submitBitacora.handle({
				fecha: formatDateForAPI(selectedDate),
				hora: currentHHMM(),
				deportista: athleteId,
				ejercicios
			});
			submitSuccess = true;
			setTimeout(() => {
				close();
			}, 1800);
		} catch (err) {
			console.error('Error submitting bitacora:', err);
			submitError = 'No se pudo enviar. Intenta de nuevo.';
			isSubmitting = false;
		}
	}

	function close() {
		// Reset state
		activeTab = 'rapido';
		selectedDate = todayInputValue();
		rapido_volume = '';
		series = [
			{ repetitions: '', distance: '', description: '' },
			{ repetitions: '', distance: '', description: '' }
		];
		submitError = null;
		submitSuccess = false;
		dispatch('close');
	}

	function handleBackdropClick(e) {
		if (e.target === e.currentTarget) close();
	}
</script>

{#if visible}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="modal-backdrop"
		on:click={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby="bitacora-title"
	>
		<div class="modal-card">

			<!-- Header -->
			<div class="modal-header">
				<div>
					<h2 id="bitacora-title" class="modal-title">Registrar Sesión</h2>
					<p class="modal-subtitle">Entrenamiento en Agua</p>
				</div>
				<button class="modal-close" on:click={close} aria-label="Cerrar">&times;</button>
			</div>

			<!-- Tab switcher -->
			<div class="tab-bar">
				<button
					class="tab-btn"
					class:tab-active={activeTab === 'rapido'}
					on:click={() => (activeTab = 'rapido')}
				>⚡ Rápido</button>
				<button
					class="tab-btn"
					class:tab-active={activeTab === 'detallado'}
					on:click={() => (activeTab = 'detallado')}
				>📝 Detallado</button>
			</div>

			<form on:submit|preventDefault={handleSubmit} class="modal-form">

				<!-- Date -->
				<div class="field">
					<label class="field-label" for="bitacora-date">Fecha de la sesión</label>
					<input
						id="bitacora-date"
						type="date"
						bind:value={selectedDate}
						class="input-base"
					/>
				</div>

				<!-- RÁPIDO view -->
				{#if activeTab === 'rapido'}
					<div class="field">
						<label class="field-label" for="bitacora-volume">Volumen Total</label>
						<div class="input-suffix-wrapper">
							<input
								id="bitacora-volume"
								type="number"
								min="0"
								placeholder="Ej. 2500"
								bind:value={rapido_volume}
								class="input-base input-large"
							/>
							<span class="input-suffix">metros</span>
						</div>
					</div>
				{/if}

				<!-- DETALLADO view -->
				{#if activeTab === 'detallado'}
					<div class="field">
						<p class="field-label">Series del Entrenamiento</p>

						{#each series as row, i}
							<div class="series-row">
								<input
									type="number"
									min="0"
									placeholder="Rep"
									bind:value={row.repetitions}
									class="input-base input-sm input-center"
									aria-label="Repeticiones"
								/>
								<span class="series-sep">×</span>
								<input
									type="number"
									min="0"
									placeholder="Dist"
									bind:value={row.distance}
									class="input-base input-md input-center"
									aria-label="Distancia"
								/>
								<span class="series-unit">m</span>
								<input
									type="text"
									placeholder="Estilo / Desc."
									bind:value={row.description}
									class="input-base input-flex"
									aria-label="Descripción"
								/>
								{#if series.length > 1}
									<button
										type="button"
										class="remove-btn"
										on:click={() => removeSeries(i)}
										aria-label="Eliminar serie"
									>&times;</button>
								{/if}
							</div>
						{/each}

						<button type="button" class="add-series-btn" on:click={addSeries}>
							+ Agregar otra serie
						</button>

						{#if totalMeters > 0}
							<div class="series-total">
								<span class="series-total-label">Total de la sesión</span>
								<span class="series-total-value">{totalMeters.toLocaleString()} metros</span>
							</div>
						{/if}
					</div>
				{/if}

				<!-- Reward estimate -->
				<div class="reward-banner">
					<span class="reward-icon">⚡</span>
					<div>
						<p class="reward-hint">Recompensa estimada</p>
						<p class="reward-pts">+{estimatedPoints} pts <span class="reward-note">al validar</span></p>
					</div>
				</div>

				{#if submitError}
					<p class="error-msg">{submitError}</p>
				{/if}
				{#if submitSuccess}
					<p class="success-msg">✅ ¡Sesión enviada a validación!</p>
				{/if}

				<button
					type="submit"
					disabled={isSubmitting || totalMeters === 0}
					class="submit-btn"
				>
					{isSubmitting ? 'Enviando…' : 'Enviar a validación'}
				</button>

			</form>
		</div>
	</div>
{/if}

<style>
	/* ── Backdrop & card ───────────────────────────────────────── */
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.6);
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.modal-card {
		background: #fcfaf8;
		border-radius: 20px;
		padding: 20px;
		width: 90%;
		max-width: 360px;
		max-height: 85vh;
		overflow-x: hidden;
		overflow-y: auto;
		position: relative;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
		z-index: 101;
	}

	/* ── Header ────────────────────────────────────────────────── */
	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 14px;
	}
	.modal-title {
		margin: 0 0 2px 0;
		font-size: 16px;
		font-weight: 700;
		color: #1c150d;
	}
	.modal-subtitle {
		margin: 0;
		font-size: 10px;
		color: #0d9488;
		font-weight: 600;
	}
	.modal-close {
		background: #f5f5f5;
		border: 1px solid #e0e0e0;
		border-radius: 50%;
		width: 28px;
		height: 28px;
		font-size: 16px;
		line-height: 1;
		color: #888;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: background 0.15s, color 0.15s;
	}
	.modal-close:hover {
		background: #eee;
		color: #333;
	}

	/* ── Tabs ──────────────────────────────────────────────────── */
	.tab-bar {
		display: flex;
		gap: 4px;
		background: #f0f0f0;
		border-radius: 10px;
		padding: 3px;
		margin-bottom: 14px;
	}
	.tab-btn {
		flex: 1;
		padding: 5px 0;
		font-size: 9px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.3px;
		border: none;
		border-radius: 8px;
		background: transparent;
		color: #aaa;
		cursor: pointer;
		transition: all 0.15s;
	}
	.tab-btn:hover {
		color: #555;
	}
	.tab-active {
		background: #fff;
		color: #1c150d;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
	}

	/* ── Form ──────────────────────────────────────────────────── */
	.modal-form {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
		overflow: hidden;
	}
	.field-label {
		font-size: 8px;
		font-weight: 700;
		color: #999;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin: 0;
	}
	.input-base {
		background: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 10px;
		padding: 8px 12px;
		font-size: 13px;
		color: #1c150d;
		outline: none;
		transition: border-color 0.15s;
		width: 100%;
		max-width: 100%;
		min-width: 0;
		box-sizing: border-box;
		font-family: inherit;
	}
	.input-base::placeholder {
		color: #ccc;
	}
	.input-base:focus {
		border-color: #4285f4;
	}
	.input-large {
		font-size: 18px;
		font-weight: 700;
		padding-right: 52px;
	}

	/* Suffix wrapper */
	.input-suffix-wrapper {
		position: relative;
	}
	.input-suffix {
		position: absolute;
		right: 12px;
		top: 50%;
		transform: translateY(-50%);
		font-size: 11px;
		color: #bbb;
		pointer-events: none;
	}

	/* Series rows */
	.series-row {
		display: flex;
		align-items: center;
		gap: 4px;
		margin-bottom: 5px;
	}
	.input-sm {
		width: 46px;
		min-width: 46px;
		padding: 6px 4px;
		flex: none;
	}
	.input-md {
		width: 54px;
		min-width: 54px;
		padding: 6px 4px;
		flex: none;
	}
	.input-center {
		text-align: center;
	}
	.input-flex {
		flex: 1;
		min-width: 0;
		padding: 6px 8px;
	}
	.series-sep,
	.series-unit {
		font-size: 10px;
		font-weight: 700;
		color: #bbb;
		flex-shrink: 0;
	}
	.remove-btn {
		background: #fee2e2;
		border: none;
		border-radius: 50%;
		width: 22px;
		height: 22px;
		color: #e53e3e;
		font-size: 14px;
		font-weight: 700;
		cursor: pointer;
		padding: 0;
		line-height: 1;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.15s, transform 0.1s;
	}
	.remove-btn:hover {
		background: #fca5a5;
		transform: scale(1.15);
	}
	.add-series-btn {
		background: none;
		border: none;
		color: #0d9488;
		font-size: 9px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.3px;
		cursor: pointer;
		padding: 0;
		margin-top: 2px;
		transition: color 0.15s;
	}
	.add-series-btn:hover {
		color: #0f766e;
	}
	.series-total {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-top: 1px solid #eee;
		padding-top: 6px;
		margin-top: 4px;
	}
	.series-total-label {
		font-size: 8px;
		color: #999;
		text-transform: uppercase;
		font-weight: 700;
	}
	.series-total-value {
		font-size: 11px;
		font-weight: 700;
		color: #1c150d;
	}

	/* Reward banner */
	.reward-banner {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 10px;
		background: #fffdf5;
		border: 1px dashed #ffc107;
		border-radius: 10px;
	}
	.reward-icon {
		font-size: 18px;
		line-height: 1;
		flex-shrink: 0;
	}
	.reward-hint {
		margin: 0 0 1px 0;
		font-size: 8px;
		color: #b08d55;
		text-transform: uppercase;
		font-weight: 700;
	}
	.reward-pts {
		margin: 0;
		font-size: 14px;
		font-weight: 800;
		color: #1c150d;
	}
	.reward-note {
		font-size: 9px;
		font-weight: 400;
		color: #999;
		margin-left: 3px;
	}

	/* Feedback */
	.error-msg {
		font-size: 11px;
		color: #e53e3e;
		text-align: center;
		margin: 0;
	}
	.success-msg {
		font-size: 11px;
		color: #34a853;
		text-align: center;
		margin: 0;
	}

	/* Submit button */
	.submit-btn {
		width: 100%;
		padding: 12px;
		background: linear-gradient(135deg, #4285f4, #3c78d8);
		color: #fff;
		border: none;
		border-radius: 12px;
		font-size: 13px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		cursor: pointer;
		transition: opacity 0.15s, transform 0.1s;
		box-shadow: 0 4px 15px rgba(66, 133, 244, 0.3);
	}
	.submit-btn:hover:not(:disabled) {
		opacity: 0.9;
	}
	.submit-btn:active:not(:disabled) {
		transform: scale(0.98);
	}
	.submit-btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	/* Hide number spinners */
	input[type='date'] {
		min-width: 0;
		width: 100%;
		max-width: 100%;
		box-sizing: border-box;
		-webkit-appearance: none;
		appearance: none;
	}
	input[type='number']::-webkit-inner-spin-button,
	input[type='number']::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	input[type='number'] {
		-moz-appearance: textfield;
		appearance: textfield;
	}
</style>
