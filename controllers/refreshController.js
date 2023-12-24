import storage from 'node-persist';
import { AssetMergedData } from '../controllers/assetControllers.js';

const CACHE_KEYS = [
  'allAssetNames',
  'singleAsset',
  'cacheKey',
  'topGainers',
  'topTurnover',
  'topVolume',
  'metal_cached', //ss
  'atomic_asset_data', //ss
  'topGainersCached' //ss
];

const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
const refreshInterval = 30 * 1000; // 30 sec
const marketClosingHour = 15;

async function getLastDataRefreshTime() {
  try {
    const lastDataRefreshTimeStr = await storage.getItem('lastDataRefreshTime');
    return lastDataRefreshTimeStr ? new Date(JSON.parse(lastDataRefreshTimeStr).timestamp) : null;
  } catch (error) {
    console.error('Error reading lastDataRefreshTime:', error.message);
    return null;
  }
}

async function saveLastDataRefreshTime(timestamp) {
  try {
    await storage.setItem('lastDataRefreshTime', JSON.stringify({ timestamp }));
  } catch (error) {
    console.error('Error saving lastDataRefreshTime:', error.message);
  }
}

async function wipeCachesAndRefreshData() {
  try {
    const lastDataRefreshTime = await getLastDataRefreshTime();
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentHour = now.getHours();
    const isWeekday = now.getDay() >= 0 && now.getDay() <= 4; // Sunday to Thursday

    const timeDifference = lastDataRefreshTime ? Math.floor((now - lastDataRefreshTime) / (1000 * 60)) : null;
    const dataAge = timeDifference !== null ? (timeDifference === 0 ? 'just now' : `${timeDifference} minute${timeDifference !== 1 ? 's' : ''} ago`) : 'N/A';

    const isMarketOpen = isWeekday && currentHour >= 11 && currentHour < marketClosingHour;

    console.log(`\x1b[33mData Age: ${dataAge}, Today is ${currentDay}, Time is ${now.toLocaleTimeString('en-US')}, ${isWeekday && isMarketOpen ? 'Market is open.' : 'Market is closed.'}\x1b[0m`);

    if (isMarketOpen || (now - lastDataRefreshTime > oneDayInMilliseconds && isWeekday)) {
      console.log('Wiping cache and refreshing data.');
      await Promise.all(CACHE_KEYS.map(key => storage.removeItem(key)));

      try {
        await AssetMergedData();
      } catch (error) {
        console.error('Error refreshing data:', error.message);
      }

      await saveLastDataRefreshTime(now);
      console.log(`Data wipe and refresh successful. Last Refreshed: ${now.toLocaleTimeString('en-US')}`);
    } else {
      console.log(`Skipping data refresh. Last Refreshed: ${lastDataRefreshTime?.toLocaleTimeString('en-US')}`);
      clearInterval(refreshIntervalId);
    }
  } catch (error) {
    console.error('Error wiping caches:', error.message);
  }
}

let refreshIntervalId;

export default async function initializeRefreshMechanism() {
  try {
    const refreshData = async () => {
      try {
        await wipeCachesAndRefreshData();
      } catch (error) {
        console.error('Error refreshing data:', error.message);
      }
    };

    console.log('Initializing refresh mechanism...');
    await refreshData();

    refreshIntervalId = setInterval(async () => {
      const isMarketOpen = await checkMarketStatus();
      if (isMarketOpen) {
        await refreshData();
      }
    }, refreshInterval);
  } catch (error) {
    console.error('Error initializing refresh mechanism:', error.message);
  }
}

async function checkMarketStatus() {
  try {
    const now = new Date();
    const currentHour = now.getHours();

    const isWeekday = now.getDay() >= 0 && now.getDay() <= 4; // Sunday to Thursday
    const lastDataRefreshTime = await getLastDataRefreshTime();
    const isMarketOpen = isWeekday && currentHour >= 11 && currentHour < marketClosingHour && now - lastDataRefreshTime > oneDayInMilliseconds;

    return isMarketOpen;
  } catch (error) {
    console.error('Error checking market status:', error.message);
    return false;
  }
}
