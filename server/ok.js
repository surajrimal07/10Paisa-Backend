

import { createClient } from 'redis';


export const redisclient = createClient({
  password: 'Ll+RXDbybHGJQuz996xK7iQ5aLygB8iRm42O1wj1JQyDcU3qrMf2tyx7DZOrVjViRYQYfBja/p+is4pC',
  socket: {
    host: 'redis.surajr.com.np',
    port: 6379
  },
  connectTimeout: 100000,

  retry_strategy: (options) => {
    console.log(`Redis Reconnect Attempt: ${options.attempt}`);
    if (options.attempt <= 5) {
      return Math.min(options.attempt * 100, 3000);
    }
    return 5000;
  }
});

export async function saveToRedis(key, value) {
  redisclient.set(key, JSON.stringify(value));
}

export async function fetchFromRedis(key) {
  try {
    const data = await redisclient.get(key);
    if (!data) {
      console.log(`No data found for key: ${key}`);
      return null;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error fetching data from Redis: ${err}`);
    throw err;
  }
}

export async function deleteFromRedis(key) {
  try {
    await redisclient.del(key);
  } catch (err) {
    console.error(`Error deleting data from Redis: ${err}`);
    throw err;
  }
}

//Test code
async function testRedisOperations() {
  await redisclient.connect();

  try {

    await saveToRedis('its working', 'hello ssss');
    const data = await fetchFromRedis('test');
    console.log(data);

    //await deleteFromRedis('test');
  } catch (err) {
    console.error('Error in testRedisOperations:', err);
  }
}

testRedisOperations();