import storage from 'node-persist';
import { createCache } from 'simple-in-memory-cache';
import { deleteFromRedis, fetchFromRedis, saveToRedis } from '../server/redisServer.js';
import { mainLogger } from '../utils/logger/logger.js';

const { set, get } = createCache({ defaultSecondsUntilExpiration: Infinity });
const useRedis = process.env.USEREDIS
const inMemory = process.env.INMEMORYCACHE

export const fetchFromCache = async (cacheKey) => {
  try {
    if (inMemory == 'true') {
      // mainLogger.info(`fetching cache of key ${cacheKey}`)
      const cachedData = get(cacheKey);
      if (cachedData !== undefined && cachedData !== null) {
        return cachedData;
      }
    }

    if (useRedis == 'true') {
      const redisData = await fetchFromRedis(cacheKey);
      if (redisData !== undefined && redisData !== null) {
        return redisData;
      }
    }

    const localData = await storage.getItem(cacheKey);
    if (localData !== undefined && localData !== null) {
      return localData;
    }
    mainLogger.error('Error: Data not found in any cache.');
    return null;
  } catch (error) {
    mainLogger.error('Error fetching data from cache: ' + error.message);
    return null;
  }
};

export const saveToCache = async (cacheKey, data) => {
  //mainLogger.info(`saving cache of key ${cacheKey}`)
  try {
    if (inMemory === 'true') {
      set(cacheKey, data);
    }
    if (useRedis === 'true') {
      await saveToRedis(cacheKey, data);
    }
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
    if (useRedis == 'true') {
      await deleteFromRedis(cacheKey);
    }
    await storage.removeItem(cacheKey);
  } catch (error) {
    mainLogger.error('Error deleting data to cache: ' + error.message);
  }
};