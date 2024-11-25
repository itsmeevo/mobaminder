<script>
  import { onDestroy, onMount } from 'svelte';
  import { base } from '$app/paths';
  import lolReminders from '$lib/data/lol-reminders.json';
  import deadlockReminders from '$lib/data/deadlock-reminders.json';

  export let gameType = 'lol';

  let seconds = 0;
  let minutes = 0;
  let timerInterval;
  let reminderInterval;
  let isRunning = false;
  let isMuted = false;
  let volume = 0.5;
  let useTTS = false;
  let minimapEnabled = true;
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

  function speak(text) {
      if (useTTS && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.volume = volume;
          window.speechSynthesis.speak(utterance);
      }
  }

  onMount(() => {
    startSound = new Audio(`${base}/audio/start.wav`);
    pauseSound = new Audio(`${base}/audio/pause.wav`);
    endSound = new Audio(`${base}/audio/end.wav`);
    minimapSound = new Audio(`${base}/audio/minimap.wav`);
    reminderSound = new Audio(`${base}/audio/reminder.wav`);

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
    if (!isMuted && !useTTS) {
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
              if (useTTS) {
                  speak(reminder.message);
              } else {
                  playSound(reminderSound);
              }
          }
      });
  }

  function adjustTime(direction) {
    const totalSeconds = minutes * 60 + seconds + direction * 60;
    if (totalSeconds >= 0) {  // Prevent negative time
      minutes = Math.floor(totalSeconds / 60);
      seconds = totalSeconds % 60;
    }
  }
  
  function clearReminderInterval() {
        if (reminderInterval) {
            clearInterval(reminderInterval);
            reminderInterval = null;
        }
    }

    function addMinimapReminder() {
        if (!minimapEnabled) return;
        
        consoleMessages = [
            { 
                time: formatTime(minutes * 60 + seconds),
                message: "Check Minimap",
                role: "Any"
            },
            ...consoleMessages
        ];
        if (useTTS) {
            speak("Check Minimap");
        } else {
            playSound(minimapSound);
        }
    }

    function startReminderInterval() {
        clearReminderInterval();
        if (minimapEnabled) {
            reminderInterval = setInterval(() => {
                addMinimapReminder();
            }, 15000);
        }
    }

    // Watch for changes to minimapEnabled
    $: {
        if (isRunning) {
            startReminderInterval();
        }
    }

    onDestroy(() => {
        clearInterval(timerInterval);
        clearReminderInterval();
    });

  function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
        }
        const totalSeconds = minutes * 60 + seconds;
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
    consoleMessages = [];
    playSound(endSound);
  }

  onDestroy(() => {
    clearInterval(timerInterval);
    clearReminderInterval();
  });

  $: formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  $: hasTime = seconds > 0 || minutes > 0;
  $: buttonText = isRunning ? 'Pause' : (hasTime ? 'Resume' : 'Start Game');
  $: latestMessage = consoleMessages[0]; // Get the most recent message
</script>

<div class="text-center text-gray-100">
  <!-- Minimap Toggle -->
  <div class="absolute top-4 right-4 flex items-center space-x-2">
    <input 
        type="checkbox" 
        id="minimapToggle"
        bind:checked={minimapEnabled}
        class="form-checkbox h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
    />
    <label 
        for="minimapToggle" 
        class="text-gray-300 text-sm"
    >
        Minimap Reminders
    </label>
</div>

  <div class="flex justify-center items-center gap-2 mb-4">
      <div class="text-4xl font-mono text-gray-100">{formattedTime}</div>
      <div class="flex flex-col">
          <button
              on:click={() => adjustTime(1)}
              class="text-gray-400 hover:text-gray-200"
          >
              ▲
          </button>
          <button
              on:click={() => adjustTime(-1)}
              class="text-gray-400 hover:text-gray-200"
          >
              ▼
          </button>
      </div>
  </div>
  
  <!-- Role selector -->
  <div class="mb-4">
    <label for="role" class="block text-sm font-medium text-gray-300 mb-2">Select Role</label>
    <select
      id="role"
      bind:value={selectedRole}
      class="mt-1 block w-48 mx-auto py-2 px-3 border border-gray-600 bg-gray-700 text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
      class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded {isRunning ? 'bg-yellow-600 hover:bg-yellow-700' : (hasTime ? 'bg-blue-600 hover:bg-blue-700' : '')}"
    >
      {buttonText}
    </button>
    <button
      on:click={endGame}
      class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
    >
      End Game
    </button>
  </div>

  <!-- Audio controls section -->
  <div class="flex items-center justify-center space-x-4 mb-6">
    <div class="flex items-center space-x-8">
      <!-- Volume controls -->
      <div class="flex items-center space-x-2">
          <div class="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" />
            </svg>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              bind:value={volume}
              class="w-24 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" />
            </svg>
          </div>
      </div>
      
      <!-- TTS Toggle -->
      <div class="flex items-center space-x-2">
          <label class="text-gray-400 text-sm">Use TTS</label>
          <input 
              type="checkbox" 
              bind:checked={useTTS}
              class="form-checkbox h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
          />
      </div>
    </div>
  </div>
  
  <!-- Latest Message Banner -->
  {#if latestMessage}
    <div class="max-w-md mx-auto mb-4 bg-gray-700 border border-gray-600 rounded-lg p-4 animate-fade-in">
      <div class="text-xl font-semibold text-gray-100">
        {latestMessage.message}
      </div>
      <div class="text-sm text-gray-300 font-mono mt-1">
        [{latestMessage.time}] {#if latestMessage.role !== "Any"}
          <span class="ml-2 px-2 py-0.5 bg-gray-600 rounded-full text-xs">
            {latestMessage.role}
          </span>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Message History Console -->
  <div class="max-w-md mx-auto bg-gray-800 rounded-lg p-4 h-48 overflow-y-auto text-left">
    {#if consoleMessages.length > 1}
      {#each consoleMessages.slice(1) as message}
        <div class="border-b border-gray-700 py-2">
          <span class="font-mono text-gray-400">[{message.time}]</span>
          <span class="ml-2 text-gray-200">{message.message}</span>
          {#if message.role !== "Any"}
            <span class="ml-2 px-2 py-0.5 bg-gray-700 rounded-full text-xs text-gray-300">
              {message.role}
            </span>
          {/if}
        </div>
      {/each}
    {/if}
    {#if consoleMessages.length === 0}
      <div class="text-gray-400 text-center italic">
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