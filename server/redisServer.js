import { createClient } from 'redis';
import { mainLogger } from '../utils/logger/logger.js';

export const redisclient = createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    },
    connectTimeout: process.env.REDIS_TIMEOUT,

    retry_strategy: (options) => {
        mainLogger.info(`Redis Reconnect Attempt: ${options.attempt}`);
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
            mainLogger.warn(`No data found for key: ${key}`);
            return null;
        }
        return JSON.parse(data);
    } catch (err) {
        mainLogger.error(`Error fetching data from Redis: ${err}`);
        throw err;
    }
}

export async function deleteFromRedis(key) {
    try {
        await redisclient.del(key);
    } catch (err) {
        mainLogger.error(`Error deleting data from Redis: ${err}`);
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