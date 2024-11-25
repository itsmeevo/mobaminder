<!-- src/lib/components/SettingsPanel.svelte -->
<script>
    export let selectedRole = "Any";
    export let roles = ["Any"];
    export let volume = 0.5;
    export let useTTS = false;
    export let minimapEnabled = true;
    export let roleRemindersEnabled = true;
    export let objectiveRemindersEnabled = true;
    export let macroRemindersEnabled = true;
    export let isRunning = false;
</script>
  
  <div class="bg-gray-800 shadow-lg rounded-lg p-6">
    <h2 class="text-xl font-bold mb-6 text-gray-100 text-center">Settings</h2>
    
    <!-- Role Settings -->
    <div class="mb-6">
      <label for="role" class="block text-sm font-medium text-gray-300 mb-2">Role Select</label>
      <select
        id="role"
        bind:value={selectedRole}
        class="w-full py-2 px-3 border border-gray-600 bg-gray-700 text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        disabled={isRunning}
      >
        {#each roles as role}
          <option value={role}>{role}</option>
        {/each}
      </select>
    </div>
  
    <!-- Sound Settings -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-300 mb-2">Volume Control</label>
      <div class="flex items-center space-x-2 mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" />
        </svg>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          bind:value={volume}
          class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
        />
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" />
        </svg>
      </div>
      <div class="flex items-center space-x-2">
        <label class="text-gray-400 text-sm">Use Text To Speech (Background Mode)</label>
        <input 
          type="checkbox" 
          bind:checked={useTTS}
          class="form-checkbox h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
        />
      </div>
    </div>
  
    <!-- Reminder Settings -->
    <div class="mb-6">
        <label class="block text-sm font-medium text-gray-300 mb-2">Reminder Types</label>
        
        <!-- Minimap Reminders -->
        <div class="flex items-center space-x-2 mb-2">
            <input 
                type="checkbox" 
                id="minimapToggle"
                bind:checked={minimapEnabled}
                class="form-checkbox h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <label for="minimapToggle" class="text-gray-300 text-sm">
                Minimap Reminders
            </label>
        </div>

        <!-- Role Reminders -->
        <div class="flex items-center space-x-2 mb-2">
            <input 
                type="checkbox" 
                id="roleToggle"
                bind:checked={roleRemindersEnabled}
                class="form-checkbox h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <label for="roleToggle" class="text-gray-300 text-sm">
                Role-Specific Reminders
            </label>
        </div>

        <!-- Objective Reminders -->
        <div class="flex items-center space-x-2 mb-2">
            <input 
                type="checkbox" 
                id="objectiveToggle"
                bind:checked={objectiveRemindersEnabled}
                class="form-checkbox h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <label for="objectiveToggle" class="text-gray-300 text-sm">
                Objective Reminders
            </label>
        </div>

        <!-- Macro Reminders -->
        <div class="flex items-center space-x-2">
            <input 
                type="checkbox" 
                id="macroToggle"
                bind:checked={macroRemindersEnabled}
                class="form-checkbox h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <label for="macroToggle" class="text-gray-300 text-sm">
                Macro Play Reminders
            </label>
        </div>
    </div>
  </div>