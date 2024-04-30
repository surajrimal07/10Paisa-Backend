import fs from "fs";
import storage from "node-persist";
import path from "path";
import {
  deleteFromCache,
  fetchFromCache,
  saveToCache,
} from "../controllers/savefetchCache.js";
import {
  FetchOldData,
  FetchSingularDataOfAsset,
  fetchCompanyIntradayGraph,
  fetchIndexes,
  fetchSummary,
  getIndexIntraday,
  intradayIndexGraph,
  topLosersShare,
  topTradedShares,
  topTransactions,
  topTurnoversShare,
  topgainersShare,
} from "../server/assetServer.js";
import { commodityprices } from "../server/commodityServer.js";
import { metalPriceExtractor } from "../server/metalServer.js";
import { oilExtractor } from "../server/oilServer.js";
import topCompanies from "../server/top_capitalization.js";
import { extractWorldMarketData } from "../server/worldmarketServer.js";
import {
  respondWithData,
  respondWithError,
  respondWithSuccess,
} from "../utils/response_utils.js";
await storage.init();

// // single stopmic data from sharesansar
export const AssetMergedData = async (req, res) => {
  console.log("Sharesansar Asset Data Requested");

  try {
    const refreshParam = req.query.refresh || "";
    if (refreshParam.toLowerCase() === "refresh") {
      await deleteFromCache("FetchSingularDataOfAssets");
      await deleteFromCache("FetchOldData");
    }

    const [todayData, liveData] = await Promise.all([
      FetchSingularDataOfAsset(),
      FetchOldData(),
    ]);

    const liveDataMap = new Map(liveData.map((item) => [item.symbol, item]));

    const mergedData = todayData.map((item) => ({
      ...item,
      ...(liveDataMap.get(item.symbol) || {}),
    }));

    return respondWithData(
      res,
      "SUCCESS",
      "Data Fetched Successfully",
      mergedData
    );
  } catch (error) {
    console.error(error);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

//single asset from sharesanasar like upcl
export const SingeAssetMergedData = async (req, res) => {
  console.log("Sharesansar Single Asset Data Requested");
  const symbol = req.body.symbol;

  if (!symbol) {
    console.error("No symbol provided in the request");
    return respondWithError(
      res,
      "BAD_REQUEST",
      "No symbol provided in the request"
    );
  }

  try {
    const [todayData, liveData] = await Promise.all([
      FetchSingularDataOfAsset(),
      FetchOldData(),
    ]);

    const liveDataMap = new Map(liveData.map((item) => [item.symbol, item]));
    const mergedData = todayData.map((item) => ({
      ...item,
      ...(liveDataMap.get(item.symbol) || {}),
    }));

    const filteredMergedData = mergedData.filter(
      (item) => item.symbol === symbol
    );

    return res.status(200).json({
      data: filteredMergedData,
      isCached: false,
    });
  } catch (error) {
    console.error(error);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

//filtering based on sector
export const AssetMergedDataBySector = async (req, res) => {
  console.log("Sharesansar Asset Data Requested by Sector");

  console.log("Request sector:", req.body.sector);

  const sector = req.body.sector;
  const assettype = req.body.category;

  if (!sector && !assettype) {
    respondWithError(
      res,
      "BAD_REQUEST",
      "No sector or asset type provided in the request"
    );
  }

  try {
    const refreshParam = req.query.refresh || "";
    if (refreshParam.toLowerCase() === "refresh") {
      await deleteFromCache("FetchSingularDataOfAssets");
      await deleteFromCache("FetchOldData");
    }

    const [todayData, liveData] = await Promise.all([
      FetchSingularDataOfAsset(),
      FetchOldData(),
    ]);

    const liveDataMap = new Map(liveData.map((item) => [item.symbol, item]));
    const mergedData = todayData.map((item) => ({
      ...item,
      ...(liveDataMap.get(item.symbol) || {}),
    }));

    let filteredData;

    if (sector) {
      filteredData = mergedData.filter((item) => item.sector === sector);
    } else if (assettype === "Assets") {
      filteredData = mergedData.filter((item) => item.category === "Assets");
    } else if (assettype === "Mutual Fund") {
      filteredData = mergedData.filter(
        (item) => item.category === "Mutual Fund"
      );
    } else if (assettype === "Debenture") {
      filteredData = cachedData.filter((item) => item.category === "Debenture");
    } else {
      respondWithError(
        res,
        "BAD_REQUEST",
        "Invalid asset type provided in the request"
      );
    }

    if (filteredData.length === 0) {
      respondWithError(
        res,
        "NOT_FOUND",
        "No data found based on the provided criteria"
      );
    }

    return respondWithData(
      res,
      "SUCCESS",
      "Data Fetched Successfully",
      filteredData
    );
  } catch (error) {
    console.error(error);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Failed to fetch commodity data."
    );
  }
};

//get metal
export const fetchMetalPrices = async (req, res) => {
  console.log("Metal data requested");

  try {
    const refreshParam = req.query.refresh || "";
    if (refreshParam.toLowerCase() === "refresh") {
      console.log("Refreshing metal prices");
      deleteFromCache("metalprices");
    }
    const metalData = await metalPriceExtractor();
    if (!metalData) {
      return respondWithError(
        res,
        "INTERNAL_SERVER_ERROR",
        "Failed to fetch metal prices."
      );
    }

    return res.status(200).json({ metalData });
  } catch (error) {
    console.error("Error fetching or logging metal prices:", error.message);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Failed to fetch commodity data."
    );
  }
};

//commodity
export const CommodityData = async (req, res) => {
  try {
    const refreshParam = req.query.refresh || "";
    if (refreshParam.toLowerCase() !== "refresh") {
      const cachedData = await fetchFromCache("CommodityData");
      if (cachedData !== null && cachedData !== undefined) {
        console.log("Returning cached commodity data");
        return respondWithData(
          res,
          "SUCCESS",
          "Data fetched Successfully",
          cachedData
        );
      }
    }

    const commodityTableData = await commodityprices(); //commodityprices
    const oilData = await oilExtractor();
    if (!commodityTableData || !oilData) {
      // || !oilData
      return respondWithError(
        res,
        "INTERNAL_SERVER_ERROR",
        "Failed to fetch commodity data."
      );
    }

    const commodityData = commodityTableData
      .filter((rowData) => rowData[0].trim() !== "")
      .map((rowData) => ({
        symbol: rowData[0],
        name: rowData[0],
        category: "Vegetables",
        unit: rowData[1],
        ltp: parseFloat(rowData[4]),
      }));

    const oilAssetData = oilData.slice(6).map((oilItem) => ({ ...oilItem })); //this is because
    //i need to switch oil extraction site, on server the site bans scarping resulting in whole request failing

    const mergedData = oilData
      ? [...commodityData, ...oilAssetData]
      : [...commodityData];
    await saveToCache("CommodityData", mergedData);

    return respondWithData(
      res,
      "SUCCESS",
      "Data Fetched Successfully",
      mergedData
    );
  } catch (error) {
    console.error(error);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

//top gainers //share sansar
export const TopGainersData = async (req, res) => {
  console.log("Top gainers data requested");
  try {
    const refreshParam = req.query.refresh || "";
    if (refreshParam.toLowerCase() === "refresh") {
      console.log("Refreshing top gainers data");
      deleteFromCache("topgainersShare");
    }
    const topGainersData = await topgainersShare();

    if (!topGainersData) {
      return respondWithError(
        res,
        "INTERNAL_SERVER_ERROR",
        "Failed to fetch top gainers data."
      );
    }

    return respondWithData(
      res,
      "SUCCESS",
      "Data Fetched Successfully",
      topGainersData
    );
  } catch (error) {
    console.error(error);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

//toploosers
export const TopLoosersData = async (req, res) => {
  console.log("Top loosers data requested");

  try {
    const refreshParam = req.query.refresh || "";
    if (refreshParam.toLowerCase() === "refresh") {
      console.log("Refreshing top loosers data");
      deleteFromCache("topLosersShare");
    }

    const topGainersData = await topLosersShare();
    if (!topGainersData) {
      return respondWithError(
        res,
        "INTERNAL_SERVER_ERROR",
        "Failed to fetch top loosers data."
      );
    }

    return respondWithData(
      res,
      "SUCCESS",
      "Data Fetched Successfully",
      topGainersData
    );
  } catch (error) {
    console.error(error);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

//top turnover
export const TopTurnoverData = async (req, res) => {
  console.log("Top turnover data requested");
  try {
    const refreshParam = req.query.refresh || "";
    if (refreshParam.toLowerCase() === "refresh") {
      console.log("Refreshing top turnover data");
      deleteFromCache("topTurnoversShare");
    }
    const topGainersData = await topTurnoversShare();

    if (!topGainersData) {
      return respondWithError(
        res,
        "INTERNAL_SERVER_ERROR",
        "Failed to fetch top turnover data."
      );
    }
    return respondWithData(
      res,
      "SUCCESS",
      "Data Fetched Successfully",
      topGainersData
    );
  } catch (error) {
    console.error(error);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

//top volume
export const TopVolumeData = async (req, res) => {
  console.log("Top volume data requested");

  try {
    const refreshParam = req.query.refresh || "";
    if (refreshParam.toLowerCase() === "refresh") {
      console.log("Refreshing top volume data");
      deleteFromCache("topTradedShares");
    }

    const topGainersData = await topTradedShares();
    if (!topGainersData) {
      return respondWithError(
        res,
        "INTERNAL_SERVER_ERROR",
        "Failed to fetch top volume data."
      );
    }

    return respondWithData(
      res,
      "SUCCESS",
      "Data Fetched Successfully",
      topGainersData
    );
  } catch (error) {
    console.error(error);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

export const TopTransData = async (req, res) => {
  console.log("Top Transaction data requested");

  try {
    const refreshParam = req.query.refresh || "";
    if (refreshParam.toLowerCase() === "refresh") {
      console.log("Refreshing top transaction data");
      deleteFromCache("topTransactions");
    }

    const topGainersData = await topTransactions();
    if (!topGainersData) {
      return respondWithError(
        res,
        "INTERNAL_SERVER_ERROR",
        "Failed to fetch top transaction data."
      );
    }

    return respondWithData(
      res,
      "SUCCESS",
      "Data Fetched Successfully",
      topGainersData
    );
  } catch (error) {
    console.error(error);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

export const DashBoardData = async (req, res) => {
  try {
    const refreshParam = req.query.refresh || "";
    if (refreshParam.toLowerCase() === "refresh") {
      console.log("Refreshing dashboard data");
      deleteFromCache("topgainersShare");
      deleteFromCache("topLosersShare");
      deleteFromCache("topTurnoversShare");
      deleteFromCache("topTradedShares");
      deleteFromCache("topTransactions");
    }

    const topGainersData = await topgainersShare();
    const topLoosersData = await topLosersShare();
    const topTurnoverData = await topTurnoversShare();
    const topVolumeData = await topTradedShares();
    const topTransData = await topTransactions();

    const dashboardData = {
      topGainers: {
        data: topGainersData,
      },
      topLoosers: {
        data: topLoosersData,
      },
      topTurnover: {
        data: topTurnoverData,
      },
      topVolume: {
        data: topVolumeData,
      },
      topTrans: {
        data: topTransData,
      },
    };

    await saveToCache("DashBoardData", dashboardData);
    console.log("Returning live dashboard data");

    return res.status(200).json({
      data: dashboardData,
      isCached: false,
    });
  } catch (error) {
    console.error(error);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

//new all indices data //returns all sub indexes
export const AllIndicesData = async (req, res) => {
  console.log("All Indices Data Requested");

  try {
    const refreshParam = req.query.refresh || "";
    if (refreshParam.toLowerCase() === "refresh") {
      console.log("Refreshing all indices data");
      deleteFromCache("allindices_sourcedata");
    }

    const allIndicesData = await fetchIndexes();
    if (!allIndicesData) {
      return respondWithError(
        res,
        "INTERNAL_SERVER_ERROR",
        "Failed to fetch all indices datas."
      );
    }

    await saveToCache("AllIndicesDatas", allIndicesData);
    return respondWithData(
      res,
      "SUCCESS",
      "Data Fetched Successfully",
      allIndicesData
    );
  } catch (error) {
    console.error(error);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

//new cache mechanism fixed and added
export const IndexData = async (req, res) => {
  console.log("Index Data Requested");
  try {
    const refreshParam = req.query.refresh || "";
    if (refreshParam.toLowerCase() === "refresh") {
      // if (await getIsMarketOpen() === false){
      //   console.log('serving from cache of controller');
      //   const cachedData = await fetchFromCache('intradayIndexData');
      //   return respondWithData(res,'SUCCESS','Data Fetched Successfully',cachedData);
      // }
      console.log("Refreshing index data");
      await deleteFromCache("intradayIndexData");
    }

    const indexData = await getIndexIntraday(false);
    if (!indexData) {
      return respondWithError(
        res,
        "INTERNAL_SERVER_ERROR",
        "Failed to fetch index data."
      );
    }

    console.log("Returning index data");
    return respondWithData(
      res,
      "SUCCESS",
      "Data Fetched Successfully",
      indexData
    );
  } catch (error) {
    console.error(error);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

//daily index data of aaile samma ko
export const CombinedIndexData = async (req, res) => {
  console.log("Combined Index Data Requested");
  try {
    const format = req.query.format || "json";
    const __dirname = path.resolve();
    if (format === "json") {
      const filePath = path.join(
        __dirname,
        "public",
        "index_data",
        "index_daily.json"
      );
      const jsonData = fs.readFileSync(filePath, "utf8");
      res.send(JSON.parse(jsonData));
    } else if (format === "csv") {
      const csvFilePath = path.join(
        __dirname,
        "public",
        "index_data",
        "index_daily.csv"
      );
      const csvData = fs.readFileSync(csvFilePath, "utf8");
      res.set("Content-Type", "text/csv");
      res.send(csvData);
    } else if (format === "graph") {
      const filePath = path.join(
        __dirname,
        "public",
        "index_data",
        "index_web.json"
      );
      const jsonData = fs.readFileSync(filePath, "utf8");
      res.send(JSON.parse(jsonData));
    } else {
      return respondWithError(res, "BAD_REQUEST", "Invalid format specified");
    }
  } catch (error) {
    console.error("Error handling request:", error.message);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

//https://localhost:4000/api/getcompanyohlc?company=nepse
export const getCompanyOHLCNepseAlpha = async (req, res) => {
  const company = req.query.company.toUpperCase();
  try {
    const response = await fetch(
      "https://www.nepsealpha.com/trading/1/history?force_key=vfgfhdhththhhnhjhjhj&symbol=" +
        company +
        "&from=767664000&to=1714521600&resolution=1D&pass=ok&fs=vfgfhdhththhhnhjhjhj&shouldCache=1",
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "sec-ch-ua":
            '"Chromium";v="124", "Microsoft Edge";v="124", "Not-A.Brand";v="99"',
          "sec-ch-ua-arch": '"x86"',
          "sec-ch-ua-bitness": '"64"',
          "sec-ch-ua-full-version": '"124.0.2478.67"',
          "sec-ch-ua-full-version-list":
            '"Chromium";v="124.0.6367.91", "Microsoft Edge";v="124.0.2478.67", "Not-A.Brand";v="99.0.0.0"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-model": '""',
          "sec-ch-ua-platform": '"Windows"',
          "sec-ch-ua-platform-version": '"15.0.0"',
          "x-requested-with": "XMLHttpRequest",
          Referer: "https://www.nepsealpha.com/trading/chart?symbol=NEPSE",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: null,
        method: "GET",
      }
    );

    if (!response) {
      return respondWithError(
        res,
        "INTERNAL_SERVER_ERROR",
        "Internal Server Error"
      );
    }

    const jsonData = await response.json();
    console.log("Response:", jsonData);
    return res.status(200).json(jsonData);
  } catch (error) {
    console.error(error);
    respondWithError(res, "INTERNAL_SERVER_ERROR", "Internal Server Error");
  }
};

//index prediction //6th sem
export const TopHeavyStocks = async (req, res) => {
  console.log("Top Impacting stocks data requested");

  try {
    const topStocks = topCompanies();
    const todayData = await FetchSingularDataOfAsset();
    const allIndicesData = await fetchIndexes();

    const result = topStocks.map((stock) => {
      const matchingData = todayData.find(
        (data) => data.symbol === stock.ticker
      );
      if (matchingData) {
        return {
          ticker: stock.ticker,
          name: stock.name,
          impact: stock.impact,
          ltp: matchingData.ltp,
          pointchange: matchingData.pointchange,
          percentchange: matchingData.percentchange,
        };
      } else {
        return {
          ticker: stock.ticker,
          name: stock.name,
          impact: stock.impact,
          ltp: null,
          pointchange: null,
          percentchange: null,
        };
      }
    });

    const overallStrength = await calculateOverallStrength(
      result,
      todayData,
      allIndicesData
    );

    const jsonResponse = {
      prediction: calculateOverallPrediction(overallStrength),
      strength: parseFloat(overallStrength.toFixed(2)),
      topIndex: allIndicesData,
      topCompanies: result,
    };

    res.json(jsonResponse);
  } catch (error) {
    console.error("Error fetching data:", error);
    respondWithError(res, "INTERNAL_SERVER_ERROR", "Internal Server Error");
  }
};

async function calculateOverallStrength(companies, todayData, allIndicesData) {
  const specifiedWeights = {
    "Banking SubIndex": 0.2,
    "HydroPower Index": 0.15,
    "Life Insurance": 0.1,
    "Others Index": 0.15,
    "Non Life Insurance": 0.1,
  };

  const specifiedWeightTotal = Object.values(specifiedWeights).reduce(
    (sum, weight) => sum + weight,
    0
  );
  const remainingWeight = 1 - specifiedWeightTotal;

  let overallWeightedChange = 0;
  let overallWeight = 0;

  companies.forEach((stock) => {
    const matchingData = todayData.find((data) => data.symbol === stock.ticker);
    if (matchingData) {
      const impactPercentage = parseFloat(stock.impact) / 100;

      // Calculate weighted change for high-cap companies (60% weight)
      const weightedChange =
        0.6 * impactPercentage * parseFloat(matchingData.percentchange);
      overallWeightedChange += weightedChange;
      overallWeight += 0.6 * impactPercentage;
    }
  });

  // Calculate weighted change for index movements (40% weight)
  Object.keys(allIndicesData).forEach((indexName) => {
    if (specifiedWeights[indexName]) {
      const indexData = allIndicesData[indexName];
      const indexWeightedChange =
        0.4 * specifiedWeights[indexName] * (indexData.percent / 100);
      overallWeightedChange += indexWeightedChange;
      overallWeight += 0.4 * specifiedWeights[indexName];
    }
  });

  if (overallWeight > 0) {
    const overallStrength = overallWeightedChange / overallWeight;
    return overallStrength;
  } else {
    return 0;
  }
}

function calculateOverallPrediction(overallStrength) {
  if (overallStrength > 0.8) {
    return "Market likely to increase significantly";
  } else if (overallStrength > 0.2 && overallStrength <= 0.8) {
    return "Market may increase";
  } else if (overallStrength < -0.8) {
    return "Market likely to decrease significantly";
  } else if (overallStrength < -0.2 && overallStrength >= -0.8) {
    return "Market may decrease";
  } else {
    return "Market may remain stable";
  }
}

//
export const WorldMarketData = async (req, res) => {
  console.log("World Index Data Requested");
  try {
    const refreshParam = req.query.refresh || "";
    if (refreshParam.toLowerCase() === "refresh") {
      console.log("Refreshing worldmarket data");
      await deleteFromCache("worldmarket");
    }

    const worlddata = await extractWorldMarketData();
    if (!worlddata) {
      return respondWithError(
        res,
        "INTERNAL_SERVER_ERROR",
        "Failed to fetch world data."
      );
    }

    return respondWithData(
      res,
      "SUCCESS",
      "Data refreshed Successfully",
      worlddata
    );
  } catch (error) {
    console.error(error);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

export const nepseSummary = async (req, res) => {
  console.log("Nepse Summary Requested");
  try {
    const refreshParam = req.query.refresh || "";
    if (refreshParam.toLowerCase() === "refresh") {
      console.log("Refreshing Nepse Summary");
      await deleteFromCache("Nepsesummary");
    }

    const nepseSummary = await fetchSummary();
    if (!nepseSummary) {
      return respondWithError(
        res,
        "INTERNAL_SERVER_ERROR",
        "Failed to fetch nepse summary."
      );
    }
    return respondWithData(
      res,
      "SUCCESS",
      "Data refreshed Successfully",
      nepseSummary
    );
  } catch (error) {
    console.error(error);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

export const nepseDailyGraphData = async (req, res) => {
  console.log("Nepse daily graph data Requested");
  try {
    const refreshParam = req.query.refresh || "";
    if (refreshParam.toLowerCase() === "refresh") {
      console.log("Refreshing Nepse daily graph");
      await deleteFromCache("intradayIndexGraph");
    }

    //if query params is csv then convert to csv and send the data

    const nepseDailyGraph = await intradayIndexGraph();

    if (!nepseDailyGraph) {
      return respondWithError(
        res,
        "INTERNAL_SERVER_ERROR",
        "Failed to fetch nepse daily graph."
      );
    }
    return respondWithData(
      res,
      "SUCCESS",
      "Data fetched Successfully",
      nepseDailyGraph
    );
  } catch (error) {
    console.error(error);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

//this api is to refresh top gainers etc data from sharesansar at EOD by using chron job
export const refreshMetalsData = async (req, res) => {
  console.log("Refreshing metals data through API");
  await deleteFromCache("metalprices");
  const metalPrices = await metalPriceExtractor();

  if (!metalPrices) {
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Failed to fetch metal prices."
    );
  }
  return respondWithSuccess(res, "SUCCESS", "Data refreshed Successfully");
};

export const refreshCommodityData = async (req, res) => {
  console.log("Refreshing commodity data through API");
  await deleteFromCache("CommodityData");
  const commodityData = await commodityprices();

  if (!commodityData) {
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Failed to fetch commodity data."
    );
  }

  return respondWithSuccess(res, "SUCCESS", "Data refreshed Successfully");
};

export const refreshWorldMarketData = async (req, res) => {
  console.log("Refreshing world market data through API");
  await deleteFromCache("worldmarket");
  const worlddata = await extractWorldMarketData();

  if (!worlddata) {
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Failed to fetch world data."
    );
  }

  return respondWithSuccess(res, "SUCCESS", "Data refreshed Successfully");
};

export const fetchAndMergeDailyNepsePrice = async (req, res) => {
  try {
    const __dirname = path.resolve();
    let message = "";
    const todayOHLC = await fetchFromCache("intradayIndexData");

    const jsonfilePath = path.join(
      __dirname,
      "public",
      "index_data",
      "index_daily.json"
    );
    const jsonData = fs.readFileSync(jsonfilePath, "utf8");
    const parsedData = JSON.parse(jsonData);

    //csv
    const csvFilePath = path.join(
      __dirname,
      "public",
      "index_data",
      "index_daily.csv"
    );
    const csvData = fs.readFileSync(csvFilePath, "utf8");
    const csvRows = csvData.trim().split("\n");
    const csvHeaders = csvRows.shift().split(",");
    let csvUpdated = false;

    //update json
    const formattedDate = new Date(todayOHLC.time);
    const todayDate = `${formattedDate.getFullYear()}-${String(
      formattedDate.getMonth() + 1
    ).padStart(2, "0")}-${String(formattedDate.getDate()).padStart(2, "0")}`;

    const isNewDate = !parsedData.some((item) => item.date === todayDate);

    if (isNewDate) {
      const backupDirPath = path.join(
        __dirname,
        "public",
        "index_data",
        "backup"
      );
      if (!fs.existsSync(backupDirPath)) {
        fs.mkdirSync(backupDirPath, { recursive: true });
      }
      const backupJsonFilePath = path.join(backupDirPath, "index_daily.json");
      const backupCsvFilePath = path.join(backupDirPath, "index_daily.csv");
      fs.copyFileSync(jsonfilePath, backupJsonFilePath);
      fs.copyFileSync(csvFilePath, backupCsvFilePath);
      console.log("JSON & CSV backup created in backup folder:", backupDirPath);

      // Add new data
      parsedData.push({
        date: todayDate,
        open: todayOHLC.open,
        high: todayOHLC.high,
        low: todayOHLC.low,
        close: todayOHLC.close,
        volume: todayOHLC.turnover.toString(),
      });
      message = "New data added for date: " + todayDate;
      console.log(message);
      fs.writeFileSync(jsonfilePath, JSON.stringify(parsedData, null, 2), "utf8");
    } else {
      // Update existing data if there's a change in volume
      const existingIndex = parsedData.findIndex(
        (item) => item.date === todayDate
      );
      if (
        existingIndex !== -1 &&
        parsedData[existingIndex].volume !== todayOHLC.turnover.toString()
      ) {
        parsedData[existingIndex] = {
          ...parsedData[existingIndex],
          volume: todayOHLC.turnover.toString(),
        };
        message = "Data updated for existing date: " + todayDate;
        console.log(message);
      } else {
        message = "No new data exists for today to update: " + todayDate;
        console.log(message);
      }
    }

    //update csv
    let lastRow = csvRows[csvRows.length - 1];
    let lastRowIndex = parseInt(lastRow.split(",")[0]);
    let newIndex = lastRowIndex + 1;

    csvRows.forEach((row, index) => {
      const rowData = row.split(",");
      const rowDate = rowData[1];

      if (rowDate === todayDate) {
        if (rowData[5] !== todayOHLC.turnover.toString()) {
          //if this is needed or not not sure, check in live market
          lastRow = csvRows[csvRows.length - 2];
          lastRowIndex = parseInt(lastRow.split(",")[0]);
          newIndex = lastRowIndex + 1;

          csvRows[
            index
          ] = `${newIndex},${todayDate},${todayOHLC.open},${todayOHLC.high},${todayOHLC.low},${todayOHLC.close},${todayOHLC.turnover}`;
          csvUpdated = true;
        } else {
          console.log("No volume change in CSV for existing date:", todayDate);
        }
      }
    });

    if (!csvUpdated) {
      const newRow = `${newIndex},${todayDate},${todayOHLC.open},${todayOHLC.high},${todayOHLC.low},${todayOHLC.close},${todayOHLC.turnover}`;
      csvRows.push(newRow);
    }

    const updatedCsvData = `${csvHeaders.join(",")}\n${csvRows.join("\n")}`;
    fs.writeFileSync(csvFilePath, updatedCsvData, "utf8");

    return respondWithSuccess(res, "SUCCESS", message);
  } catch (error) {
    console.error(error);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

//update our current daily OHLC data from nepseAlpha //khasai kai farak haina
//yo data ma epoch time xa ra yo data web ko lagi ramrai kaam garxa.
export const FetchSingleDatafromAPINepseAlpha = async (req, res) => {
  try {
    const response = await fetch(
      "https://www.nepsealpha.com/trading/1/history?force_key=vfgfhdhththhhnhjhjhj&symbol=NEPSE&from=767664000&to=1714521600&resolution=1D&pass=ok&fs=vfgfhdhththhhnhjhjhj&shouldCache=1",
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "sec-ch-ua":
            '"Chromium";v="124", "Microsoft Edge";v="124", "Not-A.Brand";v="99"',
          "sec-ch-ua-arch": '"x86"',
          "sec-ch-ua-bitness": '"64"',
          "sec-ch-ua-full-version": '"124.0.2478.67"',
          "sec-ch-ua-full-version-list":
            '"Chromium";v="124.0.6367.91", "Microsoft Edge";v="124.0.2478.67", "Not-A.Brand";v="99.0.0.0"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-model": '""',
          "sec-ch-ua-platform": '"Windows"',
          "sec-ch-ua-platform-version": '"15.0.0"',
          "x-requested-with": "XMLHttpRequest",
          Referer: "https://www.nepsealpha.com/trading/chart?symbol=NEPSE",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: null,
        method: "GET",
      }
    );

    if (!response) {
      return null;
    }

    const jsonData = await response.json();
    const __dirname = path.resolve();
    const filePath = path.join(
      __dirname,
      "public",
      "index_data",
      "index_web.json"
    );
    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));

    return respondWithSuccess(res, "SUCCESS", "Data fetched Successfully");
  } catch (error) {
    console.error(error);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

export const fetchIntradayCompanyGraph = async (req, res) => {
  try {
    const symbol = req.query.symbol;
    const intradayData = await fetchCompanyIntradayGraph(symbol);
    if (!intradayData) {
      return respondWithError(
        res,
        "INTERNAL_SERVER_ERROR",
        "Failed to fetch intraday data."
      );
    }
    return respondWithData(
      res,
      "SUCCESS",
      "Data fetched Successfully",
      intradayData
    );
  } catch (error) {
    console.error(error);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

export default {
  fetchIntradayCompanyGraph,
  refreshMetalsData,
  fetchAndMergeDailyNepsePrice,
  nepseDailyGraphData,
  nepseSummary,
  refreshWorldMarketData,
  refreshCommodityData,
  CombinedIndexData,
  fetchMetalPrices,
  TopVolumeData,
  TopTransData,
  TopTurnoverData,
  topLosersShare,
  AssetMergedData,
  SingeAssetMergedData,
  AssetMergedDataBySector,
  CommodityData,
  TopGainersData,
  DashBoardData,
  FetchSingleDatafromAPINepseAlpha,
};
