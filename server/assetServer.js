import axios from 'axios';
import cheerio from 'cheerio';
import { JSDOM } from 'jsdom';
import storage from 'node-persist';
import { fileURLToPath } from 'url';
import { fetchFromCache } from '../controllers/savefetchCache.js';
await storage.init();


//preparing to switch to sharesansar as data provider
export async function FetchSingularDataOfAsset() {
  const liveTradingUrl = 'https://www.sharesansar.com/live-trading';

  try {
    const cachedData = await fetchFromCache('FetchSingularDataOfAssets');
    if (cachedData !== null) {
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

      await storage.setItem('FetchSingularDataOfAssets', stockDataWithoutName);

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
    if (cachedData !== null) {
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

      await storage.setItem('FetchOldDatas', enrichedData);

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
    const cachedData = await fetchFromCache('topgainersShare');
    if (cachedData !== null) {
      return cachedData;
    }

    const response = await axios.get(url, {
      headers: header,
    });

    const data = response.data.data;

    if (!Array.isArray(data)) {
      throw new Error('Data is not an array.');
    }

    const processedData = data.map(item => ({
      symbol: item.symbol.replace(/<[^>]*>/g, ''),
      name: item.companyname.replace(/<[^>]*>/g, ''),
      ltp: parseFloat(item.close),
      pointchange: parseFloat(item.change_pts),
      percentchange: parseFloat(item.diff_per),
    }));

    await storage.setItem('topgainersShare', processedData);
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
    const cachedData = await fetchFromCache('topLosersShare');
    if (cachedData !== null) {
      return cachedData;
    }

    const response = await axios.get(url, {
      headers: header,
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

    await storage.setItem('topLosersShare', processedData);

    return processedData;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const topTurnoversShare = async () => {
  const url = "https://www.sharesansar.com/top-turnovers?draw=1&columns%5B0%5D%5Bdata%5D=DT_Row_Index&columns%5B0%5D%5Bname%5D=&columns%5B0%5D%5Bsearchable%5D=false&columns%5B0%5D%5Borderable%5D=false&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=symbol&columns%5B1%5D%5Bname%5D=&columns%5B1%5D%5Bsearchable%5D=false&columns%5B1%5D%5Borderable%5D=false&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=companyname&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=false&columns%5B2%5D%5Borderable%5D=false&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=traded_amount&columns%5B3%5D%5Bname%5D=&columns%5B3%5D%5Bsearchable%5D=false&columns%5B3%5D%5Borderable%5D=false&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=close&columns%5B4%5D%5Bname%5D=&columns%5B4%5D%5Bsearchable%5D=false&columns%5B4%5D%5Borderable%5D=false&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&start=0&length=50&search%5Bvalue%5D=&search%5Bregex%5D=false&_=1702618064106";

  try {
    const cachedData = await fetchFromCache('topTurnoversShare');

    if (cachedData !== null) {
      return cachedData;
    }

    const response = await axios.get(url, {
      headers: header,
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

    await storage.setItem('topTurnoversShare', processedData);

    return processedData;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

//top volume
import { header } from './headers.js';
export const topTradedShares = async () => {
  const url = "https://www.sharesansar.com/top-tradedshares?draw=1&columns%5B0%5D%5Bdata%5D=DT_Row_Index&columns%5B0%5D%5Bname%5D=&columns%5B0%5D%5Bsearchable%5D=false&columns%5B0%5D%5Borderable%5D=false&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=symbol&columns%5B1%5D%5Bname%5D=&columns%5B1%5D%5Bsearchable%5D=false&columns%5B1%5D%5Borderable%5D=false&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=companyname&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=false&columns%5B2%5D%5Borderable%5D=false&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=traded_quantity&columns%5B3%5D%5Bname%5D=&columns%5B3%5D%5Bsearchable%5D=false&columns%5B3%5D%5Borderable%5D=false&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=close&columns%5B4%5D%5Bname%5D=&columns%5B4%5D%5Bsearchable%5D=false&columns%5B4%5D%5Borderable%5D=false&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&start=0&length=50&search%5Bvalue%5D=&search%5Bregex%5D=false&_=1702618649178";

  try {
    const cachedData = await fetchFromCache('topTradedShares');

    if (cachedData !== null) {
      return cachedData;
    }

    const response = await axios.get(url, {
      headers: header,
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

    await storage.setItem('topTradedShares', processedData);

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

    const cachedData = await fetchFromCache('topTransactions');

    if (cachedData !== null) {
      return cachedData;
    }

    const response = await axios.get(url, {
      headers: header,
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

    await storage.setItem('topTransactions', processedData);

    return processedData;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

//used for machine learning model
const __filename = fileURLToPath(import.meta.url);

export async function fetchIndexes() {
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

      await storage.setItem('allindices_sourcedata', extractedData);

      return extractedData;
    } catch (error) {
      console.error('Error fetching or parsing the HTML:', error.message);
    }
  }


//to be removed
export async function extractIndex() {
  try {

    // const cachedData = await fetchFromCache('extractIndex');

    // if (cachedData !== null) {
    //   return cachedData;
    // }

    const targetUrl = 'https://www.sharesansar.com/live-trading';
    const response = await axios.get(targetUrl);
    const html = response.data;
    const $ = cheerio.load(html);

    const nepseIndexContainer = $('h4:contains("NEPSE Index")').closest('.mu-list');
    let marketStatus = $('.btn.btn-success').text().trim();

    const turnover = parseFloat(nepseIndexContainer.find('.mu-price').text().replace(/,/g, ''));
    const index = parseFloat(nepseIndexContainer.find('.mu-value').text().replace(/,/g, ''));
    const percentageChange = parseFloat(nepseIndexContainer.find('.mu-percent').text().replace(/,/g, ''));
    const currentDate = new Date();
    const formattedDate = currentDate.getFullYear() + '/' +
                         (currentDate.getMonth() + 1).toString().padStart(2, '0') + '/' +
                         currentDate.getDate().toString().padStart(2, '0');

    if (marketStatus === "") {
      marketStatus = "Market Closed";
  }

    const nepseIndexData = {
      date: formattedDate,
      index,
      percentageChange,
      turnover,
      marketStatus
    };

    await storage.setItem('extractIndex', nepseIndexData);

    return nepseIndexData;
  } catch (error) {
    console.error('Error fetching or parsing the HTML:', error.message);
  }
}

//to be removed
export async function extractIndexDateWise() {
  try {

    const indexDataByDateCached = await fetchFromCache('extractIndexDateWise');

    if (indexDataByDateCached !== null) {
      return indexDataByDateCached }

    const targetUrl = 'https://merolagani.com/Indices.aspx';
    const response = await axios.get(targetUrl);
    const html = response.data;
    const $ = cheerio.load(html);

    const tableRows = $('.table-bordered tbody tr').slice(0, 15);

    const indexData = tableRows.map((indexx, element) => {
      const $row = $(element);
      const date = $row.find('td:nth-child(2)').text().trim();
      const index = parseFloat($row.find('td:nth-child(3)').text().replace(/,/g, ''));
      const pointChange = parseFloat($row.find('td:nth-child(4)').text().replace(/,/g, ''));
      const percentageChange = parseFloat($row.find('td:nth-child(5)').text().replace(/,/g, ''));

      return {
        date,
        index,
        percentageChange,
        pointChange
      };
    }).get();

    await storage.setItem('extractIndexDateWise', indexData);

    return indexData;
  } catch (error) {
    console.error('Error fetching or parsing the HTML:', error.message);
  }
}

//replacement of intraday index above
export async function getIndexIntraday() {
  try {
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
    return nepseIndexData;
  } catch (error) {
    console.error('Error fetching or parsing the data:', error.message);
    throw error;
  }
}

export default {extractIndexDateWise,extractIndex,getIndexIntraday,fetchIndexes, FetchSingularDataOfAsset,GetDebentures,FetchOldData, topgainersShare, topLosersShare, topTradedShares, topTurnoversShare, topTransactions};