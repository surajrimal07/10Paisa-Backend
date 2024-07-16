/* eslint-disable no-undef */
import { createClient } from 'redis';
import { mainLogger } from '../utils/logger/logger.js';

export let redisclient;

const isPrimary = process.env.IS_PRIMARY_SERVER
const redisLocalhost = process.env.REDIS_LOCALHOST_AVAILABLE

console.log(`isPrimary: ${isPrimary}, redisLocalhost: ${redisLocalhost}`)

const host = isPrimary & redisLocalhost ? process.env.REDIS_HOST_PROD_LOCAL : process.env.REDIS_HOST_PROD
const port = isPrimary & redisLocalhost ? process.env.REDIS_PORT_PROD_LOCAL : process.env.REDIS_PORT_PROD
const password = isPrimary & redisLocalhost ? process.env.REDIS_PASSWORD_PROD_LOCAL : process.env.REDIS_PASSWORD_PROD
const timeout = parseInt(process.env.REDIS_TIMEOUT_PROD)
const useTLS = isPrimary & redisLocalhost ? false : true

console.log(`host: ${host}, port: ${port}, password: ${password}, timeout: ${timeout}, useTLS: ${useTLS}`)

redisclient = createClient({
    password: password,
    socket: {
        host: host,
        port: port,
        tls: useTLS
    },
    connect_timeout: timeout,
    retry_strategy: (options) => {
        mainLogger.error(`Redis Reconnect Attempt: ${options.attempt}`);
        if (options.attempt <= 5) {
            return Math.min(options.attempt * 100, 3000);
        }
        return 5000;
    }
});

redisclient.on('connect', () => {
    mainLogger.info(`Connected to Redis server at ${host}:${port}`);
});

redisclient.on('error', () => {
    mainLogger.error('Not connected to Redis Server');
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
    }
}

export async function deleteFromRedis(key) {
    try {
        await redisclient.del(key);
    } catch (err) {
        mainLogger.error(`Error deleting data from Redis: ${err}`);
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