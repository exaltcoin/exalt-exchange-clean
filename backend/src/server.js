import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

const EXALT_CONTRACT = "0xd9a9236ba831D5d059Fbb5f8238AaFcC3BBe0A78";

let listings = [
  {
    id: "exalt-official",
    name: "Exalt Coin",
    symbol: "EXALT",
    chain: "BNB Smart Chain",
    contract: EXALT_CONTRACT,
    website: "https://www.exaltcoincommunity.com",
    telegram: "https://t.me/exaltcommunity",
    twitter: "https://x.com/exalt_coin?s=21",
    discord: "",
    chart: `https://dexscreener.com/bsc/${EXALT_CONTRACT}`,
    buy: `https://pancakeswap.finance/swap?outputCurrency=${EXALT_CONTRACT}`,
    status: "approved",
    featured: true,
    createdAt: new Date().toISOString(),
  },
];

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Exalt Exchange API running" });
});

app.get("/api/listings", (req, res) => {
  res.json({ success: true, listings });
});

app.get("/api/listings/approved", (req, res) => {
  const approved = listings.filter((item) => item.status === "approved");
  res.json({ success: true, listings: approved });
});

app.post("/api/listings", (req, res) => {
  const item = {
    id: String(Date.now()),
    name: req.body.name || "",
    symbol: req.body.symbol || "",
    chain: req.body.chain || "BNB Smart Chain",
    contract: req.body.contract || "",
    website: req.body.website || "",
    telegram: req.body.telegram || "",
    twitter: req.body.twitter || "",
    discord: req.body.discord || "",
    chart: req.body.chart || "",
    buy: req.body.buy || "",
    status: "pending",
    featured: false,
    createdAt: new Date().toISOString(),
  };

  listings.unshift(item);

  res.json({
    success: true,
    message: "Listing submitted successfully",
    listing: item,
  });
});

app.post("/api/listings/status", (req, res) => {
  const { id, status } = req.body;

  const listing = listings.find((item) => String(item.id) === String(id));

  if (!listing) {
    return res.status(404).json({
      success: false,
      message: "Listing not found",
    });
  }

  listing.status = status;

  res.json({
    success: true,
    message: `Listing ${status}`,
    listing,
  });
});

app.listen(PORT, () => {
  console.log(`Exalt Exchange backend running on port ${PORT}`);
});