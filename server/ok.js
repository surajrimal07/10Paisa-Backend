

import { createClient } from 'redis';


// export const redisclient = createClient({
//   password: 'Ll+RXDbybHGJQuz996xK7iQ5aLygB8iRm42O1wj1JQyDcU3qrMf2tyx7DZOrVjViRYQYfBja/p+is4pC',
//   socket: {
//     host: 'redis.surajr.com.np',
//     port: 6379
//   },
//   connectTimeout: 100000,

//   retry_strategy: (options) => {
//     console.log(`Redis Reconnect Attempt: ${options.attempt}`);
//     if (options.attempt <= 5) {
//       return Math.min(options.attempt * 100, 3000);
//     }
//     return 5000;
//   }

// });

const redisClient = createClient({
  password: 'Ll+RXDbybHGJQuz996xK7iQ5aLygB8iRm42O1wj1JQyDcU3qrMf2tyx7DZOrVjViRYQYfBja/p+is4pC',
  socket: {
    host: 'redis.surajr.com.np',
    port: 6379
  }
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

async function testRedisOperations() {
  await redisClient.connect();

  console.log(redisClient.isOpen
    ? "Connected to Redis Server"
    : "Not connected to Redis Server");

  try {
    await redisClient.set('test', 'hellosssssssssssssss wossrld');
    const value = await redisClient.get('test');
    console.log(value);
  } catch (err) {
    console.error('Error in testRedisOperations:', err);
  } finally {
    await redisClient.quit();
  }
}

testRedisOperations();