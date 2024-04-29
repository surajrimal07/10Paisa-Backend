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

s


// getIndexIntraday()
//   .then(data => console.log(data))
//   .catch(error => console.error('Error:', error.message));


import { createCache } from 'simple-in-memory-cache';

const { set, get } = createCache({defaultSecondsUntilExpiration: Infinity});
set('meaning of life', 42);
set('meaning of life', 90);
set('meaning of life', 8);
console.log(get('meaning of life'));

