import storage from 'node-persist';
import {saveToRedis, fetchFromRedis, deleteFromRedis} from '../server/redisServer.js';

await storage.init();

const cacheServer = process.env.REDIS0RNODEPERSIST

export const fetchFromCache = async (cacheKey) => {
    try {
      if (cacheServer === 'redis') {
        return await fetchFromRedis(cacheKey);
      }
      const cachedData = await storage.getItem(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      return null;
    } catch (error) {
      console.error('Error fetching data from cache:', error.message);
      throw new Error('Error fetching data from cache');
    }
  };


export const saveToCache = async (cacheKey, data) => {
    try {
      if (cacheServer === 'redis') {
        await saveToRedis(cacheKey, data);
        return;
      }
      await storage.setItem(cacheKey, data);
    } catch (error) {
      console.error('Error saving data to cache:', error.message);
      throw new Error('Error saving data to cache');
    }
  };

  export const deleteFromCache = async (cacheKey) => {
    try {
      if (cacheServer === 'redis') {
        await deleteFromRedis(cacheKey);
        return;
      }
      await storage.removeItem(cacheKey);
    } catch (error) {
      console.error('Error deleting data from cache:', error.message);
      throw new Error('Error deleting data from cache');
    }
  };