const Order = require("../models/Order");
const Transaction = require("../models/Transaction");
const User = require("../models/user");
const Trade = require("../models/Trade");
async function matchOrder(newOrder) {
  const oppositeType = newOrder.type === "buy" ? "sell" : "buy";

  const query = {
    pair: newOrder.pair,
    type: oppositeType,
    status: { $in: ["open", "partial"] },
  };

  if (newOrder.type === "buy") {
    query.price = { $lte: newOrder.price };
  } else {
    query.price = { $gte: newOrder.price };
  }

  const oppositeOrders = await Order.find(query).sort(
    newOrder.type === "buy"
      ? { price: 1, createdAt: 1 }
      : { price: -1, createdAt: 1 }
  );

  for (const oldOrder of oppositeOrders) {
    if (newOrder.remaining <= 0) break;

    const tradeAmount = Math.min(newOrder.remaining, oldOrder.remaining);
    const tradePrice = oldOrder.price;
    const tradeValue = tradeAmount * tradePrice;

    const buyerId = newOrder.type === "buy" ? newOrder.userId : oldOrder.userId;
    const sellerId = newOrder.type === "sell" ? newOrder.userId : oldOrder.userId;

    const buyer = await User.findById(buyerId);
    const seller = await User.findById(sellerId);

    if (!buyer || !seller) continue;

    buyer.wallets.EXALT += tradeAmount;
    seller.wallets.USDT += tradeValue;

    await buyer.save();
    await seller.save();

    newOrder.filled += tradeAmount;
    newOrder.remaining -= tradeAmount;
    newOrder.status = newOrder.remaining === 0 ? "filled" : "partial";

    oldOrder.filled += tradeAmount;
    oldOrder.remaining -= tradeAmount;
    oldOrder.status = oldOrder.remaining === 0 ? "filled" : "partial";

    await oldOrder.save();

    await Transaction.create({
      userId: newOrder.userId,
      type: "trade",
      amount: tradeAmount,
      status: "completed",
      note: `${newOrder.type.toUpperCase()} ${tradeAmount} ${newOrder.pair} @ ${tradePrice}`,
      txHash: `TRADE-${Date.now()}`,
    });
  }
await Trade.create({
  pair: newOrder.pair,
  buyOrderId: newOrder.type === "buy" ? newOrder._id : oldOrder._id,
  sellOrderId: newOrder.type === "sell" ? newOrder._id : oldOrder._id,
  buyerId,
  sellerId,
  price: tradePrice,
  amount: tradeAmount,
  total: tradeValue
});
  await newOrder.save();
  return newOrder;
}

module.exports = matchOrder;