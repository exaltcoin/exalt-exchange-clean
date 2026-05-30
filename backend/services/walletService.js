const Wallet = require("../models/Wallet");

async function getOrCreateWallet(userId) {
  let wallet = await Wallet.findOne({ userId });

  if (!wallet) {
    wallet = await Wallet.create({
      userId,
      balances: [],
    });
  }

  return wallet;
}

async function addBalance(userId, coin, amount) {
  const wallet = await getOrCreateWallet(userId);

  const symbol = coin.toUpperCase();
  let balance = wallet.balances.find((b) => b.coin === symbol);

  if (!balance) {
    wallet.balances.push({
      coin: symbol,
      available: amount,
      locked: 0,
    });
  } else {
    balance.available += amount;
  }

  await wallet.save();
  return wallet;
}

async function subtractBalance(userId, coin, amount) {
  const wallet = await getOrCreateWallet(userId);

  const symbol = coin.toUpperCase();
  const balance = wallet.balances.find((b) => b.coin === symbol);

  if (!balance || balance.available < amount) {
    throw new Error(`Insufficient ${symbol} balance`);
  }

  balance.available -= amount;

  await wallet.save();
  return wallet;
}

module.exports = {
  getOrCreateWallet,
  addBalance,
  subtractBalance,
};