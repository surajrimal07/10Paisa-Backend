import { createClient } from 'redis';

export const redisclient = createClient({
    password: 'vqmUzFHiWIneSNBcx8c8sC4O0fUhyu4z',
    socket: {
        host: 'redis-16798.c264.ap-south-1-1.ec2.redns.redis-cloud.com',
        port: 16798
    },
    connectTimeout: 10000,

    retry_strategy: (options) => {
        console.log('Redis Reconnect Attempt:', options.attempt);
        if (options.attempt <= 5) {
            return Math.min(options.attempt * 100, 3000);
        }
        return 5000;
    }
});

//redisclient.on('error', err => console.log('Redis Client Error', err));

// await redisclient.connect();

// await redisclient.disconnect();

// await redisclient.set('foo', 'bar');

// const value = await redisclient.get('foo');

// console.log(value);


export async function saveToRedis(key, value) {
    redisclient.set(key, JSON.stringify(value));
}

export async function fetchFromRedis(key) {
    try {
        const data = await redisclient.get(key);
        if (!data) {
            console.warn('No data found for key:', key);
            return null;
        }
        return JSON.parse(data);
    } catch (err) {
        console.error('Error fetching data from Redis:', err);
        throw err;
    }
}

export async function deleteFromRedis(key) {
    try {
        await redisclient.del(key);
    } catch (err) {
        console.error('Error deleting data from Redis:', err);
        throw err;
    }
}

// Test code
// async function testRedisOperations() {
//     try {

//         await saveToRedis('test', 'hello world');
//         const data = await fetchFromRedis('test');
//         console.log(data);

//         await deleteFromRedis('test');
//     } catch (err) {
//         console.error('Error in testRedisOperations:', err);
//     }
// }

// testRedisOperations();