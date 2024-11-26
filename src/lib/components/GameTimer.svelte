<script>
  import { onDestroy, onMount } from 'svelte';
  import { base } from '$app/paths';
  import lolReminders from '$lib/data/lol-reminders.json';
  import deadlockReminders from '$lib/data/deadlock-reminders.json';
  import { getLiveGameData, getActivePlayer, detectPlayerRole } from '$lib/services/liveGameService';

  export let gameType = 'lol';
  export let selectedRole = "Any";
  export let volume = 0.5;
  export let useTTS = false;
  export let minimapEnabled = true;
  export let roleRemindersEnabled = true;
  export let objectiveRemindersEnabled = true;
  export let macroRemindersEnabled = true;
  export let isRunning = false;
  let lastMacroReminder = 0;
  let isLiveGame = false;
  let liveGameInterval;
  let gamePollingInterval;
  let lastEventId = 0;

  let seconds = 0;
  let minutes = 0;
  let timerInterval;
  let reminderInterval;
  let isMuted = false;
  let consoleMessages = [];
  let minimapStartTime = 91;  // 1:31 in seconds
  let lastNotificationTime = 0;

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

  async function checkLiveGame() {
  try {
    const gameData = await getLiveGameData();
    if (gameData && gameData.gameData) {
      isLiveGame = true;
      // Convert gameTime to minutes and seconds
      const gameTime = gameData.gameData.gameTime;
      minutes = Math.floor(gameTime / 60);
      seconds = Math.floor(gameTime % 60);

      // Auto-detect role if not already set
      if (selectedRole === "Any") {
        const activePlayer = await getActivePlayer();
        const detectedRole = await detectPlayerRole(activePlayer, gameData.allPlayers);
        if (detectedRole !== "Any") {
          selectedRole = detectedRole;
        }
      }

      return true;
    }
  } catch {
    isLiveGame = false;
  }
  return false;
}

function startLiveGameSync() {
  liveGameInterval = setInterval(async () => {
    try {
      const gameData = await getLiveGameData();
      if (gameData && gameData.gameData) {
        const gameTime = gameData.gameData.gameTime;
        minutes = Math.floor(gameTime / 60);
        seconds = Math.floor(gameTime % 60);

        // Check for new events
        if (gameData.events) {
          gameData.events.Events.forEach(event => {
            if (event.EventID > lastEventId) {
              handleGameEvent(event);
              lastEventId = event.EventID;
            }
          });
        }
      } else {
        clearInterval(liveGameInterval);
        isLiveGame = false;
      }
    } catch (error) {
      console.error('Error syncing game data:', error);
      clearInterval(liveGameInterval);
      isLiveGame = false;
    }
  }, 1000);
}

function handleGameEvent(event) {
  // Handle various game events
  switch (event.EventName) {
    case 'DragonKill':
      addReminder({
        message: `${event.DragonType} Dragon taken. Next dragon in 5 minutes.`,
        role: "Any",
        type: "objective"
      }, minutes * 60 + seconds);
      break;
    case 'HeraldKill':
      addReminder({
        message: "Herald taken. Next herald spawns in 6 minutes.",
        role: "Any",
        type: "objective"
      }, minutes * 60 + seconds);
      break;
    case 'BaronKill':
      addReminder({
        message: "Baron taken. Next baron spawns in 6 minutes.",
        role: "Any",
        type: "objective"
      }, minutes * 60 + seconds);
      break;
  }
}

