<script>
	import { createEventDispatcher } from 'svelte';

	export let tier = 'standard'; // 'standard', 'kids', 'performance'
	export let stats = {
		weight: 0,
		height: 0,
		fatPercentage: 0,
		musclePercentage: 0,
		waist: 0,
		hip: 0,
		visceralFat: 0
	};
	export let badges = [];
	export let level = null;
	export let isLoading = false;

	const dispatch = createEventDispatcher();

	// Reactividad para facilitar la lectura en el HTML
	$: isKids = tier === 'kids';
	$: isPerformance = tier === 'performance';
	$: lastBadge = badges && badges.length > 0 ? badges[badges.length - 1] : null;

	// Update stats with level and badges
	$: {
		if (!level) {
			stats.levelName = 'Desconocido';
			stats.levelIcon = '❓';
			stats.levelProgress = 0;
			stats.levelColor = '#2c3e50';
		}
	}

	let showBadgesPopup = false;
	let showSkillsPopup = false;
</script>

{#if showBadgesPopup}
	<div class="popup-overlay" on:click={() => (showBadgesPopup = false)}>
		<div class="popup-content" on:click|stopPropagation>
			<button class="popup-close" on:click={() => (showBadgesPopup = false)}>&times;</button>
			<h3>Insignias Ganadas</h3>
			<p>¡Felicidades por estos logros!</p>

			<div class="badges-grid">
				{#each badges || [] as badge}
					<div class="badge-item">
						<span class="badge-icon">{badge.icon}</span>
						<span class="badge-name">{badge.name}</span>
						<span class="badge-desc">{badge.description}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}

{#if showSkillsPopup && level && level.skills}
	<div class="popup-overlay" on:click={() => (showSkillsPopup = false)}>
		<div class="popup-content" on:click|stopPropagation>
			<button class="popup-close" on:click={() => (showSkillsPopup = false)}>&times;</button>
			<h3>Habilidades de Nivel: {level.name}</h3>
			<p>Progreso: {stats.levelProgress}% completado</p>

			<div class="skills-grid">
				{#each level.skills || [] as skill, index}
					{@const isCompleted =
						stats.levelCompletedSkills && stats.levelCompletedSkills.includes(index)}
					<div class="skill-item" class:completed={isCompleted}>
						<span class="skill-name">{skill}</span>
						<span class="skill-status">{isCompleted ? '✅ Completada' : '⏳ Pendiente'}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}

<div class="sheet-container">
	<!-- Botón de regreso -->
	<button class="flip-btn" on:click={() => dispatch('flip')}>
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
			<path d="M1 4v6h6"></path><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
		</svg>
	</button>

	<div class="content-scroll">
		<!-- Header -->
		<div class="stats-header">
			<h3>
				Ficha del Atleta {#if isPerformance}<span class="pro-badge">PRO</span>{/if}
			</h3>
			<small
				>Última act: {stats.measurementDate
					? stats.measurementDate.toLocaleDateString('es-ES', {
							day: 'numeric',
							month: 'long',
							year: 'numeric'
						})
					: '-'}</small
			>
		</div>

		<!-- 1. Basic Stats (Común para todos) -->
		<div class="basic-stats-grid">
			<div class="stat-box">
				<small>Peso</small>
				<strong>{stats.weight ?? '-'} <span class="unit">kg</span></strong>
			</div>
			<div class="stat-box">
				<small>Talla</small>
				<strong>{stats.height ?? '-'} <span class="unit">cm</span></strong>
			</div>
		</div>

		{#if isKids}
			<!-- VISTA NIÑOS -->
			<div class="kids-data-wrapper">
				{#if isLoading}
					<div class="composition-container">
						<div class="comp-card skeleton"></div>
						<div class="comp-card skeleton"></div>
					</div>
				{:else}
					<div class="composition-container">
						<div class="comp-card clickable" on:click={() => (showSkillsPopup = true)}>
							<div
								class="chart-donut"
								style="--percent: {stats.levelProgress}%; --chart-color: {stats.levelColor};"
							>
								<span class="chart-value" style="font-size:24px;">{stats.levelIcon}</span>
							</div>
							<span class="comp-label">Nivel {stats.levelName}</span>
							<span class="comp-sub">Progreso: {stats.levelProgress}%</span>
						</div>
						<div class="comp-card clickable" on:click={() => (showBadgesPopup = true)}>
							<div class="chart-donut" style="background: none; border: 2px solid #eee;">
								<span class="chart-value" style="font-size:24px;">🎖️</span>
							</div>
							<span class="comp-label">{(badges || []).length} Insignias</span>
							<span class="comp-sub positive">Última: {lastBadge ? lastBadge.name : 'Ninguna'}</span
							>
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<!-- VISTA ADULTOS -->
			<div class="adult-data-wrapper">
				<div class="composition-container">
					<div class="comp-card">
						<div
							class="chart-donut"
							style="--percent: {stats.fatPercentage ?? 0}%; --chart-color: var(--primary-blue);"
						>
							<span class="chart-value">{stats.fatPercentage ?? '-'}%</span>
						</div>
						<span class="comp-label">% Grasa</span>
						<!-- <span class="comp-sub">Ideal: 12-15%</span> -->
					</div>
					<div class="comp-card">
						<div
							class="chart-donut"
							style="--percent: {stats.musclePercentage ??
								0}%; --chart-color: var(--secondary-green);"
						>
							<span class="chart-value">{stats.musclePercentage ?? '-'}%</span>
						</div>
						<span class="comp-label">% Músculo</span>
						<!-- <span class="comp-sub positive">+2% vs mes ant.</span> -->
					</div>
				</div>

				<div class="measurements-grid">
					<div class="measure-box">
						<small>Cintura</small>
						<strong>{stats.waist ?? '-'} <span class="measure-unit">cm</span></strong>
					</div>
					<div class="measure-box">
						<small>Cadera</small>
						<strong>{stats.hip ?? '-'} <span class="measure-unit">cm</span></strong>
					</div>
					<div class="measure-box">
						<small>Grasa Visc.</small>
						<strong style="color: #E67C73;"
							>{stats.visceralFat ?? '-'} <span class="measure-unit">%</span></strong
						>
					</div>
				</div>
			</div>
		{/if}

		<!-- SECCIÓN PERFORMANCE (Con bloqueo) -->
		<div class="perf-wrapper">
			{#if !isPerformance}
				<div class="lock-overlay">
					<div class="lock-icon">🔒</div>
					<div class="lock-text">Plan Alto Rendimiento</div>
				</div>
			{/if}

			<div class="locked-section" class:blur-content={!isPerformance}>
				<div class="chart-section">
					<div class="chart-title">
						<span>Volumen Semanal</span>
						<span style="color:var(--primary-blue)">Total: 4.2k</span>
					</div>
					<div class="bar-chart">
						<div class="bar-group">
							<div class="bar" style="height: 30%;"></div>
							<span class="bar-label">L</span>
						</div>
						<div class="bar-group">
							<div class="bar active" style="height: 80%;"></div>
							<span class="bar-label">M</span>
						</div>
						<div class="bar-group">
							<div class="bar" style="height: 50%;"></div>
							<span class="bar-label">M</span>
						</div>
						<div class="bar-group">
							<div class="bar active" style="height: 100%;"></div>
							<span class="bar-label">J</span>
						</div>
						<div class="bar-group">
							<div class="bar" style="height: 2px%;"></div>
							<span class="bar-label">V</span>
						</div>
						<div class="bar-group">
							<div class="bar active" style="height: 70%;"></div>
							<span class="bar-label">S</span>
						</div>
						<div class="bar-group">
							<div class="bar" style="height: 15%;"></div>
							<span class="bar-label">D</span>
						</div>
					</div>
				</div>

				<div class="milestone-box">
					<div class="milestone-icon">🏆</div>
					<div class="milestone-text">
						<span class="milestone-label">Récord Histórico Semanal</span>
						<span class="milestone-val">6,500 metros</span>
					</div>
					<div class="milestone-date">Oct 2025</div>
				</div>
			</div>
		</div>
	</div>

	<button class="btn-action btn-ghost" on:click={() => dispatch('flip')}>Volver al Carnet</button>
</div>

<style>
	.sheet-container {
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		text-align: left;
		background-color: #fcfaf8;
		padding: 1rem;
		box-sizing: border-box;
	}
	.flip-btn {
		position: absolute;
		top: 20px;
		right: 20px;
		background: #f4eee7;
		border: none;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 20;
		color: var(--primary-blue);
		transition: transform 0.2s;
		box-shadow: 0 4px 12px rgba(66, 133, 244, 0.2);
	}
	.btn-action {
		width: 100%;
		padding: 14px;
		border-radius: 12px;
		font-weight: 600;
		cursor: pointer;
		font-size: 14px;
	}
	.btn-ghost {
		background: transparent;
		color: var(--primary-blue);
		border: 1px solid var(--primary-blue);
	}
	.stats-header {
		margin-bottom: 15px;
		border-bottom: 1px solid #f0f0f0;
		padding-bottom: 10px;
	}
	.stats-header h3 {
		margin: 0;
		font-size: 18px;
		color: #1c150d;
		display: flex;
		align-items: center;
		font-weight: 700;
	}
	.stats-header small {
		color: #9c7849;
		font-size: 11px;
	}
	.pro-badge {
		background: linear-gradient(135deg, #ffd700, #fdb931);
		color: #fff;
		padding: 4px 12px;
		border-radius: 20px;
		font-size: 10px;
		font-weight: 800;
		text-transform: uppercase;
		margin-left: 8px;
		box-shadow: 0 2px 5px rgba(212, 175, 55, 0.4);
	}
	.basic-stats-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 15px;
		margin-bottom: 15px;
	}
	.stat-box {
		background: #f4eee7;
		padding: 10px;
		border-radius: 16px;
	}
	.stat-box small {
		display: block;
		color: #9c7849;
		font-size: 10px;
		text-transform: uppercase;
		margin-bottom: 2px;
	}
	.stat-box strong {
		display: block;
		color: #1c150d;
		font-size: 18px;
		font-weight: 800;
	}
	.unit {
		font-size: 13px;
		color: #9c7849;
		font-weight: 500;
	}
	.composition-container {
		display: flex;
		justify-content: space-between;
		margin-bottom: 15px;
	}
	.comp-card {
		background: white;
		border: 1px solid #eee;
		border-radius: 16px;
		padding: 10px 8px;
		width: 48%;
		text-align: center;
		box-sizing: border-box;
	}
	.comp-card.clickable {
		cursor: pointer;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}
	.comp-card.clickable:hover {
		transform: translateY(-3px);
		box-shadow: 0 6px 15px rgba(0, 0, 0, 0.08);
	}
	.chart-donut {
		width: 55px;
		height: 55px;
		border-radius: 50%;
		margin: 0 auto 5px;
		position: relative;
		background: conic-gradient(var(--chart-color) var(--percent), #e0e7ff 0);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.chart-donut::after {
		content: '';
		width: 41px;
		height: 41px;
		background: white;
		border-radius: 50%;
		position: absolute;
	}
	.chart-value {
		position: absolute;
		z-index: 2;
		font-size: 11px;
		font-weight: 800;
		color: #1c150d;
	}
	.comp-label {
		font-size: 11px;
		color: #1c150d;
		font-weight: 600;
		display: block;
	}
	.comp-sub {
		font-size: 9px;
		color: #999;
		margin-top: 2px;
		display: block;
		letter-spacing: -0.2px;
	}
	.comp-sub.positive {
		color: #34a853;
		font-weight: 500;
	}
	.measurements-grid {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 8px;
		margin-bottom: 20px;
	}
	.measure-box {
		background: #fff;
		border: 1px solid #eee;
		border-radius: 12px;
		padding: 8px 5px;
		text-align: center;
	}
	.measure-box small {
		display: block;
		font-size: 9px;
		color: #999;
		text-transform: uppercase;
		margin-bottom: 2px;
	}
	.measure-box strong {
		font-size: 13px;
		font-weight: 700;
		color: #1c150d;
	}
	.measure-unit {
		font-size: 10px;
		font-weight: 400;
		color: #7f8c8d;
	}
	.perf-wrapper {
		position: relative;
	}
	.locked-section {
		transition: filter 0.3s ease;
	}
	.blur-content {
		filter: blur(6px);
		pointer-events: none;
		user-select: none;
	}
	.lock-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		z-index: 10;
		background: rgba(255, 255, 255, 0.5);
		backdrop-filter: blur(2px);
	}
	.lock-icon {
		font-size: 24px;
		background: white;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
		margin-bottom: 5px;
	}
	.lock-text {
		font-size: 10px;
		font-weight: 700;
		color: #1c150d;
		background: white;
		padding: 4px 10px;
		border-radius: 12px;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
	}
	.chart-section {
		margin-bottom: 15px;
	}
	.chart-title {
		font-size: 12px;
		font-weight: 700;
		color: #888;
		text-transform: uppercase;
		margin-bottom: 10px;
		display: flex;
		justify-content: space-between;
	}
	.bar-chart {
		display: flex;
		justify-content: space-between;
		align-items: stretch;
		height: 80px;
		padding: 0 5px;
		margin-bottom: 10px;
		border-bottom: 1px solid #eee;
	}
	.bar-group {
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		align-items: center;
		width: 12%;
		height: 100%;
	}
	.bar {
		width: 100%;
		background: #e0e7ff;
		border-radius: 4px 4px 0 0;
		position: relative;
	}
	.bar.active {
		background: var(--primary-blue);
	}
	.bar-label {
		font-size: 9px;
		color: #999;
		margin-top: 5px;
		font-weight: 600;
	}
	.milestone-box {
		background: #fffdf5;
		border: 1px dashed var(--accent-gold);
		border-radius: 12px;
		padding: 8px 12px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.milestone-icon {
		font-size: 18px;
		margin-right: 10px;
	}
	.milestone-text {
		flex: 1;
	}
	.milestone-label {
		display: block;
		font-size: 9px;
		color: #b08d55;
		text-transform: uppercase;
		font-weight: 700;
	}
	.milestone-val {
		display: block;
		font-size: 13px;
		font-weight: bold;
		color: #333;
	}
	.milestone-date {
		font-size: 10px;
		color: #aaa;
	}

	/* Popup styles */
	.popup-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.65);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		padding: 1rem;
		box-sizing: border-box;
	}
	.popup-content {
		background: #f7f3ef;
		padding: 20px;
		border-radius: 16px;
		width: 100%;
		max-width: 400px;
		text-align: center;
		position: relative;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
		max-height: 90vh;
		overflow-y: auto;
	}
	.popup-close {
		position: absolute;
		top: 10px;
		right: 10px;
		background: #e8e2dc;
		border: none;
		width: 30px;
		height: 30px;
		border-radius: 50%;
		font-size: 20px;
		line-height: 30px;
		cursor: pointer;
		color: #888;
	}
	.popup-content h3 {
		margin-top: 0;
		margin-bottom: 5px;
		color: #1c150d;
	}
	.popup-content p {
		font-size: 13px;
		color: #9c7849;
		margin-top: 0;
		margin-bottom: 20px;
	}

	.badges-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}
	.badge-item {
		background: linear-gradient(170deg, #ffffff 0%, #f9f6f2 100%);
		border-radius: 12px;
		border: 1px solid #eae5e0;
		border-top: 3px solid #ffd700; /* Gold-like top border */
		padding: 10px;
		text-align: center;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
		transition:
			transform 0.2s ease-out,
			box-shadow 0.2s ease-out;
	}
	.badge-item:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
	}
	.badge-icon {
		display: block;
		font-size: 36px;
		margin-bottom: 4px;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	.badge-name {
		display: block;
		font-size: 12px;
		color: #333;
		font-weight: 700;
		margin-bottom: 4px;
	}
	.badge-desc {
		font-size: 10px;
		color: #888;
		line-height: 1.3;
	}

	/* Skills Popup Styles */
	.skills-grid {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 15px;
		text-align: left;
	}
	.skill-item {
		background: #ffffff;
		border: 1px solid #eae5e0;
		border-radius: 10px;
		padding: 10px 15px;
		display: flex;
		flex-direction: column; /* Changed to column */
		justify-content: center; /* Center content vertically */
		align-items: flex-start; /* Align items to the start */
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
		transition: all 0.2s ease-out;
	}
	.skill-item.completed {
		border-left: 5px solid #34a853; /* Green for completed */
	}
	.skill-item:not(.completed) {
		border-left: 5px solid #fdb931; /* Orange for pending */
	}
	.skill-name {
		font-size: 13px;
		color: #1c150d;
		font-weight: 600;
	}
	.skill-status {
		font-size: 11px;
		font-weight: 500;
		color: #7f8c8d;
		white-space: nowrap;
		margin-left: 0;
		margin-top: 5px; /* Added margin-top for spacing */
	}
	.skill-item.completed .skill-status {
		color: #34a853;
	}
	.skill-item:not(.completed) .skill-status {
		color: #fdb931;
	}

	/* Skeleton Loading Styles */
	.skeleton {
		background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
		background-size: 200% 100%;
		animation: loading 1.5s infinite;
		border-color: #e0e0e0;
	}

	@keyframes loading {
		0% {
			background-position: -200% 0;
		}
		100% {
			background-position: 200% 0;
		}
	}
</style>
