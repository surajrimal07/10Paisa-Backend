import axios from 'axios';
import cheerio from 'cheerio';
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
          } else if (lowerCaseName.includes('hydro') || lowerCaseName.includes('Hydro') || lowerCaseName.includes('power') || lowerCaseName.includes('Jal Vidhyut') || lowerCaseName.includes('Khola')) {
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
//share sansar top gainers
export const topgainersShare = async () => {
  const url = "https://www.sharesansar.com/top-gainers?draw=1&columns%5B0%5D%5Bdata%5D=DT_Row_Index&columns%5B0%5D%5Bname%5D=&columns%5B0%5D%5Bsearchable%5D=false&columns%5B0%5D%5Borderable%5D=false&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=symbol&columns%5B1%5D%5Bname%5D=&columns%5B1%5D%5Bsearchable%5D=false&columns%5B1%5D%5Borderable%5D=false&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=companyname&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=false&columns%5B2%5D%5Borderable%5D=false&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=close&columns%5B3%5D%5Bname%5D=&columns%5B3%5D%5Bsearchable%5D=false&columns%5B3%5D%5Borderable%5D=false&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=change_pts&columns%5B4%5D%5Bname%5D=&columns%5B4%5D%5Bsearchable%5D=false&columns%5B4%5D%5Borderable%5D=false&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B5%5D%5Bdata%5D=diff_per&columns%5B5%5D%5Bname%5D=&columns%5B5%5D%5Bsearchable%5D=false&columns%5B5%5D%5Borderable%5D=false&columns%5B5%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B5%5D%5Bsearch%5D%5Bregex%5D=false&start=0&length=50&search%5Bvalue%5D=&search%5Bregex%5D=false&_=1702613311864";

  try {
    const response = await axios.get(url, {
      headers: {
        "accept": "application/json, text/javascript, */*; q=0.01",
        "accept-language": "en-US,en;q=0.9,ne;q=0.8",
        "sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Microsoft Edge\";v=\"120\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
        "cookie": "XSRF-TOKEN=your_XSRF_TOKEN_here; sharesansar_session=your_sharesansar_session_here",
        "Referer": "https://www.sharesansar.com/top-gainers",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      }
    });

    const data = response.data.data;

    if (!Array.isArray(data)) {
      throw new Error('Data is not an array.');
    }

   // console.log('Data:', data);

    // Process the data
    const processedData = data.map(item => ({
      symbol: item.symbol.replace(/<[^>]*>/g, ''),
      name: item.companyname.replace(/<[^>]*>/g, ''),
      ltp: parseFloat(item.close),
      pointchange: parseFloat(item.change_pts),
      percentchange: parseFloat(item.diff_per),
    }));

    //console.log('Processed Data:', processedData);

    return processedData;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

//top loosers// sharesansar
export const topLosersShare = async () => {
  const url = "https://www.sharesansar.com/top-losers?draw=1&columns%5B0%5D%5Bdata%5D=DT_Row_Index&columns%5B0%5D%5Bname%5D=&columns%5B0%5D%5Bsearchable%5D=false&columns%5B0%5D%5Borderable%5D=false&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=symbol&columns%5B1%5D%5Bname%5D=&columns%5B1%5D%5Bsearchable%5D=false&columns%5B1%5D%5Borderable%5D=false&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=companyname&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=false&columns%5B2%5D%5Borderable%5D=false&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=close&columns%5B3%5D%5Bname%5D=&columns%5B3%5D%5Bsearchable%5D=false&columns%5B3%5D%5Borderable%5D=false&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=change_pts&columns%5B4%5D%5Bname%5D=&columns%5B4%5D%5Bsearchable%5D=false&columns%5B4%5D%5Borderable%5D=false&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B5%5D%5Bdata%5D=diff_per&columns%5B5%5D%5Bname%5D=&columns%5B5%5D%5Bsearchable%5D=false&columns%5B5%5D%5Borderable%5D=false&columns%5B5%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B5%5D%5Bsearch%5D%5Bregex%5D=false&start=0&length=50&search%5Bvalue%5D=&search%5Bregex%5D=false&_=1702614671747";

  try {
    const response = await axios.get(url, {
      headers: {
        "accept": "application/json, text/javascript, */*; q=0.01",
        "accept-language": "en-US,en;q=0.9,ne;q=0.8",
        "sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Microsoft Edge\";v=\"120\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
        "cookie": "XSRF-TOKEN=your_XSRF_TOKEN_here; sharesansar_session=your_sharesansar_session_here",
        "Referer": "https://www.sharesansar.com/top-losers",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      }
    });

    const data = response.data.data;

    if (!Array.isArray(data)) {
      throw new Error('Data is not in the expected format.');
    }

    const processedData = data.map((item) => ({
      symbol: item.symbol.replace(/<[^>]*>/g, ''),
      name: item.companyname.replace(/<[^>]*>/g, ''),
      ltp: parseFloat(item.close),
      pointchange: parseFloat(item.change_pts),
      percentchange: parseFloat(item.diff_per),
    }));

    //console.log('Processed Data:', processedData);

    return processedData;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const topTurnoversShare = async () => {
  const url = "https://www.sharesansar.com/top-turnovers?draw=1&columns%5B0%5D%5Bdata%5D=DT_Row_Index&columns%5B0%5D%5Bname%5D=&columns%5B0%5D%5Bsearchable%5D=false&columns%5B0%5D%5Borderable%5D=false&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=symbol&columns%5B1%5D%5Bname%5D=&columns%5B1%5D%5Bsearchable%5D=false&columns%5B1%5D%5Borderable%5D=false&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=companyname&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=false&columns%5B2%5D%5Borderable%5D=false&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=traded_amount&columns%5B3%5D%5Bname%5D=&columns%5B3%5D%5Bsearchable%5D=false&columns%5B3%5D%5Borderable%5D=false&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=close&columns%5B4%5D%5Bname%5D=&columns%5B4%5D%5Bsearchable%5D=false&columns%5B4%5D%5Borderable%5D=false&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&start=0&length=50&search%5Bvalue%5D=&search%5Bregex%5D=false&_=1702618064106";

  try {
    const response = await axios.get(url, {
      headers: {
        "accept": "application/json, text/javascript, */*; q=0.01",
        "accept-language": "en-US,en;q=0.9,ne;q=0.8",
        "sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Microsoft Edge\";v=\"120\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
        "cookie": "XSRF-TOKEN=your_XSRF_TOKEN_here; sharesansar_session=your_sharesansar_session_here",
        "Referer": "https://www.sharesansar.com/top-turnovers",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      }
    });

    const data = response.data.data;

    if (!Array.isArray(data)) {
      throw new Error('Data is not in the expected format.');
    }

    const processedData = data.map((item) => ({
      symbol: item.symbol.replace(/<[^>]*>/g, ''),
      name: item.companyname.replace(/<[^>]*>/g, ''),
      turnover: parseFloat(item.traded_amount),
      ltp: parseFloat(item.close),
    }));

   // console.log('Processed Data:', processedData);

    return processedData;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

//top volume
export const topTradedShares = async () => {
  const url = "https://www.sharesansar.com/top-tradedshares?draw=1&columns%5B0%5D%5Bdata%5D=DT_Row_Index&columns%5B0%5D%5Bname%5D=&columns%5B0%5D%5Bsearchable%5D=false&columns%5B0%5D%5Borderable%5D=false&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=symbol&columns%5B1%5D%5Bname%5D=&columns%5B1%5D%5Bsearchable%5D=false&columns%5B1%5D%5Borderable%5D=false&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=companyname&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=false&columns%5B2%5D%5Borderable%5D=false&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=traded_quantity&columns%5B3%5D%5Bname%5D=&columns%5B3%5D%5Bsearchable%5D=false&columns%5B3%5D%5Borderable%5D=false&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=close&columns%5B4%5D%5Bname%5D=&columns%5B4%5D%5Bsearchable%5D=false&columns%5B4%5D%5Borderable%5D=false&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&start=0&length=50&search%5Bvalue%5D=&search%5Bregex%5D=false&_=1702618649178";

  try {
    const response = await axios.get(url, {
      headers: {
        "accept": "application/json, text/javascript, */*; q=0.01",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "en-US,en;q=0.9,ne;q=0.8",
        "cookie": "XSRF-TOKEN=your_XSRF_TOKEN_here; sharesansar_session=your_sharesansar_session_here",
        "dnt": "1",
        "referer": "https://www.sharesansar.com/top-tradedshares",
        "sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Microsoft Edge\";v=\"120\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
        "x-requested-with": "XMLHttpRequest",
      },
    });

    const data = response.data.data;

    if (!Array.isArray(data)) {
      throw new Error('Data is not in the expected format.');
    }

    const processedData = data.map((item) => ({
      symbol: item.symbol.replace(/<[^>]*>/g, ''),
      name: item.companyname.replace(/<[^>]*>/g, ''),
      volume: parseFloat(item.traded_quantity),
      ltp: parseFloat(item.close),
    }));

    //console.log('Processed Data:', processedData);

    return processedData;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

//top transaction
export const topTransactions = async () => {
  const url = "https://www.sharesansar.com/top-transactions?draw=1&columns%5B0%5D%5Bdata%5D=DT_Row_Index&columns%5B0%5D%5Bname%5D=&columns%5B0%5D%5Bsearchable%5D=false&columns%5B0%5D%5Borderable%5D=false&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=symbol&columns%5B1%5D%5Bname%5D=&columns%5B1%5D%5Bsearchable%5D=false&columns%5B1%5D%5Borderable%5D=false&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=companyname&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=false&columns%5B2%5D%5Borderable%5D=false&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=no_trade&columns%5B3%5D%5Bname%5D=&columns%5B3%5D%5Bsearchable%5D=false&columns%5B3%5D%5Borderable%5D=false&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=close&columns%5B4%5D%5Bname%5D=&columns%5B4%5D%5Bsearchable%5D=false&columns%5B4%5D%5Borderable%5D=false&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&start=0&length=50&search%5Bvalue%5D=&search%5Bregex%5D=false&_=1702618782413";

  try {
    const response = await axios.get(url, {
      headers: {
        "accept": "application/json, text/javascript, */*; q=0.01",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "en-US,en;q=0.9,ne;q=0.8",
        "cookie": "XSRF-TOKEN=your_XSRF_TOKEN_here; sharesansar_session=your_sharesansar_session_here",
        "dnt": "1",
        "referer": "https://www.sharesansar.com/top-transactions",
        "sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Microsoft Edge\";v=\"120\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
        "x-requested-with": "XMLHttpRequest",
      },
    });

    const data = response.data.data;

    if (!Array.isArray(data)) {
      throw new Error('Data is not in the expected format.');
    }

    const processedData = data.map((item) => ({
      symbol: item.symbol.replace(/<[^>]*>/g, ''),
      name: item.companyname.replace(/<[^>]*>/g, ''),
      transactions: parseFloat(item.no_trade),
      ltp: parseFloat(item.close),
    }));

    //console.log('Processed Data:', processedData);

    return processedData;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export async function fetchIndexes() {
  try {
    const url = 'https://www.sharesansar.com/live-trading'
      const response = await axios.get(url);
      const html = response.data;
      const $ = cheerio.load(html);

      const fieldsToExtract = [
        'Banking SubIndex',
        'Development Bank Ind.',
        'Finance Index',
        'Float Index',
        'Hotels And Tourism',
        'HydroPower Index',
        'Investment',
        'Life Insurance',
        'Manufacturing And Pr.',
        'Microfinance Index',
        'Mutual Fund',
        'NEPSE Index',
        'Non Life Insurance',
        'Others Index',
        'Sensitive Float Inde.',
        'Sensitive Index',
        'Trading Index',
      ];

      const extractedData = {};

      fieldsToExtract.forEach((field) => {
        const $element = $(`h4:contains('${field}')`).closest('.mu-list');
        const price = $element.find('.mu-price').text().trim();

        const valueText = $element.find('.mu-value').text().trim();
        const values = valueText.match(/\d{1,3}(,\d{3})*\.\d+/g) || [];

        const percent = $element.find('.mu-percent').text().trim();

        extractedData[field] = {
          price,
          values,
          percent,
        };
      });

      console.log(extractedData);
      return extractedData;
    } catch (error) {
      console.error('Error fetching or parsing the HTML:', error.message);
    }
  }

export async function extractIndex() {
  try {
    const targetUrl = 'https://www.sharesansar.com/live-trading';
    const response = await axios.get(targetUrl);
    const html = response.data;
    const $ = cheerio.load(html);

    const nepseIndexContainer = $('h4:contains("NEPSE Index")').closest('.mu-list');
    const Turnover = parseFloat(nepseIndexContainer.find('.mu-price').text().replace(/,/g, ''));
    const Index = nepseIndexContainer.find('.mu-value').text().trim();
    const Percentage = nepseIndexContainer.find('.mu-percent').text().trim();

    const nepseIndexData = {
      Index,
      Percentage,
      Turnover,
    };

    return nepseIndexData;
  } catch (error) {
    console.error('Error fetching or parsing the HTML:', error.message);
  }
}



export default {extractIndex,fetchDataAndMapToAssetModel,fetchIndexes,fetchTopGainers, fetchturnvolume, fetchvolume, FetchSingularDataOfAsset,GetDebentures,FetchOldData, topgainersShare, topLosersShare, topTradedShares, topTurnoversShare, topTransactions};