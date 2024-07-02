import fs from "fs";
import path from "path";
import {
  deleteFromCache,
  fetchFromCache,
  saveToCache,
} from "../controllers/savefetchCache.js";
import {
  FetchSingleCompanyDatafromAPI,
  FetchSingularDataOfAsset,
  SupplyDemandData,
  fetchAvailableNepseSymbol,
  fetchCompanyIntradayGraph,
  fetchFunctionforNepseAlphaORSystemxlite,
  filterDuplicatesfromSystemX,
  getIndexIntraday,
  intradayIndexGraph,
  isValidData,
  topLosersShare,
  topTradedShares,
  topTransactions,
  topTurnoversShare,
  topgainersShare
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

import { apiLogger, assetLogger, nepseLogger } from '../utils/logger/logger.js';

// // single stopmic data from sharesansar
export const AssetMergedData = async (req, res) => {
  try {
    const refreshParam = req.query.refresh || "";
    const refresh = refreshParam.toLowerCase() === "refresh"

    const todayData = await FetchSingularDataOfAsset(refresh);

    await saveToCache("AssetMergedDataShareSansar", todayData);

    return respondWithData(
      res,
      "SUCCESS",
      "Data Fetched Successfully",
      todayData
    );
  } catch (error) {
    apiLogger.error(`Error fetching asset data: ${error.message}`);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

//single asset from sharesanasar like upcl
export const SingeAssetMergedData = async (req, res) => {
  apiLogger.info("Sharesansar Single Asset Data Requested");


  if (!req.query.symbol) {
    apiLogger.error("No symbol provided in the request");
    return respondWithError(
      res,
      "BAD_REQUEST",
      "No symbol provided in the request"
    );
  }
  const symbol = (req.query.symbol).toUpperCase();

  try {

    const companyDetails = await FetchSingleCompanyDatafromAPI(symbol);
    if (!companyDetails) {
      return respondWithError(
        res,
        "INTERNAL_SERVER_ERROR",
        "Failed to fetch company data."
      );
    }

    return respondWithData(
      res,
      "SUCCESS",
      "Data Fetched Successfully",
      companyDetails
    );

  } catch (error) {
    apiLogger.error(`Error fetching single asset data: ${error.message}`);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

// //filtering based on sector
// export const AssetMergedDataBySector = async (req, res) => {
//   apiLogger.info("Sharesansar Asset Data Requested by Sector");

//   const sector = req.body.sector;
//   const assettype = req.body.category;

//   if (!sector && !assettype) {
//     respondWithError(
//       res,
//       "BAD_REQUEST",
//       "No sector or asset type provided in the request"
//     );
//   }

//   try {
//     const refreshParam = req.query.refresh || "";
//     if (refreshParam.toLowerCase() === "refresh") {
//       await deleteFromCache("FetchSingularDataOfAssets");
//       await deleteFromCache("FetchOldData");
//     }

//     const [todayData, liveData] = await Promise.all([
//       FetchSingularDataOfAsset(),
//       FetchOldData(),
//     ]);

//     const liveDataMap = new Map(liveData.map((item) => [item.symbol, item]));
//     const mergedData = todayData.map((item) => ({
//       ...item,
//       ...(liveDataMap.get(item.symbol) || {}),
//     }));

//     let filteredData;

//     if (sector) {
//       filteredData = mergedData.filter((item) => item.sector === sector);
//     } else if (assettype === "Assets") {
//       filteredData = mergedData.filter((item) => item.category === "Assets");
//     } else if (assettype === "Mutual Fund") {
//       filteredData = mergedData.filter(
//         (item) => item.category === "Mutual Fund"
//       );
//     } else if (assettype === "Debenture") {
//       filteredData = mergedData.filter((item) => item.category === "Debenture");
//     } else {
//       respondWithError(
//         res,
//         "BAD_REQUEST",
//         "Invalid asset type provided in the request"
//       );
//     }

//     if (filteredData.length === 0) {
//       respondWithError(
//         res,
//         "NOT_FOUND",
//         "No data found based on the provided criteria"
//       );
//     }

//     return respondWithData(
//       res,
//       "SUCCESS",
//       "Data Fetched Successfully",
//       filteredData
//     );
//   } catch (error) {
//     apiLogger.error(`Error fetching asset data by sector: ${error.message}`);
//     return respondWithError(
//       res,
//       "INTERNAL_SERVER_ERROR",
//       "Failed to fetch commodity data."
//     );
//   }
// };

//get metal
export const fetchMetalPrices = async (req, res) => {
  assetLogger.info("Metal data requested");

  try {
    const refreshParam = req.query.refresh || "";
    if (refreshParam.toLowerCase() === "refresh") {
      assetLogger.info("Refreshing metal prices");
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
    assetLogger.error("Error fetching or logging metal prices:", error.message);
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
        assetLogger.info("Returning cached commodity data");
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
    assetLogger.error(`Error fetchirg or logging commodity data: ${error.message}`);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

export const fetchSupplyDemand = async (req, res) => {
  assetLogger.info("SupplyDemand data requested");

  try {
    const refreshParam = req.query.refresh || "";
    const isSingleCompany = req.query.company || "";

    let data = await SupplyDemandData(refreshParam.toLowerCase() === "refresh");

    if (!data) {
      return respondWithError(
        res,
        "INTERNAL_SERVER_ERROR",
        "Failed to fetch supply demand prices."
      );

    }
    if (isSingleCompany) {
      data = {
        highestDemand: data.highestDemand.filter(item => item.symbol === isSingleCompany),
        highestSupply: data.highestSupply.filter(item => item.symbol === isSingleCompany),
        highestQuantityperOrder: data.highestQuantityperOrder.filter(item => item.symbol === isSingleCompany),
      };

    }

    res.status(200).json(data);

  } catch (error) {
    assetLogger.error("Error fetching supply demand prices:", error.message);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Failed to fetch supply demand data."
    );
  }
};


//top gainers //share sansar
export const TopGainersData = async (req, res) => {
  assetLogger.info("Top Gainers Data Requested");
  try {
    const refreshParam = req.query.refresh || "";
    if (refreshParam.toLowerCase() === "refresh") {
      assetLogger.info("Refreshing top gainers data");
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
    apiLogger.error(`Error fetching top gainers data: ${error.message}`);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

//toploosers
export const TopLoosersData = async (req, res) => {
  assetLogger.info("Top Loosers Data Requested");

  try {
    const refreshParam = req.query.refresh || "";
    if (refreshParam.toLowerCase() === "refresh") {
      assetLogger.info("Refreshing top loosers data");
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
    assetLogger.error(`Error fetching top loosers data: ${error.message}`);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

//top turnover
export const TopTurnoverData = async (req, res) => {
  apiLogger.info("Top Turnover Data Requested");
  try {
    const refreshParam = req.query.refresh || "";
    if (refreshParam.toLowerCase() === "refresh") {
      apiLogger.info("Refreshing top turnover data");
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
    apiLogger.error(`Error fetching top turnover data: ${error.message}`);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

//top volume
export const TopVolumeData = async (req, res) => {
  apiLogger.info("Top Volume Data Requested");

  try {
    const refreshParam = req.query.refresh || "";
    if (refreshParam.toLowerCase() === "refresh") {
      apiLogger.info("Refreshing top volume data");
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
    apiLogger.error(`Error fetching top volume data: ${error.message}`);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

export const TopTransData = async (req, res) => {
  apiLogger.info("Top Transaction Data Requested");

  try {
    const refreshParam = req.query.refresh || "";
    if (refreshParam.toLowerCase() === "refresh") {
      apiLogger.info("Refreshing top transaction data");
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
    apiLogger.error(`Error fetching top transaction data: ${error.message}`);
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
      apiLogger.info("Refreshing dashboard data");
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

    return res.status(200).json({
      data: dashboardData,
      isCached: false,
    });
  } catch (error) {
    apiLogger.error(`Error fetching dashboard data: ${error.message}`);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

//new all indices data //returns all sub indexes
export const AllIndicesData = async (req, res) => {
  apiLogger.info("All Indices Data Requested");

  try {
    const refreshParam = req.query.refresh || "";
    const refresh = refreshParam.toLowerCase() === "refresh";

    const allIndicesData = await FetchSingularDataOfAsset(refresh);
    if (!allIndicesData) {
      return respondWithError(
        res,
        "INTERNAL_SERVER_ERROR",
      );
    }

    return respondWithData(
      res,
      "SUCCESS",
      "Data Fetched Successfully",
      allIndicesData['stockIndexData']
    );
  } catch (error) {
    apiLogger.error(`Error fetching all indices data: ${error.message}`);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

//new cache mechanism fixed and added
export const IndexData = async (req, res) => {
  apiLogger.info("Index Data Requested");
  try {
    const refreshParam = req.query.refresh || "";
    if (refreshParam.toLowerCase() === "refresh") {
      apiLogger.info("Refreshing index data");
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

    return respondWithData(
      res,
      "SUCCESS",
      "Data Fetched Successfully",
      indexData
    );
  } catch (error) {
    apiLogger.error(`Error fetching index data: ${error.message}`);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

//daily index data of aaile samma ko
export const CombinedIndexData = async (req, res) => {
  apiLogger.info("Combined Index Data Requested");
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
    apiLogger.error(`Error fetching combined index data: ${error.message}`);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

//https://localhost:4000/api/getcompanyohlc?company=nepse
//company ko aaile samma ko complete daily OHLC data //from nepsealpha or systemxlite
//accept timeframe too, used for python chart
function getIndexName(index) {
  switch (index) {
    case 'BANKING':
      return 'BANKING_index';
    case 'DEVELOPMENT BANK':
      return 'DEVELOPMENT BANK_index';
    case 'FINANCE':
      return 'FINANCE_index';
    case 'FLOAT':
      return 'FLOAT_index';
    case 'HOTELS AND TOURISM':
      return 'HOTELS AND TOURISM_index';
    case 'HYDROPOWER':
      return 'HYDROPOWER_index';
    case 'INSURANCE':
      return 'INSURANCE_index';
    case 'LIFE INSURANCE':
      return 'LIFE INSURANCE_index';
    case 'MANU.& PRO.':
      return 'MANU.& PRO._index';
    case 'MICROFINANCE':
      return 'MICROFINANCE_index';
    case 'NEPSE':
      return 'NEPSE_index';
    case 'NON LIFE INSURANCE':
      return 'NON LIFE INSURANCE_index';
    case 'OTHERS':
      return 'OTHERS_index';
    case 'SEN. FLOAT':
      return 'SEN. FLOAT_index';
    case 'SENSITIVE':
      return 'SENSITIVE_index';
    case 'TRADING':
      return 'TRADING_index';
    case 'MUTUAL FUND':
      return 'MUTUAL FUND_index';
    case 'INVESTMENT':
      return 'INVESTMENT_index';
    default:
      return index;
  }
}

//use new technique to only fetch short data if first load is off
//challange remains is how do we save this part data and merge it?
// export const getCompanyOHLCNepseAlpha = async (req, res) => {
//   const requestedSymbol = (req.query.symbol ? req.query.symbol.toUpperCase() : 'NEPSE');
//   const timeFrame = (req.query.timeFrame ? req.query.timeFrame : '1D');
//   const force_key = (req.query.force_key ? req.query.force_key : 'rrfdwdwdsdfdg');
//   const is_firstload = (req.query.firstload ? req.query.firstload : 'true');

//   //is_firstload !== 'true' then do this
//   //const start_epoch =
//   //if timeFrame = 1 then substract 10 minutes from currentEpochTime
//   //if timeFrame = 5 then substract 50 minutes from currentEpochTime
//   //if timeFrame = 15 then substract 150 minutes from currentEpochTime
//   // if timeFrame = 10 then substract 100 minutes from currentEpochTime

//   const currentEpochTime = Math.floor(Date.now() / 1000);
//   const start_date = (is_firstload === 'true' ? 768009600 : 0); //add start_epoch here


export const getCompanyOHLCNepseAlpha = async (req, res) => {
  const requestedSymbol = (req.query.symbol ? req.query.symbol.toUpperCase() : 'NEPSE');
  const timeFrame = (req.query.timeFrame ? req.query.timeFrame : '1D');
  const force_key = (req.query.force_key ? req.query.force_key : 'rrfdwdwdsdfdg');
  const is_intraday = (req.query.intradayupdate ? req.query.intradayupdate : 'false');

  assetLogger.info(`${is_intraday === 'true' ? 'Requested Intraday' : 'Requested Historical'} OHLC for symbol: ${requestedSymbol}, ${timeFrame}`);

  if (timeFrame !== '1' && timeFrame !== '5' && timeFrame !== '10' && timeFrame !== '15' && timeFrame !== '1D') {
    return respondWithError(res, 'BAD_REQUEST', 'Invalid timeFrame requested');
  };

  const __dirname = path.resolve();
  const availableSymbols = path.join(__dirname, `./public/stock/NEPSE_SYMBOLS.json`);
  const availableSymbolData = await fs.promises.readFile(availableSymbols, 'utf8');
  if (!availableSymbolData.includes(requestedSymbol)) {
    assetLogger.error(`Symbol ${requestedSymbol} not found in available symbols`);
    return respondWithError(res, 'BAD_REQUEST', 'Symbol not found in available symbols');
  }

  const fileName = path.join(__dirname, `./public/stock/${requestedSymbol}/${requestedSymbol}_${timeFrame}.json`);
  const lastUpdatedFileName = path.join(__dirname, `./public/stock/${requestedSymbol}/${requestedSymbol}_${timeFrame}_lastupdated.json`);

  try {
    //checking in cache
    const [fileData, lastUpdatedTime, lastIndexUpdatedEpochTime, isNepseOn] = await Promise.all([
      fs.promises.readFile(fileName, 'utf8').catch(err => console.log(err)),
      fs.promises.readFile(lastUpdatedFileName, 'utf8').catch(err => console.log(err)),
      fetchFromCache('intradayGraph').catch(err => console.log(err)),
      fetchFromCache('isMarketOpen').catch(err => console.log(err)),
    ]);
    const lastTimeEpochFromIndex = lastIndexUpdatedEpochTime && lastIndexUpdatedEpochTime.length ? lastIndexUpdatedEpochTime[lastIndexUpdatedEpochTime.length - 1].timeepoch : Math.floor(Date.now() / 1000);

    if (fileData && lastUpdatedTime && (!(isNepseOn && timeFrame === '1' && is_intraday) || !isNepseOn)) {
      const lastepochFromFile = JSON.parse(lastUpdatedTime).lastUpdated;
      if (lastTimeEpochFromIndex === lastepochFromFile) {
        assetLogger.info(`${requestedSymbol} ${timeFrame} data found in cache so returning cached data`);
        return res.status(200).json(JSON.parse(fileData));
      }
      assetLogger.info(`${requestedSymbol} ${timeFrame} data not found in cache, returning live data`);
    }

    if (is_intraday && timeFrame === '1' && isNepseOn) {
      try {
        assetLogger.info('Fetching Intraday update from systemxlite.com');
        const symbolIndex = await getIndexName(requestedSymbol);
        const currentEpochTime = Math.floor(Date.now() / 1000);
        const fromEpochTime = lastUpdatedTime ? JSON.parse(lastUpdatedTime).lastUpdated : '768009600';
        const response = await fetchFunctionforNepseAlphaORSystemxlite(symbolIndex, timeFrame, fromEpochTime, currentEpochTime, force_key);

        if (!response || !isValidData(response)) {
          const fileData = await fs.promises.readFile(fileName, 'utf8').catch(err => console.log(err));
          if (fileData) {
            return res.status(200).json(JSON.parse(fileData));
          }
          assetLogger.error('Failed to fetch data from both nepsealpha.com and systemxlite.com and file does not exist');
          return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'Failed to fetch data from both nepsealpha.com and systemxlite, probably invalid symbol');
        }

        //now instead of saving full data, we will save only last chunk of data of same day without overwriting the file previous content
        const existingData = JSON.parse(await fs.promises.readFile(fileName, 'utf8').catch(err => '[]'));

        //remove duplicate data because no matter what you set initital time systemx will return data from dherai aagadi
        const filteredResponse = filterDuplicatesfromSystemX(existingData, response);
        existingData.t = existingData.t.concat(filteredResponse.t);
        existingData.c = existingData.c.concat(filteredResponse.c);
        existingData.o = existingData.o.concat(filteredResponse.o);
        existingData.h = existingData.h.concat(filteredResponse.h);
        existingData.l = existingData.l.concat(filteredResponse.l);
        existingData.v = existingData.v.concat(filteredResponse.v);

        await Promise.all([
          (async () => {
            await fs.promises.mkdir(path.dirname(fileName), { recursive: true });
            await fs.promises.writeFile(fileName, JSON.stringify(existingData));
          })(),
          (async () => {
            await fs.promises.mkdir(path.dirname(lastUpdatedFileName), { recursive: true });
            await fs.promises.writeFile(lastUpdatedFileName, JSON.stringify({ lastUpdated: lastTimeEpochFromIndex }));
          })()
        ]);

        assetLogger.info('Returning Intraday data from systemxlite.com');
        return res.status(200).json(response);

      } catch (error) {
        assetLogger.error(`Error fetching data: ${error.message}`);
      }

    }
    assetLogger.info('Fetching data from systemxlite.com');
    const symbolIndex = await getIndexName(requestedSymbol);
    const currentEpochTime = Math.floor(Date.now() / 1000);
    const fromEpochTime = '768009600';
    const response = await fetchFunctionforNepseAlphaORSystemxlite(symbolIndex, timeFrame, fromEpochTime, currentEpochTime, force_key);

    if (!response || !isValidData(response)) {
      assetLogger.error('Failed to fetch data from both nepsealpha.com and systemxlite.com, trying to read from file.');
      const fileData = await fs.promises.readFile(fileName, 'utf8').catch(err => console.log(err));
      if (fileData) {
        return res.status(200).json(JSON.parse(fileData));
      }
      assetLogger.error('Failed to fetch data from both nepsealpha.com and systemxlite.com and file does not exist');
      return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'Failed to fetch data from both nepsealpha.com and systemxlite, probably invalid symbol');
    }

    await Promise.all([
      (async () => {
        await fs.promises.mkdir(path.dirname(fileName), { recursive: true });
        await fs.promises.writeFile(fileName, JSON.stringify(response));
      })(),
      (async () => {
        await fs.promises.mkdir(path.dirname(lastUpdatedFileName), { recursive: true });
        await fs.promises.writeFile(lastUpdatedFileName, JSON.stringify({ lastUpdated: lastTimeEpochFromIndex }));
      })()
    ]);
    assetLogger.info('Returning live data from systemxlite.com');
    return res.status(200).json(response);
  } catch (error) {
    assetLogger.error(`Error fetching data: ${error.message}`);
    const fileData = await fs.promises.readFile(fileName, 'utf8').catch(err => console.log(err));
    if (fileData) {
      return res.status(200).json(fileData);
    }
    respondWithError(res, 'INTERNAL_SERVER_ERROR', 'Internal Server Error');
  }
}

export const AvailableNepseSymbols = async (req, res) => {

  const refreshParam = req.query.refresh || "";
  try {
    const symbols = await fetchAvailableNepseSymbol(true, refreshParam.toLowerCase() === "refresh");
    if (!symbols) {
      return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'Failed to fetch available symbols.');
    }

    return respondWithData(res, 'SUCCESS', 'Data Fetched Successfully', symbols);
  } catch (error) {
    assetLogger.error(`Error fetching data: ${error.message}`);
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'Internal Server Error');
  }
};

//index prediction //6th sem
export const TopHeavyStocks = async (req, res) => {
  apiLogger.info("Top Impacting stocks data requested");

  try {
    const topStocks = topCompanies();
    let todayData = await FetchSingularDataOfAsset(false);
    const allIndicesData = todayData['stockIndexData'];
    todayData = todayData['stockDataWithoutName'];

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
    apiLogger.error(`Error fetching data: ${error.message}`);
    console.log(error);
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
  apiLogger.info("World Index Data Requested");
  try {
    const refreshParam = req.query.refresh || "";
    if (refreshParam.toLowerCase() === "refresh") {
      apiLogger.info("Refreshing world market data");
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
    apiLogger.error(`Error fetching world market data: ${error.message}`);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

//merged to index data
// export const nepseSummary = async (req, res) => {
//   apiLogger.info("Nepse Summary Requested");
//   try {
//     const refreshParam = req.query.refresh || "";
//     if (refreshParam.toLowerCase() === "refresh") {
//       apiLogger.info("Refreshing nepse summary");
//       await deleteFromCache("Nepsesummary");
//     }

//     const nepseSummary = await fetchSummary();
//     if (!nepseSummary) {
//       return respondWithError(
//         res,
//         "INTERNAL_SERVER_ERROR",
//         "Failed to fetch nepse summary."
//       );
//     }
//     return respondWithData(
//       res,
//       "SUCCESS",
//       "Data refreshed Successfully",
//       nepseSummary
//     );
//   } catch (error) {
//     apiLogger.error(`Error fetching nepse summary: ${error.message}`);
//     return respondWithError(
//       res,
//       "INTERNAL_SERVER_ERROR",
//       "Internal Server Error"
//     );
//   }
// };

export const nepseDailyGraphData = async (req, res) => {
  nepseLogger.info("Nepse daily graph data requested");
  try {
    const refreshParam = req.query.refresh || "";
    if (refreshParam.toLowerCase() === "refresh") {
      nepseLogger.info("Refreshing Nepse daily graph");
      await deleteFromCache("intradayIndexGraph");
    }

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
    nepseLogger.error(`Error fetching or logging nepse daily graph: ${error.message}`);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

//this api is to refresh top gainers etc data from sharesansar at EOD by using chron job
export const refreshMetalsData = async (req, res) => {
  apiLogger.info("Refreshing metals data through API");
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
  apiLogger.info("Refreshing commodity data through API");
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
  apiLogger.info("Refreshing world market data through API");
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
      nepseLogger.info(`JSON & CSV backup created in backup folder: ${backupDirPath}`);

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
      nepseLogger.info(message);
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
        nepseLogger.info(message);
      } else {
        message = "No new data exists for today to update: " + todayDate;
        nepseLogger.info(message);
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
          nepseLogger.info(`No volume change in CSV for existing date: ${todayDate}`);
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
    apiLogger.error(`Error fetching data: ${error.message}`);
    return respondWithError(
      res,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
};

//update our current daily OHLC data from nepseAlpha //khasai kai farak haina
//yo data ma epoch time xa ra yo data web ko lagi ramrai kaam garxa.
// export const FetchSingleDatafromAPINepseAlpha = async (req, res) => {
//   try {
//     const response = await fetch(
//       "https://www.nepsealpha.com/trading/1/history?force_key=vfgfhdhththhhnhjhjhj&symbol=NEPSE&from=767664000&to=1714521600&resolution=1D&pass=ok&fs=vfgfhdhththhhnhjhjhj&shouldCache=1",
//       {
//         headers: {
//           accept: "application/json, text/plain, */*",
//           "sec-ch-ua":
//             '"Chromium";v="124", "Microsoft Edge";v="124", "Not-A.Brand";v="99"',
//           "sec-ch-ua-arch": '"x86"',
//           "sec-ch-ua-bitness": '"64"',
//           "sec-ch-ua-full-version": '"124.0.2478.67"',
//           "sec-ch-ua-full-version-list":
//             '"Chromium";v="124.0.6367.91", "Microsoft Edge";v="124.0.2478.67", "Not-A.Brand";v="99.0.0.0"',
//           "sec-ch-ua-mobile": "?0",
//           "sec-ch-ua-model": '""',
//           "sec-ch-ua-platform": '"Windows"',
//           "sec-ch-ua-platform-version": '"15.0.0"',
//           "x-requested-with": "XMLHttpRequest",
//           Referer: "https://www.nepsealpha.com/trading/chart?symbol=NEPSE",
//           "Referrer-Policy": "strict-origin-when-cross-origin",
//         },
//         body: null,
//         method: "GET",
//       }
//     );

//     if (!response) {
//       return null;
//     }

//     const jsonData = await response.json();
//     const __dirname = path.resolve();
//     const filePath = path.join(
//       __dirname,
//       "public",
//       "index_data",
//       "index_web.json"
//     );
//     fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));

//     return respondWithSuccess(res, "SUCCESS", "Data fetched Successfully");
//   } catch (error) {
//     apiLogger.error(`Error fetching data: ${error.message}`);
//     return respondWithError(
//       res,
//       "INTERNAL_SERVER_ERROR",
//       "Internal Server Error"
//     );
//   }
// };

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
    apiLogger.error(`Error fetching intraday data: ${error.message}`);
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
  CommodityData,
  TopGainersData,
  DashBoardData,
  AvailableNepseSymbols,
};
