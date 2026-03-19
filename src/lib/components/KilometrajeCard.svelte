<script>
	import BitacoraModal from '$lib/components/BitacoraModal.svelte';

	/** @type {'standard'|'kids'|'health'|'performance'} */
	export let tier = 'standard';
	/** Processed chart data: [{ label, distance, height, active }] */
	export let chartData = [];
	export let totalDistance = null;
	export let monthlyRecord = null;
	export let monthlyRecordDate = null;
	export let puntajeDistancia = null;
	export let puntajeAsistencia = null;
	export let athleteId = null;

	let chartTab = 'all'; // 'all' | 'official' | 'bitacora'
	let showBitacoraModal = false;
</script>

<div class="km-card">

	<!-- Header: title + pill button -->
	<div class="km-header">
		<div>
			<p class="km-section-label">Kilometraje Acumulado</p>
			<div class="km-total-row">
				<span class="km-total">{totalDistance ? totalDistance.toLocaleString() : '0'}</span>
				<span class="km-total-unit">mts totales</span>
			</div>
		</div>
		{#if tier !== 'standard'}
			<button
				class="bitacora-pill"
				on:click={() => (showBitacoraModal = true)}
				aria-label="Registrar entrenamiento en bitácora"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="pill-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
				</svg>
				Bitácora
			</button>
		{/if}
	</div>

	<!-- Gamification point badges -->
	{#if puntajeDistancia != null || puntajeAsistencia != null}
		<div class="km-badges">
			{#if puntajeDistancia != null}
				<div class="km-badge km-badge--teal">
					<div class="km-badge-icon">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
						</svg>
					</div>
					<div>
						<p class="km-badge-label">Pts. Distancia</p>
						<p class="km-badge-val">{puntajeDistancia}</p>
					</div>
				</div>
			{/if}
			{#if puntajeAsistencia != null}
				<div class="km-badge km-badge--blue">
					<div class="km-badge-icon km-badge-icon--blue">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
					</div>
					<div>
						<p class="km-badge-label">Pts. Asistencia</p>
						<p class="km-badge-val">{puntajeAsistencia}</p>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Filter tabs -->
	<div class="km-tabs" role="tablist">
		<button
			class="km-tab"
			class:km-tab--active={chartTab === 'all'}
			role="tab"
			on:click={() => (chartTab = 'all')}
		>Todo</button>
		<button
			class="km-tab"
			class:km-tab--active={chartTab === 'official'}
			role="tab"
			on:click={() => (chartTab = 'official')}
		>Oficiales</button>
		<button
			class="km-tab"
			class:km-tab--active={chartTab === 'bitacora'}
			role="tab"
			on:click={() => (chartTab = 'bitacora')}
		>
			Bitácora
			{#if tier !== 'standard'}
				<span class="km-tab-dot" aria-hidden="true"></span>
			{/if}
		</button>
	</div>

	<!-- Bar chart -->
	<div class="chart-section">
		<div class="bar-chart">
			{#each chartData as day}
				<div class="bar-group">
					{#if day.distance > 0}
						<span class="bar-value">{(day.distance / 1000).toFixed(1)}k</span>
					{/if}
					<div class="bar" class:active={day.active} style="height: {day.height}%;" />
					<span class="bar-label">{day.label}</span>
				</div>
			{/each}
		</div>
		{#if chartTab !== 'all'}
			<p class="chart-filter-hint">
				{chartTab === 'official' ? 'Solo entrenamientos oficiales' : 'Solo registros de bitácora'}
			</p>
		{/if}
	</div>

	<!-- Monthly record milestone -->
	{#if monthlyRecord}
		<div class="milestone-box">
			<div class="milestone-icon">🏆</div>
			<div class="milestone-text">
				<span class="milestone-label">Récord Histórico Mensual</span>
				<span class="milestone-val">{(monthlyRecord / 1000).toFixed(1)}k metros</span>
			</div>
			<div class="milestone-date">{monthlyRecordDate || '-'}</div>
		</div>
	{/if}

</div>

<!-- Bitácora registration modal (only for non-standard plans) -->
{#if tier !== 'standard'}
	<BitacoraModal
		{athleteId}
		visible={showBitacoraModal}
		on:close={() => (showBitacoraModal = false)}
	/>
{/if}

<style>
	.km-card {
		background: #fff;
		border: 1px solid #eee;
		border-radius: 12px;
		padding: 6px 8px;
		margin-bottom: 8px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	/* ── Header ────────────────────────────────────────────────── */
	.km-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}
	.km-section-label {
		font-size: 7px;
		text-transform: uppercase;
		color: #999;
		font-weight: 700;
		letter-spacing: 0.5px;
		margin: 0 0 2px 0;
	}
	.km-total-row {
		display: flex;
		align-items: baseline;
		gap: 4px;
	}
	.km-total {
		font-size: 20px;
		font-weight: 800;
		color: #1c150d;
		line-height: 1;
	}
	.km-total-unit {
		font-size: 10px;
		color: #7f8c8d;
		font-weight: 500;
	}

	/* ── Bitácora pill button ──────────────────────────────────── */
	.bitacora-pill {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 9px;
		background: linear-gradient(135deg, #0f766e, #0d9488);
		color: #fff;
		border: none;
		border-radius: 12px;
		font-size: 9px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.3px;
		cursor: pointer;
		transition: opacity 0.15s, transform 0.1s;
		box-shadow: 0 2px 8px rgba(13, 148, 136, 0.25);
		flex-shrink: 0;
	}
	.bitacora-pill:hover {
		opacity: 0.88;
	}
	.bitacora-pill:active {
		transform: scale(0.96);
	}
	.pill-icon {
		width: 10px;
		height: 10px;
	}

	/* ── Gamification badges ───────────────────────────────────── */
	.km-badges {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 5px;
	}
	.km-badge {
		background: #fff;
		border: 1px solid #eee;
		border-radius: 10px;
		padding: 5px 6px;
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.km-badge--teal {
		border-left: 3px solid #14b8a6;
	}
	.km-badge--blue {
		border-left: 3px solid var(--primary-blue, #4285f4);
	}
	.km-badge-icon {
		width: 22px;
		height: 22px;
		border-radius: 6px;
		background: #f0fdf9;
		color: #0d9488;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.km-badge-icon svg {
		width: 12px;
		height: 12px;
	}
	.km-badge-icon--blue {
		background: #eff6ff;
		color: var(--primary-blue, #4285f4);
	}
	.km-badge-label {
		font-size: 7px;
		color: #999;
		text-transform: uppercase;
		font-weight: 700;
		letter-spacing: 0.3px;
		margin: 0 0 1px 0;
	}
	.km-badge-val {
		font-size: 13px;
		font-weight: 800;
		color: #1c150d;
		margin: 0;
		line-height: 1;
	}

	/* ── Filter tabs ───────────────────────────────────────────── */
	.km-tabs {
		display: flex;
		gap: 3px;
		background: #f5f5f5;
		border-radius: 8px;
		padding: 3px;
	}
	.km-tab {
		flex: 1;
		padding: 3px 0;
		font-size: 8px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.3px;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: #aaa;
		cursor: pointer;
		transition: all 0.15s;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 3px;
	}
	.km-tab:hover {
		color: #555;
	}
	.km-tab--active {
		background: #fff;
		color: #1c150d;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
	}
	.km-tab-dot {
		display: inline-block;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: #f59e0b;
		flex-shrink: 0;
	}

	/* ── Bar chart (matches TechnicalSheet styles) ─────────────── */
	.chart-section {
		margin-bottom: 2px;
	}
	.bar-chart {
		display: flex;
		justify-content: space-between;
		align-items: stretch;
		height: 40px;
		padding: 0 5px;
		margin-bottom: 5px;
		border-bottom: 1px solid #eee;
	}
	.bar-group {
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		align-items: center;
		width: 12%;
		height: 100%;
		position: relative;
	}
	.bar {
		width: 100%;
		background: #e0e7ff;
		border-radius: 4px 4px 0 0;
		position: relative;
	}
	.bar.active {
		background: var(--primary-blue, #4285f4);
	}
	.bar-label {
		font-size: 9px;
		color: #999;
		margin-top: 5px;
		font-weight: 600;
	}
	.bar-value {
		display: none;
		position: absolute;
		top: -20px;
		left: 50%;
		transform: translateX(-50%);
		background: #333;
		color: #fff;
		padding: 2px 5px;
		border-radius: 4px;
		font-size: 10px;
		font-weight: 700;
		white-space: nowrap;
		z-index: 1;
	}
	.bar-group:hover .bar-value {
		display: block;
	}
	.chart-filter-hint {
		font-size: 8px;
		color: #bbb;
		text-align: center;
		margin: 2px 0 0 0;
		font-style: italic;
	}

	/* ── Monthly record milestone ──────────────────────────────── */
	.milestone-box {
		background: #fffdf5;
		border: 1px dashed var(--accent-gold, #ffc107);
		border-radius: 10px;
		padding: 4px 6px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.milestone-icon {
		font-size: 14px;
		margin-right: 6px;
	}
	.milestone-text {
		flex: 1;
	}
	.milestone-label {
		display: block;
		font-size: 7px;
		color: #b08d55;
		text-transform: uppercase;
		font-weight: 700;
	}
	.milestone-val {
		display: block;
		font-size: 11px;
		font-weight: 700;
		color: #333;
	}
	.milestone-date {
		font-size: 8px;
		color: #aaa;
	}
</style>
