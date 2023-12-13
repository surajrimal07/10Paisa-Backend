import axios from 'axios';
import fs from 'fs/promises';
import { JSDOM } from 'jsdom';
import nepseUrls from '../middleware/nepseapiUrl.js';


export async function fetchDataAndMapToAssetModel() {
  try {
    const response = await axios.get(nepseUrls.Company_URL);

    const assetData = response.data.map(company => ({
      symbol: company.symbol,
      name: company.companyName,
      category: company.instrumentType,
      sector: company.sectorName,
    }));

    const jsonData = JSON.stringify(assetData, null, 2);

    await fs.writeFile('mappedAssetData.json', jsonData);

    return jsonData;
  } catch (error) {
    console.error('Error fetching data:', error.message);
    throw error;
  }
}

// export async function fetchSecurityData(indexId) {
//   try {
//     const response = await axios.get(`${nepseUrls.API_URL}/${indexId}`);
//     const mappedData = response.data
//       .filter(security => security.symbol && security.securityName && security.symbol && security.indexId)
//       .map(security => ({
//         symbol: security.symbol,
//         name: security.securityName,
//         ltp: security.lastTradedPrice.toString(),
//         totaltradedquantity: security.totalTradeQuantity.toString(),
//         percentchange: security.percentageChange.toString(),
//         previousclose: security.previousClose.toString(),
//       }));
//     return mappedData;
//   } catch (error) {
//     console.error(`Error fetching security data for indexId ${indexId}:`, error.message);
//     throw error;
//   }
// }

// export async function fetchSingleSecurityData( requestedSymbol) {
//   try {
//     const response = await axios.get(`${nepseUrls.API_URL}/58`);
//     const filteredData = response.data.filter(security => security.symbol === requestedSymbol);

//     if (filteredData.length === 0) {
//       console.error(`Security with symbol ${requestedSymbol} not found`);
//       return [];
//     }

//     const mappedData = filteredData.map(security => ({
//       symbol: security.symbol,
//       name: security.securityName,
//       ltp: security.lastTradedPrice.toString(),
//       totaltradedquantity: security.totalTradeQuantity.toString(),
//       percentchange: security.percentageChange.toString(),
//       previousclose: security.previousClose.toString(),
//     }));

//     return mappedData;
//   } catch (error) {
//     console.error(`Error fetching security data :`, error.message);
//     throw error;
//   }
// }

export async function fetchTopGainers() {
  try {
    const gainers = await axios.get(nepseUrls.Gainer_URL);
    const loosers = await axios.get(nepseUrls.Looser_URL);
    const gain = gainers.data;
    const lose = loosers.data;

    const mappedGainers = gain.map(item => ({
      symbol: item.symbol,
      ltp: item.ltp || 0,
      pointChange: item.pointChange || 0,
      percentageChange: parseFloat(item.percentageChange) || 0,
      securityId: item.securityId || 0,
    }));

    const mappedLosers = lose.map(item => ({
      symbol: item.symbol,
      ltp: item.ltp || 0,
      pointChange: item.pointChange || 0,
      percentageChange: parseFloat(item.percentageChange) || 0,
      securityId: item.securityId || 0,
    }));

    const mergedData = [...mappedGainers, ...mappedLosers];
    mergedData.sort((a, b) => b.percentageChange - a.percentageChange);

    return mergedData;
  } catch (error) {
    console.error(`Error fetching data:`, error.message);
    throw error;
  }
}

export async function fetchturnvolume() {
  try {
    const turn = await axios.get(nepseUrls.Turnover_URL);
    const turnover = turn.data;
    const top10Turnover = turnover.slice(0, 10);

    const mappedTurnover = top10Turnover.map(item => {
      const symbol = item.symbol || '';
      const turnoverValue = item.turnover || 0;
      const ltp = item.closingPrice || 0;
      const name = item.securityName || '';
      const securityId = item.securityId || 0;

      return {
        symbol,
        turnover: turnoverValue,
        ltp,
        name,
        securityId,
      };
    });

    return mappedTurnover;
  } catch (error) {
    console.error(`Error fetching data:`, error.message);
    throw error;
  }
}

