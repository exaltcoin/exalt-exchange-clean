import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP"
});

app.use(limiter);
app.use(helmet());
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((error) => {
    console.log(error);
  });

const listingSchema = new mongoose.Schema(
  {
    name: String,
    contract: String,
    website: String,
    status: {
      type: String,
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const Listing = mongoose.model("Listing", listingSchema);
const adminAuth = (req, res, next) => {
  const adminKey = req.headers["x-admin-key"];

  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized"
    });
  }

  next();
};
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    name: "Exalt Exchange API",
  });
});

app.post("/api/listings", async (req, res) => {
  try {
    const listing = await Listing.create({
      name: req.body.name,
      contract: req.body.contract,
      website: req.body.website,
    });

    res.json({
      success: true,
      listing,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
    });
  }
});

app.get("/api/listings", async (req, res) => {
  try {
    const listings = await Listing.find().sort({
      createdAt: -1,
    });

    res.json(listings);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});



   app.post("/api/listings/status", async (req, res) => {
  try {
    const { id, status } = req.body;

    const listing = await Listing.findByIdAndUpdate(
      id,
      {
        status,
      },
      {
        new: true,
      }
    );

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    res.json({
      success: true,
      message: "Status updated",
      listing,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});let depositRequests = [];
let users = [];

app.post("/api/signup", (req, res) => {
  try {
    const { name, wallet, email, password } = req.body;

    if (!name || !wallet || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    const existingUser = users.find((user) => user.email === email);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const user = {
      id: String(Date.now()),
      name,
      wallet,
      email,
      password,
      balance: 0,
      createdAt: new Date().toISOString(),
    };

    users.push(user);

    res.json({
      success: true,
      message: "Signup successful",
      token: "exalt-user-token",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

app.post("/api/login", (req, res) => {
  try {
    const { email, password } = req.body;

    const user = users.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    res.json({
      success: true,
      message: "Login successful",
      token: "exalt-user-token",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

app.post("/api/deposit-request", async (req, res) => {
  try {
    const request = {
      id: String(Date.now()),
      ...req.body,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    depositRequests.unshift(request);

    res.json({
      success: true,
      message: "Deposit request submitted",
      request,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

app.get("/api/deposit-request", (req, res) => {
  try {
    res.json({
      success: true,
      requests: depositRequests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

app.post("/api/deposit-request/status", async (req, res) => {
  try {
    const { id, status } = req.body;

    const request = depositRequests.find(
      (item) => item.id === id
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Deposit request not found",
      });
    }

    request.status = status;

    res.json({
      success: true,
      request,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

app.get("/", (req, res) => {
  res.send("Exalt Exchange Backend Running ✅");
});
app.listen(PORT, () => {
  console.log(`Exalt Exchange backend running on port ${PORT}`);
});