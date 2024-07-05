import { createClient } from 'redis';

const redisClient = createClient({
  password: 'Ll+RXDbybHGJQuz996xK7iQ5aLygB8iRm42O1wj1JQyDcU3qrMf2tyx7DZOrVjViRYQYfBja/p+is4pC',
  socket: {
    host: 'redis.surajr.com.np',
    port: 6443,
    tls: true
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