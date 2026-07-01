const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/appError");
const { startBinanceStream } = require("./services/binanceService");

const listingRoutes = require("./routes/listingRoutes");
const authRoutes = require("./authRoutes");
const depositRoutes = require("./routes/depositRoutes");
const supportRoutes = require("./routes/supportRoutes");
const withdrawalRoutes = require("./routes/withdrawalRoutes");
const orderRoutes = require("./routes/orderRoutes");
const p2pRoutes = require("./routes/p2pRoutes");
const futuresRoutes = require("./routes/futuresRoutes");
const coinRoutes = require("./routes/coinRoutes");
const walletRoutes = require("./routes/walletRoutes");
const tradeRoutes = require("./routes/tradeRoutes");
const adminRoutes = require("./routes/adminRoutes");
const dexRoutes = require("./routes/dexRoutes");
const marketRoutes = require("./routes/marketRoutes");
const kycRoutes = require("./routes/kycRoutes");
const otpRoutes = require("./routes/otpRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const web3Routes = require("./routes/web3Routes");
const web3TransactionRoutes = require("./routes/web3TransactionRoutes");
const aiRoutes = require("./routes/aiRoutes");
const stakingRoutes = require("./routes/stakingRoutes");
const adminStakingRoutes = require("./routes/adminStakingRoutes");
const learnEarnRoutes = require("./routes/learnEarnRoutes");
const learnEarnAdminRoutes = require("./routes/learnEarnAdminRoutes");
const copyTradeRoutes = require("./routes/copyTradeRoutes");
const aiPortfolioRoutes = require("./routes/aiPortfolioRoutes");
const adminAIPortfolioRoutes = require("./routes/adminAIPortfolioRoutes");
const socialRoutes = require("./routes/socialRoutes");
const riskRoutes = require("./routes/riskRoutes");
const aiProfitRoutes = require("./routes/aiProfitRoutes");
const aiMarketScannerRoutes = require("./routes/aiMarketScannerRoutes");
const aiNewsRoutes = require("./routes/aiNewsRoutes");
const aiWhaleTrackerRoutes = require("./routes/aiWhaleTrackerRoutes");
const aiArbitrageRoutes = require("./routes/aiArbitrageRoutes");
const aiGridTradingRoutes = require("./routes/aiGridTradingRoutes");
const aiSmartAlertRoutes = require("./routes/aiSmartAlertRoutes");
const aiLaunchpadRoutes = require("./routes/aiLaunchpadRoutes");
const aiWhaleHeatmapRoutes = require("./routes/aiWhaleHeatmapRoutes");
const aiTrustScoreRoutes = require("./routes/aiTrustScoreRoutes");
const aiWhaleAlertRoutes = require("./routes/aiWhaleAlertRoutes");
const exaltUtilityRoutes = require("./routes/exaltUtilityRoutes");
const reputationRoutes = require("./routes/reputationRoutes");
const achievementRoutes = require("./routes/achievementRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const referralRoutes = require("./routes/referralRoutes");
const rewardRoutes = require("./routes/rewardRoutes");
const aiTradingAssistantRoutes = require("./routes/aiTradingAssistantRoutes");

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost",
  "capacitor://localhost",
  "ionic://localhost",
  "http://192.168.8.33:5000",
  "http://192.168.8.33:5173",

  "https://exaltexchange.io",
  "https://www.exaltexchange.io",

  "https://exalt-exchange-frontend.onrender.com",
  "https://exalt-exchange-1.onrender.com",

  "https://exalt-real-backend-6b6v.onrender.com",

  "https://exaltcoincommunity.com",
  "https://www.exaltcoincommunity.com",
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 200,
};

const server = http.createServer(app);

const io = new Server(server, {
  cors: corsOptions,
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
});

connectDB();
startBinanceStream(io);

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests from this IP, please try again later.",
    },
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server healthy",
    backend: "Exalt Exchange",
  });
});

app.use("/api/futures", futuresRoutes);
app.use("/futures", futuresRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/p2p", p2pRoutes);
app.use("/api/listings", listingRoutes);
app.use((req, res, next) => {
  console.log("API HIT:", req.method, req.originalUrl);
  next();
});
app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/dex", dexRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/coins", coinRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/trades", tradeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/deposit-request", depositRoutes);
app.use("/api/support-ticket", supportRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/web3", web3Routes);
app.use("/api/web3-transactions", web3TransactionRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/staking", stakingRoutes);
app.use("/api/admin/staking", adminStakingRoutes);
app.use("/api/learnearn", learnEarnRoutes);
app.use("/api/admin/learnearn", learnEarnAdminRoutes);
app.use("/api/copy", copyTradeRoutes);
app.use("/api/portfolio", aiPortfolioRoutes);
app.use("/api/admin/portfolio", adminAIPortfolioRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/risk", riskRoutes);
app.use("/api/ai-profit", aiProfitRoutes);
app.use("/api/ai-market-scanner", aiMarketScannerRoutes);
app.use("/api/ai-news", aiNewsRoutes);
app.use("/api/ai-whale-tracker", aiWhaleTrackerRoutes);
app.use("/api/ai-arbitrage", aiArbitrageRoutes);
app.use("/api/ai-grid-trading", aiGridTradingRoutes);
app.use("/api/ai-smart-alerts", aiSmartAlertRoutes);
app.use("/api/ai-launchpad", aiLaunchpadRoutes);
app.use("/api/ai-whale-heatmap", aiWhaleHeatmapRoutes);
app.use("/api/ai-trust-score", aiTrustScoreRoutes);
app.use("/api/ai-whale-alerts", aiWhaleAlertRoutes);
app.use("/api/exalt-utility", exaltUtilityRoutes);
app.use("/api/reputation", reputationRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/ai-trading-assistant", aiTradingAssistantRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});