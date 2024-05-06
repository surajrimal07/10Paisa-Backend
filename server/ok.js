// import axios from 'axios';
// import cheerio from 'cheerio';
// import storage from 'node-persist';
// import { fetchFromCache } from '../controllers/assetControllers.js';
// import { getIsMarketOpen } from '../state/StateManager.js';

// export async function getIndexIntraday() {
//   try {
//     if (getIsMarketOpen()) {
//       const cachedData = await fetchFromCache('intradayIndexData');
//       if (cachedData) {
//         console.log('Market is closed. Returning cached intraday data.');
//         return cachedData;
//       }
//       return;
//     }

//     // Fetch data from different URLs in parallel
//     const [response1, response2, response3] = await Promise.all([
//       axios.get('https://www.sharesansar.com/live-trading'),
//       axios.get('https://nepseapi.zorsha.com.np/DailyNepseIndexGraph'),
//       axios.get('https://nepseapi.zorsha.com.np/IsNepseOpen')
//     ]);

//     const $ = cheerio.load(response1.data);

//     // Extract data from the first URL
//     const nepseIndexContainer = $('h4:contains("NEPSE Index")').closest('.mu-list');
//     const turnover = parseFloat(nepseIndexContainer.find('.mu-price').text().replace(/,/g, ''));
//     const close = parseFloat(nepseIndexContainer.find('.mu-value').text().replace(/,/g, ''));
//     const percentageChange = parseFloat(nepseIndexContainer.find('.mu-percent').text().replace(/,/g, ''))
//     //const percentageChange = parseFloat(nepseIndexContainer.find('.mu-percent').text().match(/\d+\.\d+/)[0]) / 100;

//     const currentDate = new Date();
//     const formattedDate = currentDate.getFullYear() + '/' +
//                          (currentDate.getMonth() + 1).toString().padStart(2, '0') + '/' +
//                          currentDate.getDate().toString().padStart(2, '0');

//     // Extract data from the second URL's response
//     const jsonData = response2.data;
//     const valuesArray = jsonData.map(item => item[1]);
//     const open = valuesArray[0];
//     const high = Math.max(...valuesArray);
//     const low = Math.min(...valuesArray);
//     const change = parseFloat((valuesArray[valuesArray.length - 1] - open).toFixed(2), 10); // Convert to integer

//     // Extract data from the third URL's response
//     const { isOpen } = response3.data;

//     // Construct the final data object
//     const nepseIndexData = {
//       date: formattedDate,
//       open,
//       high,
//       low,
//       close,
//       change,
//       percentageChange,
//       turnover,
//       isOpen
//     };

//     await storage.setItem('intradayIndexData', nepseIndexData);

//     return nepseIndexData;
//   } catch (error) {
//     console.error('Error fetching or parsing the data:', error.message);
//     throw error;
//   }
// }

// getIndexIntraday()
//   .then(data => console.log(data))
//   .catch(error => console.error('Error:', error.message));

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

//this is to check for empty data that systemxlite.com returns when symbol name is incorrect.
function isValidData(data) {
  return data.s !== 'no_data' && data.t.length > 0 && data.c.length > 0 && data.o.length > 0 && data.h.length > 0 && data.l.length > 0 && data.v.length > 0;
}

import fs from 'fs';
import path from 'path';

