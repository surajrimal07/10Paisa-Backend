import storage from 'node-persist';

export const fetchFromCache = async (cacheKey) => {
    try {
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
      await storage.setItem(cacheKey, data);
    } catch (error) {
      console.error('Error saving data to cache:', error.message);
      throw new Error('Error saving data to cache');
    }
  };