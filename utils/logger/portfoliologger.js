import winston from "winston";
/* eslint-disable */
import { MongoDB } from "winston-mongodb";

const consoleLogEnabled = process.env.CONSOLE_LOG_ENABLED === 'true';

const transports = [
    new winston.transports.MongoDB({ db: process.env.NEW_DB_URL, collection: 'mainlogs', level: 'info' ,tryReconnect: true, storeHost: true}),
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

export const portfolioLogger = winston.createLogger({
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
