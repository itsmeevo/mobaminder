<script>
  import { onDestroy, onMount } from 'svelte';
  import { base } from '$app/paths';
  import lolReminders from '$lib/data/lol-reminders.json';
  import deadlockReminders from '$lib/data/deadlock-reminders.json';

  export let gameType = 'lol';
  export let selectedRole = "Any";
  export let volume = 0.5;
  export let useTTS = false;
  export let minimapEnabled = true;
  export let isRunning = false;  // Make this a prop instead of local state

  let seconds = 0;
  let minutes = 0;
  let timerInterval;
  let reminderInterval;
  let isMuted = false;
  let consoleMessages = [];

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
    isRunning = !isRunning;
    if (isRunning) {
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
    } else {
      clearInterval(timerInterval);
      clearReminderInterval();
      playSound(pauseSound);
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