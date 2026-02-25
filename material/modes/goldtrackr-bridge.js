/**
 * GoldTrackr Bridge Script
 * Add this to your GoldTrackr page (/gold/index.html) to enable price polling
 * 
 * Include at the bottom of your script tag:
 * <script src="./goldtrackr-bridge.js"></script>
 * 
 * Or paste directly at the bottom of your main script.
 */

// At the bottom of your script
window.getLivePrices = () => ({
  gold: currentGoldPrice,     // whatever your variables are
  btc: currentBtcPrice,
  eth: currentEthPrice,
  sol: currentSolPrice,
  // add any others you track
  timestamp: Date.now()
});
