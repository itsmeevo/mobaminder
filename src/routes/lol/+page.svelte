<script>
  import GameTimer from '$lib/components/GameTimer.svelte';
  import SettingsPanel from '$lib/components/SettingsPanel.svelte';
  import lolReminders from '$lib/data/lol-reminders.json';
  
  const gameType = 'lol';
  let selectedRole = "Any";
  let volume = 0.5;
  let useTTS = false;
  let minimapEnabled = true;
  let roleRemindersEnabled = true;
  let objectiveRemindersEnabled = true;
  let macroRemindersEnabled = true;
  let isRunning = false;

  $: roles = ["Any", ...lolReminders.roles.map(r => r.name)];
</script>

<div class="max-w-5xl mx-auto">
  <h1 class="text-2xl font-bold mb-8 text-center text-gray-100">League of Legends</h1>
  
  <div class="grid grid-cols-3 gap-6">
    <div class="col-span-2">
      <GameTimer 
        {gameType}
        bind:selectedRole
        bind:volume
        bind:useTTS
        bind:minimapEnabled
        bind:roleRemindersEnabled
        bind:objectiveRemindersEnabled
        bind:macroRemindersEnabled
        bind:isRunning
      />
    </div>

    <div>
      <SettingsPanel
        bind:selectedRole
        {roles}
        bind:volume
        bind:useTTS
        bind:minimapEnabled
        bind:roleRemindersEnabled
        bind:objectiveRemindersEnabled
        bind:macroRemindersEnabled
        {isRunning}
      />
    </div>
  </div>
</div>