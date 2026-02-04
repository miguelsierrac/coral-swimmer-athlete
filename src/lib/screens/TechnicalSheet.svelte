<script>
	import { createEventDispatcher } from 'svelte';
	import BadgePopover from '$lib/components/BadgePopover.svelte';
	import Leaderboard from '$lib/components/Leaderboard.svelte';

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
	export let allLevels = [];
	export let currentUserID;

	const dispatch = createEventDispatcher();

	// Reactividad para facilitar la lectura en el HTML
	$: isKids = tier === 'kids';
	$: isPerformance = tier === 'performance';

	// Update stats with level and badges
	$: {
		if (!level) {
			stats.levelName = 'Desconocido';
			stats.levelIcon = '❓';
			stats.levelProgress = 0;
			stats.levelColor = '#2c3e50';
		}
	}

	let showSkillsPopup = false;
	let showObjectivesPopup = false;
	let selectedBadge = null;
	let popoverPosition = { top: 0, left: 0 };
	let showLeaderboard = false;

	function handleBadgeClick(event, badge) {
		if (selectedBadge && selectedBadge.id === badge.id) {
			closePopover();
			return;
		}
		const rect = event.currentTarget.getBoundingClientRect();
		popoverPosition = {
			top: rect.top + rect.height / 2,
			left: rect.left + rect.width / 2
		};
		selectedBadge = badge;
	}

	function closePopover() {
		selectedBadge = null;
	}

	function toggleLeaderboard() {
		showLeaderboard = !showLeaderboard;
	}

	function toggleObjectivesPopup() {
		showObjectivesPopup = !showObjectivesPopup;
	}
</script>

