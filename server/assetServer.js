import axios from 'axios';
import cheerio from 'cheerio';
import { JSDOM } from 'jsdom';
//import storage from 'node-persist';
import { fetchFromCache, saveToCache } from '../controllers/savefetchCache.js';
//await storage.init();

//preparing to switch to sharesansar as data provider
export async function FetchSingularDataOfAsset() {
  const liveTradingUrl = 'https://www.sharesansar.com/live-trading';

  try {
    const cachedData = await fetchFromCache('FetchSingularDataOfAssets');
    if (cachedData) {
      return cachedData;
    }
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
              ltp: parseFloat(columns[2].textContent.trim().replace(/,(?=\d{3})/g, '')),
              pointchange: parseFloat(columns[3].textContent.trim()),
              percentchange: parseFloat(columns[4].textContent.trim()),
              open: parseFloat(columns[5].textContent.trim().replace(/,(?=\d{3})/g, '')),
              high: parseFloat(columns[6].textContent.trim().replace(/,(?=\d{3})/g, '')),
              low: parseFloat(columns[7].textContent.trim().replace(/,(?=\d{3})/g, '')),
              volume: parseFloat(columns[8].textContent.trim().replace(/,(?=\d{3})/g, '')),
              previousclose: parseFloat(columns[9].textContent.trim().replace(/,(?=\d{3})/g, '')),
          };

          stockDataWithoutName.push(stockInfo);
      });

      await saveToCache('FetchSingularDataOfAssets', stockDataWithoutName);
      return stockDataWithoutName;

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
    const cachedData = await fetchFromCache('FetchOldDatas');
    if (cachedData) {
      return cachedData;
    }
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
              vwap: parseInt(columns[7].textContent.trim()),
              Turnover: parseInt(columns[10].textContent.replace(/,/g, '')), //controvercial
              //why add yesterday turnover in today data? //find alternative way
              day120: parseInt(columns[17].textContent.replace(/,/g, '')),
              day180: parseInt(columns[18].textContent.replace(/,/g, '')),
              week52high: parseInt(columns[19].textContent.replace(/,/g, '')),
              week52low: parseInt(columns[20].textContent.replace(/,/g, '')),
              name: symbolToNameMap[columns[1].querySelector('a').textContent.trim()] || '',
          };

          stockDataWithoutName.push(stockInfo);
      });

      const enrichedData = await AddCategoryAndSector(stockDataWithoutName);
      await saveToCache('FetchOldDatas', enrichedData);

      return enrichedData;

  } catch (error) {
      console.error(error);
      throw error;
  }
}
//share sansar top gainers
export const topgainersShare = async () => {
  const url = "http://localhost:5000/TopGainers";

  try {
    const cachedData = await fetchFromCache('topgainersShare');
    if (cachedData) {
      return cachedData;
    }

    const response = await fetch(url);
    const data = await response.json();

    const processedData = data.map(item => ({
      symbol: item.symbol,
      name: item.securityName,
      ltp: item.ltp,
      pointchange: item.pointChange,
      percentchange: item.percentageChange,
    }));

    await saveToCache('topgainersShare', processedData);
    return processedData;
  } catch (error) {
    console.error(error);
  }
};


//top loosers// sharesansar
export const topLosersShare = async () => {

  const url = "http://localhost:5000/TopLosers";
  try {
    const cachedData = await fetchFromCache('topLosersShare');
    if (cachedData) {
      return cachedData;
    }

    const response = await fetch(url);
    const data = await response.json();

    const processedData = data.map(item => ({
      symbol: item.symbol,
      name: item.securityName,
      ltp: item.ltp,
      pointchange: item.pointChange,
      percentchange: item.percentageChange,
    }));

    await saveToCache('topLosersShare', processedData);

    return processedData;
  } catch (error) {
    console.error(error);
  }
};

export const topTurnoversShare = async () => {
  const url = "http://localhost:5000/TopTenTurnoverScrips";

  try {
    const cachedData = await fetchFromCache('topTurnoversShare');
    if (cachedData) {
      return cachedData;
    }

    const response = await fetch(url);
    const data = await response.json();

    const processedData = data.map(item => ({
      symbol: item.symbol,
      name: item.securityName,
      ltp: item.closingPrice,
      turnover: item.turnover
    }));

    await saveToCache('topTurnoversShare', processedData);
    return processedData;
  } catch (error) {
    console.error(error);
  }
};

