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
const kycRoutes = require("./routes/kycRoutes");
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
      "https://exalt-exchange-frontend.onrender.com",
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
    "https://exalt-exchange-frontend.onrender.com",
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
app.use("/api/kyc", kycRoutes);
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