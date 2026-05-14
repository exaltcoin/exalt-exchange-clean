import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
async function getRealMarketData(coin) {
  try {
    const pairAddress = coin.contract;

    const response = await fetch(
     `https://api.dexscreener.com/latest/dex/tokens/${pairAddress}` 
    );

    const data = await response.json();

    const pair = data.pairs?.[0];

    if (!pair) {
      return {
        price: "0",
        change24h: "0",
        liquidity: "0",
        volume24h: "0",
        marketCap: "0",
      };
    }

    return {
      price: pair.priceUsd || "0",
      change24h: pair.priceChange?.h24 || "0",
      liquidity: pair.liquidity?.usd || "0",
      volume24h: pair.volume?.h24 || "0",
      marketCap: pair.marketCap || "0",
    };
  } catch (error) {
    return {
      price: "0",
      change24h: "0",
      liquidity: "0",
      volume24h: "0",
      marketCap: "0",
    };
  }
}
app.get("/api/market/coins", async (req, res) => {
  try {
    const approved = listings.filter((coin) => coin.status === "approved");

    const uniqueMap = new Map();

    for (const coin of approved) {
      const key = (coin.contract || coin.symbol || coin.name || "").toLowerCase();

      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, coin);
      }
    }

    const uniqueCoins = Array.from(uniqueMap.values());

    const enrichedCoins = await Promise.all(
      uniqueCoins.map(async (coin) => {
        const market = await getRealMarketData(coin);

        return {
          ...coin,
          market,
        };
      })
    );

    res.json({
      success: true,
      coins: enrichedCoins,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
let depositRequests = [];

app.post("/api/deposit-request", async (req, res) => {
  try {
    console.log("Deposit Request:", req.body);

    const request = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
    };

    depositRequests.push(request);

    res.json({
      success: true,
      message: "Deposit request submitted",
      request,
    });

  } catch (error) {
    console.log("Deposit error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

app.get("/api/deposit-request", (req, res) => {
  res.json({
    success: true,
    requests: depositRequests,
  });
});
let supportTickets = [];

app.post("/api/support-ticket", (req, res) => {
  const ticket = {
    id: String(Date.now()),
    ...req.body,
    status: "open",
    createdAt: new Date().toISOString(),
  };

  supportTickets.unshift(ticket);

  res.json({
    success: true,
    ticket,
  });
});

app.get("/api/support-ticket", (req, res) => {
  res.json({
    success: true,
    tickets: supportTickets,
  });
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
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

app.get("/api/deposit-request", (req, res) => {
  res.json({
    success: true,
    requests: depositRequests,
  });
});
app.post("/api/deposit-request/status", (req, res) => {
  const { id, status } = req.body;

  const request = depositRequests.find((item) => item.id === id);

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
});

app.post("/api/support-ticket/status", (req, res) => {
  const { id, status } = req.body;

  const ticket = supportTickets.find((item) => item.id === id);

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: "Support ticket not found",
    });
  }

  ticket.status = status;

  res.json({
    success: true,
    ticket,
  });
});
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