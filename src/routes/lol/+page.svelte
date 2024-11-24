<!-- src/routes/lol/+page.svelte -->
<script>
  import GameTimer from '$lib/components/GameTimer.svelte';
</script>

<div class="max-w-2xl mx-auto">
  <h1 class="text-2xl font-bold mb-8">League of Legends</h1>
  
  <div class="bg-white shadow-lg rounded-lg p-6">
    <GameTimer gameType="lol" />
  </div>
</div>