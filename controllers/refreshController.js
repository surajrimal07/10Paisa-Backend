import storage from 'node-persist';
import AssetMergedData from '../controllers/assetControllers.js';

const CACHE_KEY_ALL_ASSET_NAMES = 'allAssetNames';
const CACHE_KEY_SINGLE_ASSET = 'singleAsset';
const CACHE_KEY = 'cacheKey';
const CACHE_KEY_TOP_GAINERS = 'topGainers';
const CACHE_KEY_TOP_TURNOVER = 'topTurnover';
const CACHE_KEY_TOP_VOLUME = 'topVolume';
const CACHE_KEY_METAL_PRICES = 'metalPrices';
const Asset_cached_key = 'atomic_asset_data';

const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
const fifteenMinutesInMilliseconds = 15 * 60 * 1000;

export async function getLastDataRefreshTime() {
  try {
    const lastDataRefreshTimeStr = await storage.getItem('lastDataRefreshTime');
    return lastDataRefreshTimeStr ? new Date(JSON.parse(lastDataRefreshTimeStr).timestamp) : null;
  } catch (error) {
    console.error('Error reading lastDataRefreshTime:', error);
    return null;
  }
}

export async function saveLastDataRefreshTime(timestamp) {
  try {
    await storage.setItem('lastDataRefreshTime', JSON.stringify({ timestamp }));
  } catch (error) {
    console.error('Error saving lastDataRefreshTime:', error);
  }
}

export async function wipeCachesAndRefreshData() {
  try {
    const lastDataRefreshTime = await getLastDataRefreshTime();
    console.log(`Last Refreshed Data Date and Time: ${lastDataRefreshTime || 'N/A'}`);
    const now = new Date();

    if (!lastDataRefreshTime || now - lastDataRefreshTime > oneDayInMilliseconds) {
      console.log('Data age is unknown or older than a day. Wiping caches and refreshing data.');
      console.log(`Last Refreshed Data Date and Time: ${lastDataRefreshTime || 'N/A'}`);

      await Promise.all([
        storage.removeItem(CACHE_KEY_ALL_ASSET_NAMES),
        storage.removeItem(CACHE_KEY_SINGLE_ASSET),
        storage.removeItem(CACHE_KEY),
        storage.removeItem(CACHE_KEY_TOP_GAINERS),
        storage.removeItem(CACHE_KEY_TOP_TURNOVER),
        storage.removeItem(CACHE_KEY_TOP_VOLUME),
        storage.removeItem(CACHE_KEY_METAL_PRICES),
        storage.removeItem(Asset_cached_key),
      ]);

      await saveLastDataRefreshTime(now);
      console.log('Data wipe and refresh successful.');
    } else {
      const currentDay = now.getDay();
      const currentHour = now.getHours();
      const isBetween11and3 = currentHour >= 11 && currentHour < 15;

      if (currentDay === 5 || currentDay === 6 || !isBetween11and3) {
        console.log('Skipping cache wipe based on day and time conditions.');
      } else {
        if (!lastDataRefreshTime || now - lastDataRefreshTime > fifteenMinutesInMilliseconds) {
          console.log('Wiping cache every 15 minutes between 11 am and 3 pm.');
          console.log(`Last Refreshed Data Date and Time: ${lastDataRefreshTime || 'N/A'}`);

          await Promise.all([
            storage.removeItem(CACHE_KEY_ALL_ASSET_NAMES),
            storage.removeItem(CACHE_KEY_SINGLE_ASSET),
            storage.removeItem(CACHE_KEY),
            storage.removeItem(CACHE_KEY_TOP_GAINERS),
            storage.removeItem(CACHE_KEY_TOP_TURNOVER),
            storage.removeItem(CACHE_KEY_TOP_VOLUME),
            storage.removeItem(CACHE_KEY_METAL_PRICES),
            storage.removeItem(Asset_cached_key),
            AssetMergedData(),
          ]);

          await saveLastDataRefreshTime(now);
          console.log('Data wipe and refresh successful.');
        } else {
          console.log('Skipping cache wipe based on the 15-minute interval.');
        }
      }
    }
  } catch (error) {
    console.error('Error wiping caches:', error.message);
  }
}

export default async function initializeRefreshMechanism() {
    try {
      console.log('Initializing refresh mechanism...');
      await wipeCachesAndRefreshData();
    } catch (error) {
      console.error('Error initializing refresh mechanism:', error.message);
    }
}
