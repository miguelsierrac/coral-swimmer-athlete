<script>
  import { onMount } from 'svelte';
  import Badge from '$lib/components/Badge.svelte';
  import BadgePopover from '$lib/components/BadgePopover.svelte';

  export let users = []; // All users from the leaderboard table
  export let allLevels = [];
  export let currentUserID;
  export let currentUserLevelId;
  export let badges = []; // User's badges/objectives
  export let userLevel = null; // Current level object
  export let specialty = null; // Optional specialty info

  let rankedUsers = [];
  let selectedLevelId = null;
  let activeTab = 'ranking'; // 'ranking' or 'badges'
  let selectedBadge = null;
  let popoverPosition = { top: 0, left: 0 };

  onMount(() => {
    selectedLevelId = currentUserLevelId;
  });

  $: {
    if (selectedLevelId) {
      rankedUsers = users
        .filter(u => u.level_id === selectedLevelId)
        .sort((a, b) => b.score - a.score)
        .map((user, index) => ({
          ...user,
          rank: index + 1
        }));
    }
  }

  $: currentLevel = allLevels.find(l => l.id === selectedLevelId);
  
  $: totalBadgePoints = badges.reduce((sum, badge) => {
    if (!badge.progress) return sum;
    const grade = userLevel?.objetivos?.find(obj => obj.id === badge.id)?.grados[badge.progress];
    return sum + (grade?.puntos || 0);
  }, 0);

  const medalIcons = ['🥇', '🥈', '🥉'];
  
  function getAvatarUrl(userId) {
    // Generate consistent avatar based on user id
    const seed = typeof userId === 'string' ? parseInt(userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) : userId;
    return `https://i.pravatar.cc/100?img=${(seed % 70) + 1}`;
  }
  
  function switchTab(tab) {
    activeTab = tab;
  }

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
</script>

