/**
 * Market Mayhem Mode
 * Live GoldTrackr dashboard + real-time crypto/gold roast improv
 */

const marketMayhemMode = {
  id: "market-mayhem",
  name: "📈 Market Mayhem",
  icon: "💰",
  description: "Live GoldTrackr dashboard + real-time crypto/gold roast improv",
  
  activate: function() {
    const viewer = document.getElementById('viewerPanel') ||
                   document.getElementById('mainContent') ||
                   document.querySelector('.viewer-panel, .stage, .content-area');

    if (!viewer) {
      console.error("Viewer panel not found for Market Mayhem");
      return;
    }

    viewer.innerHTML = `
      <iframe 
        id="goldtrackr-iframe"
        src="https://test.1ink.us/gold/index.html"
        style="width:100%; height:100%; border:none; background:#0a0a0a; overflow:hidden;"
        allow="clipboard-write"
        allowfullscreen>
      </iframe>
    `;

    // Give the comedy engine perfect context
    if (typeof startImprovSession === 'function') {
      startImprovSession({
        scene: "market-mayhem",
        promptOverride: `The entire troupe is LIVE watching the GoldTrackr dashboard right now. Gold, BTC, ETH, SOL and other prices are moving in real time. React instantly to every pump, dump, wick, or flash crash. Chad drops degenerate grindset alpha, Philosopher questions the metaphysics of fiat, Scientist runs quick math on volatility, Comedian roasts the candles like a heckler, Unit-734 deadpans error beeps on red numbers. Keep all running gags alive.`
      });
    }

    startMarketPricePoll();   // <-- starts live price feed
  },

  deactivate: function() {
    stopMarketPricePoll();
  }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = marketMayhemMode;
}
