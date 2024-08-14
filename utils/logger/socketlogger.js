import winston from "winston";
import { localDBURL } from "../../database/db.js";

// eslint-disable-next-line no-undef
import {consoleLogEnabled} from './mainlogger.js'

const transports = [

  new winston.transports.MongoDB({ db: localDBURL, collection: 'socketlogs', level: 'info', tryReconnect: true, storeHost: true, poolSize: 50 }),
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

export const socketLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.timestamp(),
    winston.format.json(),
    winston.format.printf(({ level, message }) => {
      return JSON.stringify({ level, message, errorType: level === 'error' ? 'error' : level === 'exception' ? 'exception' : 'info' });
    })
  ),
  transports
});