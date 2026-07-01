const mongoose = require("mongoose");
const FuturesPosition = require("../models/FuturesPosition");
const FuturesOrder = require("../models/FuturesOrder");
const UserWallet = require("../models/UserWallet");
const WalletLedger = require("../models/WalletLedger");
const { getPrice } = require("../services/binanceService");

const getUserId = (req) => req.user?._id || req.user?.id;

exports.openPosition = async (req, res) => {
  try {
    const { symbol, side, quantity, leverage, entryPrice, takeProfit, stopLoss } =
      req.body;

    if (!symbol || !side || !quantity || !leverage || !entryPrice) {
      return res.status(400).json({
        success: false,
        message: "Missing required futures fields",
      });
    }

    if (!["long", "short"].includes(side)) {
      return res.status(400).json({
        success: false,
        message: "Invalid position side",
      });
    }

    const userId = new mongoose.Types.ObjectId(getUserId(req));
    const qty = Number(quantity);
    const lev = Number(leverage);
    const entry = Number(entryPrice);

    if (qty <= 0 || lev <= 0 || entry <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity, leverage or entry price",
      });
    }

    const margin = (qty * entry) / lev;

    const wallet = await UserWallet.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId } },
      { new: true, upsert: true }
    );

    if (wallet.isFrozen) {
      return res.status(403).json({
        success: false,
        message: wallet.freezeReason || "User wallet is frozen",
      });
    }

    const balanceBefore = Number(wallet.futuresBalance?.USDT || 0);

    if (balanceBefore < margin) {
      return res.status(400).json({
        success: false,
        message: "Insufficient futures USDT balance",
      });
    }

    const balanceAfter = balanceBefore - margin;
    wallet.futuresBalance.USDT = balanceAfter;
    await wallet.save();

    const liquidationPrice =
      side === "long" ? entry - entry / lev : entry + entry / lev;

    const position = await FuturesPosition.create({
      userId,
      symbol: String(symbol).toUpperCase(),
      side,
      quantity: qty,
      leverage: lev,
      entryPrice: entry,
      markPrice: entry,
      margin,
      maintenanceMargin: margin * 0.005,
      liquidationPrice,
      takeProfit: Number(takeProfit) || 0,
      stopLoss: Number(stopLoss) || 0,
      pnl: 0,
      unrealizedPnl: 0,
      realizedPnl: 0,
      status: "open",
    });

    await FuturesOrder.create({
      userId,
      symbol: String(symbol).toUpperCase(),
      side: side === "long" ? "buy" : "sell",
      type: "market",
      quantity: qty,
      price: entry,
      leverage: lev,
      status: "filled",
      positionId: position._id,
    });

    await WalletLedger.create({
      userId,
      type: "FUTURES_PNL",
      coin: "USDT",
      amount: margin,
      balanceBefore,
      balanceAfter,
      referenceId: position._id,
      referenceModel: "FuturesPosition",
      status: "SUCCESS",
      note: `Futures margin locked for ${side} ${symbol}`,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      message: "Position opened successfully",
      position,
      futuresBalance: wallet.futuresBalance,
    });
  } catch (error) {
    console.log("OPEN POSITION ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getPositions = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(getUserId(req));

    const positions = await FuturesPosition.find({
      userId,
      status: "open",
    }).sort({ createdAt: -1 });

    const updatedPositions = positions.map((position) => {
      const livePrice =
        getPrice(position.symbol) || position.markPrice || position.entryPrice;

      let pnl = 0;
      let pnlPercent = 0;

      if (position.side === "long") {
        pnl = (livePrice - position.entryPrice) * position.quantity;
        pnlPercent =
          ((livePrice - position.entryPrice) / position.entryPrice) * 100;
      } else {
        pnl = (position.entryPrice - livePrice) * position.quantity;
        pnlPercent =
          ((position.entryPrice - livePrice) / position.entryPrice) * 100;
      }

      return {
        ...position.toObject(),
        markPrice: livePrice,
        unrealizedPnl: pnl,
        pnl,
        pnlPercent,
      };
    });

    res.status(200).json({
      success: true,
      positions: updatedPositions,
    });
  } catch (error) {
    console.log("GET POSITIONS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.closePosition = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(getUserId(req));

    const position = await FuturesPosition.findOne({
      _id: req.params.id,
      userId,
      status: "open",
    });

    if (!position) {
      return res.status(404).json({
        success: false,
        message: "Open position not found",
      });
    }

    const livePrice =
      getPrice(position.symbol) || position.markPrice || position.entryPrice;

    let finalPnl = 0;

    if (position.side === "long") {
      finalPnl = (livePrice - position.entryPrice) * position.quantity;
    } else {
      finalPnl = (position.entryPrice - livePrice) * position.quantity;
    }

    const wallet = await UserWallet.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId } },
      { new: true, upsert: true }
    );

    const balanceBefore = Number(wallet.futuresBalance?.USDT || 0);
    const amountToReturn = Math.max(0, Number(position.margin || 0) + finalPnl);
    const balanceAfter = balanceBefore + amountToReturn;

    wallet.futuresBalance.USDT = balanceAfter;
    await wallet.save();

    position.status = "closed";
    position.markPrice = livePrice;
    position.closePrice = livePrice;
    position.pnl = finalPnl;
    position.realizedPnl = finalPnl;
    position.unrealizedPnl = 0;
    position.closedAt = new Date();

    await position.save();

    await FuturesOrder.create({
      userId,
      symbol: position.symbol,
      side: position.side === "long" ? "sell" : "buy",
      type: "market",
      quantity: position.quantity,
      price: livePrice,
      leverage: position.leverage,
      status: "filled",
      positionId: position._id,
    });

    await WalletLedger.create({
      userId,
      type: "FUTURES_PNL",
      coin: "USDT",
      amount: Math.abs(amountToReturn),
      balanceBefore,
      balanceAfter,
      referenceId: position._id,
      referenceModel: "FuturesPosition",
      status: "SUCCESS",
      note: `Futures position closed. PnL: ${finalPnl}`,
      createdBy: userId,
    });

    res.status(200).json({
      success: true,
      message: "Position closed successfully",
      position,
      futuresBalance: wallet.futuresBalance,
    });
  } catch (error) {
    console.log("CLOSE POSITION ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getFuturesHistory = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(getUserId(req));

    const history = await FuturesPosition.find({
      userId,
      status: { $in: ["closed", "liquidated"] },
    })
      .sort({ updatedAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      history,
    });
  } catch (error) {
    console.log("FUTURES HISTORY ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};