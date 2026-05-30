const mongoose = require("mongoose");
const FuturesPosition = require("../models/FuturesPosition");
const FuturesOrder = require("../models/FuturesOrder");
const { getPrice } = require("../services/binanceService");

const DEMO_USER_ID =
  process.env.DEMO_USER_ID || "000000000000000000000001";

const getUserId = (req) => {
  return req.user?.id || req.body.userId || DEMO_USER_ID;
};

exports.openPosition = async (req, res) => {
  try {
    const {
      symbol,
      side,
      quantity,
      leverage,
      entryPrice,
      takeProfit,
      stopLoss,
    } = req.body;

    if (!symbol || !side || !quantity || !leverage || !entryPrice) {
      return res.status(400).json({
        success: false,
        message: "Missing required futures fields",
      });
    }

    const userId = new mongoose.Types.ObjectId(getUserId(req));
    const qty = Number(quantity);
    const lev = Number(leverage);
    const entry = Number(entryPrice);

    const margin = (qty * entry) / lev;

    const liquidationPrice =
      side === "long"
        ? entry - entry / lev
        : entry + entry / lev;

    const position = await FuturesPosition.create({
      userId,
      symbol,
      side,
      quantity: qty,
      leverage: lev,
      entryPrice: entry,
      markPrice: entry,
      margin,
      liquidationPrice,
      takeProfit: Number(takeProfit) || 0,
      stopLoss: Number(stopLoss) || 0,
      pnl: 0,
      status: "open",
    });

    await FuturesOrder.create({
      userId,
      symbol,
      side: side === "long" ? "buy" : "sell",
      type: "market",
      quantity: qty,
      price: entry,
      leverage: lev,
      status: "filled",
    });

    res.status(201).json({
      success: true,
      message: "Position opened and saved in MongoDB",
      position,
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
        pnl,
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
    const position = await FuturesPosition.findById(req.params.id);

    if (!position) {
      return res.status(404).json({
        success: false,
        message: "Position not found",
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

    position.status = "closed";
    position.markPrice = livePrice;
    position.pnl = finalPnl;

    await position.save();

    res.status(200).json({
      success: true,
      message: "Position closed and saved in MongoDB",
      position,
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
    }).sort({ updatedAt: -1 });

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