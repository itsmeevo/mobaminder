// src/lib/services/liveGameService.js
export async function getLiveGameData() {
    try {
      const response = await fetch('https://127.0.0.1:2999/liveclientdata/allgamedata', {
        headers: new Headers({
          'Accept': 'application/json'
        }),
      });
      
      return await response.json();
    } catch (error) {
      return null;
    }
  }
  
  export async function getActivePlayer() {
    try {
      const response = await fetch('https://127.0.0.1:2999/liveclientdata/activeplayer', {
        headers: new Headers({
          'Accept': 'application/json'
        })
      });
      
      return await response.json();
    } catch (error) {
      return null;
    }
  }
  
  export async function detectPlayerRole(activePlayer, allPlayers) {
    if (!activePlayer || !allPlayers) return "Any";
  
    try {
      const player = allPlayers.find(p => p.summonerName === activePlayer.summonerName);
      if (!player) return "Any";
  
      // Check for jungle role based on Smite
      const hasSmite = player.summonerSpells?.summonerSpellOne?.name === "Smite" || 
                       player.summonerSpells?.summonerSpellTwo?.name === "Smite";
      if (hasSmite) return "Jungle";
  
      // Use position if available
      if (player.position) {
        const { x, y } = player.position;
        if (y > 7000) return "Top";
        if (y < 3000) return "Bot";
        if (Math.abs(x - y) < 1000) return "Mid";
      }
    } catch (error) {
      console.error('Error detecting role:', error);
    }
    
    return "Any";
  }