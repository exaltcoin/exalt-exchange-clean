const express = require("express");
const router = express.Router();

const Listing = require("../models/Listing");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const normalizeContract = (value = "") =>
  String(value || "").trim().toLowerCase();

const normalizeSymbol = (value = "") =>
  String(value || "").trim().toUpperCase();

/* PUBLIC: get approved/listed listings */
router.get("/", async (req, res) => {
  try {
    const rawListings = await Listing.find({
      status: { $in: ["approved", "listed"] },
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(300);

    const uniqueMap = new Map();

    rawListings.forEach((coin) => {
      const contract = normalizeContract(coin.contractAddress);
      const symbol = normalizeSymbol(coin.symbol);
      const key = contract || `${symbol}-${coin.coinName}`;

      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, coin);
      }
    });

    res.json({
      success: true,
      listings: Array.from(uniqueMap.values()),
    });
  } catch (error) {
    console.error("Fetch listings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch listings",
    });
  }
});

/* USER: create new listing request */
router.post("/", protect, async (req, res) => {
  try {
    const {
      coinName,
      symbol,
      website,
      telegram,
      twitter,
      contractAddress,
      description,
      ownerName,
      ownerEmail,
      ownerWallet,
      projectCategory,
      whitepaper,
      network,
      chain,
      price,
      marketCap,
      liquidity,
      chart,
      buy,
      logo,
      logoUrl,
      image,
      icon,
      bscscan,
    } = req.body;

    const cleanContract = normalizeContract(contractAddress);
    const cleanSymbol = normalizeSymbol(symbol);

    if (!coinName || !cleanSymbol || !cleanContract) {
      return res.status(400).json({
        success: false,
        message: "Coin name, symbol and contract address are required",
      });
    }

    const existing = await Listing.findOne({
      contractAddress: { $regex: new RegExp(`^${cleanContract}$`, "i") },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "This contract address is already submitted",
      });
    }

    const newListing = await Listing.create({
      user: req.user._id,
      coinName: String(coinName).trim(),
      symbol: cleanSymbol,
      website,
      telegram,
      twitter,
      contractAddress: cleanContract,
      description,
      ownerName,
      ownerEmail: ownerEmail || req.user.email,
      ownerWallet,
      projectCategory,
      whitepaper,
      network: network || "BSC",
      chain: chain || "BNB Smart Chain",
      price,
      marketCap,
      liquidity,
      chart,
      buy,
      logo: logo || logoUrl || image || icon || "",
      logoUrl: logoUrl || logo || image || icon || "",
      bscscan,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Listing submitted successfully",
      listing: newListing,
    });
  } catch (error) {
    console.error("Submit listing:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "This contract address is already submitted",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Listing submit failed",
    });
  }
});

/* USER: get my listings */
router.get("/my-listings", protect, async (req, res) => {
  try {
    const listings = await Listing.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      listings,
    });
  } catch (error) {
    console.error("My listings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch my listings",
    });
  }
});

/* ADMIN: get all listings */
router.get("/admin/all", protect, adminOnly, async (req, res) => {
  try {
    const listings = await Listing.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(300);

    res.json({
      success: true,
      listings,
    });
  } catch (error) {
    console.error("Admin listings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin listings",
    });
  }
});

/* ADMIN: approve/reject/list/delist listing */
router.put("/:id/approve", protect, adminOnly, async (req, res) => {
  try {
    const { status, adminNote, checks, safetyScore, riskLevel } = req.body;

    const allowedStatus = ["pending", "approved", "rejected", "listed", "delisted"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid listing status",
      });
    }

    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    const cleanContract = normalizeContract(listing.contractAddress);

    if (["approved", "listed"].includes(status) && cleanContract) {
      const duplicateApproved = await Listing.findOne({
        _id: { $ne: listing._id },
        contractAddress: { $regex: new RegExp(`^${cleanContract}$`, "i") },
        status: { $in: ["approved", "listed"] },
      });

      if (duplicateApproved) {
        return res.status(400).json({
          success: false,
          message:
            "Duplicate approved/listed contract found. Delist or reject duplicate first.",
        });
      }
    }

    listing.status = status;
    listing.adminNote = adminNote || "";
    listing.reviewedBy = req.user._id;
    listing.reviewedAt = new Date();

    if (checks) listing.checks = checks;
    if (safetyScore !== undefined) listing.safetyScore = Number(safetyScore);
    if (riskLevel) listing.riskLevel = riskLevel;

    await listing.save();

    res.json({
      success: true,
      message: `Listing ${status} successfully`,
      listing,
    });
  } catch (error) {
    console.error("Update listing:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Listing update failed",
    });
  }
});

module.exports = router;