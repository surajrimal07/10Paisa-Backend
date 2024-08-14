/* eslint-disable no-undef */
import winston from "winston";
import { localDBURL } from "../../database/db.js";

import {consoleLogEnabled} from './mainlogger.js'

const transports = [
    new winston.transports.MongoDB({ db: localDBURL, collection: 'sessionlogs', level: 'info', tryReconnect: true, storeHost: true, poolSize: 50 }),
];

if (consoleLogEnabled) {
    transports.push(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple(),
                winston.format.printf(({ level, message }) => {
                    return `${level}: ${message}`;
                })
            ),
            level: 'info',
        })
    );
}

export const sessionLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ level, message }) => {
            return JSON.stringify({ level, message, errorType: level === 'error' ? 'error' : level === 'exception' ? 'exception' : 'info' });
        })
    ),
    transports
});