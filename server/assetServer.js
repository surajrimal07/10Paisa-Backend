import axios from "axios";
import cheerio from "cheerio";
import fs from 'fs';
import { JSDOM } from "jsdom";
import path from 'path';
import { NEPSE_ACTIVE_API_URL } from "../controllers/refreshController.js";
import { fetchFromCache, saveToCache } from "../controllers/savefetchCache.js";

import { assetLogger } from '../utils/logger/logger.js';

//preparing to switch to sharesansar as data provider
export async function FetchSingularDataOfAsset(refresh) {
  const liveTradingUrl = "https://www.sharesansar.com/live-trading";

  try {
    if (!refresh) {
      const cachedData = await fetchFromCache("FetchSingularDataOfAssets");
      if (cachedData != null) {
        return cachedData;
      }
    }

    const responseLiveTrading = await axios.get(liveTradingUrl);

    if (!responseLiveTrading.data) {
      assetLogger.error(`Failed to fetch live trading data. Status: ${responseLiveTrading.status}`);
      return null;
    }

    const domLiveTrading = new JSDOM(responseLiveTrading.data);
    const documentLiveTrading = domLiveTrading.window.document;

    const stockDataWithoutName = [];

    const rowsLiveTrading = documentLiveTrading.querySelectorAll(
      "#headFixed tbody tr"
    );

    rowsLiveTrading.forEach((row) => {
      const columns = row.querySelectorAll("td");

      const stockInfo = {
        symbol: columns[1].querySelector("a").textContent.trim(),
        ltp: parseFloat(
          columns[2].textContent.trim().replace(/,(?=\d{3})/g, "")
        ),
        pointchange: parseFloat(columns[3].textContent.trim()),
        percentchange: parseFloat(columns[4].textContent.trim()),
        open: parseFloat(
          columns[5].textContent.trim().replace(/,(?=\d{3})/g, "")
        ),
        high: parseFloat(
          columns[6].textContent.trim().replace(/,(?=\d{3})/g, "")
        ),
        low: parseFloat(
          columns[7].textContent.trim().replace(/,(?=\d{3})/g, "")
        ),
        volume: parseFloat(
          columns[8].textContent.trim().replace(/,(?=\d{3})/g, "")
        ),
        previousclose: parseFloat(
          columns[9].textContent.trim().replace(/,(?=\d{3})/g, "")
        ),
      };

      stockDataWithoutName.push(stockInfo);
    });

    await saveToCache("FetchSingularDataOfAssets", stockDataWithoutName);
    return stockDataWithoutName;
  } catch (error) {
    assetLogger.error(`Error at FetchSingularDataOfAsset : ${error.message}`);
    //throw error;
    return null;
  }
}

//not used in controller
export async function FetchSingularDataOfAssetFromAPI(refresh) {
  const url = NEPSE_ACTIVE_API_URL + "/CompanyList";

  try {
    const cachedData = await fetchFromCache("FetchSingularDataOfAssetsFromAPI");
    if (cachedData !== null && cachedData !== undefined && !refresh) {
      return cachedData;
    }

    const data = await fetch(url).then((response) => response.json());
    await saveToCache("FetchSingularDataOfAssetsFromAPI", data);

    return data;
  } catch (error) {
    assetLogger.error(`Error fetching or parsing the data: ${error.message}`);
  }
}

