const Staking = require("../models/Staking");
const UserWallet = require("../models/UserWallet");
const WalletLedger = require("../models/WalletLedger");

const ALLOWED_COINS = ["EXALT", "USDT", "BNB"];
const ALLOWED_DURATIONS = [30, 60, 90, 180, 365];

const calculateReward = (stake) => {
  const now = new Date();
  const lastClaim = stake.lastClaimAt || stake.startDate;

  const daysPassed = Math.max(
    0,
    (now - new Date(lastClaim)) / (1000 * 60 * 60 * 24)
  );

  const dailyRate = Number(stake.apy || 0) / 365 / 100;
  return Number((Number(stake.amount || 0) * dailyRate * daysPassed).toFixed(6));
};

const getApyByDuration = (durationDays) => {
  if (durationDays === 30) return 8;
  if (durationDays === 60) return 10;
  if (durationDays === 90) return 12;
  if (durationDays === 180) return 16;
  if (durationDays === 365) return 20;
  return 8;
};

const getOrCreateWallet = async (userId) => {
  return UserWallet.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { new: true, upsert: true }
  );
};

const stakeCoins = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { amount, durationDays, coin = "EXALT", autoRenew = false } = req.body;

    const coinSymbol = String(coin).toUpperCase();
    const stakeAmount = Number(amount);
    const duration = Number(durationDays);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!ALLOWED_COINS.includes(coinSymbol)) {
      return res.status(400).json({ success: false, message: "Unsupported staking coin" });
    }

    if (!stakeAmount || stakeAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid staking amount" });
    }

    if (!ALLOWED_DURATIONS.includes(duration)) {
      return res.status(400).json({ success: false, message: "Invalid staking duration" });
    }

    const wallet = await getOrCreateWallet(userId);

    if (wallet.isFrozen) {
      return res.status(403).json({
        success: false,
        message: wallet.freezeReason || "Wallet is frozen",
      });
    }

    const balanceBefore = Number(wallet.balances?.[coinSymbol] || 0);

    if (balanceBefore < stakeAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${coinSymbol} balance`,
      });
    }

    const balanceAfter = balanceBefore - stakeAmount;

    wallet.balances[coinSymbol] = balanceAfter;
    wallet.locked[coinSymbol] = Number(wallet.locked?.[coinSymbol] || 0) + stakeAmount;

    await wallet.save();

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration);

    const stake = await Staking.create({
      user: userId,
      coin: coinSymbol,
      amount: stakeAmount,
      apy: getApyByDuration(duration),
      durationDays: duration,
      startDate,
      endDate,
      autoRenew: Boolean(autoRenew),
      status: "active",
      lastClaimAt: startDate,
    });

    await WalletLedger.create({
      userId,
      type: "STAKING_REWARD",
      coin: coinSymbol,
      amount: stakeAmount,
      balanceBefore,
      balanceAfter,
      referenceId: stake._id,
      referenceModel: "Admin",
      status: "SUCCESS",
      note: "Coins locked for staking",
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      message: "Staking started successfully",
      stake,
      wallet,
    });
  } catch (error) {
    console.error("Stake coins:", error);
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

    const stake = await Staking.findOne({
      _id: req.params.id,
      user: userId,
    });

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

    const stake = await Staking.findOne({
      _id: stakeId,
      user: userId,
      status: "active",
    });

    if (!stake) {
      return res.status(404).json({ success: false, message: "Active stake not found" });
    }

    const reward = calculateReward(stake);

    if (reward <= 0) {
      return res.status(400).json({ success: false, message: "No reward available yet" });
    }

    const coinSymbol = String(stake.coin || "EXALT").toUpperCase();
    const wallet = await getOrCreateWallet(userId);

    const balanceBefore = Number(wallet.balances?.[coinSymbol] || 0);
    const balanceAfter = balanceBefore + reward;

    wallet.balances[coinSymbol] = balanceAfter;
    await wallet.save();

    stake.totalRewardClaimed = Number(stake.totalRewardClaimed || 0) + reward;
    stake.rewardEarned = Number(stake.rewardEarned || 0) + reward;
    stake.lastClaimAt = new Date();
    await stake.save();

    await WalletLedger.create({
      userId,
      type: "STAKING_REWARD",
      coin: coinSymbol,
      amount: reward,
      balanceBefore,
      balanceAfter,
      referenceId: stake._id,
      referenceModel: "Admin",
      status: "SUCCESS",
      note: "Staking reward claimed",
      createdBy: userId,
    });

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

    const stake = await Staking.findOne({
      _id: stakeId,
      user: userId,
      status: "active",
    });

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
    const coinSymbol = String(stake.coin || "EXALT").toUpperCase();
    const wallet = await getOrCreateWallet(userId);

    const lockedBefore = Number(wallet.locked?.[coinSymbol] || 0);

    if (lockedBefore < Number(stake.amount)) {
      return res.status(400).json({
        success: false,
        message: "Insufficient locked staking balance",
      });
    }

    wallet.locked[coinSymbol] = lockedBefore - Number(stake.amount);

    const balanceBefore = Number(wallet.balances?.[coinSymbol] || 0);
    const returnAmount = Number(stake.amount) + Number(reward);
    const balanceAfter = balanceBefore + returnAmount;

    wallet.balances[coinSymbol] = balanceAfter;
    await wallet.save();

    stake.status = "completed";
    stake.rewardEarned = Number(stake.rewardEarned || 0) + reward;
    stake.totalRewardClaimed = Number(stake.totalRewardClaimed || 0) + reward;
    stake.lastClaimAt = new Date();
    await stake.save();

    await WalletLedger.create({
      userId,
      type: "STAKING_REWARD",
      coin: coinSymbol,
      amount: returnAmount,
      balanceBefore,
      balanceAfter,
      referenceId: stake._id,
      referenceModel: "Admin",
      status: "SUCCESS",
      note: "Stake completed and principal returned with reward",
      createdBy: userId,
    });

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