const mongoose = require("mongoose");

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
    },

    wallets: {
      USDT: {
        type: Number,
        default:0,
      },
      EXALT: {
        type: Number,
        default:0,
      },
      BNB: {
        type: Number,
        default: 0,
      },
    },
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
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    resetPasswordToken: {
  type: String,
},

resetPasswordExpire: {
  type: Date,
},
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);