<script>
	export let users = []; // Top 3 users
	export let getAvatarUrl;
	export let levelIcon = '🔱'; // Level icon to display for first place

	// Ensure we have exactly 3 positions, filling with null if needed
	const top3Users = [
		users.find((u) => u.rank === 1) || null, // 1st place
		users.find((u) => u.rank === 2) || null, // 2nd place
		users.find((u) => u.rank === 3) || null  // 3rd place
	];

	const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd
	const sortedUsers = podiumOrder.map((rankIndex) => top3Users[rankIndex]);
</script>

<div class="podium-wrapper">
	<div class="podium-container">
		{#each sortedUsers as user, index}
			{@const position = podiumOrder[index]}
			{@const isFirst = position === 0}
			{@const isSecond = position === 1}
			{@const isThird = position === 2}
			
			<div
				class="podium-item"
				class:first={isFirst}
				class:second={isSecond}
				class:third={isThird}
				class:empty={!user}
			>
				{#if user}
					<div class="avatar-container">
						<div class="podium-avatar-wrapper">
							<img src={getAvatarUrl(user)} alt="Avatar" class="podium-avatar" />
						</div>
						<div class="medal-badge">
							<span class="medal-number">{user.rank}</span>
						</div>
					</div>
					<div class="podium-base">
						<div class="podium-info">
							<span class="podium-name"
								>{user.nombre_deportista}<br />{user.apellido_deportista}</span
							>
							<span class="podium-score">{new Intl.NumberFormat('es-ES').format(user.puntaje_total)}</span>
							{#if isFirst && levelIcon}
								<span class="level-icon">{levelIcon}</span>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.podium-wrapper {
		padding: 0;
		margin: 55px 0 8px;
		position: relative;
	}

	.podium-container {
		display: flex;
		justify-content: center;
		align-items: flex-end;
		gap: 4px;
		position: relative;
		min-height: 130px;
	}

	.podium-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		position: relative;
		flex: 1;
		max-width: 33.33%;
	}

	.podium-item.first {
		order: 2;
		z-index: 3;
	}

	.podium-item.second {
		order: 1;
		z-index: 2;
	}

	.podium-item.third {
		order: 3;
		z-index: 1;
	}

	.podium-item.empty {
		visibility: hidden;
	}

	.avatar-container {
		position: absolute;
		top: -30px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.podium-item.first .avatar-container {
		top: -35px;
	}

	.podium-avatar-wrapper {
		border-radius: 50%;
		overflow: hidden;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.podium-item.first .podium-avatar-wrapper {
		width: 72px;
		height: 72px;
		border: 4px solid #fbbf24;
	}

	.podium-item.second .podium-avatar-wrapper {
		width: 56px;
		height: 56px;
		border: 3px solid #9ca3af;
	}

	.podium-item.third .podium-avatar-wrapper {
		width: 56px;
		height: 56px;
		border: 3px solid #fb923c;
	}

	.podium-avatar {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.medal-badge {
		position: relative;
		margin-top: -12px;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
		border: 2px solid white;
		z-index: 10;
	}

	.first .medal-badge {
		background: #fbbf24;
		width: 24px;
		height: 24px;
	}

	.second .medal-badge {
		background: #9ca3af;
	}

	.third .medal-badge {
		background: #fb923c;
	}

	.medal-number {
		font-size: 10px;
		font-weight: 700;
		color: white;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.first .medal-number {
		font-size: 12px;
		color: #78350f;
	}

	.podium-base {
		background: #3b82f6;
		border-radius: 12px 12px 0 0;
		padding: 26px 6px 8px;
		width: 100%;
		box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.podium-item.first .podium-base {
		min-height: 135px;
		background: #2563eb;
		box-shadow: 0 -5px 15px rgba(37, 99, 235, 0.3);
		padding: 48px 6px 8px;
	}

	.podium-item.second .podium-base {
		min-height: 102px;
	}

	.podium-item.third .podium-base {
		min-height: 95px;
	}

	.podium-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.podium-name {
		font-weight: 600;
		font-size: 11px;
		color: rgba(255, 255, 255, 0.9);
		line-height: 1.2;
		min-height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.podium-score {
		font-weight: 700;
		font-size: 14px;
		color: white;
		margin-top: 4px;
	}

	.first .podium-name {
		font-size: 12px;
		min-height: 58px;
	}

	.first .podium-score {
		font-size: 16px;
	}

	.level-icon {
		font-size: 24px;
		margin-top: 4px;
		color: #fbbf24;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
	}
</style>
