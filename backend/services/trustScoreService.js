const round = (value, digits = 2) =>
  Number(Number(value || 0).toFixed(digits));

const clamp = (value, min = 0, max = 100) =>
  Math.min(Math.max(Number(value || 0), min), max);

exports.calculateTrustScore = ({
  liquidityUSD = 0,
  marketCapUSD = 0,
  holders = 0,
  whaleRiskScore = 50,
  contractSafetyScore = 50,
  communityScore = 50,
}) => {
  liquidityUSD = Number(liquidityUSD || 0);
  marketCapUSD = Number(marketCapUSD || 0);
  holders = Number(holders || 0);

  let liquidityScore = 20;
  if (liquidityUSD >= 10000) liquidityScore = 45;
  if (liquidityUSD >= 50000) liquidityScore = 65;
  if (liquidityUSD >= 100000) liquidityScore = 80;
  if (liquidityUSD >= 500000) liquidityScore = 95;

  let holderScore = 20;
  if (holders >= 100) holderScore = 45;
  if (holders >= 500) holderScore = 65;
  if (holders >= 1000) holderScore = 80;
  if (holders >= 5000) holderScore = 95;

  const marketHealthScore =
    marketCapUSD > 0 && liquidityUSD > 0
      ? clamp((liquidityUSD / marketCapUSD) * 1000)
      : 35;

  const safeWhaleScore = 100 - clamp(whaleRiskScore);

  const trustScore = clamp(
    liquidityScore * 0.25 +
      holderScore * 0.2 +
      marketHealthScore * 0.15 +
      safeWhaleScore * 0.15 +
      clamp(contractSafetyScore) * 0.15 +
      clamp(communityScore) * 0.1
  );

  let riskLevel = "Medium";

  if (trustScore >= 80) riskLevel = "Low";
  if (trustScore < 60 && trustScore >= 40) riskLevel = "High";
  if (trustScore < 40) riskLevel = "Critical";

  const flags = [];

  if (liquidityUSD < 10000) flags.push("Low liquidity");
  if (holders < 100) flags.push("Low holder count");
  if (whaleRiskScore >= 70) flags.push("High whale concentration");
  if (contractSafetyScore < 60) flags.push("Contract safety needs review");
  if (communityScore < 50) flags.push("Weak community activity");

  let recommendation =
    "Token is under review. Check liquidity, holders, whale activity and contract safety.";

  if (riskLevel === "Low") {
    recommendation =
      "Token appears healthy based on current liquidity, holders, contract safety and community data.";
  }

  if (riskLevel === "High") {
    recommendation =
      "Token shows elevated risk. Trade carefully and avoid large exposure.";
  }

  if (riskLevel === "Critical") {
    recommendation =
      "Token is high risk. Listing or trading should be restricted until further review.";
  }

  return {
    liquidityScore: round(liquidityScore),
    holderScore: round(holderScore),
    marketHealthScore: round(marketHealthScore),
    whaleRiskScore: round(whaleRiskScore),
    contractSafetyScore: round(contractSafetyScore),
    communityScore: round(communityScore),
    trustScore: round(trustScore),
    riskLevel,
    flags,
    recommendation,
  };
};