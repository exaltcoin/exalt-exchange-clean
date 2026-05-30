const axios = require("axios");

async function getTokenData(contractAddress) {
  try {
    const response = await axios.get(
      `https://api.dexscreener.com/tokens/v1/bsc/${contractAddress}`
    );

    return response.data;
  } catch (error) {
    console.log("DEX SCREENER ERROR:", error.message);

    return [];
  }
}

async function searchCoins(query) {
  try {
    const response = await axios.get(
      `https://api.dexscreener.com/latest/dex/search?q=${query}`
    );

    return response.data;
  } catch (error) {
    console.log("SEARCH ERROR:", error.message);

    return [];
  }
}

module.exports = {
  getTokenData,
  searchCoins,
};