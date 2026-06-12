const Coin = require("../models/Coin");

exports.getCoins = async (req, res) => {
  try {
    const coins = await Coin.find();

    res.json({
      success: true,
      coins,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.addCoin = async (req, res) => {
  try {
    const coin = await Coin.create(req.body);

    res.json({
      success: true,
      coin,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
exports.getWeb3Coins = async (req, res) => {
  try {
    const coins = await Coin.find({
      status: "active",
      $or: [
        { marketType: "web3" },
        { marketType: "both" }
      ]
    });

    res.json({
      success: true,
      coins,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getMarketCoins = async (req, res) => {
  try {
    const coins = await Coin.find({
      status: "active",
      $or: [
        { marketType: "market" },
        { marketType: "both" }
      ]
    });

    res.json({
      success: true,
      coins,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};