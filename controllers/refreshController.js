// import storage from 'node-persist';
// import { FetchOldData, FetchSingularDataOfAsset, extractIndex, extractIndexDateWise, topLosersShare, topTradedShares, topTransactions, topTurnoversShare, topgainersShare } from '../server/assetServer.js';
// import { commodityprices } from '../server/commodityServer.js';
// const CACHE_KEYS = [

//   'commodityprices',
//   'extractIndex',  //server function
//   'extractIndexDateWise', //server function

//   'topTransactions', //server function
//   'topTradedShares', //server function
//   'topTurnoversShare', //server function
//   'topLosersShare', //server function
//   'topgainersShare',
//   'FetchOldData',
//   'FetchSingularDataOfAsset',
//   'tableData',
//   'fetchMetalPrices' //for now only this is used
//   //metalPriceExtractor
// ];

// const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
// const refreshInterval = 30 * 1000; // 30 sec
// const marketClosingHour = 15;

// async function getLastDataRefreshTime() {
//   try {
//     const lastDataRefreshTimeStr = await storage.getItem('lastDataRefreshTime');
//     return lastDataRefreshTimeStr ? new Date(JSON.parse(lastDataRefreshTimeStr).timestamp) : null;
//   } catch (error) {
//     console.error('Error reading lastDataRefreshTime:', error.message);
//     return null;
//   }
// }

// async function saveLastDataRefreshTime(timestamp) {
//   try {
//     await storage.setItem('lastDataRefreshTime', JSON.stringify({ timestamp }));
//   } catch (error) {
//     console.error('Error saving lastDataRefreshTime:', error.message);
//   }
// }

// async function wipeCachesAndRefreshData() {
//   try {
//     const lastDataRefreshTime = await getLastDataRefreshTime();
//     const now = new Date();
//     const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
//     const currentHour = now.getHours();
//     const isWeekday = now.getDay() >= 0 && now.getDay() <= 4; // Sunday to Thursday

//     const timeDifference = lastDataRefreshTime ? Math.floor((now - lastDataRefreshTime) / (1000 * 60)) : null;
//     const dataAge = timeDifference !== null ? (timeDifference === 0 ? 'just now' : `${timeDifference} minute${timeDifference !== 1 ? 's' : ''} ago`) : 'N/A';

//     const isMarketOpen = isWeekday && currentHour >= 11 && currentHour < marketClosingHour;

//     console.log(`\x1b[33mData Age: ${dataAge}, Today is ${currentDay}, Time is ${now.toLocaleTimeString('en-US')}, ${isWeekday && isMarketOpen ? 'Market is open.' : 'Market is closed.'}\x1b[0m`);

//     if (isMarketOpen || (now - lastDataRefreshTime > oneDayInMilliseconds && isWeekday)) {
//       console.log('Wiping cache and refreshing data.');
//       await Promise.all(CACHE_KEYS.map(key => storage.removeItem(key)));

//       try {
//         await extractIndex();
//         await extractIndexDateWise();
//         await FetchSingularDataOfAsset();
//         await FetchOldData();
//         await topgainersShare();
//         await topLosersShare();
//         await topTurnoversShare();
//         await topTradedShares();
//         await topTransactions();
//         await commodityprices();


//       } catch (error) {
//         console.error('Error refreshing data:', error.message);
//       }

//       await saveLastDataRefreshTime(now);
//       console.log(`Data wipe and refresh successful. Last Refreshed: ${now.toLocaleTimeString('en-US')}`);
//     } else {
//       console.log(`Skipping data refresh. Last Refreshed: ${lastDataRefreshTime?.toLocaleTimeString('en-US')}`);
//       clearInterval(refreshIntervalId);
//     }
//   } catch (error) {
//     console.error('Error wiping caches:', error.message);
//   }
// }

// let refreshIntervalId;

// export default async function initializeRefreshMechanism() {
//   try {
//     const refreshData = async () => {
//       try {
//         await wipeCachesAndRefreshData();
//       } catch (error) {
//         console.error('Error refreshing data:', error.message);
//       }
//     };

//     console.log('Initializing refresh mechanism...');
//     await refreshData();

