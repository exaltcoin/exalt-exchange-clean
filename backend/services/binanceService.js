const WebSocket = require("ws");

let latestPrices = {};

const baseSymbols = [
  "btcusdt",
  "ethusdt",
  "bnbusdt",
  "xrpusdt",
  "dogeusdt",
  "solusdt",
  "adausdt",
  "maticusdt",
  "dotusdt",
  "ltcusdt",
  "linkusdt",
  "avaxusdt",
  "trxusdt",
  "atomusdt",
  "nearusdt",
  "filusdt",
  "aptusdt",
  "arbusdt",
  "opusdt",
  "1000pepeusdt",
  "shibusdt",
  "uniusdt",
  "etcusdt",
  "xmrusdt",
  "algousdt",
  "sandusdt",
  "manausdt",
  "aaveusdt",
  "eosusdt",
  "axsusdt",
  "injusdt",
  "vetusdt",
  "galausdt",
  "ftmusdt",
  "rndrusdt",
  "renderusdt",
  "suiusdt",
  "tiausdt",
  "stxusdt",
  "flowusdt",
  "icpusdt",
  "crousdt",
  "chzusdt",
  "enjusdt",
  "zecusdt",
  "dashusdt",
  "wavesusdt",
  "1inchusdt",
  "compusdt",
  "snxusdt",
  "sushiusdt",
  "crvusdt",
  "blurusdt",
  "ankrusdt",
  "iotxusdt",
  "hotusdt",
  "zilusdt",
  "rvnusdt",
  "roseusdt",
  "qtumusdt",
  "dydxusdt",
  "maskusdt",
  "hookusdt",
  "peopleusdt",
  "flokusdt",
  "bonkusdt",
  "wifusdt",
  "tonusdt",
  "kasusdt",
  "pendleusdt",
  "ordiusdt",
  "fetusdt",
  "oceanusdt",
  "astrusdt",
  "hbarusdt",
  "egldusdt"
];

const streams = [];

baseSymbols.forEach((symbol) => {
  streams.push(`${symbol}@trade`);
  streams.push(`${symbol}@kline_1m`);
});

function startBinanceStream(io) {
  const ws = new WebSocket(
    `wss://stream.binance.com:9443/stream?streams=${streams.join("/")}`
  );

  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    if (!data.data) return;

   if (data.data.e === "trade") {
  const symbol = data.data.s.toLowerCase();
  latestPrices[symbol] = Number(data.data.p);
      if (!io) return;

      io.emit("marketUpdate", {
        type: "price",
        symbol,
        price: Number(data.data.p),
      });
    }

    if (data.data.e === "kline") {
      const candle = data.data.k;

      if (!io) return;

      io.emit("marketUpdate", {
      candle: {
  symbol: data.data.s,
  time: Math.floor(candle.t / 1000),
  open: Number(candle.o),
  high: Number(candle.h),
  low: Number(candle.l),
  close: Number(candle.c),
  volume: Number(candle.v),
},
      });
    }
  });

  ws.on("open", () => {
    console.log("Binance WebSocket Connected");
  });

  ws.on("error", (err) => {
    console.log("Binance WebSocket Error:", err.message);
  });

  ws.on("close", () => {
    console.log("Binance WebSocket Closed. Reconnect disabled.");
   // setTimeout(() => startBinanceStream(io), 30000);
  });
}

function getPrice(symbol) {
    if (!symbol) return 0;

    symbol = symbol.toLowerCase();

    return Number(latestPrices[symbol]) || 0;
}

module.exports = {
  startBinanceStream,
  getPrice,
  latestPrices,
};