import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests from this IP"
}));

app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

await mongoose.connect(process.env.MONGO_URI);
console.log("MongoDB Connected");

const adminAuth = (req, res, next) => {
  const adminKey = String(req.headers["x-admin-key"] || "exaltexchange7890$$").trim();
  const realKey = String(process.env.ADMIN_KEY || "exaltexchange7890$$").trim();

  if (!realKey || adminKey !== realKey) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  next();
};

const listingSchema = new mongoose.Schema({
  name: String,
  symbol: String,
  chain: String,
  contract: String,
  website: String,
  telegram: String,
  twitter: String,
  discord: String,
  chart: String,
  buy: String,
  status: { type: String, default: "pending" }
}, { timestamps: true });

const depositSchema = new mongoose.Schema({
  name: String,
  wallet: String,
  amount: String,
  paymentMethod: String,
  transactionId: String,
  status: { type: String, default: "pending" }
}, { timestamps: true });

const ticketSchema = new mongoose.Schema({
  wallet: String,
  issue: String,
  message: String,
  status: { type: String, default: "open" }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  name: String,
  wallet: String,
  email: String,
  password: String,
  balance: { type: Number, default: 0 }
}, { timestamps: true });

const Listing = mongoose.model("Listing", listingSchema);
const Deposit = mongoose.model("Deposit", depositSchema);
const Ticket = mongoose.model("Ticket", ticketSchema);
const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.send("Exalt Exchange Backend Running ✅");
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Exalt Exchange API running" });
});

// LISTINGS
app.post("/api/listings", async (req, res) => {
  try {
    const listing = await Listing.create({
      ...req.body,
      status: "pending"
    });

    res.json({ success: true, message: "Listing submitted", listing });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

app.get("/api/listings", async (req, res) => {
  try {
    const listings = await Listing.find().sort({ createdAt: -1 });
    res.json(listings);
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

app.post("/api/listings/status", adminAuth, async (req, res) => {
  try {
    const { id, status } = req.body;

    const listing = await Listing.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!listing) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }

    res.json({ success: true, message: "Listing status updated", listing });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// DEPOSITS
app.post("/api/deposit-request", async (req, res) => {
  try {
    const request = await Deposit.create({
      ...req.body,
      status: "pending"
    });

    res.json({ success: true, message: "Deposit request submitted", request });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

app.get("/api/deposit-request", async (req, res) => {
  try {
    const requests = await Deposit.find().sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

app.post("/api/deposit-request/status", adminAuth, async (req, res) => {
  try {
    const { id, status } = req.body;

    const request = await Deposit.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ success: false, message: "Deposit request not found" });
    }

    res.json({ success: true, message: "Deposit status updated", request });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// SUPPORT TICKETS
app.post("/api/support-ticket", async (req, res) => {
  try {
    const ticket = await Ticket.create({
      ...req.body,
      status: "open"
    });

    res.json({ success: true, message: "Support ticket submitted", ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

app.get("/api/support-ticket", async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

app.post("/api/support-ticket/status", adminAuth, async (req, res) => {
  try {
    const { id, status } = req.body;

    const ticket = await Ticket.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    res.json({ success: true, message: "Ticket status updated", ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// USERS BASIC
app.post("/api/signup", async (req, res) => {
  try {
    const { name, wallet, email, password } = req.body;

    if (!name || !wallet || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const user = await User.create({ name, wallet, email, password });

    res.json({
      success: true,
      message: "Signup successful",
      token: "exalt-user-token",
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, password });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    res.json({
      success: true,
      message: "Login successful",
      token: "exalt-user-token",
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Exalt Exchange backend running on port ${PORT}`);
});