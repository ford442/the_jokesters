/**
 * Market Mayhem Helper Functions
 * Polls live prices from GoldTrackr iframe and feeds to comedy engine
 */

let marketPollInterval = null;

/**
 * Start polling for live market prices every 8 seconds
 */
function startMarketPricePoll() {
  if (marketPollInterval) clearInterval(marketPollInterval);

  marketPollInterval = setInterval(() => {
    const iframe = document.getElementById('goldtrackr-iframe');
    if (!iframe?.contentWindow) return;

    try {
      const prices = iframe.contentWindow.getLivePrices?.();
      if (prices) {
        const update = `📊 LIVE MARKET: Gold $${prices.gold || '—'} | BTC $${prices.btc || '—'} | ETH $${prices.eth || '—'} | SOL $${prices.sol || '—'}`;

        // Feed it wherever your engine expects live facts
        window.injectLiveFact?.(update);           // if you have this
        window.comedyEngine?.addObservation?.(update);
        window.updateSharedContext?.("market_prices", update);
      }
    } catch (e) {
      // silent — iframe might still be loading
    }
  }, 8000); // every 8 seconds — perfect rhythm for improv
}

/**
 * Stop the market price polling
 */
function stopMarketPricePoll() {
  if (marketPollInterval) {
    clearInterval(marketPollInterval);
    marketPollInterval = null;
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { startMarketPricePoll, stopMarketPricePoll };
}
