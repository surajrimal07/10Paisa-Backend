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

export async function FetchSingleDatafromAPINepseAlpha(refresh, symbol) {
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
    return jsonData;
  } catch (error) {
    console.error(error);
  }
}

await FetchSingleDatafromAPI(true).then(console.log).catch(console.error);
