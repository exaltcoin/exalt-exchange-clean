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
    });
  }
});

app.post("/api/listings/status", adminAuth, async (req, res) => {
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
});
app.get("/", (req, res) => {
  res.send("Exalt Exchange Backend Running ✅");
});
app.listen(PORT, () => {
  console.log(`Exalt Exchange backend running on port ${PORT}`);
});