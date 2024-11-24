<!-- src/lib/components/GameTimer.svelte -->
<script>
    import { onDestroy, onMount } from 'svelte';
    import lolReminders from '$lib/data/lol-reminders.json';
    import deadlockReminders from '$lib/data/deadlock-reminders.json';
  
    export let gameType = 'lol';
  
    let seconds = 0;
    let minutes = 0;
    let hours = 0;
    let timerInterval;
    let reminderInterval;
    let isRunning = false;
    let isMuted = false;
    let volume = 0.5;
    let consoleMessages = [];
    let selectedRole = "Any";

  // Get the appropriate roles based on game type
  $: gameData = gameType === 'lol' ? lolReminders : deadlockReminders;
  $: roles = ["Any", ...gameData.roles.map(r => r.name)];
  
    // Audio elements
    let startSound;
    let pauseSound;
    let endSound;
    let minimapSound;
    let reminderSound;
  
    onMount(() => {
      startSound = new Audio('/audio/start.wav');
      pauseSound = new Audio('/audio/pause.wav');
      endSound = new Audio('/audio/end.wav');
      minimapSound = new Audio('/audio/minimap.wav');
      reminderSound = new Audio('/audio/reminder.wav');
  
      // Preload sounds and set initial volumes
      [startSound, pauseSound, endSound, minimapSound, reminderSound].forEach(sound => {
        sound.load();
        sound.volume = volume;
      });
    });
  
    // Update all sound volumes when the volume slider changes
    $: {
      if (startSound) {
        [startSound, pauseSound, endSound, minimapSound, reminderSound].forEach(sound => {
          sound.volume = volume;
        });
      }
    }
  
    function playSound(sound) {
      if (!isMuted) {
        sound.play();
      }
    }
  
    function checkReminders(totalSeconds) {
        const reminders = gameData.reminders;
        
        reminders.forEach(reminder => {
        if (totalSeconds === reminder.time && 
            (reminder.role === "Any" || reminder.role === selectedRole)) {
            consoleMessages = [
            { 
                time: formatTime(totalSeconds),
                message: reminder.message,
                role: reminder.role
            },
            ...consoleMessages
            ];
            playSound(reminderSound);
        }
        });
    }

    function startReminderInterval() {
      reminderInterval = setInterval(() => {
        playSound(minimapSound);
      }, 15000);
    }
  
    function clearReminderInterval() {
      if (reminderInterval) {
        clearInterval(reminderInterval);
      }
    }
  
    function formatTime(totalSeconds) {
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
  
    function toggleTimer() {
      if (isRunning) {
        clearInterval(timerInterval);
        clearReminderInterval();
        isRunning = false;
        playSound(pauseSound);
      } else {
        isRunning = true;
        playSound(startSound);
        timerInterval = setInterval(() => {
          seconds++;
          if (seconds === 60) {
            seconds = 0;
            minutes++;
            if (minutes === 60) {
              minutes = 0;
              hours++;
            }
          }
          const totalSeconds = hours * 3600 + minutes * 60 + seconds;
          checkReminders(totalSeconds);
        }, 1000);
        startReminderInterval();
      }
    }
  
    function endGame() {
    clearInterval(timerInterval);
    clearReminderInterval();
    isRunning = false;
    seconds = 0;
    minutes = 0;
    hours = 0;
    consoleMessages = [];
    playSound(endSound);
  }
  
    onDestroy(() => {
      clearInterval(timerInterval);
      clearReminderInterval();
    });
  
    $: formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    $: hasTime = seconds > 0 || minutes > 0 || hours > 0;
    $: buttonText = isRunning ? 'Pause' : (hasTime ? 'Resume' : 'Start Game');
    $: latestMessage = consoleMessages[0]; // Get the most recent message
</script>

<div class="text-center">
    <div class="text-4xl font-mono mb-4">{formattedTime}</div>
    
    <!-- Role selector -->
    <div class="mb-4">
      <label for="role" class="block text-sm font-medium text-gray-700 mb-2">Select Role</label>
      <select
        id="role"
        bind:value={selectedRole}
        class="mt-1 block w-48 mx-auto py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        disabled={isRunning}
      >
        {#each roles as role}
          <option value={role}>{role}</option>
        {/each}
      </select>
    </div>
  
    <!-- Game control buttons -->
    <div class="space-x-4 mb-4">
      <button
        on:click={toggleTimer}
        class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded {isRunning ? 'bg-yellow-500 hover:bg-yellow-600' : (hasTime ? 'bg-blue-500 hover:bg-blue-600' : '')}"
      >
        {buttonText}
      </button>
      <button
        on:click={endGame}
        class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
      >
        End Game
      </button>
    </div>
  
    <!-- Audio controls section -->
<div class="flex items-center justify-center space-x-4 mb-6">
  <!-- Role selector and volume controls in a row -->
  <div class="flex items-center space-x-8">
    <!-- Volume controls -->
    <div class="flex items-center space-x-2">
        <div class="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" />
          </svg>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            bind:value={volume}
            class="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" />
          </svg>
        </div>
      </div>
    </div>
  </div>
    
    <!-- Latest Message Banner -->
    {#if latestMessage}
      <div class="max-w-md mx-auto mb-4 bg-blue-50 border border-blue-100 rounded-lg p-4 animate-fade-in">
        <div class="text-xl font-semibold text-blue-900">
          {latestMessage.message}
        </div>
        <div class="text-sm text-blue-600 font-mono mt-1">
          [{latestMessage.time}] {#if latestMessage.role !== "Any"}
            <span class="ml-2 px-2 py-0.5 bg-blue-100 rounded-full text-xs">
              {latestMessage.role}
            </span>
          {/if}
        </div>
      </div>
    {/if}
  
    <!-- Message History Console -->
    <div class="max-w-md mx-auto bg-gray-100 rounded-lg p-4 h-48 overflow-y-auto text-left">
      {#if consoleMessages.length > 1}
        {#each consoleMessages.slice(1) as message}
          <div class="border-b border-gray-200 py-2">
            <span class="font-mono text-gray-500">[{message.time}]</span>
            <span class="ml-2">{message.message}</span>
            {#if message.role !== "Any"}
              <span class="ml-2 px-2 py-0.5 bg-gray-200 rounded-full text-xs text-gray-700">
                {message.role}
              </span>
            {/if}
          </div>
        {/each}
      {/if}
      {#if consoleMessages.length === 0}
        <div class="text-gray-500 text-center italic">
          Game events will appear here...
        </div>
      {/if}
    </div>
  </div>

<style>
  .animate-fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>