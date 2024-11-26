// src/lib/services/liveGameService.js
export async function getLiveGameData() {
    try {
      const response = await fetch('/api/league/liveclientdata/allgamedata');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch live game data:', error);
      return null;
    }
  }
  
  export async function getActivePlayer() {
    try {
      const response = await fetch('/api/league/liveclientdata/activeplayer');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch active player data:', error);
      return null;
    }
  }
  export async function detectPlayerRole(activePlayer, allPlayers) {
    // This is a simple role detection based on player position and summoner spells
    if (!activePlayer || !allPlayers) return "Any";
  
    const player = allPlayers.find(p => p.summonerName === activePlayer.summonerName);
    if (!player) return "Any";
  
    // Check summoner spells for jungle
    const hasSmite = player.summonerSpells.summonerSpellOne.name === "Smite" || 
                     player.summonerSpells.summonerSpellTwo.name === "Smite";
    if (hasSmite) return "Jungle";
  
    // Use position on map to detect role
    const position = player.position;
    if (!position) return "Any";
  
    if (position.y > 7000) return "Top";
    if (position.y < 3000) return "Bot";
    if (Math.abs(position.x - position.y) < 1000) return "Mid";
    
    return "Any";
  }