{#if showSkillsPopup && level && level.skills}
	<div
		class="popup-overlay"
		role="button"
		tabindex="0"
		on:click={() => (showSkillsPopup = false)}
		on:keydown={(e) => {
			if (e.key === 'Enter') showSkillsPopup = false;
		}}
	>
		<div class="popup-content">
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

{#if showObjectivesPopup}
	<div
		class="popup-overlay"
		role="button"
		tabindex="0"
		on:click={toggleObjectivesPopup}
		on:keydown={(e) => {
			if (e.key === 'Enter') toggleObjectivesPopup();
		}}
	>
		<div class="popup-content objectives-popup">
			<button class="popup-close" on:click={toggleObjectivesPopup}>&times;</button>
			<h3>🎯 Objetivos del Nivel {level?.nombre || ''}</h3>
			<p class="popup-subtitle">Progreso: {stats.levelProgress || 0}% completado</p>

			<div class="badge-grid">
				{#if badges && badges.length > 0}
					{#each badges as badge (badge.id)}
						{@const gradeClass = badge.progress
							? `badge-slot-${badge.progress}`
							: 'badge-slot-locked'}
						<div
							class="badge-slot {gradeClass}"
							role="button"
							tabindex="0"
							on:click={(e) => {
								e.stopPropagation();
								handleBadgeClick(e, badge);
							}}
							on:keydown={(e) => {
								if (e.key === 'Enter') {
									e.stopPropagation();
									handleBadgeClick(e, badge);
								}
							}}
						>
							{#if badge.progress}
								<div class="tier-dot tier-{badge.progress}"></div>
							{/if}
							<span class="b-icon">{badge.icono}</span>
							<span class="b-name">{badge.nombre}</span>
						</div>
					{/each}
				{:else}
					<p class="no-objectives">No hay objetivos definidos para este nivel.</p>
				{/if}
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

		{#if isLoading}
			<div class="level-card-container">
				<div class="comp-card skeleton centered"></div>
			</div>
		{:else if isKids}
			<!-- VISTA NIÑOS -->
			<div class="kids-data-wrapper">
				<div class="level-card-container">
					<div
						class="level-card-header"
						role="button"
						tabindex="0"
						on:click={toggleObjectivesPopup}
						on:keydown={(e) => {
							if (e.key === 'Enter') toggleObjectivesPopup();
						}}
						style="background: {stats.levelColor};"
					>
						<div class="level-ring-container">
							<div
								class="donut-ring"
								style="border-top-color: {stats.levelColor === '#34495E'
									? '#FFC107'
									: 'rgba(255,255,255,0.9)'}; border-right-color: {stats.levelColor === '#34495E'
									? '#FFC107'
									: 'rgba(255,255,255,0.9)'};"
							></div>
							<span class="level-icon-large">{stats.levelIcon}</span>
						</div>
						<h3 class="level-name-header">Nivel {stats.levelName}</h3>
						<span class="xp-pill"
							>{stats.levelProgress}% Completado • {(badges || []).length} objetivos</span
						>
					</div>
				</div>
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

				{#if !isLoading && stats.levelName}
					<div class="level-card-container">
						<div
							class="level-card-header-compact"
							role="button"
							tabindex="0"
							on:click={toggleObjectivesPopup}
							on:keydown={(e) => {
								if (e.key === 'Enter') toggleObjectivesPopup();
							}}
							style="background: {stats.levelColor};"
						>
							<div class="level-header-content">
								<span class="level-icon-compact">{stats.levelIcon}</span>
								<div class="level-info-compact">
									<h4 class="level-name-compact">Nivel {stats.levelName}</h4>
									<span class="level-progress-compact">{stats.levelProgress}% Completado</span>
								</div>
							</div>
							{#if stats.specialty}
								<div class="specialty-chips-inline">
									<div class="specialty-chip-inline tool-chip">
										{stats.specialty.tool === 'Monoaleta' ? '🧜' : '🏊'}
										{stats.specialty.tool}
									</div>
									<div class="specialty-chip-inline mode-chip">
										{stats.specialty.mode === 'Velocidad' ? '🏎️' : '🔋'}
										{stats.specialty.mode}
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{/if}

		{#if selectedBadge}
			<div
				class="popover-backdrop"
				role="button"
				tabindex="0"
				on:click={closePopover}
				on:keydown={(e) => {
					if (e.key === 'Enter') closePopover();
				}}
			></div>
			<div
				class="popover-container"
				style="top: {popoverPosition.top}px; left: {popoverPosition.left}px;"
			>
				<BadgePopover badge={selectedBadge} progress={selectedBadge.progress} />
			</div>
		{/if}

		{#if !isLoading && stats.levelName}
			<!-- SECCIÓN LEADERBOARD -->
			<div class="leaderboard-section">
				{#if tier === 'standard'}
					<div class="leaderboard-upsell">
						<div class="lock-icon">🔒</div>
						<div class="upsell-text">
							<h4>Ranking Exclusivo</h4>
							<p>Actualiza a Premium para ver tu posición y competir.</p>
							<button class="btn-upgrade">Mejorar Plan</button>
						</div>
					</div>
				{:else}
					<div
						class="leaderboard-cta"
						role="button"
						tabindex="0"
						on:click={toggleLeaderboard}
						on:keydown={(e) => {
							if (e.key === 'Enter') toggleLeaderboard();
						}}
					>
						<div class="cta-icon">🏆</div>
						<div class="cta-text">
							<h4>Tabla de Posiciones</h4>
							<p>¡Compite y mide tu progreso!</p>
						</div>
						<div class="cta-arrow">›</div>
					</div>
				{/if}
			</div>

			{#if showLeaderboard}
				<div
					class="leaderboard-modal-overlay"
					role="button"
					tabindex="0"
					on:click={toggleLeaderboard}
					on:keydown={(e) => {
						if (e.key === 'Enter') toggleLeaderboard();
					}}
				>
					<div class="leaderboard-modal-content" on:click|stopPropagation>
						<button class="popup-close" on:click={toggleLeaderboard}>&times;</button>
						<Leaderboard
							{allLevels}
							{currentUserID}
							currentUserLevelId={level ? level.id : null}
							{badges}
							userLevel={level}
							specialty={stats.specialty}
						/>
					</div>
				</div>
			{/if}
		{/if}

		<!-- SECCIÓN PERFORMANCE (Con bloqueo) -->
		<div class="perf-wrapper">
			{#if !isPerformance}
				<div class="lock-overlay">
					<div class="lock-icon">🔒</div>
					<div class="lock-text">Plan Alto Rendimiento</div>
					<div class="lock-subtext">Desbloquea tu máximo potencial.</div>
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
		padding: 0.75rem;
		box-sizing: border-box;
	}
	.flip-btn {
		position: absolute;
		top: 12px;
		right: 12px;
		background: #f4eee7;
		border: none;
		width: 36px;
		height: 36px;
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
		padding: 10px;
		border-radius: 12px;
		font-weight: 600;
		cursor: pointer;
		font-size: 13px;
	}
	.btn-ghost {
		background: transparent;
		color: var(--primary-blue);
		border: 1px solid var(--primary-blue);
	}
	.stats-header {
		margin-bottom: 10px;
		border-bottom: 1px solid #f0f0f0;
		padding-bottom: 8px;
	}
	.stats-header h3 {
		margin: 0;
		font-size: 16px;
		color: #1c150d;
		display: flex;
		align-items: center;
		font-weight: 700;
	}
	.stats-header small {
		color: #9c7849;
		font-size: 10px;
	}
	.pro-badge {
		background: linear-gradient(135deg, #ffd700, #fdb931);
		color: #fff;
		padding: 3px 10px;
		border-radius: 20px;
		font-size: 9px;
		font-weight: 800;
		text-transform: uppercase;
		margin-left: 8px;
		box-shadow: 0 2px 5px rgba(212, 175, 55, 0.4);
	}
	.basic-stats-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		margin-bottom: 8px;
	}
	.stat-box {
		background: #f4eee7;
		padding: 8px;
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
		font-size: 16px;
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
		margin-bottom: 8px;
	}
	.comp-card {
		background: white;
		border: 1px solid #eee;
		border-radius: 16px;
		padding: 6px 4px;
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
		width: 45px;
		height: 45px;
		border-radius: 50%;
		margin: 0 auto 4px;
		position: relative;
		background: conic-gradient(var(--chart-color) var(--percent), #e0e7ff 0);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.chart-donut::after {
		content: '';
		width: 34px;
		height: 34px;
		background: white;
		border-radius: 50%;
		position: absolute;
	}
	.chart-value {
		position: absolute;
		z-index: 2;
		font-size: 10px;
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
	.level-card-container {
		display: flex;
		justify-content: center;
		margin-bottom: 10px;
	}
	.level-card-header {
		width: 100%;
		background: var(--shark-color, #34495e);
		color: white;
		padding: 12px 20px;
		text-align: center;
		border-radius: 20px;
		position: relative;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
	}
	.level-card-header:hover {
		transform: translateY(-3px);
		box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25);
	}
	.level-card-header-compact {
		width: 100%;
		background: var(--level-color, #34495e);
		color: white;
		padding: 12px 16px;
		border-radius: 16px;
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
		cursor: pointer;
		transition: all 0.3s ease;
	}
	.level-card-header-compact:hover {
		transform: translateY(-3px);
		box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
	}
	.level-header-content {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 8px;
	}
	.level-icon-compact {
		font-size: 32px;
		line-height: 1;
	}
	.level-info-compact {
		flex: 1;
		text-align: left;
	}
	.level-name-compact {
		margin: 0;
		font-size: 16px;
		font-weight: 800;
		line-height: 1.2;
	}
	.level-progress-compact {
		font-size: 11px;
		opacity: 0.9;
		font-weight: 500;
	}
	.specialty-chips-inline {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.specialty-chip-inline {
		padding: 4px 10px;
		border-radius: 12px;
		font-size: 10px;
		font-weight: 700;
		display: inline-flex;
		align-items: center;
		gap: 4px;
		background: rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(10px);
	}
	.level-ring-container {
		width: 60px;
		height: 60px;
		margin: 0 auto 6px;
		position: relative;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.donut-ring {
		position: absolute;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		border: 4px solid rgba(255, 255, 255, 0.2);
		border-top-color: #ffc107;
		border-right-color: #ffc107;
		transform: rotate(45deg);
	}
	.level-icon-large {
		font-size: 28px;
		z-index: 2;
	}
	.level-name-header {
		margin: 0;
		font-size: 16px;
		font-weight: 800;
		letter-spacing: 0.5px;
	}
	.xp-pill {
		background: rgba(0, 0, 0, 0.3);
		padding: 2px 8px;
		border-radius: 20px;
		font-size: 9px;
		margin-top: 3px;
		display: inline-block;
	}
	.measurements-grid {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 8px;
		margin-bottom: 10px;
	}
	.measure-box {
		background: #fff;
		border: 1px solid #eee;
		border-radius: 12px;
		padding: 6px 4px;
		text-align: center;
	}
	.measure-box small {
		display: block;
		font-size: 8px;
		color: #999;
		text-transform: uppercase;
		margin-bottom: 2px;
	}
	.measure-box strong {
		font-size: 12px;
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
	.objectives-section {
		margin-top: 20px;
	}
	.section-title {
		font-size: 14px;
		font-weight: 700;
		color: #1c150d;
		margin-bottom: 10px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.badge-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
		margin-top: 8px;
	}
	.badge-slot {
		aspect-ratio: 1;
		background: white;
		border-radius: 16px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.04);
		cursor: pointer;
		position: relative;
		border: 2px solid transparent;
		transition: transform 0.2s;
	}
	.badge-slot:hover {
		transform: translateY(-3px);
	}
	.b-icon {
		font-size: 24px;
		margin-bottom: 4px;
		filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.1));
	}
	.b-name {
		font-size: 9px;
		font-weight: 700;
		color: #444;
		text-align: center;
		line-height: 1.2;
	}
	.tier-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		position: absolute;
		top: 8px;
		right: 8px;
	}
	.tier-dot.tier-bronce {
		background: linear-gradient(135deg, #e7cbae, #cd7f32);
	}
	.tier-dot.tier-plata {
		background: linear-gradient(135deg, #f0f0f0, #c0c0c0);
	}
	.tier-dot.tier-oro {
		background: linear-gradient(135deg, #fff7cc, #ffd700);
	}
	.badge-slot-bronce {
		border-color: #cd7f32;
		background: linear-gradient(to bottom right, #fff, #fff5eb);
	}
	.badge-slot-plata {
		border-color: #c0c0c0;
		background: linear-gradient(to bottom right, #fff, #f5f5f5);
	}
	.badge-slot-oro {
		border-color: #ffd700;
		background: linear-gradient(to bottom right, #fff, #fffee0);
		box-shadow: 0 0 10px rgba(255, 215, 0, 0.2);
	}
	.badge-slot-locked {
		opacity: 0.5;
		background: #f0f0f0;
		border: 2px dashed #ddd;
		filter: grayscale(1);
	}
	.badge-slot-locked .b-icon {
		opacity: 0.3;
	}
	.no-objectives {
		font-size: 12px;
		color: #999;
		text-align: center;
		padding: 20px;
		background-color: #f9f9f9;
		border-radius: 12px;
		grid-column: 1 / -1;
	}
	.popover-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: 250;
	}
	.popover-container {
		position: fixed;
		z-index: 251;
		transform: translate(-50%, -50%);
		transition:
			transform 0.2s ease,
			opacity 0.2s ease;
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
	.lock-subtext {
		font-size: 8px;
		color: #666;
		margin-top: 2px;
	}
	.chart-section {
		margin-bottom: 8px;
	}
	.chart-title {
		font-size: 11px;
		font-weight: 700;
		color: #888;
		text-transform: uppercase;
		margin-bottom: 8px;
		display: flex;
		justify-content: space-between;
	}
	.bar-chart {
		display: flex;
		justify-content: space-between;
		align-items: stretch;
		height: 50px;
		padding: 0 5px;
		margin-bottom: 6px;
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
		padding: 5px 8px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.milestone-icon {
		font-size: 16px;
		margin-right: 8px;
	}
	.milestone-text {
		flex: 1;
	}
	.milestone-label {
		display: block;
		font-size: 8px;
		color: #b08d55;
		text-transform: uppercase;
		font-weight: 700;
	}
	.milestone-val {
		display: block;
		font-size: 12px;
		font-weight: bold;
		color: #333;
	}
	.milestone-date {
		font-size: 9px;
		color: #aaa;
	}

	/* Popup Styles */
	.popup-overlay {
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
	.popup-content {
		background: #fcfaf8;
		border-radius: 20px;
		padding: 25px 20px;
		width: 90%;
		max-width: 450px;
		max-height: 80vh;
		overflow-y: auto;
		position: relative;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
		z-index: 101;
	}
	.popup-content.objectives-popup {
		max-height: 85vh;
	}
	.popup-close {
		position: fixed;
		top: 15px;
		right: 15px;
		background: white;
		border: 2px solid #e0e0e0;
		border-radius: 50%;
		font-size: 24px;
		cursor: pointer;
		color: #666;
		line-height: 1;
		padding: 0;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		z-index: 1000;
	}
	.popup-close:hover {
		background: #f5f5f5;
		color: #333;
		border-color: #4285f4;
		transform: scale(1.1);
	}
	.popup-content h3 {
		margin: 0 0 8px 0;
		color: #1c150d;
		font-size: 18px;
		font-weight: 700;
		padding-right: 30px;
	}
	.popup-content p {
		margin: 0 0 20px 0;
		color: #666;
		font-size: 13px;
	}
	.popup-subtitle {
		color: #9c7849;
		font-size: 12px;
		font-weight: 600;
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

	/* Leaderboard Styles */
	.leaderboard-section {
		margin-top: 10px;
		margin-bottom: 10px;
	}
	.leaderboard-upsell,
	.leaderboard-cta {
		border-radius: 16px;
		padding: 10px 12px;
		display: flex;
		align-items: center;
		gap: 10px;
		cursor: pointer;
	}
	.leaderboard-upsell {
		background: #f5f5f5;
		border: 1px solid #e0e0e0;
		color: #757575;
	}
	.upsell-text h4 {
		margin: 0 0 5px 0;
		color: #333;
		font-size: 14px;
	}
	.upsell-text p {
		margin: 0;
		font-size: 12px;
	}
	.btn-upgrade {
		margin-top: 10px;
		background: var(--primary-blue);
		color: white;
		border: none;
		padding: 8px 12px;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
	}
	.leaderboard-cta {
		background: linear-gradient(135deg, #4285f4, #3c78d8);
		color: white;
		box-shadow: 0 4px 15px rgba(66, 133, 244, 0.3);
	}
	.cta-icon {
		font-size: 24px;
	}
	.cta-text h4 {
		margin: 0 0 2px 0;
		font-size: 14px;
		font-weight: 700;
	}
	.cta-text p {
		margin: 0;
		font-size: 12px;
		opacity: 0.9;
	}
	.cta-arrow {
		margin-left: auto;
		font-size: 24px;
		font-weight: bold;
	}

	/* Leaderboard Modal */
	.leaderboard-modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.6);
		z-index: 998;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.leaderboard-modal-content {
		position: relative;
		background: #f7f3ef;
		border-radius: 20px;
		padding: 20px;
		width: 90%;
		max-width: 400px;
		max-height: 80vh;
		overflow-y: auto;
	}
</style>