async function pollForGame() {
  gamePollingInterval = setInterval(async () => {
    if (!isLiveGame) {
      try {
        const hasLiveGame = await checkLiveGame();
        if (hasLiveGame && !isRunning) {
          toggleTimer();
        }
      } catch (error) {
        console.error('Error polling for game:', error);
      }
    }
  }, 5000);  // Check every 5 seconds for a new game
}

  async function toggleTimer() {
    if (isRunning) {
      clearInterval(timerInterval);
      clearInterval(liveGameInterval);
      clearReminderInterval();
      isRunning = false;
      playSound(pauseSound);
    } else {
      const hasLiveGame = await checkLiveGame();
      isRunning = true;
      playSound(startSound);

      if (hasLiveGame) {
        startLiveGameSync();
      } else {
        // Fallback to manual timer
        timerInterval = setInterval(() => {
          seconds++;
          if (seconds === 60) {
            seconds = 0;
            minutes++;
          }
          const totalSeconds = minutes * 60 + seconds;
          checkReminders(totalSeconds);
        }, 1000);
      }
      startReminderInterval();
    }
  }

  onMount(() => {
    startSound = new Audio(`${base}/audio/start.wav`);
    pauseSound = new Audio(`${base}/audio/pause.wav`);
    endSound = new Audio(`${base}/audio/end.wav`);
    minimapSound = new Audio(`${base}/audio/minimap.wav`);
    reminderSound = new Audio(`${base}/audio/reminder.wav`);
    pollForGame();

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
  

  function getRandomReminder(pool) {
    const index = Math.floor(Math.random() * pool.length);
    return pool[index];
  }

  function getMacroPhase(totalSeconds) {
    if (totalSeconds <= 600) return "early";
    if (totalSeconds <= 1200) return "mid";
    return "late";
  }

  function shouldShowReminder(reminder) {
    // Check if reminder type is enabled
    if (reminder.type === 'role' && !roleRemindersEnabled) return false;
    if (reminder.type === 'objective' && !objectiveRemindersEnabled) return false;
    if (reminder.type === 'macro' && !macroRemindersEnabled) return false;

    // Check if role matches
    return reminder.role === "Any" || reminder.role === selectedRole;
  }

  function getRandomMacroReminder(poolArray, currentRole) {
    // Filter the pool for relevant role messages
    const relevantPools = poolArray.filter(pool => 
      pool.role === "Any" || pool.role === currentRole
    );

    if (relevantPools.length === 0) return null;

    // Randomly select a pool (Any or role-specific)
    const selectedPool = relevantPools[Math.floor(Math.random() * relevantPools.length)];
    
    // Randomly select a message from the chosen pool
    const message = selectedPool.messages[Math.floor(Math.random() * selectedPool.messages.length)];

    return {
      message,
      role: selectedPool.role
    };
  }

  function checkMacroReminders(totalSeconds) {
    if (!macroRemindersEnabled) return;

    const phase = getMacroPhase(totalSeconds);
    const macroConfig = gameData.reminders.macro[phase];

    if (totalSeconds >= macroConfig.timeRange[0] && 
        totalSeconds <= macroConfig.timeRange[1] && 
        totalSeconds >= lastMacroReminder + macroConfig.interval) {
      
      const reminder = getRandomMacroReminder(macroConfig.pool, selectedRole);
      
      if (reminder) {
          lastNotificationTime = totalSeconds;
          consoleMessages = [
            { 
              time: formatTime(totalSeconds),
              message: reminder.message,
              role: reminder.role,
              type: "macro"
            },
            ...consoleMessages
          ];

          if (useTTS) {
            speak(reminder.message);
          } else {
            playSound(reminderSound);
          }

          lastMacroReminder = totalSeconds;
      }
    }
  }

  function checkReminders(totalSeconds) {
    // Check regular (objective and role) reminders
    const objectiveReminders = gameData.reminders.objective || [];
    const roleReminders = gameData.reminders.role || [];
    
    if (objectiveRemindersEnabled) {
      objectiveReminders.forEach(reminder => {
        if (totalSeconds === reminder.time && 
            (reminder.role === "Any" || reminder.role === selectedRole)) {
          addReminder(reminder, totalSeconds);
        }
      });
    }

    if (roleRemindersEnabled) {
      roleReminders.forEach(reminder => {
        if (totalSeconds === reminder.time && 
            (reminder.role === "Any" || reminder.role === selectedRole)) {
          addReminder(reminder, totalSeconds);
        }
      });
    }

    // Check macro reminders
    checkMacroReminders(totalSeconds);
  }

  function addReminder(reminder, totalSeconds) {
    lastNotificationTime = totalSeconds;
    consoleMessages = [
      { 
        time: formatTime(totalSeconds),
        message: reminder.message,
        role: reminder.role,
        type: reminder.type || 'objective'
      },
      ...consoleMessages
    ];

    if (useTTS) {
      speak(reminder.message);
    } else {
      playSound(reminderSound);
    }
}

  function adjustTime(direction) {
    const totalSeconds = minutes * 60 + seconds + direction * 60;
    if (totalSeconds >= 0) {  // Prevent negative time
      minutes = Math.floor(totalSeconds / 60);
      seconds = totalSeconds % 60;
    }
  }

  // Watch for changes to reminder settings
  $: {
    // When any reminder setting changes and timer is running
    if (isRunning) {
      clearReminderInterval();
      startReminderInterval();
    }
  }

  // Watch for changes to reminder settings
  $: {
    if (isRunning) {
      const totalSeconds = minutes * 60 + seconds;
      if (objectiveRemindersEnabled || roleRemindersEnabled || macroRemindersEnabled) {
        // Re-check reminders at current time when settings change
        checkReminders(totalSeconds);
      }
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
    
    const currentTotalSeconds = minutes * 60 + seconds;
    
    // Don't show if before 1:31 or if another notification was shown in last 5 seconds
    if (currentTotalSeconds < minimapStartTime || 
        (currentTotalSeconds - lastNotificationTime) < 5) {
        return;
    }
    
    lastNotificationTime = currentTotalSeconds;
    consoleMessages = [
        { 
            time: formatTime(currentTotalSeconds),
            message: "Check Minimap",
            role: "Any",
            type: "minimap"
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
    clearInterval(liveGameInterval);
    clearInterval(gamePollingInterval);
    clearReminderInterval();
  });

  function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // Add minimap to the type color function
  function getTypeColor(type) {
    switch (type) {
      case 'role':
        return 'bg-blue-600 text-white';
      case 'objective':
        return 'bg-yellow-600 text-white';
      case 'macro':
        return 'bg-purple-600 text-white';
      case 'minimap':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  }

  function formatType(type) {
    switch (type) {
      case 'role':
        return 'Role';
      case 'objective':
        return 'Objective';
      case 'macro':
        return 'Macro';
      case 'minimap':
        return 'Minimap';
      default:
        return type;
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
  {#if isLiveGame}
    <div class="text-green-500 text-sm mb-2 flex items-center justify-center gap-2">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Live Game Connected
    </div>
  {/if}
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
      <div class="text-sm text-gray-300 font-mono mt-1 flex items-center gap-2">
        <span>[{latestMessage.time}]</span>
        {#if latestMessage.role !== "Any"}
          <span class="px-2 py-0.5 bg-gray-600 rounded-full text-xs">
            {latestMessage.role}
          </span>
        {/if}
        <span class="px-2 py-0.5 {getTypeColor(latestMessage.type)} rounded-full text-xs">
          {formatType(latestMessage.type)}
        </span>
      </div>
    </div>
  {/if}

  <!-- Message History Console -->
  <div class="max-w-md mx-auto bg-gray-800 rounded-lg p-4 h-192 overflow-y-auto text-left">
    {#if consoleMessages.length > 1}
      {#each consoleMessages.slice(1) as message}
        <div class="border-b border-gray-700 py-2">
          <span class="font-mono text-gray-400">[{message.time}]</span>
          <span class="ml-2 text-gray-200">{message.message}</span>
          <div class="flex gap-2 mt-1">
            {#if message.role !== "Any"}
              <span class="px-2 py-0.5 bg-gray-700 rounded-full text-xs text-gray-300">
                {message.role}
              </span>
            {/if}
            <span class="px-2 py-0.5 {getTypeColor(message.type)} rounded-full text-xs">
              {formatType(message.type)}
            </span>
          </div>
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