//     refreshIntervalId = setInterval(async () => {
//       const isMarketOpen = await checkMarketStatus();
//       if (isMarketOpen) {
//         await refreshData();
//       }
//     }, refreshInterval);
//   } catch (error) {
//     console.error('Error initializing refresh mechanism:', error.message);
//   }
// }

// async function checkMarketStatus() {
//   try {
//     const now = new Date();
//     const currentHour = now.getHours();

//     const isWeekday = now.getDay() >= 0 && now.getDay() <= 4; // Sunday to Thursday
//     const lastDataRefreshTime = await getLastDataRefreshTime();
//     const isMarketOpen = isWeekday && currentHour >= 11 && currentHour < marketClosingHour && now - lastDataRefreshTime > oneDayInMilliseconds;

//     return isMarketOpen;
//   } catch (error) {
//     console.error('Error checking market status:', error.message);
//     return false;
//   }
// }


import storage from 'node-persist';
import { FetchOldData, FetchSingularDataOfAsset, extractIndex, extractIndexDateWise, topLosersShare, topTradedShares, topTransactions, topTurnoversShare, topgainersShare } from '../server/assetServer.js';
import { commodityprices } from '../server/commodityServer.js';
import { notifyClients } from '../server/websocket.js';

const CACHE_KEYS = [
  'commodityprices',
  'extractIndex',
  'extractIndexDateWise',
  'topTransactions',
  'topTradedShares',
  'topTurnoversShare',
  'topLosersShare',
  'topgainersShare',
  'FetchOldData',
  'FetchSingularDataOfAsset',
  'tableData',
  'fetchMetalPrices'
];

const refreshInterval = 30 * 1000; // 30 seconds
const marketClosingHour = 15;
const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
export let isMarketOpen = false;

async function getLastDataRefreshTime() {
  const lastDataRefreshTimeStr = await storage.getItem('lastDataRefreshTime');
  return lastDataRefreshTimeStr ? new Date(JSON.parse(lastDataRefreshTimeStr).timestamp) : null;
}

async function saveLastDataRefreshTime(timestamp) {
  await storage.setItem('lastDataRefreshTime', JSON.stringify({ timestamp }));
}

async function wipeCachesAndRefreshData() {
  try {
    const lastDataRefreshTime = await getLastDataRefreshTime();
    const now = new Date();
    const isMarketOpen = isMarketOpenNow();

    if (isMarketOpen || (now - lastDataRefreshTime > oneDayInMilliseconds && isWeekday())) {
      console.log('Wiping cache and refreshing data.');
      await Promise.all(CACHE_KEYS.map(key => storage.removeItem(key)));

      await Promise.all([
        extractIndexDateWise(),
        FetchSingularDataOfAsset(),
        FetchOldData(),
        topgainersShare(),
        topLosersShare(),
        topTurnoversShare(),
        topTradedShares(),
        topTransactions(),
        commodityprices(),
        saveLastDataRefreshTime(now)
      ]);

      let IndexData = await extractIndex();
      if (IndexData) {
        notifyClients({ type: 'index', data: IndexData });
      }

      console.log(`Data wipe and refresh successful. Last Refreshed: ${now.toLocaleTimeString('en-US')}`);
    } else {
      console.log(`Skipping data refresh. Last Refreshed: ${lastDataRefreshTime?.toLocaleTimeString('en-US')}`);
    }
  } catch (error) {
    console.error('Error wiping caches or refreshing data:', error.message);
  }
}

function isWeekday() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  return dayOfWeek >= 0 && dayOfWeek <= 4;
}

function isMarketOpenNow() {
  const now = new Date();
  const currentHour = now.getHours();
  return isWeekday() && currentHour >= 11 && currentHour < marketClosingHour;
}

export default async function initializeRefreshMechanism() {
  try {
    console.log('Initializing refresh mechanism...');
    await wipeCachesAndRefreshData();

    setInterval(async () => {
      if (isMarketOpenNow()) {
        await wipeCachesAndRefreshData();
      }
    }, refreshInterval);
  } catch (error) {
    console.error('Error initializing refresh mechanism:', error.message);
  }
}
