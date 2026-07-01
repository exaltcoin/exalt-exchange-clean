const UserWallet = require("../models/UserWallet");

const ALLOWED_COINS = ["USDT", "BNB", "EXALT"];

const normalizeCoin = (coin) => {
  const symbol = String(coin || "").toUpperCase().trim();

  if (!ALLOWED_COINS.includes(symbol)) {
    throw new Error(`Unsupported coin: ${symbol}`);
  }

  return symbol;
};

const normalizeAmount = (amount) => {
  const value = Number(amount);

  if (!value || value <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  return value;
};

async function getOrCreateWallet(userId) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const wallet = await UserWallet.findOneAndUpdate(
    { userId },
    {
      $setOnInsert: {
        userId,
      },
    },
    {
      new: true,
      upsert: true,
    }
  );

  return wallet;
}

async function addBalance(userId, coin, amount) {
  const symbol = normalizeCoin(coin);
  const value = normalizeAmount(amount);

  const wallet = await getOrCreateWallet(userId);

  if (wallet.isFrozen) {
    throw new Error(wallet.freezeReason || "Wallet is frozen");
  }

  wallet.balances[symbol] = Number(wallet.balances?.[symbol] || 0) + value;

  await wallet.save();
  return wallet;
}

async function subtractBalance(userId, coin, amount) {
  const symbol = normalizeCoin(coin);
  const value = normalizeAmount(amount);

  const wallet = await getOrCreateWallet(userId);

  if (wallet.isFrozen) {
    throw new Error(wallet.freezeReason || "Wallet is frozen");
  }

  const available = Number(wallet.balances?.[symbol] || 0);

  if (available < value) {
    throw new Error(`Insufficient ${symbol} balance`);
  }

  wallet.balances[symbol] = available - value;

  await wallet.save();
  return wallet;
}

async function lockBalance(userId, coin, amount) {
  const symbol = normalizeCoin(coin);
  const value = normalizeAmount(amount);

  const wallet = await getOrCreateWallet(userId);

  if (wallet.isFrozen) {
    throw new Error(wallet.freezeReason || "Wallet is frozen");
  }

  const available = Number(wallet.balances?.[symbol] || 0);

  if (available < value) {
    throw new Error(`Insufficient ${symbol} balance`);
  }

  wallet.balances[symbol] = available - value;
  wallet.locked[symbol] = Number(wallet.locked?.[symbol] || 0) + value;

  await wallet.save();
  return wallet;
}

async function releaseBalance(userId, coin, amount) {
  const symbol = normalizeCoin(coin);
  const value = normalizeAmount(amount);

  const wallet = await getOrCreateWallet(userId);

  const locked = Number(wallet.locked?.[symbol] || 0);

  if (locked < value) {
    throw new Error(`Insufficient locked ${symbol}`);
  }

  wallet.locked[symbol] = locked - value;
  wallet.balances[symbol] = Number(wallet.balances?.[symbol] || 0) + value;

  await wallet.save();
  return wallet;
}

async function unlockToAvailable(userId, coin, amount) {
  return releaseBalance(userId, coin, amount);
}

async function deductLocked(userId, coin, amount) {
  const symbol = normalizeCoin(coin);
  const value = normalizeAmount(amount);

  const wallet = await getOrCreateWallet(userId);

  const locked = Number(wallet.locked?.[symbol] || 0);

  if (locked < value) {
    throw new Error(`Insufficient locked ${symbol}`);
  }

  wallet.locked[symbol] = locked - value;

  await wallet.save();
  return wallet;
}

async function getBalance(userId, coin) {
  const symbol = normalizeCoin(coin);
  const wallet = await getOrCreateWallet(userId);

  return {
    available: Number(wallet.balances?.[symbol] || 0),
    locked: Number(wallet.locked?.[symbol] || 0),
    total:
      Number(wallet.balances?.[symbol] || 0) +
      Number(wallet.locked?.[symbol] || 0),
  };
}

module.exports = {
  getOrCreateWallet,
  addBalance,
  subtractBalance,
  lockBalance,
  releaseBalance,
  unlockToAvailable,
  deductLocked,
  getBalance,
};