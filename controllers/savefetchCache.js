import storage from 'node-persist';
import { createCache } from 'simple-in-memory-cache';
import { deleteFromRedis, fetchFromRedis, saveToRedis } from '../server/redisServer.js';
import { mainLogger } from '../utils/logger/logger.js';

// eslint-disable-next-line no-undef
const isDevelopment = process.env.NODE_ENV == "development";
const { set, get } = createCache({ defaultSecondsUntilExpiration: Infinity });
// eslint-disable-next-line no-undef
const inMemory = process.env.INMEMORYCACHE

export const fetchFromCache = async (cacheKey) => {
  try {

    if (isDevelopment) {
      const localData = await storage.getItem(cacheKey);
      if (localData !== undefined && localData !== null) {
        return localData;
      }
    }

    if (inMemory == 'true') {
      const cachedData = get(cacheKey);
      if (cachedData !== undefined && cachedData !== null) {
        return cachedData;
      }
    }

    const localData = await storage.getItem(cacheKey);
    if (localData !== undefined && localData !== null) {
      return localData;
    }

    const redisData = await fetchFromRedis(cacheKey);
    if (redisData !== undefined && redisData !== null) {
      return redisData;
    }

    mainLogger.error('Error: Data not found in any cache.');
    return null;
  } catch (error) {
    mainLogger.error('Error fetching data from cache: ' + error.message);
    return null;
  }
};

export const saveToCache = async (cacheKey, data) => {
  try {
    if (inMemory === 'true') {
      set(cacheKey, data);
    }

    await saveToRedis(cacheKey, data);
    await storage.setItem(cacheKey, data);

  } catch (error) {
    mainLogger.error('Error saving data to cache: ' + error.message);
  }
};

export const deleteFromCache = async (cacheKey) => {
  try {
    if (inMemory === 'true') {
      set(cacheKey, null);
    }

    await deleteFromRedis(cacheKey);

    await storage.removeItem(cacheKey);
  } catch (error) {
    mainLogger.error('Error deleting data to cache: ' + error.message);
  }
};