<div class="leaderboard-container">
  <div class="modal-header">
    <h2>Tu Progreso</h2>
  </div>

  <div class="tabs-nav">
    <button class="tab-btn" class:active={activeTab === 'ranking'} on:click={() => switchTab('ranking')}>
      🏆 Ranking
    </button>
    <button class="tab-btn" class:active={activeTab === 'badges'} on:click={() => switchTab('badges')}>
      🎯 Mis Logros
    </button>
  </div>

  <div class="tab-content">
    {#if activeTab === 'ranking'}
      <div class="ranking-header">
        <h3>
          Ranking Nivel 
          <span class="level-tag" style="background: {currentLevel?.color || '#4285F4'};">{currentLevel?.icono || ''} {currentLevel?.nombre || ''}</span>
          {#if userLevel && userLevel.id !== selectedLevelId}
            <span class="user-level-chip" style="background: {userLevel.color};">{userLevel.icono} Tu nivel</span>
          {/if}
        </h3>
        <span class="total-players">{rankedUsers.length} Atletas compitiendo</span>
      </div>

      <div class="level-filter">
        {#each allLevels as level (level.id)}
          <button 
            class="level-tab" 
            class:active={selectedLevelId === level.id}
            on:click={() => selectedLevelId = level.id}
          >
            {level.icono} {level.nombre}
          </button>
        {/each}
      </div>
      
      <ul class="leaderboard-list">
        {#each rankedUsers as user (user.id)}
          <li class="rank-item" class:current-user={user.id === currentUserID}>
            <span class="rank-pos" class:top-3={user.rank <= 3}>
              {#if user.rank <= 3}
                {medalIcons[user.rank - 1]}
              {:else}
                {user.rank}
              {/if}
            </span>

            <img src={getAvatarUrl(user.id)} alt="Avatar" class="rank-avatar" />

            <div class="rank-info">
              <span class="rank-name">
                {user.forename} {user.surname}
                <small class="rank-level-icon">{user.level_icon}</small>
              </span>
            </div>

            <span class="rank-score">
              {new Intl.NumberFormat('es-ES').format(user.score)}
            </span>
          </li>
        {/each}
      </ul>
    {:else}
      <!-- Tab de Mis Logros -->
      <div class="level-hero" style="--lvl-color: {userLevel?.color || '#4285F4'};">
        <div class="level-icon-large">
          <span>{userLevel?.icono || '🎯'}</span>
        </div>
        <h3 class="level-title" style="color: {userLevel?.color || '#4285F4'};">
          Nivel {userLevel?.nombre || 'Desconocido'}
        </h3>
        <p class="level-desc">{userLevel?.descripcion || ''}</p>
        
        {#if specialty}
          <div class="specialty-chips-hero">
            <div class="specialty-chip-hero tool-chip">
              {specialty.tool === 'Monoaleta' ? '🦶' : '🏊'} {specialty.tool}
            </div>
            <div class="specialty-chip-hero mode-chip">
              {specialty.mode === 'Velocidad' ? '⚡' : '🌊'} {specialty.mode}
            </div>
          </div>
        {/if}
      </div>

      <div class="badges-section">
        <h4>Mis Insignias <span class="points-total">{totalBadgePoints} Pts en Logros</span></h4>
        
        <div class="badge-grid-compact">
          {#if badges && badges.length > 0}
            {#each badges as badge (badge.id)}
              {@const gradeClass = badge.progress ? `badge-item-${badge.progress}` : 'badge-item-locked'}
              <div class="badge-item-compact {gradeClass}" on:click={(e) => handleBadgeClick(e, badge)}>
                {#if badge.progress}
                  <span class="badge-tier-label-compact">{badge.progress}</span>
                {/if}
                <span class="badge-icon-compact">{badge.icono}</span>
                <span class="badge-name-compact">{badge.nombre}</span>
              </div>
            {/each}
          {:else}
            <p class="no-badges">No hay insignias disponibles.</p>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

{#if selectedBadge}
  <div class="popover-backdrop" on:click={closePopover}></div>
  <div class="popover-container" style="top: {popoverPosition.top}px; left: {popoverPosition.left}px;">
    <BadgePopover badge={selectedBadge} progress={selectedBadge.progress} />
  </div>
{/if}

<style>
  .leaderboard-container {
    background: white;
    border-radius: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    overflow: hidden;
    box-shadow: none;
  }
  
  .modal-header {
    padding: 20px 20px 0;
    background: #fff;
  }
  
  .modal-header h2 {
    margin: 0;
    font-size: 20px;
    color: #2c3e50;
  }

  .tabs-nav {
    display: flex;
    padding: 15px 20px 0;
    background: #fff;
    border-bottom: 1px solid #eee;
  }
  
  .tab-btn {
    flex: 1;
    padding: 12px;
    border: none;
    background: none;
    font-weight: 600;
    color: #7f8c8d;
    border-bottom: 3px solid transparent;
    cursor: pointer;
    transition: 0.3s;
    font-size: 14px;
  }
  
  .tab-btn.active {
    color: #4285F4;
    border-bottom-color: #4285F4;
  }

  .tab-content {
    padding: 20px;
    background: #f8faff;
    height: calc(100vh - 160px);
    overflow-y: auto;
  }
  
  .ranking-header {
    text-align: center;
    margin-bottom: 20px;
  }
  
  .ranking-header h3 {
    margin: 5px 0;
    color: #2c3e50;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 18px;
  }
  
  .level-tag {
    background: #4285F4;
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }

  .user-level-chip {
    background: #E91E63;
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  
  .total-players {
    font-size: 12px;
    color: #7f8c8d;
    font-weight: 600;
    display: block;
    margin-top: 5px;
  }

  .level-filter {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .level-tab {
    background: #e8e2dc;
    border: none;
    padding: 6px 12px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 600;
    color: #555;
    transition: all 0.2s ease;
  }
  
  .level-tab.active {
    background: var(--primary-blue, #4285F4);
    color: white;
    box-shadow: 0 2px 8px rgba(66, 133, 244, 0.4);
  }

  .leaderboard-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .rank-item {
    display: flex;
    align-items: center;
    background: white;
    padding: 12px 15px;
    border-radius: 16px;
    margin-bottom: 10px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);
    border: 1px solid transparent;
    transition: all 0.2s ease;
  }
  
  .rank-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  }
  
  .rank-item.current-user {
    border-color: #4285F4;
    background: #f0f7ff;
  }

  .rank-pos {
    font-size: 16px;
    font-weight: 800;
    color: #7f8c8d;
    width: 30px;
    text-align: center;
    margin-right: 10px;
  }
  
  .rank-pos.top-3 {
    font-size: 22px;
  }

  .rank-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    margin-right: 15px;
    border: 2px solid #fff;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    object-fit: cover;
  }
  
  .rank-info {
    flex: 1;
    text-align: left;
  }
  
  .rank-name {
    display: block;
    font-weight: 700;
    color: #2c3e50;
    font-size: 14px;
  }
  
  .rank-level-icon {
    font-size: 12px;
    margin-left: 4px;
  }

  .rank-score {
    font-size: 16px;
    font-weight: 900;
    color: #4285F4;
  }

  /* Estilos de la pestaña de logros */
  .level-hero {
    background: white;
    border-radius: 20px;
    padding: 20px 16px;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
    margin-bottom: 20px;
    position: relative;
    overflow: hidden;
  }
  
  .level-hero::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 8px;
    background: var(--lvl-color, #4285F4);
  }
  
  .level-icon-large {
    font-size: 44px;
    background: #f8faff;
    width: 75px;
    height: 75px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    margin: 0 auto 12px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
    border: 3px solid white;
  }
  
  .level-title {
    font-size: 20px;
    font-weight: 900;
    margin: 0;
    color: #2c3e50;
  }
  
  .level-desc {
    color: #7f8c8d;
    font-size: 14px;
    margin: 10px 0 20px;
  }

  .specialty-chips-hero {
    display: flex;
    gap: 8px;
    justify-content: center;
    margin-top: 12px;
  }

  .specialty-chip-hero {
    padding: 6px 14px;
    border-radius: 16px;
    font-size: 11px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .specialty-chip-hero.tool-chip {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .specialty-chip-hero.mode-chip {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  .badges-section h4 {
    font-size: 16px;
    color: #2c3e50;
    margin: 0 0 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .points-total {
    font-size: 12px;
    color: #4285F4;
    background: #e0e7ff;
    padding: 4px 10px;
    border-radius: 12px;
  }

  .badge-grid-compact {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    width: 100%;
  }
  
  .badge-item-compact {
    background: white;
    border-radius: 18px;
    padding: 8px 6px;
    text-align: center;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
    position: relative;
    border: 2px solid transparent;
    transition: transform 0.2s;
    cursor: pointer;
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: visible;
    box-sizing: border-box;
  }
  
  .badge-item-compact:hover {
    transform: translateY(-3px);
  }
  
  .badge-icon-compact {
    font-size: 26px;
    margin-bottom: 6px;
    display: inline-block;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }
  
  .badge-name-compact {
    display: block;
    font-size: 9px;
    font-weight: 700;
    color: #2c3e50;
    line-height: 1.2;
  }
  
  .badge-tier-label-compact {
    position: absolute;
    top: -6px;
    right: -6px;
    font-size: 8px;
    font-weight: 800;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 8px;
    color: white;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }

  /* Estilos metálicos */
  .badge-item-bronce {
    border-color: #CD7F32;
    background: linear-gradient(to bottom right, #fff, #fffaf5);
  }
  
  .badge-item-bronce .badge-tier-label-compact {
    background: linear-gradient(135deg, #E7CBAE, #CD7F32);
  }

  .badge-item-plata {
    border-color: #C0C0C0;
    background: linear-gradient(to bottom right, #fff, #f8f9fa);
  }
  
  .badge-item-plata .badge-tier-label-compact {
    background: linear-gradient(135deg, #F0F0F0, #C0C0C0);
    color: #555;
  }

  .badge-item-oro {
    border-color: #FFD700;
    background: linear-gradient(to bottom right, #fff, #fffdf0);
    box-shadow: 0 8px 20px rgba(255, 215, 0, 0.15);
  }
  
  .badge-item-oro .badge-tier-label-compact {
    background: linear-gradient(135deg, #FFF7CC, #FFD700);
    color: #7a6000;
  }

  .badge-item-locked {
    opacity: 0.4;
    filter: grayscale(1);
    border: 2px dashed #ccc;
  }

  .no-badges {
    grid-column: 1 / -1;
    text-align: center;
    color: #7f8c8d;
    padding: 20px;
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
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
</style>
