import storage from 'node-persist';
import { createCache } from 'simple-in-memory-cache';
import { deleteFromRedis, fetchFromRedis, saveToRedis } from '../server/redisServer.js';
import { mainLogger } from '../utils/logger/logger.js';
import { isDevelopment } from '../database/db.js';

const { set, get } = createCache({ defaultSecondsUntilExpiration: Infinity });
// eslint-disable-next-line no-undef
const inMemory = process.env.INMEMORYCACHE === 'true';

// Utility function to check if data is not null or undefined
const isValidData = (data) => data !== undefined && data !== null;

//2. this was made specific to save floorsheet data because it is not efficient to store it in redis or inmemeory cache due to its size
export const saveTOStorage = async (cacheKey, data) => {
  try {
    await storage.setItem(cacheKey, data);
  } catch (error) {
    mainLogger.error('Error saving data to cache: ' + error.message);
  }
}

export const fetchFromStorage = async (cacheKey) => {
  try {
    const data = await storage.getItem(cacheKey);
    return isValidData(data) ? data : null;
  } catch (error) {
    mainLogger.error(`Error fetching data from storage: ${error.message}`);
    return null;
  }
}
// end of 2

// Fetch data from a specific cache source
const fetchData = async (source, cacheKey) => {
  try {
    const data = await source(cacheKey);
    return isValidData(data) ? data : null;
  } catch (error) {
    mainLogger.error(`Error fetching data from ${source.name}: ${error.message}`);
    return null;
  }
};

// Fetch data from in-memory cache, local storage, or Redis in that order
export const fetchFromCache = async (cacheKey) => {
  if (isDevelopment) {
    const localData = await fetchData(storage.getItem.bind(storage), cacheKey);
    if (localData) return localData;
  }

  if (inMemory) {
    const inMemoryData = fetchData(get, cacheKey);
    if (inMemoryData) return inMemoryData;
  }

  const redisData = await fetchData(fetchFromRedis, cacheKey);
  if (redisData) return redisData;

  mainLogger.error('Error: Data not found in any cache.');
  return null;
};

// Save data to all relevant caches
export const saveToCache = async (cacheKey, data) => {
  try {
    if (inMemory) set(cacheKey, data);
    if (isDevelopment) await storage.setItem(cacheKey, data);
    await saveToRedis(cacheKey, data);
  } catch (error) {
    mainLogger.error('Error saving data to cache: ' + error.message);
  }
};

// Delete data from all relevant caches
export const deleteFromCache = async (cacheKey) => {
  try {
    if (inMemory) set(cacheKey, null);
    if (isDevelopment) await storage.removeItem(cacheKey);
    await deleteFromRedis(cacheKey);
  } catch (error) {
    mainLogger.error('Error deleting data from cache: ' + error.message);
  }
};