export async function FetchSingleDatafromAPINepseAlpha(symbol = "nepse", timeFrame = '1D', force_key = "rrfdwdwdsdfdg") {
  const requestedSymbol = symbol.toUpperCase();
  console.log('Requested data for symbol:', requestedSymbol, timeFrame)

  // if (!symbol.trim() || !timeFrame.trim() || !force_key.trim() || !['1D', '1'].includes(timeFrame.trim())) {
  //   console.error('Invalid parameter provided.');
  //   return null;
  // }

  const __dirname = path.resolve();
  const fileName = path.join(__dirname, `../public/stock/${requestedSymbol}/${requestedSymbol}_${timeFrame}.json`);

  try {
    console.log('Fetching data from systemxlite.com');
    //we need to add _index to the indices like nepse, sensitive, float etc
    const symbolIndex = getIndexName(requestedSymbol);
    let response = await fetch(`https://backendtradingview.systemxlite.com/tv/tv/history?symbol=${symbolIndex}&resolution=${timeFrame}&from=768009600&to=1714867200&countback=88`, {
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
      "method": "GET"
    }).then((response) => response.json());

    console.log('Response: from systemx is ', response);

    if (!response || !isValidData(response)) {
      console.log('Fetching data from systemxlite.com failed. Trying nepsealpha.com');
      response = await fetch(
        `https://www.nepsealpha.com/trading/1/history?${force_key}=rrfdwdwdsdfdg&symbol=${requestedSymbol}&from=768009600&to=1714867200&resolution=${timeFrame}&pass=ok&fs=${force_key}&shouldCache=1`,
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
          method: "GET",
        }
      );

    }

    if (!response || !isValidData(response)) {
      console.error('Failed to fetch data from both nepsealpha.com and systemxlite.com, trying to read from file.');
      const fileData = await fs.promises.readFile(fileName, 'utf8').catch(err => null);
      if (fileData) {
        return JSON.parse(fileData);
      }
      console.log('Failed to read data from file, returning null.');
      return null;
    }

    console.log(fileName);
    await fs.promises.mkdir(path.dirname(fileName), { recursive: true });
    await fs.promises.writeFile(fileName, JSON.stringify(response));

    return response;
  } catch (error) {

    const fileData = await fs.promises.readFile(fileName, 'utf8').catch(err => null);
    if (fileData) {
      return JSON.parse(fileData);
    }
    console.error(error);
    return null;
  }
}

//await FetchSingleDatafromAPINepseAlpha("NEPSE", "1D").then(console.log).catch(console.error);



//
// fetch("https://www.nepsealpha.com/trading/1/search?limit=500&query=&type=&exchange=", {
//   "headers": {
//     "sec-ch-ua": "\"Chromium\";v=\"124\", \"Microsoft Edge\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
//     "sec-ch-ua-arch": "\"x86\"",
//     "sec-ch-ua-bitness": "\"64\"",
//     "sec-ch-ua-full-version": "\"124.0.2478.67\"",
//     "sec-ch-ua-full-version-list": "\"Chromium\";v=\"124.0.6367.91\", \"Microsoft Edge\";v=\"124.0.2478.67\", \"Not-A.Brand\";v=\"99.0.0.0\"",
//     "sec-ch-ua-mobile": "?0",
//     "sec-ch-ua-model": "\"\"",
//     "sec-ch-ua-platform": "\"Windows\"",
//     "sec-ch-ua-platform-version": "\"15.0.0\"",
//     "Referer": "https://www.nepsealpha.com/trading/chart",
//     "Referrer-Policy": "strict-origin-when-cross-origin"
//   },
//   "body": null,
//   "method": "GET"
// });


// fetch("https://backendtradingview.systemxlite.com/tv/tv/search?limit=30&query=&type=&exchange=", {
//   "headers": {
//     "accept": "*/*",
//     "accept-language": "en-US,en;q=0.9,ne;q=0.8",
//     "if-none-match": "W/\"107d7-CkFswx0Zr81sX6ZUbikPAlgnJBA\"",
//     "sec-ch-ua": "\"Chromium\";v=\"124\", \"Microsoft Edge\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
//     "sec-ch-ua-mobile": "?0",
//     "sec-ch-ua-platform": "\"Windows\"",
//     "sec-fetch-dest": "empty",
//     "sec-fetch-mode": "cors",
//     "sec-fetch-site": "same-site",
//     "sec-gpc": "1",
//     "Referer": "https://tradingview.systemxlite.com/",
//     "Referrer-Policy": "strict-origin-when-cross-origin"
//   },
//   "body": null,
//   "method": "GET"
// });

