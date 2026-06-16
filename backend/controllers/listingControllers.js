const Listing = require("../models/Listing");

const createListing = async (req, res) => {
  try {
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
      liquidity: req.body.liquidity,
      ownerName: req.body.ownerName,
ownerEmail: req.body.ownerEmail,
ownerWallet: req.body.ownerWallet,
projectCategory: req.body.projectCategory,
whitepaper: req.body.whitepaper,
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