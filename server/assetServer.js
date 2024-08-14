/* eslint-disable no-unused-vars */
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { NEPSE_ACTIVE_API_URL, isNepseOpen, switchServer } from "../controllers/refreshController.js";
import { fetchFromCache, saveToCache } from "../controllers/savefetchCache.js";
import { fetchFunction } from '../server/fetchFunction.js';
import { SendNotification } from '../server/notificationServer.js';
import { assetLogger, nepseLogger } from '../utils/logger/logger.js';
import { notifyRoomClients } from './websocket.js';

const nepseIndexes = [
  { field: "Banking SubIndex", symbol: "BANKING", name: "Commercial Banking" },
  { field: "Development Bank Ind.", symbol: "DEVBANK", name: "Development Bank" },
  { field: "Finance Index", symbol: "FINANCE", name: "Finance" },
  { field: "Float Index", symbol: "FLOAT", name: "Float index" },
  { field: "Hotels And Tourism", symbol: "HOTELS", name: "Hotels and Tourism" },
  { field: "HydroPower Index", symbol: "HYDROPOWER", name: "Hydropower" },
  { field: "Investment", symbol: "INVESTMENT", name: "Investment" },
  { field: "Life Insurance", symbol: "LIFEINSU", name: "Life Insurance" },
  { field: "Manufacturing And Pr.", symbol: "MANUFACTURE", name: "Manufacturing and Processing" },
  { field: "Microfinance Index", symbol: "MICROFINANCE", name: "Microfinance" },
  { field: "Mutual Fund", symbol: "MUTUAL", name: "Mutual Fund Index" },
  { field: "NEPSE Index", symbol: "NEPSE", name: "NEPAL STOCK EXCHANGE" },
  { field: "Non Life Insurance", symbol: "NONLIFEINSU", name: "Nonlife Insurance" },
  { field: "Others Index", symbol: "OTHERS", name: "Others" },
  { field: "Sensitive Float Inde.", symbol: "SENFLOAT", name: "Sensitive Float Index" },
  { field: "Sensitive Index", symbol: "SENSITIVE", name: "Sensitive Index" },
  { field: "Trading Index", symbol: "TRADING", name: "Trading" },
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const parentDir = path.resolve(__dirname, '..');

const filePath = path.join(parentDir, 'public', 'index_data', 'SymbolNameMap.json');

const jsonData = fs.readFileSync(filePath, 'utf8');
const symbolNameMap = JSON.parse(jsonData);

const symbolToNameMap = new Map();
const nameToSymbolMap = new Map();

symbolNameMap.forEach(item => {
  symbolToNameMap.set(item.symbol, item.description);
  nameToSymbolMap.set(item.companyname, item.symbol);
});

export async function UpdateNameSymbolMapJSON() {
  try {
    let symbolNameMap = await fetch("https://www.nepsealpha.com/trading/1/search?limit=500&query=", {
      "headers": {
        "accept": "application/json, text/plain, */*",
        "sec-ch-ua": "\"Microsoft Edge\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
        "sec-ch-ua-arch": "\"x86\"",
        "sec-ch-ua-bitness": "\"64\"",
        "sec-ch-ua-full-version": "\"125.0.2535.79\"",
        "sec-ch-ua-full-version-list": "\"Microsoft Edge\";v=\"125.0.2535.79\", \"Chromium\";v=\"125.0.6422.112\", \"Not.A/Brand\";v=\"24.0.0.0\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-model": "\"\"",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-ch-ua-platform-version": "\"15.0.0\"",
        "x-requested-with": "XMLHttpRequest",
        "Referer": "https://www.nepsealpha.com/trading/chart",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      "method": "GET"
    });

    symbolNameMap = await symbolNameMap.json();

    if (!symbolNameMap.ok) {
      assetLogger.error(`HTTP error! status: ${symbolNameMap.status}`);
      return;
    }
    fs.writeFileSync(filePath, JSON.stringify(symbolNameMap, null, 2));

  }
  catch (error) {
    assetLogger.error(`Error at UpdateNameSymbolMapJSON : ${error.message}`);
  }
}


export async function FetchSingularDataOfAsset(refresh) {

  try {
    const cachedData = await fetchFromCache("FetchSingularDataOfAssets");
    if (!refresh && cachedData != null) {
      return cachedData;
    }

    const response = await fetch("https://www.sharesansar.com/live-trading", {
      headers: {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "max-age=0",
        "priority": "u=0, i",
        "sec-ch-ua": "\"Microsoft Edge\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "cookie": "_ga=GA1.1.226892968.1702885063; _ga_FPXFBP3MT9=GS1.1.1702885062.1.1.1702886988.60.0.0; XSRF-TOKEN=eyJpdiI6Ik9lOFV0ZW9UZkRlNkVUWFRQcjZkcXc9PSIsInZhbHVlIjoiNkk4QkVyQk5wNWN5ODhraC83dnYyekJPZmx0bzM0UU1UV2E3Wm9lSjB3cEJOVFNSQzkxVjdZMDlKT1pCL0xWSFp5YU05WXZZcFFIQmwraEVTRDE5c3k0RGpaSE4renFRdzZJOXdESGp3RVIrOUNQMGFRNjBBU3Q5cWU2T1d5eWIiLCJtYWMiOiI5YjlkMGVkMzE1ZDFiZDBlNDFmZjMxZmQ0MjIyYjczODIzYmRmNjM3MTlkZTg4ODI2ZTNlNWFkNTRmMWYwNGE3In0%3D; sharesansar_session=eyJpdiI6InVKSzVlQzB5V1FIZldvdzZBR1lqZEE9PSIsInZhbHVlIjoiRForNWt2L2YvLy9oODdVMjRlR3h6WXBrdEhSaUhjZVRiNHZuK000Y1RHTTkzWGpnMVlKdFJ1M0dDcWZNMWxiOXNTRUpvV2hobHE2QmRLUGFwcUY5UVNrRkpHd1cwLzNiODdSczFBTW03WEF1UFdXWitSeGtoWmJFR3VnYXVlWnQiLCJtYWMiOiI1MTk0YTY1ZTgwOGQ3ZDFiY2RiY2EyMTZiNjBhNzQ2OTMyZjQzZDAwYzJlNTM3MTM3OGZmMzYxYmM3OTZiOWViIn0%3D"
      },
      referrerPolicy: "strict-origin-when-cross-origin",
      method: "GET"
    });

    if (!response.ok && cachedData != null) {
      assetLogger.error(`HTTP error! status: ${response.status}`);
      return cachedData;
    }

    const $ = cheerio.load(await response.text());

    const stockDataWithoutName = [];
    const stockIndexData = {};

    $('#headFixed tbody tr').each((index, element) => {
      const columns = $(element).find('td');

      stockDataWithoutName.push({
        symbol: $(columns[1]).find('a').text().trim(),
        name: symbolToNameMap.get($(columns[1]).find('a').text().trim()) || "",
        ltp: parseFloat($(columns[2]).text().trim().replace(/,/g, "")),
        pointchange: parseFloat($(columns[3]).text().trim()),
        percentchange: parseFloat($(columns[4]).text().trim()),
        open: parseFloat($(columns[5]).text().trim().replace(/,/g, "")),
        high: parseFloat($(columns[6]).text().trim().replace(/,/g, "")),
        low: parseFloat($(columns[7]).text().trim().replace(/,/g, "")),
        volume: parseFloat($(columns[8]).text().trim().replace(/,/g, "")),
        previousclose: parseFloat($(columns[9]).text().trim().replace(/,/g, ""))
      });

    });

    nepseIndexes.forEach(({ field, symbol, name }) => {
      const $element = $(`h4:contains('${field}')`).closest(".mu-list");
      if ($element.length) {
        stockIndexData[field] = {
          symbol: symbol,
          name: name,
          volume: parseInt($element.find(".mu-price").text().replace(/,/g, ""), 10) || 0,
          index: parseFloat($element.find(".mu-value").text().replace(/,/g, "")) || 0,
          percent: parseFloat($element.find(".mu-percent").text().replace(/%/g, "")) || 0
        };
      }
    });

    const isNepseOpen = $(".btn.btn-danger").text().trim() !== "Market Closed";
    const lastUpdated = $("#dDate").text().trim();

    const returnData = { stockDataWithoutName, stockIndexData, isNepseOpen, lastUpdated };

    await saveToCache("FetchSingularDataOfAssets", returnData);
    await saveToCache("allindices_sourcedata", stockIndexData);

    return returnData;
  } catch (error) {
    assetLogger.error(`Error at FetchSingularDataOfAsset : ${error.message}`);
    return null;
  }
}

//not used in controller //new code merges and creates somewhat useful data from nepseapi
export async function FetchAllCompaniesDataFromAPI(refresh = false) {
  const url = NEPSE_ACTIVE_API_URL + "/CompanyList";
  const url2 = NEPSE_ACTIVE_API_URL + "/TradeTurnoverTransactionSubindices";


  const cachedData = await fetchFromCache("FetchSingularDataOfAssetsFromAPI");
  if (cachedData !== null && cachedData !== undefined && !refresh) {
    return cachedData;
  }

  try {
    const data = await fetch(url).then((response) => response.json());
    const data2 = await fetch(url2).then((response) => response.json());

    if (!data || !data2) {
      return null;
    }

    const filteredData = data
      .filter((company) => company.status === "A")
      .map(({ id, sectorName, securityName, ...rest }) => rest);

    const mergedData = filteredData.map((company) => {
      const symbol = company.symbol;
      const extraInfo = data2.scripsDetails[symbol];
      if (extraInfo) {
        return { ...company, ...extraInfo };
      } else {
        return company;
      }
    });

    await saveToCache("FetchSingularDataOfAssetsFromAPI", mergedData);
    return mergedData;
  } catch (error) {
    console.error(error);
  }
}

//not used in controller //gives very detailed data of a single company from nepseapi
//not good for high frequency api requests

export async function FetchSingleCompanyDatafromAPI(symbol) {

  const url = `/CompanyDetails?symbol=${symbol}`;

  try {
    const data = await fetchFunction(url);

    data.securityDailyTradeDto.open = data.securityDailyTradeDto.openPrice;
    delete data.securityDailyTradeDto.openPrice;

    data.securityDailyTradeDto.high = data.securityDailyTradeDto.highPrice;
    delete data.securityDailyTradeDto.highPrice;

    data.securityDailyTradeDto.low = data.securityDailyTradeDto.lowPrice;
    delete data.securityDailyTradeDto.lowPrice;

    data.securityDailyTradeDto.close = data.securityDailyTradeDto.closePrice;
    delete data.securityDailyTradeDto.closePrice;

    delete data.securityDailyTradeDto.securityId;
    delete data.security.id;
    delete data.security.isin;
    delete data.security.creditRating;
    delete data.security.meInstanceNumber;
    delete data.security.recordType;
    delete data.security.shareGroupId;
    delete data.security.cdsStockRefId;
    delete data.security.securityTradeCycle;
    delete data.security.highRangeDPR;
    delete data.security.issuerName;
    delete data.security.parentId;
    delete data.security.schemeDescription;
    delete data.security.schemeName;
    delete data.security.series;
    delete data.security.divisor;
    delete data.security.secured;

    if (data.security.companyId) {
      delete data.security.companyId.companyShortName;
      delete data.security.companyId.companyWebsite;
      delete data.security.companyId.companyRegistrationNumber;
      delete data.security.companyId.modifiedBy;
      delete data.security.companyId.modifiedDate;
    }

    delete data.updatedDate;
    delete data.securityId;

    return data;
  } catch (error) {
    assetLogger.error(`Error at FetchSingleCompanyDatafromAPI : ${error.message}`);
    return null;
  }
}


//supply demand code

async function sendSupplyDemandNotification(modifiedItem) {
  if (modifiedItem.buyToSellOrderRatio > 7 || modifiedItem.buyToSellQuantityRatio > 7) {
    let ratioComparison = '';
    const title = `Bulk Orders at ${modifiedItem.symbol}`;

    if (modifiedItem.buyToSellOrderRatio > 1) {
      ratioComparison += `Buy order is ${modifiedItem.buyToSellOrderRatio.toFixed(1)} times higher than sell order and `;
    } else {
      ratioComparison += `Sell order is ${(1 / modifiedItem.buyToSellOrderRatio).toFixed(1)} times higher than buy order and `;
    }

    if (modifiedItem.buyToSellQuantityRatio > 1) {
      ratioComparison += `buy quantity is ${modifiedItem.buyToSellQuantityRatio.toFixed(1)} times higher than sell quantity`;
    } else {
      ratioComparison += `sell quantity is ${(1 / modifiedItem.buyToSellQuantityRatio).toFixed(1)} times higher than buy quantity`;
    }

    const body = `Buy order ${modifiedItem.totalBuyOrder}, Sell order ${modifiedItem.totalSellOrder}, Buy quantity ${modifiedItem.totalBuyQuantity}, Sell quantity ${modifiedItem.totalSellQuantity}, ${ratioComparison}`;

    await SendNotification('all', title, body);
  }
}

// eslint-disable-next-line no-undef
const nepseNotification = process.env.IS_NEPSE_NOTIFICATION_ENABLED === 'true' ? true : false;

const calculatePercentageDifference = (oldValue, newValue) => {
  if (oldValue === 0 && newValue !== 0) return true;
  if (newValue === 0 && oldValue !== 0) return true;

  if (!isFinite(oldValue) && !isFinite(newValue)) {
    return false;
  }

  return Math.abs((newValue - oldValue) / oldValue) > 0.4;
};
const sendNotificationsIfNeeded = async (currentHighestQuantityPerOrder) => {
  const previousHighestQuantityPerOrder = await fetchFromCache("previousHighestQuantityPerOrder");

  if (!previousHighestQuantityPerOrder) {
    nepseLogger.info("No previous data found, treating all items as significant change.");
    await saveToCache("previousHighestQuantityPerOrder", currentHighestQuantityPerOrder);

    if (nepseNotification) {
      for (const item of currentHighestQuantityPerOrder) {
        await sendSupplyDemandNotification(item);
      }
    }
    return;
  }

  const previousMap = new Map(previousHighestQuantityPerOrder.map(item => [item.symbol, item]));

  let significantChangesDetected = false;

  for (const currentItem of currentHighestQuantityPerOrder) {
    const previousItem = previousMap.get(currentItem.symbol);

    if (!previousItem) {
      nepseLogger.info(`Significant change detected for new symbol: ${currentItem.symbol}`);
      significantChangesDetected = true;

      if (nepseNotification) {
        await sendSupplyDemandNotification(currentItem);
      }
    } else {
      const significantChangeInBuyQuantity = calculatePercentageDifference(previousItem.totalBuyQuantity, currentItem.totalBuyQuantity);
      const significantChangeInSellQuantity = calculatePercentageDifference(previousItem.totalSellQuantity, currentItem.totalSellQuantity);

      if (significantChangeInBuyQuantity || significantChangeInSellQuantity) {
        nepseLogger.info(`Significant change detected for symbol: ${currentItem.symbol}`);
        significantChangesDetected = true;

        if (nepseNotification) {
          await sendSupplyDemandNotification(currentItem);
        }
      }
    }
  }

  if (significantChangesDetected) {
    await saveToCache("previousHighestQuantityPerOrder", currentHighestQuantityPerOrder);
  }
};


const mergeBuySellData = async (item, side, matchingList) => {
  const modifiedItem = { ...item };

  if (side === 'Demand') {
    modifiedItem.totalBuyOrder = item.totalOrder;
    modifiedItem.totalBuyQuantity = item.totalQuantity;

    const matchingSellData = matchingList.find(sellItem => sellItem.symbol === item.symbol);
    if (matchingSellData) {
      modifiedItem.totalSellOrder = matchingSellData.totalOrder;
      modifiedItem.totalSellQuantity = matchingSellData.totalQuantity;
      modifiedItem.buyQuantityPerOrder = item.quantityPerOrder;
      modifiedItem.sellQuantityPerOrder = matchingSellData.quantityPerOrder;
    } else {
      modifiedItem.totalSellOrder = 0;
      modifiedItem.totalSellQuantity = 0;
    }
  } else if (side === 'Supply') {
    modifiedItem.totalSellOrder = item.totalOrder;
    modifiedItem.totalSellQuantity = item.totalQuantity;

    const matchingBuyData = matchingList.find(buyItem => buyItem.symbol === item.symbol);
    if (matchingBuyData) {
      modifiedItem.totalBuyOrder = matchingBuyData.totalOrder;
      modifiedItem.totalBuyQuantity = matchingBuyData.totalQuantity;
      modifiedItem.sellQuantityPerOrder = item.quantityPerOrder;
      modifiedItem.buyQuantityPerOrder = matchingBuyData.quantityPerOrder;
    } else {
      modifiedItem.totalBuyOrder = 0;
      modifiedItem.totalBuyQuantity = 0;
    }
  }

  modifiedItem.buyToSellOrderRatio = parseFloat((modifiedItem.totalBuyOrder / modifiedItem.totalSellOrder).toFixed(1));
  modifiedItem.buyToSellQuantityRatio = parseFloat((modifiedItem.totalBuyQuantity / modifiedItem.totalSellQuantity).toFixed(1));

  delete modifiedItem.totalOrder;
  delete modifiedItem.totalQuantity;
  delete modifiedItem.quantityPerOrder;
  delete item.orderSide;

  return modifiedItem;
};


export async function SupplyDemandData(refresh = false) {
  const url = "/SupplyDemand";

  try {
    if (!refresh || isNepseOpen === false) {
      const cachedHighestSupply = await fetchFromCache("highestSupply");
      const cachedHighestDemand = await fetchFromCache("highestDemand");
      const cachedHighestQuantityperOrder = await fetchFromCache("highestQuantityperOrder");

      if (cachedHighestSupply !== null && cachedHighestDemand !== null && cachedHighestQuantityperOrder !== null) {
        return {
          highestQuantityperOrder: cachedHighestQuantityperOrder,
          highestSupply: cachedHighestSupply,
          highestDemand: cachedHighestDemand
        };
      }
    }

    const data = await fetchFunction(url);

    const { supplyList, demandList } = data;

    const calculateQuantityPerOrder = (list, side) => {
      return list
        .filter(item => item.totalQuantity != null)
        .map(item => {
          if (item.totalOrder !== 0) {
            item.quantityPerOrder = Math.floor(item.totalQuantity / item.totalOrder);
          } else {
            item.quantityPerOrder = 0;
          }
          item.orderSide = side;
          delete item.securityId;
          return item;
        });
    };

    const demandWithQuantityPerOrder = calculateQuantityPerOrder(demandList, 'Demand');
    const supplyWithQuantityPerOrder = calculateQuantityPerOrder(supplyList, 'Supply');

    const combineAndSortTopItems = async (highestDemand, highestSupply) => {

      const combinedList = [
        ...(await Promise.all(highestDemand.map(async (item) => await mergeBuySellData(item, 'Demand', supplyList)))),
        ...(await Promise.all(highestSupply.map(async (item) => await mergeBuySellData(item, 'Supply', demandList))))
      ];

      const sortedList = combinedList
        .sort((a, b) => b.quantityPerOrder - a.quantityPerOrder)
        .slice(0, 40);

      return sortedList;
    };

    const highestDemand = demandWithQuantityPerOrder.slice(0, 40);
    const highestSupply = supplyWithQuantityPerOrder.slice(0, 40);

    const highestQuantityperOrder = await combineAndSortTopItems(highestDemand, highestSupply);

    await Promise.all([
      saveToCache("highestSupply", highestSupply),
      saveToCache("highestDemand", highestDemand),
      saveToCache("highestQuantityperOrder", highestQuantityperOrder),
      sendNotificationsIfNeeded(highestQuantityperOrder),

      notifyRoomClients('supplydemand',
        {
          type: 'supplydemand',
          highestQuantityperOrder: highestQuantityperOrder,
          highestSupply: highestSupply,
          highestDemand: highestDemand
        })

    ]);

    return { highestQuantityperOrder, highestSupply, highestDemand };
  } catch (error) {
    assetLogger.error(`Error at SupplyDemandData: ${error.message}`);
    return null;
  }
}

//nepseapi top gainers
export const topgainersShare = async (refresh) => {
  const url = NEPSE_ACTIVE_API_URL + "/TopGainers";

  try {
    const cachedData = await fetchFromCache("topgainersShare");
    if (!refresh && cachedData != null) {
      return cachedData;
    }

    const data = await fetch(url).then((response) => response.json());

    if (!Array.isArray(data) && cachedData != null) {

      await switchServer();
      assetLogger.error("Invalid data received from the API in topgainersShare.");
      return cachedData;
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

//top loosers
export const topLosersShare = async (refresh) => {
  const url = NEPSE_ACTIVE_API_URL + "/TopLosers";
  try {
    const cachedData = await fetchFromCache("topLosersShare");
    if (!refresh && cachedData != null) {
      return cachedData;
    }

    const data = await fetch(url).then((response) => response.json());
    if (!Array.isArray(data) && cachedData != null) {
      await switchServer();
      assetLogger.error("Invalid data received from the API in topLosersShare.");
      return cachedData;
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
    const cachedData = await fetchFromCache("topTurnoversShare");
    if (!refresh && cachedData != null) {
      return cachedData;
    }

    const data = await fetch(url).then((response) => response.json());

    if (!Array.isArray(data) && cachedData != null) {
      await switchServer();
      assetLogger.error("Invalid data received from the API in topTurnoversShare");
      return cachedData;
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
    const cachedData = await fetchFromCache("topTradedShares");
    if (!refresh && cachedData != null) {
      return cachedData;
    }

    const data = await fetch(url).then((response) => response.json());

    if (!Array.isArray(data) && cachedData != null) {
      await switchServer();
      assetLogger.error("Invalid data received from the API in TopTenTradeScrips.");
      return cachedData;
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
    const cachedData = await fetchFromCache("topTransactions");
    if (!refresh && cachedData != null) {
      return cachedData;
    }

    const data = await fetch(url).then((response) => response.json());
    if (!Array.isArray(data) && cachedData != null) {

      await switchServer();
      assetLogger.error("Invalid data received from the API in toptransaction. Switching server.");
      return cachedData;
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

//intraday index using NepseAPI
export async function getIndexIntraday(refresh) {
  try {
    const cachedData = await fetchFromCache("intradayIndexData");
    if (!refresh && cachedData != null) {
      return cachedData;
    }

    const [nepseIndexData, nepseSummaryData, open, isOpen] = await Promise.all([
      fetchFunction("/NepseIndex"),
      fetchFunction("/Summary"),
      fetchFromCache('intradayGraph'),
      fetchFromCache('isMarketOpen')
    ]);

    // if (open === null || isOpen === null) {
    //   assetLogger.error("Open or isOpen data is missing or undefined.");
    //   return cachedData;
    // }

    // if (cachedData != null && !nepseIndexData || !nepseSummaryData) {
    //   await switchServer();
    //   assetLogger.error("NEPSE Index data is missing or undefined. Switching server");
    //   return cachedData;
    // }

    const nepseIndex = nepseIndexData["NEPSE Index"];
    const nepseSummaryArray = Object.values(nepseSummaryData);

    const nepseIndexDataObj = {
      time: nepseIndex.generatedTime,
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
      saveToCache('previousIndexData', nepseIndexDataObj),
      saveToCache('lastBusinessDate', nepseIndex.generatedTime.split('T')[0])
    ]);

    return nepseIndexDataObj;
  } catch (error) {
    assetLogger.error(`Error at getIndexIntraday : ${error.message}`);
    return null;
  }
}

export async function intradayIndexGraph(refresh) {

  const url = "/DailyNepseIndexGraph";

  try {
    const cachedData = await fetchFromCache("intradayIndexGraph");
    if (!refresh && cachedData != null) {
      return cachedData;
    }

    const data = await fetchFunction(url);
    if (!Array.isArray(data) && cachedData != null) {
      return cachedData;
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
    assetLogger.error(`Error at intradayIndexGraph ${error.message}`);
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

    return data;
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
    const response = await fetch("https://api.npstocks.com/tv/tv/search?limit=30&query=&type=&exchange=", {
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

//this is to check for empty data that systemxlite.com returns when symbol name is incorrect.
export function isValidData(data) {
  if (!data || typeof data !== 'object' ||
    !data.s || !Array.isArray(data.t) || !Array.isArray(data.c) ||
    !Array.isArray(data.o) || !Array.isArray(data.h) ||
    !Array.isArray(data.l) || !Array.isArray(data.v)) {
    return false;
  }

  return data.s !== 'no_data' && data.t.length > 0 &&
    data.c.length > 0 && data.o.length > 0 &&
    data.h.length > 0 && data.l.length > 0 && data.v.length > 0;
}

export function filterDuplicatesfromSystemX(existingData, newData) {
  const existingSet = new Set(existingData.t);
  const filteredResponse = {
    t: [],
    c: [],
    o: [],
    h: [],
    l: [],
    v: []
  };

  newData.t.forEach((timestamp, index) => {
    if (!existingSet.has(timestamp)) {
      filteredResponse.t.push(timestamp);
      filteredResponse.c.push(newData.c[index]);
      filteredResponse.o.push(newData.o[index]);
      filteredResponse.h.push(newData.h[index]);
      filteredResponse.l.push(newData.l[index]);
      filteredResponse.v.push(newData.v[index]);
    }
  });

  return filteredResponse;
}

//fetch dynamic ohlc data from systemx or nepsealpha
export const fetchFunctionforNepseAlphaORSystemxlite = async (symbolIndex, timeFrame, fromEpochTime, currentEpochTime, force_key) => {
  let response;
  try {
    response = await fetch(`https://api.npstocks.com/tv/tv/history?symbol=${symbolIndex}&resolution=${timeFrame}&from=${fromEpochTime}&to=${currentEpochTime}&countback=18`, {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9,ne;q=0.8",
        "if-none-match": "W/\"107d7-CkFswx0Zr81sX6ZUbikPAlgnJBA\"",
        "sec-ch-ua": "\"Chromium\";v=\"124\", \"Microsoft Edge\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "sec-gpc": "1",
        Referer: "https://chart.npstocks.com/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      method: "GET"
    });
    response = await response.json();

    if (!response || !isValidData(response)) {
      throw new Error('Invalid data recieved from npstocks.com');
    }
  } catch (error) {
    //console.error('Fetching data from npstocks.com failed. Trying nepsealpha.com', error);
    assetLogger.error('Fetching data from npstocks.com failed. Trying nepsealpha.com');

    //console.log(`https://www.nepsealpha.com/trading/1/history?force_key=${force_key}&symbol=${symbolIndex}&resolution=${timeFrame}&pass=ok&fs=${force_key}`);
    //response = await fetch (`https://www.nepsealpha.com/trading/1/history?force_key=${force_key}&symbol=${symbolIndex}&resolution=${timeFrame}&pass=ok&fs=${force_key}`)
    response = await fetch(`https://www.nepsealpha.com/trading/1/history?force_key=${force_key}&symbol=${symbolIndex}&resolution=${timeFrame}&pass=ok&fs=${force_key}`, {
      headers: {
        accept: "application/json, text/plain, */*",
        "sec-ch-ua": '"Chromium";v="124", "Microsoft Edge";v="124", "Not-A.Brand";v="99"',
        "sec-ch-ua-arch": '"x86"',
        "sec-ch-ua-bitness": '"64"',
        "sec-ch-ua-full-version": '"124.0.2478.67"',
        "sec-ch-ua-full-version-list": '"Chromium";v="124.0.6367.91", "Microsoft Edge";v="124.0.2478.67", "Not-A.Brand";v="99.0.0.0"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-model": '""',
        "sec-ch-ua-platform": '"Windows"',
        "sec-ch-ua-platform-version": '"15.0.0"',
        "x-requested-with": "XMLHttpRequest",
        Referer: "https://www.nepsealpha.com/trading/chart?symbol=NEPSE",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      method: "GET"
    });
    response = await response.json();
  }

  return response;
};

export default {
  fetchCompanyIntradayGraph,
  intradayIndexGraph,
  getIndexIntraday,
  FetchSingularDataOfAsset,
  filterDuplicatesfromSystemX,
  topgainersShare,
  topLosersShare,
  topTradedShares,
  topTurnoversShare,
  topTransactions,
  fetchAvailableNepseSymbol,
  FetchSingleCompanyDatafromAPI,
  fetchFunctionforNepseAlphaORSystemxlite,
  isValidData
};
