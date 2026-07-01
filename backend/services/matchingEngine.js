const Order = require("../models/Order");
const Transaction = require("../models/Transaction");
const UserWallet = require("../models/UserWallet");
const Trade = require("../models/Trade");
const WalletLedger = require("../models/WalletLedger");

async function matchOrder(newOrder) {
  const side = String(newOrder.side || "").toLowerCase();
  const oppositeSide = side === "buy" ? "sell" : "buy";

  const query = {
    pair: newOrder.pair,
    side: oppositeSide,
    status: { $in: ["open", "partial"] },
  };

  if (side === "buy") {
    query.price = { $lte: newOrder.price };
  } else {
    query.price = { $gte: newOrder.price };
  }

  const oppositeOrders = await Order.find(query).sort(
    side === "buy"
      ? { price: 1, createdAt: 1 }
      : { price: -1, createdAt: 1 }
  );

  for (const oldOrder of oppositeOrders) {
    if (newOrder.remaining <= 0) break;

    const tradeAmount = Math.min(
      Number(newOrder.remaining),
      Number(oldOrder.remaining)
    );

    const tradePrice = Number(oldOrder.price);
    const tradeValue = tradeAmount * tradePrice;

    const buyerId = side === "buy" ? newOrder.userId : oldOrder.userId;
    const sellerId = side === "sell" ? newOrder.userId : oldOrder.userId;

    const buyerWallet = await UserWallet.findOneAndUpdate(
      { userId: buyerId },
      { $setOnInsert: { userId: buyerId } },
      { new: true, upsert: true }
    );

    const sellerWallet = await UserWallet.findOneAndUpdate(
      { userId: sellerId },
      { $setOnInsert: { userId: sellerId } },
      { new: true, upsert: true }
    );

    if (buyerWallet.isFrozen || sellerWallet.isFrozen) {
      continue;
    }

    const buyerExaltBefore = Number(buyerWallet.balances.EXALT || 0);
    const sellerUsdtBefore = Number(sellerWallet.balances.USDT || 0);

    buyerWallet.balances.EXALT = buyerExaltBefore + tradeAmount;
    sellerWallet.balances.USDT = sellerUsdtBefore + tradeValue;

    await buyerWallet.save();
    await sellerWallet.save();

    newOrder.filled = Number(newOrder.filled || 0) + tradeAmount;
    newOrder.remaining = Number(newOrder.remaining || 0) - tradeAmount;
    newOrder.status = newOrder.remaining <= 0 ? "filled" : "partial";

    oldOrder.filled = Number(oldOrder.filled || 0) + tradeAmount;
    oldOrder.remaining = Number(oldOrder.remaining || 0) - tradeAmount;
    oldOrder.status = oldOrder.remaining <= 0 ? "filled" : "partial";

    await oldOrder.save();

    const trade = await Trade.create({
      pair: newOrder.pair,
      buyOrderId: side === "buy" ? newOrder._id : oldOrder._id,
      sellOrderId: side === "sell" ? newOrder._id : oldOrder._id,
      buyerId,
      sellerId,
      price: tradePrice,
      amount: tradeAmount,
      total: tradeValue,
      buyerFee: 0,
      sellerFee: 0,
      feeCoin: "USDT",
      maker: oldOrder.userId,
      taker: newOrder.userId,
      status: "SUCCESS",
      source: "SPOT",
    });

    await WalletLedger.create({
      userId: buyerId,
      type: "SPOT_TRADE",
      coin: "EXALT",
      amount: tradeAmount,
      balanceBefore: buyerExaltBefore,
      balanceAfter: buyerWallet.balances.EXALT,
      referenceId: trade._id,
      referenceModel: "Trade",
      status: "SUCCESS",
      note: `Bought ${tradeAmount} EXALT @ ${tradePrice}`,
      createdBy: buyerId,
    });

    await WalletLedger.create({
      userId: sellerId,
      type: "SPOT_TRADE",
      coin: "USDT",
      amount: tradeValue,
      balanceBefore: sellerUsdtBefore,
      balanceAfter: sellerWallet.balances.USDT,
      referenceId: trade._id,
      referenceModel: "Trade",
      status: "SUCCESS",
      note: `Sold ${tradeAmount} EXALT @ ${tradePrice}`,
      createdBy: sellerId,
    });

    await Transaction.create({
      userId: buyerId,
      type: "trade",
      amount: tradeAmount,
      coin: "EXALT",
      status: "completed",
      note: `BUY ${tradeAmount} ${newOrder.pair} @ ${tradePrice}`,
      txHash: `TRADE-${trade._id}`,
    });

    await Transaction.create({
      userId: sellerId,
      type: "trade",
      amount: tradeValue,
      coin: "USDT",
      status: "completed",
      note: `SELL ${tradeAmount} ${newOrder.pair} @ ${tradePrice}`,
      txHash: `TRADE-${trade._id}`,
    });
  }

  await newOrder.save();
  return newOrder;
}

module.exports = matchOrder;