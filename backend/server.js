const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/appError");
const listingRoutes = require("./routes/listingRoutes");
const authRoutes = require("./authRoutes");
const depositRoutes = require("./routes/depositRoutes");
const supportRoutes = require("./routes/supportRoutes");
const withdrawalRoutes = require("./routes/withdrawalRoutes");
const orderRoutes = require("./routes/orderRoutes");
const p2pRoutes = require("./routes/p2pRoutes");
const Deposit = require("./models/Deposit");
const User = require("./models/user");
const Transaction = require("./models/Transaction");
 const futuresRoutes = require("./routes/futuresRoutes");
const coinRoutes = require("./routes/coinRoutes");
const walletRoutes = require("./routes/walletRoutes");
const tradeRoutes = require("./routes/tradeRoutes");
const adminRoutes = require("./routes/adminRoutes");
const dexRoutes = require("./routes/dexRoutes");
const marketRoutes = require("./routes/marketRoutes");
const {
  startBinanceStream,
} = require("./services/binanceService"); 
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://exalt-exchange-backend.onrender.com",
      "https://exaltcoincommunity.com",
      "https://www.exaltcoincommunity.com",
    ],
    credentials: true,
  },
});
connectDB();
startBinanceStream(io);

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User Disconnected");
  });
});
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://exalt-exchange-backend.onrender.com",
    "https://exaltcoincommunity.com",
    "https://www.exaltcoincommunity.com"
  ],
  credentials: true
}));

app.use(helmet());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5000,
    message: {
      success: false,
      message: "Too many requests from this IP, please try again later.",
    },
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use("/api/futures", futuresRoutes);
app.use("/futures", futuresRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/p2p", p2pRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dex", dexRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/coins", coinRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/trades", tradeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/deposit-request", depositRoutes);
app.use("/api/support-ticket", supportRoutes);
app.put("/api/admin/deposits/:id/approve", async (req, res) => {
  try {

    const Deposit = require("./models/Deposit");
    const User = require("./models/User");
    const Transaction = require("./models/Transaction");

    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found"
      });
    }

    // prevent duplicate approval
    if (deposit.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Deposit already approved"
      });
    }

    // approve deposit
    deposit.status = "approved";
    await deposit.save();

    // update user balance
    const user = await User.findById(deposit.userId);

    if (user) {
      user.balance += Number(deposit.amount);
      await user.save();
    }
await Transaction.create({
  userId: deposit.userId || null,
  type: "deposit",
  amount: Number(deposit.amount),
  status: "approved",
  note: "Deposit approved by admin",
  txHash: deposit.transactionId || deposit.txHash || ""
});
    res.json({
      success: true,
      message: "Deposit approved successfully"
    });
  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }
});
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Exalt Exchange Backend is running",
    status: "LIVE",
  });
});

app.get("/api/transactions", async (req, res) => {
  try {
    const Transaction = require("./models/Transaction");

    const transactions = await Transaction.find()
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      transactions,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
app.get("/api/user/balance/:userId", async (req, res) => {
  try {
    const User = require("./models/User");

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      balance: user.balance || 0,
      user,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server healthy",
    backend: "Exalt Exchange",
  });
});

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Backend API working",
  });
});
app.get("/api/transactions", async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});