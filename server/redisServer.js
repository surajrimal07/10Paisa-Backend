/* eslint-disable no-undef */
import { createClient } from 'redis';
//import { hostName } from '../database/dbConfig.js';
import { mainLogger } from '../utils/logger/logger.js';

export let redisclient;

// if (hostName == 'instance-20240618-2207') {
//     redisclient = createClient({
//         password: 'Ll+RXDbybHGJQuz996xK7iQ5aLygB8iRm42O1wj1JQyDcU3qrMf2tyx7DZOrVjViRYQYfBja/p+is4pC'
//     });
// } else {
redisclient = createClient({
    password: process.env.REDIS_PASSWORD_PROD, //when redis container works use REDIS_HOST_PROD
    socket: {
        host: process.env.REDIS_HOST_PROD, //REDIS_PORT_PROD
        port: process.env.REDIS_PORT_PROD //REDIS_PASSWORD_PROD
    },
    connect_timeout: parseInt(process.env.REDIS_TIMEOUT_PROD),
    retry_strategy: (options) => {
        console.log(`Redis Reconnect Attempt: ${options.attempt}`);
        if (options.attempt <= 5) {
            return Math.min(options.attempt * 100, 3000);
        }
        return 5000;
    }
});
//}

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