//top volume
export const topTradedShares = async () => {
  const url = "http://localhost:5000/TopTenTradeScrips";
  try {
    const cachedData = await fetchFromCache('topTradedShares');
    if (cachedData) {
      return cachedData;
    }

    const response = await fetch(url);
    const data = await response.json();

    const processedData = data.map(item => ({
      symbol: item.symbol,
      name: item.securityName,
      closingPrice: item.closingPrice,
      shareTraded: item.turnover
    }));

    await saveToCache('topTradedShares', processedData);
    return processedData;
  } catch (error) {
    console.error(error);
  }
};

//top transaction
export const topTransactions = async () => {
  const url = "http://localhost:5000/TopTenTransactionScrips";
  try {
    const cachedData = await fetchFromCache('topTransactions');
    if (cachedData) {
      return cachedData;
    }

    const response = await fetch(url);
    const data = await response.json();

    const processedData = data.map(item => ({
      symbol: item.symbol,
      name: item.securityName,
      ltp: item.lastTradedPrice,
      transactions: item.totalTrades
    }));

    await saveToCache('topTransactions', processedData);
    return processedData;
  } catch (error) {
    console.error(error);
  }
};

//used for machine learning model
export async function fetchIndexes() { //to do switch to self made python api
  try {

    const cachedData = await fetchFromCache('allindices_sourcedata');
    if (cachedData !== null) {
      return cachedData;
    }

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
        const time = $('#dDate').text();
        const volume = parseInt($element.find('.mu-price').text().replace(/,/g, ''), 10);
        const index = parseFloat($element.find('.mu-value').text().replace(/,/g, ''));
        const percent = parseFloat($element.find('.mu-percent').text().replace(/%/g, ''));

        extractedData[field] = { volume, index, percent,time };
    });

      await saveToCache('allindices_sourcedata', extractedData);
      return extractedData;
    } catch (error) {
      console.error('Error fetching or parsing the HTML:', error.message);
    }
  }

//replacement of intraday index above
export async function getIndexIntraday() {
  try {

    const cachedData = await fetchFromCache('intradayIndexData');
    if (cachedData) {
      return cachedData;
    }

    const [response1, response2, response3] = await Promise.all([
      axios.get('https://www.sharesansar.com/live-trading'),
      axios.get('https://nepseapi.zorsha.com.np/DailyNepseIndexGraph'),
      axios.get('https://nepseapi.zorsha.com.np/IsNepseOpen')
    ]);

    const $ = cheerio.load(response1.data);

    const nepseIndexContainer = $('h4:contains("NEPSE Index")').closest('.mu-list');
    const turnover = parseFloat(nepseIndexContainer.find('.mu-price').text().replace(/,/g, ''));
    const close = parseFloat(nepseIndexContainer.find('.mu-value').text().replace(/,/g, ''));
    const percentageChange = parseFloat(nepseIndexContainer.find('.mu-percent').text().replace(/,/g, ''))
    //const percentageChange = parseFloat(nepseIndexContainer.find('.mu-percent').text().match(/\d+\.\d+/)[0]) / 100;

    const currentDate = new Date();
    const formattedDate = currentDate.getFullYear() + '/' +
                         (currentDate.getMonth() + 1).toString().padStart(2, '0') + '/' +
                         currentDate.getDate().toString().padStart(2, '0');

    const jsonData = response2.data;
    const valuesArray = jsonData.map(item => item[1]);
    const open = valuesArray[0];
    const high = Math.max(...valuesArray);
    const low = Math.min(...valuesArray);
    const change = parseFloat((valuesArray[valuesArray.length - 1] - open).toFixed(2), 10);

    const { isOpen } = response3.data;

    const nepseIndexData = {
      date: formattedDate,
      open,
      high,
      low,
      close,
      change,
      percentageChange,
      turnover,
      isOpen
    };

    await saveToCache('intradayIndexData', nepseIndexData);

    return nepseIndexData;
  } catch (error) {
    console.error('Error fetching or parsing the data:', error.message);
    throw error;
  }
}

export default {getIndexIntraday,fetchIndexes, FetchSingularDataOfAsset,GetDebentures,FetchOldData, topgainersShare, topLosersShare, topTradedShares, topTurnoversShare, topTransactions};