export async function AddCategoryAndSector(stockData) {
  try {
    stockData.forEach((stockInfo) => {
      const lowerCaseName = stockInfo.name.toLowerCase();

      if (stockInfo.ltp < 20 && lowerCaseName.includes("mutual fund")) {
        stockInfo.category = "Mutual Fund";
        stockInfo.sector = "Mutual Fund";
      } else if (lowerCaseName.includes("debenture")) {
        stockInfo.category = "Debenture";
        stockInfo.sector = "Debenture";
      } else {
        if (
          !stockInfo.sector &&
          !lowerCaseName.includes("debenture") &&
          !lowerCaseName.includes("mutual")
        ) {
          if (
            lowerCaseName.includes("bank") &&
            !lowerCaseName.includes("debenture") &&
            !lowerCaseName.includes("promotor share")
          ) {
            stockInfo.sector = "Bank";
          } else if (lowerCaseName.includes("finance")) {
            stockInfo.sector = "Finance";
          } else if (
            lowerCaseName.includes("hydro") ||
            lowerCaseName.includes("Hydro") ||
            lowerCaseName.includes("power") ||
            lowerCaseName.includes("Jal Vidhyut") ||
            lowerCaseName.includes("Khola")
          ) {
            stockInfo.sector = "Hydropower";
          } else if (
            lowerCaseName.includes("bikas") ||
            lowerCaseName.includes("development")
          ) {
            stockInfo.sector = "Development Banks";
          } else if (
            lowerCaseName.includes("microfinance") ||
            lowerCaseName.includes("laghubitta")
          ) {
            stockInfo.sector = "Microfinance";
          } else if (lowerCaseName.includes("life insurance")) {
            stockInfo.sector = "Life Insurance";
          } else if (lowerCaseName.includes("insurance")) {
            stockInfo.sector = "Insurance";
          } else if (lowerCaseName.includes("investment")) {
            stockInfo.sector = "Investment";
          } else {
            stockInfo.sector = "unknown";
          }
        }

        stockInfo.category = "Assets";
      }
    });

    return stockData;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function GetMutualFund() {
  try {
    const stockData = await fetchAndExtractStockData();
    const mutualFundStocks = stockData.filter((stock) => stock.LTP < 20);

    return mutualFundStocks;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function GetDebentures() {
  try {
    const stockData = await fetchAndExtractStockData();
    const debentureStocks = stockData.filter((stock) =>
      stock.name.toLowerCase().includes("debenture")
    );

    return debentureStocks;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

//not live but good and complete
export async function FetchOldData(refresh) {
  const hardcodedUrl = "https://www.sharesansar.com/today-share-price";

  try {
    if (!refresh) {
      const cachedData = await fetchFromCache("FetchOldDatas");
      if (cachedData != null) {
        return cachedData;
      }
    }

    const response = await axios.get(hardcodedUrl);

    if (!response.data) {
      assetLogger.error(`Failed to fetch data at FetchOldData. Status: ${response.status}`);
      return null;
    }

    const dom = new JSDOM(response.data);
    const document = dom.window.document;

    const scriptElements = document.querySelectorAll("script");
    let cmpjsonArray = [];

    scriptElements.forEach((scriptElement) => {
      if (scriptElement.textContent.includes("var cmpjson")) {
        const scriptContent = scriptElement.textContent;
        const jsonMatch = scriptContent.match(/var cmpjson = (\[.*\]);/);

        if (jsonMatch && jsonMatch[1]) {
          const jsonContent = jsonMatch[1];
          cmpjsonArray = JSON.parse(jsonContent);
        }
      }
    });

    const symbolToNameMap = cmpjsonArray.reduce((map, item) => {
      map[item.symbol] = item.companyname;
      return map;
    }, {});

    const stockDataWithoutName = [];

    const rows = document.querySelectorAll("#headFixed tbody tr");

    rows.forEach((row) => {
      const columns = row.querySelectorAll("td");

      const stockInfo = {
        symbol: columns[1].querySelector("a").textContent.trim(),
        vwap: parseInt(columns[7].textContent.trim()),
        Turnover: parseInt(columns[10].textContent.replace(/,/g, "")), //controvercial
        //why add yesterday turnover in today data? //find alternative way
        day120: parseInt(columns[17].textContent.replace(/,/g, "")),
        day180: parseInt(columns[18].textContent.replace(/,/g, "")),
        week52high: parseInt(columns[19].textContent.replace(/,/g, "")),
        week52low: parseInt(columns[20].textContent.replace(/,/g, "")),
        name:
          symbolToNameMap[columns[1].querySelector("a").textContent.trim()] ||
          "",
      };

      stockDataWithoutName.push(stockInfo);
    });

    const enrichedData = await AddCategoryAndSector(stockDataWithoutName);
    await saveToCache("FetchOldDatas", enrichedData);

    return enrichedData;
  } catch (error) {
    assetLogger.error(`Error at FetchOldData : ${error.message}`);
  }
}
//share sansar top gainers
export const topgainersShare = async (refresh) => {
  const url = NEPSE_ACTIVE_API_URL + "/TopGainers";

  try {
    if (!refresh) {
      const cachedData = await fetchFromCache("topgainersShare");
      if (cachedData != null) {
        return cachedData;
      }
    }

    const data = await fetch(url).then((response) => response.json());

    if (!Array.isArray(data)) {
      assetLogger.error("Invalid data received from the API in topgainersShare.");
      return null;
    }

    const processedData = data.map((item) => ({
      symbol: item.symbol,
      name: item.securityName,
      ltp: item.ltp,
      pointchange: item.pointChange,
      percentchange: item.percentageChange,
    }));

    await saveToCache("topgainersShare", processedData);
    return processedData;
  } catch (error) {
    assetLogger.error(`Error at topgainersShare : ${error.message}`);
  }
};

//top loosers// sharesansar
export const topLosersShare = async (refresh) => {
  const url = NEPSE_ACTIVE_API_URL + "/TopLosers";
  try {
    if (!refresh) {
      const cachedData = await fetchFromCache("topLosersShare");
      if (cachedData != null) {
        return cachedData;
      }
    }

    const data = await fetch(url).then((response) => response.json());
    if (!Array.isArray(data)) {
      assetLogger.error("Invalid data received from the API in topLosersShare.");
      return null;
    }

    const processedData = data.map((item) => ({
      symbol: item.symbol,
      name: item.securityName,
      ltp: item.ltp,
      pointchange: item.pointChange,
      percentchange: item.percentageChange,
    }));

    await saveToCache("topLosersShare", processedData);

    return processedData;
  } catch (error) {
    assetLogger.error(`Error at topLosersShare : ${error.message}`);
  }
};

export const topTurnoversShare = async (refresh) => {
  const url = NEPSE_ACTIVE_API_URL + "/TopTenTurnoverScrips";

  try {
    if (!refresh) {
      const cachedData = await fetchFromCache("topTurnoversShare");
      if (cachedData != null) {
        return cachedData;
      }
    }

    const data = await fetch(url).then((response) => response.json());

    if (!Array.isArray(data)) {
      assetLogger.error("Invalid data received from the API in topTurnoversShare.");
      return null;
    }

    const processedData = data.map((item) => ({
      symbol: item.symbol,
      name: item.securityName,
      ltp: item.closingPrice,
      turnover: item.turnover,
    }));

    await saveToCache("topTurnoversShare", processedData);
    return processedData;
  } catch (error) {
    assetLogger.error(`Error at topTurnoversShare : ${error.message}`);
  }
};

//top volume
export const topTradedShares = async (refresh) => {
  const url = NEPSE_ACTIVE_API_URL + "/TopTenTradeScrips";
  try {
    if (!refresh) {
      const cachedData = await fetchFromCache("topTradedShares");
      if (cachedData != null) {
        return cachedData;
      }
    }

    const data = await fetch(url).then((response) => response.json());

    if (!Array.isArray(data)) {
      assetLogger.error("Invalid data received from the API in TopTenTradeScrips.");
      return null;
    }

    const processedData = data.map((item) => ({
      symbol: item.symbol,
      name: item.securityName,
      ltp: item.closingPrice,
      shareTraded: item.shareTraded,
    }));

    await saveToCache("topTradedShares", processedData);
    return processedData;
  } catch (error) {
    assetLogger.error(`Error at topTradedShares : ${error.message}`);
  }
};

//top transaction
export const topTransactions = async (refresh) => {
  const url = NEPSE_ACTIVE_API_URL + "/TopTenTransactionScrips";
  try {
    if (!refresh) {
      const cachedData = await fetchFromCache("topTransactions");
      if (cachedData != null) {
        return cachedData;
      }
    }

    const data = await fetch(url).then((response) => response.json());

    if (!Array.isArray(data)) {
      assetLogger.error("Invalid data received from the API in toptransaction.");
      return null;
    }

    const processedData = data.map((item) => ({
      symbol: item.symbol,
      name: item.securityName,
      ltp: item.lastTradedPrice,
      transactions: item.totalTrades,
    }));

    await saveToCache("topTransactions", processedData);
    return processedData;
  } catch (error) {
    assetLogger.error(`Error at topTransactions : ${error.message}`);
  }
};

//used for machine learning model
export async function fetchIndexes(refresh) {
  //to do switch to self made python api
  try {
    if (!refresh) {
      const cachedData = await fetchFromCache("allindices_sourcedata");
      if (cachedData != null) {
        return cachedData;
      }
    }

    const url = "https://www.sharesansar.com/live-trading";
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    const fieldsToExtract = [
      "Banking SubIndex",
      "Development Bank Ind.",
      "Finance Index",
      "Float Index",
      "Hotels And Tourism",
      "HydroPower Index",
      "Investment",
      "Life Insurance",
      "Manufacturing And Pr.",
      "Microfinance Index",
      "Mutual Fund",
      "NEPSE Index",
      "Non Life Insurance",
      "Others Index",
      "Sensitive Float Inde.",
      "Sensitive Index",
      "Trading Index",
    ];

    const extractedData = {};

    fieldsToExtract.forEach((field) => {
      const $element = $(`h4:contains('${field}')`).closest(".mu-list");
      const time = $("#dDate").text();
      const volume = parseInt(
        $element.find(".mu-price").text().replace(/,/g, ""),
        10
      );
      const index = parseFloat(
        $element.find(".mu-value").text().replace(/,/g, "")
      );
      const percent = parseFloat(
        $element.find(".mu-percent").text().replace(/%/g, "")
      );

      extractedData[field] = { volume, index, percent, time };
    });

    await saveToCache("allindices_sourcedata", extractedData);
    return extractedData;
  } catch (error) {
    assetLogger.error(`Error at fetchIndexes : ${error.message}`);
  }
}

//NEW fetchIndexes
export async function fetchIndexess(refresh) {
  try {
    if (!refresh) {
      const cachedData = await fetchFromCache("allindices_sourcedata");
      if (cachedData != null) {
        return cachedData;
      }
    }
  }
  catch (error) {
    assetLogger.error(`Error at fetchIndexes : ${error.message}`);
  }
}


//intraday index using NepseAPI
export async function getIndexIntraday(refresh) {
  const url = NEPSE_ACTIVE_API_URL + "/NepseIndex";
  const url2 = NEPSE_ACTIVE_API_URL + "/Summary";

  try {
    if (!refresh) {
      const cachedData = await fetchFromCache("intradayIndexData");
      if (cachedData != null) {
        return cachedData;
      }
    }

    const [nepseIndexData, nepseSummaryData, open, isOpen] = await Promise.all([
      fetch(url).then((response) => response.json()),
      fetch(url2).then((response) => response.json()),
      fetchFromCache('intradayGraph'),
      fetchFromCache('isMarketOpen')
    ]);

    if (!nepseIndexData || !nepseSummaryData || open === null || isOpen === null) {
      assetLogger.error("NEPSE Index data is missing or undefined.");
      return null;
    }

    const nepseIndex = nepseIndexData["NEPSE Index"];
    const nepseSummaryArray = Object.values(nepseSummaryData);

    const nepseIndexDataObj = {
      open: open[0].index,
      high: nepseIndex.high,
      low: nepseIndex.low,
      close: nepseIndex.currentValue,
      change: nepseIndex.change,
      percentageChange: nepseIndex.perChange,
      turnover: nepseSummaryArray[0], //first data in json
      totalTradedShared: nepseSummaryArray[1], //2nd
      totalTransactions: nepseSummaryArray[2], //3rd
      totalScripsTraded: nepseSummaryArray[3], //4th
      totalCapitalization: nepseSummaryArray[4], //5th
      isOpen: isOpen,
      fiftyTwoWeekHigh: nepseIndex.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: nepseIndex.fiftyTwoWeekLow,
      previousClose: nepseIndex.previousClose,
    };

    await Promise.all([
      saveToCache("intradayIndexData", nepseIndexDataObj),
      saveToCache('previousIndexData', nepseIndexDataObj)
    ]);

    return nepseIndexDataObj;
  } catch (error) {
    assetLogger.error(`Error at getIndexIntraday : ${error.message}`);
    return null;
  }
}

export async function intradayIndexGraph(refresh) {
  const url = NEPSE_ACTIVE_API_URL + "/DailyNepseIndexGraph";
  try {
    if (!refresh) {
      const cachedData = await fetchFromCache("intradayIndexGraph");
      if (cachedData != null) {
        return cachedData;
      }
    }

    const data = await fetch(url).then((response) => response.json());
    if (!Array.isArray(data)) {
      assetLogger.error("Invalid data received from the API in DailyNepseIndexGraph.");
      return null;
    }

    const processedData = data.map((entry) => ({
      timeepoch: entry[0],
      time: new Date(entry[0] * 1000).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: true,
      }),
      index: entry[1],
    }));

    await Promise.all([
      saveToCache("intradayIndexGraph", processedData),
      saveToCache("intradayGraph", processedData)
    ]);

    return processedData;
  } catch (error) {
    assetLogger.error(`Error at intradayIndexGraph : ${error.message}`);
    return null;
  }
}

// export async function r(refresh) {
//   const url = NEPSE_ACTIVE_API_URL + "/Summary";
//   try {
//     if (!refresh) {
//       const cachedData = await fetchFromCache("Nepsesummary");
//       if (cachedData != null) {
//         return cachedData;
//       }
//     }

//     const data = await fetch(url).then((response) => response.json());
//     await saveToCache("Nepsesummary", data);
//     return data;
//   } catch {
//     assetLogger.error(`Error at fetchSummary : ${error.message}`);
//     return null;
//   }
// }

//aauta company ko din vari ko data of today
export async function fetchCompanyIntradayGraph(company) {
  const url = NEPSE_ACTIVE_API_URL + "/DailyScripPriceGraph?symbol=" + company;

  try {
    const data = await fetch(url).then((response) => response.json());
    const modifiedData = data.map((item) => {
      const utcTime = new Date(item.time * 1000);
      const kathmanduTime = new Date(
        utcTime.toLocaleString("en-US", { timeZone: "Asia/Kathmandu" })
      );
      const timeString = kathmanduTime.toLocaleTimeString("en-US", {
        hour12: false,
      });
      return {
        ltp: item.contractRate,
        time: timeString,
      };
    });
    return modifiedData;
  } catch (error) {
    assetLogger.error(`Error at fetchCompanyIntradayGraph : ${error.message}`);
    return null;
  }
}


//good, returns dfull details of single company, general, ohlc etc
export async function fetchCompanyDailyOHLC(company) {
  const url = NEPSE_ACTIVE_API_URL + "/CompanyDetails?symbol=" + company;
  try {
    const data = await fetch(url).then((response) => response.json());

    return modifiedData;
  } catch (error) {
    assetLogger.error(`Error fetching company full details: ${error.message}`);
    return null;
  }
}


export async function fetchAvailableNepseSymbol(filterdeben = true, refresh) {

  if (!refresh) {
    const cachedData = await fetchFromCache("AvailableNepseSymbols");
    if (cachedData != null) {
      return cachedData;
    }
  }

  const __dirname = path.resolve();
  const fileName = path.join(__dirname, `../public/stock/NEPSE_SYMBOLS.json`);

  try {
    const response = await fetch("https://backendtradingview.systemxlite.com/tv/tv/search?limit=30&query=&type=&exchange=", {
      "headers": {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9,ne;q=0.8",
        "if-none-match": "W/\"107d7-CkFswx0Zr81sX6ZUbikPAlgnJBA\"",
        "sec-ch-ua": "\"Chromium\";v=\"124\", \"Microsoft Edge\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "sec-gpc": "1",
        "Referer": "https://tradingview.systemxlite.com/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      "body": null,
      "method": "GET"
    });


    if (!response || !response.ok) {
      const fileData = await fs.promises.readFile(fileName, 'utf8').catch(err => null);
      if (fileData) {
        return JSON.parse(fileData);
      }
    }

    const jsonData = await response.json();
    let symbols = jsonData.map(entry => entry.symbol);

    await fs.promises.mkdir(path.dirname(fileName), { recursive: true });
    await fs.promises.writeFile(fileName, JSON.stringify(symbols));

    if (filterdeben) {
      symbols = symbols.filter(symbol => !/\d/.test(symbol) && !symbol.includes('/'));
    }

    await saveToCache("AvailableNepseSymbols", symbols);
    return symbols;

  } catch (error) {
    const fileData = await fs.promises.readFile(fileName, 'utf8').catch(err => null);
    if (fileData) {
      return JSON.parse(fileData);
    }
    assetLogger.error(`Error at fetchAvailableNepseSymbol ${error.message}`);
    return null;
  }
}

export default {
  fetchCompanyIntradayGraph,
  intradayIndexGraph,
  getIndexIntraday,
  fetchIndexes,
  FetchSingularDataOfAsset,
  GetDebentures,
  FetchOldData,
  topgainersShare,
  topLosersShare,
  topTradedShares,
  topTurnoversShare,
  topTransactions,
  fetchAvailableNepseSymbol
};
