const mongoose = require("mongoose");

const referralRewardSchema = new mongoose.Schema(
  {
    referredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    referredEmail: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },

    rewardAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    coin: {
      type: String,
      default: "EXALT",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    note: {
      type: String,
      default: "",
    },

    approvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    wallets: {
      USDT: { type: Number, default: 0 },
      EXALT: { type: Number, default: 0 },
      BNB: { type: Number, default: 0 },
    },

    phone: { type: String, default: "" },
    country: { type: String, default: "" },
    telegram: { type: String, default: "" },
    bio: { type: String, default: "" },
    profileImage: { type: String, default: "" },

    balance: {
      type: Number,
      default: 0,
    },

    walletAddress: {
      type: String,
      default: "",
    },

    depositAddresses: {
      BSC: {
        type: String,
        default: "",
      },
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },

    kycStatus: {
      type: String,
      enum: ["not_submitted", "pending", "approved", "rejected"],
      default: "not_submitted",
      index: true,
    },

    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      uppercase: true,
      trim: true,
    },

    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    referredByCode: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
    },

    referralCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    pendingReferralRewards: {
      type: Number,
      default: 0,
      min: 0,
    },

    approvedReferralRewards: {
      type: Number,
      default: 0,
      min: 0,
    },

    referralRewards: {
      type: [referralRewardSchema],
      default: [],
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },

    emailVerificationToken: {
      type: String,
      default: "",
      select: false,
    },

    emailVerificationExpire: {
      type: Date,
      default: null,
      select: false,
    },

    emailVerifiedAt: {
      type: Date,
      default: null,
    },

    lastVerificationEmailSentAt: {
      type: Date,
      default: null,
    },

    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    twoFactorSecret: {
      type: String,
      default: "",
      select: false,
    },

    twoFactorBackupCodes: {
      type: [String],
      default: [],
      select: false,
    },

    antiPhishingCode: {
      type: String,
      default: "",
    },

    accountStatus: {
      type: String,
      enum: ["Active", "Suspended", "Frozen", "Pending Verification"],
      default: "Pending Verification",
      index: true,
    },

    failedLoginAttempts: {
      type: Number,
      default: 0,
    },

    lastFailedLoginAt: {
      type: Date,
      default: null,
    },

    lockUntil: {
      type: Date,
      default: null,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    lastLoginIp: {
      type: String,
      default: "",
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },

    resetPasswordToken: {
      type: String,
      select: false,
    },

    resetPasswordExpire: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", function (next) {
  if (!this.referralCode) {
    const namePart = String(this.name || "EXALT")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 5)
      .toUpperCase();

    const randomPart = Date.now().toString(36).slice(-4).toUpperCase();
const cryptoPart = Math.random().toString(36).slice(2, 6).toUpperCase();

this.referralCode = `${namePart}-${randomPart}${cryptoPart}`;
  }

  next();
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);