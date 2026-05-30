const Wallet = require("../models/Wallet");
const Deposit = require("../models/Deposit");
const Withdrawal = require("../models/Withdrawal");

exports.getWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({
      userId: req.params.userId,
    });

    res.json({
      success: true,
      wallet,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.depositFunds = async (req, res) => {
  try {
    const deposit = await Deposit.create(req.body);

    res.json({
      success: true,
      deposit,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.withdrawFunds = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.create(req.body);

    res.json({
      success: true,
      withdrawal,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};