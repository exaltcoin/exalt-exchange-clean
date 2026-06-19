const Staking = require("../models/Staking");
const UserWallet = require("../models/UserWallet");

const calculateReward = (stake) => {
  const now = new Date();
  const lastClaim = stake.lastClaimAt || stake.startDate;
  const daysPassed = Math.max(
    0,
    (now - new Date(lastClaim)) / (1000 * 60 * 60 * 24)
  );

  const dailyRate = stake.apy / 365 / 100;
  return Number((stake.amount * dailyRate * daysPassed).toFixed(6));
};

const getApyByDuration = (durationDays) => {
  if (durationDays === 30) return 8;
  if (durationDays === 60) return 10;
  if (durationDays === 90) return 12;
  if (durationDays === 180) return 16;
  if (durationDays === 365) return 20;
  return 8;
};

const stakeCoins = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { amount, durationDays, coin = "EXALT", autoRenew = false } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: "Invalid staking amount" });
    }

    if (![30, 60, 90, 180, 365].includes(Number(durationDays))) {
      return res.status(400).json({ success: false, message: "Invalid staking duration" });
    }

    let wallet = await UserWallet.findOne({ user: userId });

if (!wallet) {
  wallet = await UserWallet.create({
    user: userId,
    balances: {
      USDT: 0,
      BNB: 0,
      EXALT: 0,
    },
  });
}

const coinSymbol = coin.toUpperCase();
const balance = Number(wallet.balances?.[coinSymbol] || 0);

if (balance < Number(amount)) {
  return res.status(400).json({
    success: false,
    message: `Insufficient ${coinSymbol} balance`,
  });
}

wallet.balances[coinSymbol] = balance - Number(amount);
await wallet.save();

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Number(durationDays));

    const stake = await Staking.create({
      user: userId,
      coin,
      amount: Number(amount),
      apy: getApyByDuration(Number(durationDays)),
      durationDays: Number(durationDays),
      startDate,
      endDate,
      autoRenew,
      status: "active",
      lastClaimAt: startDate,
    });

    res.status(201).json({
      success: true,
      message: "Staking started successfully",
      stake,
      wallet,
    });
  } catch (error) {
    console.log(error);
console.log(error.message);
    res.status(500).json({
      success: false,
      message: "Failed to start staking",
      error: error.message,
    });
  }
};

const getUserStakes = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    const stakes = await Staking.find({ user: userId }).sort({ createdAt: -1 });

    const data = stakes.map((stake) => ({
      ...stake.toObject(),
      pendingReward: calculateReward(stake),
    }));

    res.json({ success: true, count: data.length, stakes: data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch stakes",
      error: error.message,
    });
  }
};

const getSingleStake = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const stake = await Staking.findOne({ _id: req.params.id, user: userId });

    if (!stake) {
      return res.status(404).json({ success: false, message: "Stake not found" });
    }

    res.json({
      success: true,
      stake: {
        ...stake.toObject(),
        pendingReward: calculateReward(stake),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch stake",
      error: error.message,
    });
  }
};

const claimRewards = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { stakeId } = req.body;

    const stake = await Staking.findOne({ _id: stakeId, user: userId, status: "active" });

    if (!stake) {
      return res.status(404).json({ success: false, message: "Active stake not found" });
    }

    const reward = calculateReward(stake);

    if (reward <= 0) {
      return res.status(400).json({ success: false, message: "No reward available yet" });
    }

    const wallet = await UserWallet.findOne({ user: userId });

    if (!wallet) {
      return res.status(404).json({ success: false, message: "Wallet not found" });
    }

    const coinKey = stake.coin.toLowerCase();
    wallet[coinKey] = Number(wallet[coinKey] || 0) + reward;
    await wallet.save();

    stake.totalRewardClaimed += reward;
    stake.rewardEarned += reward;
    stake.lastClaimAt = new Date();
    await stake.save();

    res.json({
      success: true,
      message: "Reward claimed successfully",
      reward,
      stake,
      wallet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to claim reward",
      error: error.message,
    });
  }
};

const unstakeCoins = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { stakeId } = req.body;

    const stake = await Staking.findOne({ _id: stakeId, user: userId, status: "active" });

    if (!stake) {
      return res.status(404).json({ success: false, message: "Active stake not found" });
    }

    const now = new Date();
    if (now < new Date(stake.endDate)) {
      return res.status(400).json({
        success: false,
        message: "Locked staking period is not completed yet",
      });
    }

    const reward = calculateReward(stake);
    const wallet = await UserWallet.findOne({ user: userId });

    if (!wallet) {
      return res.status(404).json({ success: false, message: "Wallet not found" });
    }

    const coinKey = stake.coin.toLowerCase();
    wallet[coinKey] =
      Number(wallet[coinKey] || 0) + Number(stake.amount) + Number(reward);

    await wallet.save();

    stake.status = "completed";
    stake.rewardEarned += reward;
    stake.totalRewardClaimed += reward;
    stake.lastClaimAt = new Date();
    await stake.save();

    res.json({
      success: true,
      message: "Unstaked successfully",
      returnedAmount: stake.amount,
      reward,
      stake,
      wallet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to unstake",
      error: error.message,
    });
  }
};

module.exports = {
  stakeCoins,
  getUserStakes,
  getSingleStake,
  claimRewards,
  unstakeCoins,
};