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
    const currentMinute = now.getMinutes();
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;

    const timeDifference = lastDataRefreshTime ? Math.floor((now - lastDataRefreshTime) / (1000 * 60)) : null;
    const dataAge = timeDifference !== null ? (timeDifference === 0 ? 'just now' : `${timeDifference} minute${timeDifference !== 1 ? 's' : ''} ago`) : 'N/A';

    let remainingTime = 0;
    if (isWeekday && currentHour < marketClosingHour) {
      remainingTime = (marketClosingHour - currentHour) * 60 - currentMinute;
    }

    const isMarketOpen = isWeekday && currentHour >= 11 && currentHour < marketClosingHour && now - lastDataRefreshTime > oneDayInMilliseconds;

    console.log(`\x1b[33mData Age: ${dataAge}, Today is ${currentDay}, Time is ${currentHour}:${currentMinute < 10 ? '0' : ''}${currentMinute} ${currentHour >= 12 ? 'PM' : 'AM'}, ${isWeekday && isMarketOpen ? `${remainingTime} minutes remaining for market close.` : 'Market closed'}\x1b[0m`);

    if (isMarketOpen || now - lastDataRefreshTime > oneDayInMilliseconds) {
      console.log('Wiping cache and refreshing data.');
      await Promise.all(CACHE_KEYS.map(key => storage.removeItem(key)));

      try {
        await AssetMergedData();
      } catch (error) {
      }

      await saveLastDataRefreshTime(now);
      console.log(`Data wipe and refresh successful. Last Refreshed: ${now.toLocaleDateString('en-US', { weekday: 'long' })} ${now.toLocaleTimeString('en-US')}`);
    } else {
      console.log(`Market is closed. Skipping data refresh. Last Refreshed: ${lastDataRefreshTime.toLocaleDateString('en-US', { weekday: 'long' })} ${lastDataRefreshTime.toLocaleTimeString('en-US')}`);
    }
  } catch (error) {
    console.error('Error wiping caches:', error.message);
  }
}

export default async function initializeRefreshMechanism() {
  try {
    const refreshData = async () => {
      try {
        const isMarketOpen = await checkMarketStatus();
        const lastDataRefreshTime = await getLastDataRefreshTime();

        console.log(
          `\x1b[33mMarket is ${
            isMarketOpen ? 'open' : 'closed'
          }. ${
            isMarketOpen
              ? 'Refreshing data.'
              : `Skipping data refresh. Last Refreshed: ${lastDataRefreshTime?.toLocaleDateString(
                  'en-US',
                  { weekday: 'long' }
                )} ${lastDataRefreshTime?.toLocaleTimeString('en-US')}`
          }\x1b[0m`
        );

        if (isMarketOpen) {
          await wipeCachesAndRefreshData();
        }
      } catch (error) {
        console.error('Error refreshing data:', error.message);
      }
    };

    console.log('Initializing refresh mechanism...');
    await refreshData();

    const marketCheckInterval = 5 * 60 * 1000;
    setInterval(async () => {
      const isMarketOpen = await checkMarketStatus();
      if (isMarketOpen) {
        await refreshData();
      }
    }, refreshInterval);

    setInterval(async () => {
      await refreshData();
    }, marketCheckInterval);
  } catch (error) {
    console.error('Error initializing refresh mechanism:', error.message);
  }
}

async function checkMarketStatus() {
  try {
    const now = new Date();
    const currentHour = now.getHours();

    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
    const lastDataRefreshTime = await getLastDataRefreshTime();
    const isMarketOpen = isWeekday && currentHour >= 11 && currentHour < marketClosingHour && now - lastDataRefreshTime > oneDayInMilliseconds;

    return isMarketOpen;
  } catch (error) {
    console.error('Error checking market status:', error.message);
    return false;
  }
}