//live data with index, company and sentiments etc
// fetch("https://nepsealpha.com/live/stocks", {
//   "headers": {
//     "accept": "application/json, text/plain, */*",
//     "accept-language": "en-US,en;q=0.9,ne;q=0.8",
//     "content-type": "application/json",
//     "priority": "u=1, i",
//     "sec-ch-ua": "\"Chromium\";v=\"124\", \"Microsoft Edge\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
//     "sec-ch-ua-mobile": "?0",
//     "sec-ch-ua-platform": "\"Windows\"",
//     "sec-fetch-dest": "empty",
//     "sec-fetch-mode": "cors",
//     "sec-fetch-site": "same-origin",
//     "sec-gpc": "1",
//     "x-requested-with": "XMLHttpRequest",
//     "cookie": "remember_web_59ba36addc2b2f9401580f014c7f58ea4e30989d=eyJpdiI6IjExTEZ6cWNoWTVIVVFkZG9JS0FCUUE9PSIsInZhbHVlIjoiN2hsM0V3amMzMlRIV3VTbGJTZHBlVXhYRUsvUmo2VUU0Y3QwWE1MbGFISjVBOW9nRWlGbWI3dzlNQzlWNGIrbG44blRZUWdhL2orVnRQdytHaElEYldYSzF3SkErM2w0VEdsS05yRVZwdHNGNnlKckh2OGEwc1g5YlNUcWNHRWQ0MmtjQ1MzVERBYStGWnpxMTc1TUVVVTdHRWIrYXBHN1Izd3A3ZXFLaUlCVlp1cVdHTEJ4NTBGOERaMERNUE1WU0ZKdUVNNktNTlQzSENkM1VMbkwwWVZRbmNPVXBsYzhKcVJ4bnhza2ZXRT0iLCJtYWMiOiI5MTBkMGRhNGFiMjE2YmZiMjQxMTZiODJhYWFjYjY2YTJmZDViN2Y2MjdmNmYwODQzMmQzYmY0M2MyNTc1Y2UyIiwidGFnIjoiIn0%3D; cf_clearance=ed.YL.1P_pAPnU..g3ua.76sXsPCBC7AZW24TxPF6VA-1714749813-1.0.1.1-vCHBrmfxXb5ylXEjnBjsz3X2ceGIc2f8t8mRstBAMy8Qq3sRN5ryEHABD.7HP7yYP5hZQt.s7sPz8d0hlLGJJQ; nepsealpha_session=eyJpdiI6IkF4bkFjTy96clZKeVFqTkhQcE5LUVE9PSIsInZhbHVlIjoiVGhHblpMUEROeDNUZVZGQkdnU3FuNDUwZzlZYnQ4eTNZVEZoYmNiWFNYcXM3MHROeDIyR05jV3g1K1VUL0RBR3N0bWVkZklhellyRWJvckd6K1pjekZQVHZqdis5eFpUVWNHTTBiWU8zdzNTSE40MXYxSGc2aFk0Vm5aWG04bksiLCJtYWMiOiI0NTliOWFmNzQ4ZTg1NWE3MjNlYTk3MjlkNjM4ZDE0MjJlZWUyYTI3MmVmNGE2OWExNzY2ZWQ4ZTI1MGQ1ODI1IiwidGFnIjoiIn0%3D",
//     "Referer": "https://nepsealpha.com/live-market",
//     "Referrer-Policy": "strict-origin-when-cross-origin"
//   },
//   "body": "{\"_token\":\"uOcuC433lF3mgEismEeeL4dsC7L4by27fqsOPIhB\",\"selectedSector\":\"NEPSE\",\"sector\":\"\"}",
//   "method": "POST"
// });

//list of currently available symbols

export async function fetchAvailableNepseSymbol() {

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
      "method": "GET"
    });


    if (!response) {
      return null;
    }

    const jsonData = await response.json();

    const symbols = jsonData.map(entry => entry.symbol);

    console.log(symbols);

    await fs.promises.mkdir(path.dirname(fileName), { recursive: true });
    await fs.promises.writeFile(fileName, JSON.stringify(symbols));

    return symbols;

  } catch (error) {
    console.error(error);
  }
}

await fetchAvailableNepseSymbol()

// async function processSymbols() {
//   try {
//     const symbolsData = await fetchAvailableSymbol();

//     if (!symbolsData || !Array.isArray(symbolsData)) {
//       console.error('Invalid symbols data received.');
//       return;
//     }
//     for (const symbolData of symbolsData) {
//       const { symbol } = symbolData;
//       await FetchSingleDatafromAPINepseAlpha(symbol);
//     }

//     console.log('Processing of symbols completed.');
//   } catch (error) {
//     console.error('Error processing symbols:', error);
//   }
// }

//processSymbols();