//fetch volume
export async function fetchvolume() {
  try {
    const vol = await axios.get(nepseUrls.Volume_URL);
    const volume = vol.data;
    const top10Volume = volume.slice(0, 10);

    const mappedVolume = top10Volume.map(item => {
      const symbol = item.symbol || '';
      const shareTraded = item.shareTraded || 0;
      const ltp = item.closingPrice || 0;
      const name = item.securityName || '';
      const securityId = item.securityId || 0;

      return {
        symbol,
        turnover: shareTraded,
        ltp,
        name,
        securityId,
      };
    });
    return mappedVolume;
  } catch (error) {
    console.error(`Error fetching data:`, error.message);
    throw error;
  }
}







//preparing to switch to sharesansar as data provider
export async function FetchSingularDataOfAsset() {
  const liveTradingUrl = 'https://www.sharesansar.com/live-trading';
  const todaySharePriceUrl = 'https://www.sharesansar.com/today-share-price';

  try {
      const responseLiveTrading = await axios.get(liveTradingUrl);

      if (!responseLiveTrading.data) {
          throw new Error(`Failed to fetch live trading data. Status: ${responseLiveTrading.status}`);
      }

      const domLiveTrading = new JSDOM(responseLiveTrading.data);
      const documentLiveTrading = domLiveTrading.window.document;

      const stockDataWithoutName = [];

      const rowsLiveTrading = documentLiveTrading.querySelectorAll('#headFixed tbody tr');

      rowsLiveTrading.forEach((row) => {
          const columns = row.querySelectorAll('td');

          const stockInfo = {
              symbol: columns[1].querySelector('a').textContent.trim(),
              ltp: parseFloat(columns[2].textContent.trim()),
              pointchange: parseFloat(columns[3].textContent.trim()),
              percentchange: parseFloat(columns[4].textContent.trim()),
              open: parseFloat(columns[5].textContent.trim()),
              high: parseFloat(columns[6].textContent.trim()),
              low: parseFloat(columns[7].textContent.trim()),
              volume: parseFloat(columns[8].textContent.trim()),
              previousclose: parseFloat(columns[9].textContent.trim()),
          };

          stockDataWithoutName.push(stockInfo);
      });

      const responseTodaySharePrice = await axios.get(todaySharePriceUrl);

      if (!responseTodaySharePrice.data) {
          throw new Error(`Failed to fetch today's share price data. Status: ${responseTodaySharePrice.status}`);
      }

      const domTodaySharePrice = new JSDOM(responseTodaySharePrice.data);
      const documentTodaySharePrice = domTodaySharePrice.window.document;

      const scriptElements = documentTodaySharePrice.querySelectorAll('script');
      let cmpjsonArray = [];

      scriptElements.forEach((scriptElement) => {
          if (scriptElement.textContent.includes('var cmpjson')) {
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

      const stockDataWithName = stockDataWithoutName.map((stockInfo) => ({
          ...stockInfo,
          name: symbolToNameMap[stockInfo.Symbol] || '',
          category: '',
          sector: '',
      }));

      stockDataWithName.forEach((stock) => {
          if (stock.name.toLowerCase().includes('debenture')) {
              stock.category = 'debenture';
          } else if (stock.LTP < 20) {
              stock.category = 'mutual fund';
          } else {
              stock.category = 'stock';
          }
      });

      return stockDataWithName;

  } catch (error) {
      console.error(error);
      throw error;
  }
}


export async function AddCategoryAndSector(stockData) {
  try {
    stockData.forEach(stockInfo => {
      const lowerCaseName = stockInfo.name.toLowerCase();

      if (stockInfo.ltp < 20 && lowerCaseName.includes('mutual fund')) {
        stockInfo.category = 'Mutual Fund';
        stockInfo.sector = 'Mutual Fund';
      } else if (lowerCaseName.includes('debenture')) {
        stockInfo.category = 'Debenture';
        stockInfo.sector = 'Debenture';
      } else {

        if (!stockInfo.sector && !lowerCaseName.includes('debenture') && !lowerCaseName.includes('mutual')) {
          if (lowerCaseName.includes('bank') && !lowerCaseName.includes('debenture') && !lowerCaseName.includes('promotor share')) {
            stockInfo.sector = 'Bank';
          } else if (lowerCaseName.includes('finance')) {
            stockInfo.sector = 'Finance';
          } else if (lowerCaseName.includes('hydro') && lowerCaseName.includes('power')) {
            stockInfo.sector = 'Hydropower';
          } else if (
            lowerCaseName.includes('bikas') ||
            lowerCaseName.includes('development')
          ) {
            stockInfo.sector = 'Development Banks';
          } else if (
            lowerCaseName.includes('microfinance') ||
            lowerCaseName.includes('laghubitta')
          ) {
            stockInfo.sector = 'Microfinance';
          } else if (lowerCaseName.includes('life insurance')) {
            stockInfo.sector = 'Life Insurance';
          } else if (lowerCaseName.includes('insurance')) {
            stockInfo.sector = 'Insurance';
          } else if (lowerCaseName.includes('investment')) {
            stockInfo.sector = 'Investment';
          } else {
            stockInfo.sector = 'unknown';
          }
        }

        stockInfo.category = 'Assets';
      }
    });

    return stockData;
  } catch (error) {
    console.error(error);
    throw error;
  }
}


export async function GetMutualFund () {
  try {

      const stockData = await fetchAndExtractStockData();
      const mutualFundStocks = stockData.filter(stock =>stock.LTP < 20);

      return mutualFundStocks;
  } catch (error) {
      console.error(error);
      throw error;
  }
}

export async function GetDebentures() {
  try {
      const stockData = await fetchAndExtractStockData();
      const debentureStocks = stockData.filter(stock => stock.name.toLowerCase().includes('debenture'));

      return debentureStocks;
  } catch (error) {
      console.error(error);
      throw error;
  }
}

//not live but good and complete
export async function FetchOldData() {
  const hardcodedUrl = 'https://www.sharesansar.com/today-share-price';

  try {
      const response = await axios.get(hardcodedUrl);

      if (!response.data) {
          throw new Error(`Failed to fetch data. Status: ${response.status}`);
      }

      const dom = new JSDOM(response.data);
      const document = dom.window.document;

      const scriptElements = document.querySelectorAll('script');
      let cmpjsonArray = [];

      scriptElements.forEach((scriptElement) => {
          if (scriptElement.textContent.includes('var cmpjson')) {
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

      const rows = document.querySelectorAll('#headFixed tbody tr');

      rows.forEach((row) => {
          const columns = row.querySelectorAll('td');

          const stockInfo = {
              symbol: columns[1].querySelector('a').textContent.trim(),
              open: parseInt(columns[3].textContent.trim()),
              high: parseInt(columns[4].textContent.trim()),
              low: parseInt(columns[5].textContent.trim()),
              ltp: parseInt(columns[6].textContent.trim()),
              vwap: parseInt(columns[7].textContent.trim()),
              volume: parseInt(columns[8].textContent.trim()),
              previousclose: parseInt(columns[9].textContent.trim()),
              Turnover: parseInt(columns[10].textContent.trim()),
              percentchange: parseInt(columns[14].textContent.trim()),
              day120: parseInt(columns[17].textContent.trim()),
              day180: parseInt(columns[18].textContent.trim()),
              week52high: parseInt(columns[19].textContent.trim()),
              week52low: parseInt(columns[20].textContent.trim()),
              name: symbolToNameMap[columns[1].querySelector('a').textContent.trim()] || '',
          };

          stockDataWithoutName.push(stockInfo);
      });

      const enrichedData = await AddCategoryAndSector(stockDataWithoutName);
      return enrichedData;

  } catch (error) {
      console.error(error);
      throw error;
  }
}

export default {fetchDataAndMapToAssetModel,fetchTopGainers, fetchturnvolume, fetchvolume, FetchSingularDataOfAsset,GetDebentures,FetchOldData};