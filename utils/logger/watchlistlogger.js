import winston from "winston";
import { localDBURL } from "../../database/db.js";
/* eslint-disable */

import {consoleLogEnabled} from './mainlogger.js'

const transports = [
  new winston.transports.MongoDB({ db: localDBURL, collection: 'mainlogs', level: 'info', tryReconnect: true, storeHost: true, poolSize: 50 }),
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

export const watchlistLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.timestamp(),
    winston.format.json(),
    winston.format.printf(({ level, message, stack }) => {
      return JSON.stringify({ level, message, stack, errorType: level === 'error' ? 'error' : level === 'exception' ? 'exception' : 'info' });
    })
  ),
  transports,
});
