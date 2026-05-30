const Deposit = require("../models/Deposit");
const Withdrawal = require("../models/Withdrawal");

exports.approveDeposit = async (req, res) => {
  try {
    const deposit = await Deposit.findByIdAndUpdate(
      req.body.id,
      {
        status: "approved",
      },
      {
        new: true,
      }
    );

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

exports.approveWithdrawal = async (
  req,
  res
) => {
  try {
    const withdrawal =
      await Withdrawal.findByIdAndUpdate(
        req.body.id,
        {
          status: "approved",
        },
        {
          new: true,
        }
      );

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