/* eslint-disable no-undef */
import winston from "winston";
import { dbURL } from "../../database/dbConfig.js";
// eslint-disable-next-line no-unused-vars
import MongoDB from "winston-mongodb"


export const consoleLogEnabled = process.env.CONSOLE_LOG_ENABLED === 'true';

const transports = [
  new winston.transports.MongoDB({ db: dbURL, collection: 'adminlogs', level: 'info', tryReconnect: true, storeHost: true, poolSize: 50 }),
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

export const adminLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.timestamp(),
    winston.format.printf(({ level, message, stack }) => {
      return JSON.stringify({ level, message, stack, errorType: level === 'error' ? 'error' : level === 'exception' ? 'exception' : 'info' });
    })
  ),
  transports,
});