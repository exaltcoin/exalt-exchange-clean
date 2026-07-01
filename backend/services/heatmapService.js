const round = (value, digits = 2) =>
  Number(Number(value || 0).toFixed(digits));

exports.calculateHeatmap = ({
  currentPrice = 0,
  buyVolumeUSD = 0,
  sellVolumeUSD = 0,
  transferVolumeUSD = 0,
  wallets = [],
}) => {
  const totalWhaleVolumeUSD =
    Number(buyVolumeUSD || 0) +
    Number(sellVolumeUSD || 0) +
    Number(transferVolumeUSD || 0);

  const buyPressure =
    totalWhaleVolumeUSD > 0 ? (buyVolumeUSD / totalWhaleVolumeUSD) * 100 : 0;

  const sellPressure =
    totalWhaleVolumeUSD > 0 ? (sellVolumeUSD / totalWhaleVolumeUSD) * 100 : 0;

  let signal = "Neutral";
  if (buyPressure >= sellPressure + 12) signal = "Bullish";
  if (sellPressure >= buyPressure + 12) signal = "Bearish";

  const largeWallets = wallets.filter(
    (w) => Number(w.amountUSD || 0) >= 500000
  ).length;

  let whaleScore =
    45 +
    buyPressure * 0.35 -
    sellPressure * 0.18 +
    wallets.length * 2 +
    largeWallets * 3;

  whaleScore = Math.max(0, Math.min(100, whaleScore));

  let heatLevel = "Cold";
  if (totalWhaleVolumeUSD >= 1000000) heatLevel = "Warm";
  if (totalWhaleVolumeUSD >= 10000000) heatLevel = "Hot";
  if (totalWhaleVolumeUSD >= 50000000) heatLevel = "Extreme";

  let riskLevel = "Medium";
  if (signal === "Bullish" && whaleScore >= 75 && sellPressure < 35) {
    riskLevel = "Low";
  }
  if (signal === "Bearish" || sellPressure >= 55) {
    riskLevel = "High";
  }

  let aiConfidence = 70 + wallets.length * 2 + largeWallets * 3;
  if (totalWhaleVolumeUSD >= 1000000) aiConfidence += 5;
  if (signal !== "Neutral") aiConfidence += 5;
  aiConfidence = Math.max(50, Math.min(99, aiConfidence));

  let recommendation =
    "Whale activity is balanced. Monitor price action before opening a trade.";

  if (signal === "Bullish") {
    recommendation =
      "Strong whale accumulation detected. Buyers are currently stronger than sellers.";
  }

  if (signal === "Bearish") {
    recommendation =
      "Heavy whale selling detected. Use caution and reduce risk exposure.";
  }

  if (heatLevel === "Extreme") {
    recommendation += " Extreme heat zone detected. Avoid over-leverage.";
  }

  return {
    currentPrice: round(currentPrice, 4),
    totalWhaleVolumeUSD: round(totalWhaleVolumeUSD),
    buyVolumeUSD: round(buyVolumeUSD),
    sellVolumeUSD: round(sellVolumeUSD),
    transferVolumeUSD: round(transferVolumeUSD),
    buyPressure: round(buyPressure),
    sellPressure: round(sellPressure),
    whaleScore: round(whaleScore),
    heatLevel,
    riskLevel,
    aiConfidence: round(aiConfidence),
    signal,
    recommendation,
  };
};