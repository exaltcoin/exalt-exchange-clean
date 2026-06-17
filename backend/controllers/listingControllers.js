const Listing = require("../models/Listing");

const createListing = async (req, res) => {
  try {
    let score = 0;

if (req.body.kycVerified) score += 15;
if (req.body.liquidityLocked) score += 20;
if (req.body.auditAvailable) score += 20;
if (req.body.websiteVerified) score += 10;
if (req.body.telegramVerified) score += 10;
if (req.body.xVerified) score += 10;
if (req.body.teamVerified) score += 15;

let riskLevel = "High Risk";

if (score >= 80) {
  riskLevel = "Low Risk";
} else if (score >= 50) {
  riskLevel = "Medium Risk";
}
    const listing = await Listing.create({
      coinName: req.body.coinName,
      symbol: req.body.symbol,
      network: req.body.network,
      contractAddress: req.body.contractAddress || req.body.contract,
      website: req.body.website,
      logo: req.body.logo,
      telegram: req.body.telegram,
      twitter: req.body.twitter,
      bscscan: req.body.bscscan,
      chart: req.body.chart,
      price: req.body.price,
      marketCap: req.body.marketCap,
      liquidity: req.body.liquidity,
      ownerName: req.body.ownerName,
ownerEmail: req.body.ownerEmail,
ownerWallet: req.body.ownerWallet,
projectCategory: req.body.projectCategory,
whitepaper: req.body.whitepaper,
safetyScore: score,
riskLevel,

checks: {
  kycVerified: req.body.kycVerified,
  liquidityLocked: req.body.liquidityLocked,
  auditAvailable: req.body.auditAvailable,
  websiteVerified: req.body.websiteVerified,
  telegramVerified: req.body.telegramVerified,
  xVerified: req.body.xVerified,
  teamVerified: req.body.teamVerified,
},
      status: "pending",
    });

    res.status(201).json({
      success: true,
      listing,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Listing submit failed",
    });
  }
};

const getListings = async (req, res) => {
  try {
    const listings = await Listing.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      listings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
    });
  }
};

const updateListingStatus = async (req, res) => {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status,
      },
      { new: true }
    );

    res.json({
      success: true,
      listing,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
    });
  }
};

module.exports = {
  createListing,
  getListings,
  updateListingStatus,
};