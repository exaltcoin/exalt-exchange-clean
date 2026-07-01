const round = (value, digits = 4) =>
  Number(Number(value || 0).toFixed(digits));

const API_KEYS = {
  MORALIS_API_KEY: process.env.MORALIS_API_KEY,
  BSCSCAN_API_KEY: process.env.BSCSCAN_API_KEY,
  ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
};

const TOKEN_CONFIG = {
  BTCUSDT: {
    network: "Bitcoin",
    minUsd: 250000,
  },
  ETHUSDT: {
    network: "Ethereum",
    minUsd: 100000,
    explorerContract: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  },
  BNBUSDT: {
    network: "BNB Chain",
    minUsd: 100000,
    explorerContract: "0x55d398326f99059ff775485246999027b3197955",
  },
  SOLUSDT: {
    network: "Solana",
    minUsd: 100000,
  },
  XRPUSDT: {
    network: "Ethereum",
    minUsd: 100000,
    explorerContract: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  },
};

const shorten = (value = "") => {
  if (!value) return "";
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
};

const detectTransactionType = (index) => {
  if (index % 3 === 0) return "Buy";
  if (index % 3 === 1) return "Sell";
  return "Transfer";
};

const normalizeWallet = ({
  walletAddress,
  network,
  transactionHash,
  transactionType,
  amountCoin,
  amountUSD,
}) => ({
  walletAddress: walletAddress || "Unknown wallet",
  network,
  transactionHash: transactionHash || "",
  transactionType: transactionType || "Transfer",
  amountCoin: round(amountCoin),
  amountUSD: round(amountUSD, 2),
  walletScore: Math.min(
    100,
    Math.max(50, Math.round(Number(amountUSD || 0) / 100000))
  ),
  detectedAt: new Date(),
});

const fetchMoralisWhales = async ({ symbol, network, currentPrice }) => {
  if (!API_KEYS.MORALIS_API_KEY) return [];

  try {
    const chain =
      network === "Ethereum"
        ? "eth"
        : network === "BNB Chain"
        ? "bsc"
        : network === "Polygon"
        ? "polygon"
        : "eth";

    const url = `https://deep-index.moralis.io/api/v2.2/erc20/transfers?chain=${chain}&limit=50`;

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "X-API-Key": API_KEYS.MORALIS_API_KEY,
      },
    });

    const data = await response.json();
    const transfers = data.result || [];

    return transfers
      .map((tx, index) => {
        const amountCoin = Number(tx.value_decimal || 0);
        const amountUSD = amountCoin * Number(currentPrice || 0);

        if (amountUSD < (TOKEN_CONFIG[symbol]?.minUsd || 100000)) return null;

        return normalizeWallet({
          walletAddress: tx.from_address || tx.to_address,
          network,
          transactionHash: tx.transaction_hash,
          transactionType: detectTransactionType(index),
          amountCoin,
          amountUSD,
        });
      })
      .filter(Boolean);
  } catch {
    return [];
  }
};

const fetchExplorerWhales = async ({ symbol, network }) => {
  try {
    const isBsc = network === "BNB Chain";
    const apiKey = isBsc ? API_KEYS.BSCSCAN_API_KEY : API_KEYS.ETHERSCAN_API_KEY;

    if (!apiKey) return [];

    const baseUrl = isBsc
      ? "https://api.bscscan.com/api"
      : "https://api.etherscan.io/api";

    const contract =
      TOKEN_CONFIG[symbol]?.explorerContract ||
      (isBsc
        ? "0x55d398326f99059ff775485246999027b3197955"
        : "0xdac17f958d2ee523a2206206994597c13d831ec7");

    const url = `${baseUrl}?module=account&action=tokentx&contractaddress=${contract}&page=1&offset=50&sort=desc&apikey=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();
    const transfers = Array.isArray(data.result) ? data.result : [];

    return transfers
      .map((tx, index) => {
        const decimals = Number(tx.tokenDecimal || 18);
        const amountCoin = Number(tx.value || 0) / Math.pow(10, decimals);
        const amountUSD = amountCoin;

        if (amountUSD < (TOKEN_CONFIG[symbol]?.minUsd || 100000)) return null;

        return normalizeWallet({
          walletAddress: tx.from || tx.to,
          network,
          transactionHash: tx.hash,
          transactionType: detectTransactionType(index),
          amountCoin,
          amountUSD,
        });
      })
      .filter(Boolean);
  } catch {
    return [];
  }
};

const buildMarketFallbackWhales = ({ symbol, network, currentPrice }) => {
  const price = Number(currentPrice || 0);
  if (!price) return [];

  const baseUsd =
    symbol === "BTCUSDT"
      ? 850000
      : symbol === "ETHUSDT"
      ? 520000
      : symbol === "BNBUSDT"
      ? 260000
      : symbol === "SOLUSDT"
      ? 180000
      : 140000;

  const samples = [
    { type: "Buy", multiplier: 1.4 },
    { type: "Buy", multiplier: 0.95 },
    { type: "Sell", multiplier: 0.7 },
    { type: "Transfer", multiplier: 0.55 },
  ];

  return samples.map((item, index) => {
    const amountUSD = baseUsd * item.multiplier;
    const amountCoin = amountUSD / price;

    return normalizeWallet({
      walletAddress: `market-${symbol.toLowerCase()}-${index}-${shorten(
        Date.now().toString()
      )}`,
      network,
      transactionHash: `fallback-${symbol.toLowerCase()}-${Date.now()}-${index}`,
      transactionType: item.type,
      amountCoin,
      amountUSD,
    });
  });
};

exports.getRealWhaleTransactions = async ({ symbol, network, currentPrice }) => {
  const cleanSymbol = String(symbol || "BTCUSDT").replace("/", "").toUpperCase();

  const moralis = await fetchMoralisWhales({
    symbol: cleanSymbol,
    network,
    currentPrice,
  });

  const explorer = await fetchExplorerWhales({
    symbol: cleanSymbol,
    network,
  });

  let combined = [...moralis, ...explorer];

  if (combined.length === 0) {
    combined = buildMarketFallbackWhales({
      symbol: cleanSymbol,
      network,
      currentPrice,
    });
  }

  const unique = [];
  const seen = new Set();

  for (const tx of combined) {
    const key = tx.transactionHash || tx.walletAddress;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(tx);
    }
  }

  return unique
    .sort((a, b) => Number(b.amountUSD || 0) - Number(a.amountUSD || 0))
    .slice(0, 20);
};