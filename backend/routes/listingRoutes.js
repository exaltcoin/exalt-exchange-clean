const express = require("express");
const router = express.Router();

const Listing = require("../models/Listing");

// ==============================
// GET ALL LISTINGS
// ==============================
router.get("/", async (req, res) => {
  try {
    const listings = await Listing.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      listings,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch listings",
    });
  }
});

// ==============================
// CREATE NEW LISTING
// ==============================
router.post("/", async (req, res) => {
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
} = req.body;

   const newListing = new Listing({
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
  status: "pending",
});

    await newListing.save();

    res.json({
      success: true,
      message: "Listing submitted successfully",
      listing: newListing,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Listing submit failed",
    });
  }
});

// ==============================
// APPROVE OR REJECT LISTING
// ==============================
router.put("/:id/approve", async (req, res) => {
  try {
    const { status } = req.body;

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json({
      success: true,
      message: `Listing ${status} successfully`,
      listing: updatedListing,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Listing update failed",
    });
  }
});

module.exports = router;