import storage from 'node-persist';
import { createCache } from 'simple-in-memory-cache';
import { deleteFromRedis, fetchFromRedis, saveToRedis } from '../server/redisServer.js';
await storage.init();

const { set, get } = createCache({defaultSecondsUntilExpiration: Infinity});
const useRedis = process.env.USEREDIS
const inMemory = process.env.INMEMORYCACHE

export const fetchFromCache = async (cacheKey) => {
 // console.log('Fetching cache of key ' + cacheKey);
  try {
    if (inMemory == 'true') {
//      console.log('Fetching from inMemory for key '+ cacheKey);
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

    console.error('Error: Data not found in any cache.');
    return null;
  } catch (error) {
    console.error('Error fetching data from cache:', error.message);
    return null;
  }
};



  export const saveToCache = async (cacheKey, data) => {
    console.log('saving cache of key '+ cacheKey)
    try {
        if (inMemory === 'true') {
            //console.log('Saving to InMemory');
            set(cacheKey, data);
        }
        if (useRedis === 'true') {
          //console.log('saving to redis');
          await saveToRedis(cacheKey, data);
        }
        //console.log('Saving to Storage');
        await storage.setItem(cacheKey, data);
    } catch (error) {
        console.error('Error saving data to cache:', error.message);
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
      console.error('Error deleting data from cache:', error.message);
    }
  };