<!-- src/routes/deadlock/+page.svelte -->
<script>
  import GameTimer from '$lib/components/GameTimer.svelte';
  import SettingsPanel from '$lib/components/SettingsPanel.svelte';
  import deadlockReminders from '$lib/data/deadlock-reminders.json';
  
  const gameType = 'deadlock';
  let selectedRole = "Any";
  let volume = 0.5;
  let useTTS = false;
  let minimapEnabled = true;
  let isRunning = false;

  // Get roles from the JSON data
  $: roles = ["Any", ...deadlockReminders.roles.map(r => r.name)];
</script>

<div class="max-w-5xl mx-auto bg-gray-900">
  <h1 class="text-2xl font-bold mb-8 text-center text-gray-100">Deadlock</h1>
  
  <div class="grid grid-cols-3 gap-6">
    <!-- Main Timer Panel -->
    <div class="col-span-2">
      <GameTimer 
        {gameType}
        bind:selectedRole
        bind:volume
        bind:useTTS
        bind:minimapEnabled
        bind:isRunning
      />
    </div>

    <!-- Settings Panel -->
    <div>
      <SettingsPanel
        bind:selectedRole
        {roles}
        bind:volume
        bind:useTTS
        bind:minimapEnabled
        {isRunning}
      />
    </div>
  </div>
</div>