const getSignalFromChange = (changePercent = 0) => {
  const change = Number(changePercent);

  if (change >= 2) return "bullish";
  if (change <= -2) return "bearish";
  if (change > 0) return "buy";
  if (change < 0) return "sell";

  return "neutral";
};

const getConfidence = (changePercent = 0, volume = 0) => {
  const change = Math.abs(Number(changePercent));
  const vol = Number(volume);

  let score = 60;

  if (change >= 1) score += 10;
  if (change >= 2) score += 15;
  if (change >= 5) score += 10;
  if (vol > 1000000) score += 5;
  if (vol > 10000000) score += 5;

  return Math.min(score, 98);
};

const buildTradingSignal = (market = {}) => {
  const price = Number(market.price || 0);
  const changePercent = Number(market.changePercent || 0);

  const signal = getSignalFromChange(changePercent);
  const confidence = getConfidence(changePercent, market.volume);

  return {
    module: "ai_trading_assistant",
    title: `${market.symbol || "BTCUSDT"} AI Signal`,
    description: `AI generated ${signal} signal based on live market data.`,
    symbol: market.symbol || "BTCUSDT",
    signal,
    confidence,
    price,
    value: price,
    status: "active",
    metadata: {
      entryPrice: price ? `${price.toLocaleString()} USDT` : "--",
      takeProfit: price ? `${(price * 1.025).toLocaleString()} USDT` : "--",
      stopLoss: price ? `${(price * 0.985).toLocaleString()} USDT` : "--",
      changePercent,
      volume: market.volume || 0,
    },
  };
};

const buildMarketScanner = (markets = []) => {
  return markets.map((market) => ({
    module: "ai_market_scanner",
    title: `${market.symbol} Market Scan`,
    description: "AI market scanner result from live market data.",
    symbol: market.symbol,
    signal: getSignalFromChange(market.changePercent),
    confidence: getConfidence(market.changePercent, market.volume),
    price: Number(market.price || 0),
    value: Number(market.volume || 0),
    status: "active",
    metadata: {
      changePercent: market.changePercent,
      volume: market.volume,
    },
  }));
};

module.exports = {
  getSignalFromChange,
  getConfidence,
  buildTradingSignal,
  buildMarketScanner,
};