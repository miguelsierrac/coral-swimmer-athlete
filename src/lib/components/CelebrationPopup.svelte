<script>
    import { popup } from '$lib/stores';
    import confetti from 'canvas-confetti';
    import { tick } from 'svelte';

    let show = false;
    let title = '';
    let message = '';
    let achievements = [];
    let levelAchievements = [];
    let badgeAchievements = [];

    popup.subscribe(value => {
        if (value) {
            show = true;
            title = value.title;
            message = value.message;
            achievements = value.achievements;
            levelAchievements = achievements.filter(a => a.type === 'level');
            badgeAchievements = achievements.filter(a => a.type === 'badge');
        } else {
            show = false;
        }
    });

    $: {
        if (show) {
            tick().then(() => {
                const canvas = document.querySelector('#confetti-canvas');
                if(canvas) {
                    const myConfetti = confetti.create(canvas, {
                        resize: true,
                        useWorker: true
                    });
                    myConfetti({
                        particleCount: 200,
                        spread: 160
                    });
                }
            });
        }
    }

    function dismiss() {
        popup.set(null);
    }
</script>

{#if show}
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <canvas id="confetti-canvas" class="absolute inset-0 w-full h-full"></canvas>
    <div class="bg-white rounded-lg p-8 shadow-2xl text-center z-10 max-w-sm mx-auto">
        <h2 class="text-2xl font-bold mb-4">{title}</h2>
        <p class="mb-4">{message}</p>

        {#if levelAchievements.length > 0}
            <div class="mb-6">
                <h3 class="text-xl font-semibold text-blue-600 mb-2">¡Nuevo Nivel!</h3>
                {#each levelAchievements as achievement}
                    <div class="flex flex-col items-center p-4 bg-blue-50 rounded-lg">
                        <span class="text-5xl mb-2">{achievement.icon}</span>
                        <span class="text-2xl font-bold">{achievement.name}</span>
                    </div>
                {/each}
            </div>
        {/if}

        {#if badgeAchievements.length > 0}
            <div>
                <h3 class="text-lg font-semibold text-gray-700 mb-3">Nuevas Insignias</h3>
                <div class="grid grid-cols-3 gap-4">
                    {#each badgeAchievements as achievement}
                        <div class="flex flex-col items-center p-2 bg-gray-100 rounded-lg">
                            <span class="text-3xl">{achievement.icon}</span>
                            <span class="text-xs text-center mt-1">{achievement.name}</span>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}

        <button on:click={dismiss} class="mt-8 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full">
            Cerrar
        </button>
    </div>
</div>
{/if}
