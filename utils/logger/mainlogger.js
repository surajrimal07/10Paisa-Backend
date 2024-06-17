/* eslint-disable no-undef */
import winston from "winston";

const consoleLogEnabled = process.env.CONSOLE_LOG_ENABLED === 'true';

const transports = [
  new winston.transports.MongoDB({ db: process.env.NEW_DB_URL, collection: 'mainlogs', level: 'info', tryReconnect: true, storeHost: true, poolSize: 50 }),
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

export const mainLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.timestamp(),
    winston.format.printf(({ level, message }) => {
      return JSON.stringify({ level, message, errorType: level === 'error' ? 'error' : level === 'exception' ? 'exception' : 'info' });
    })
  ),
  transports
});

const errorHandler = (err, req, res, next) => {
  mainLogger.error(err.stack);

  const response = {
    message: 'An internal server error occurred',
  };

  if (process.env.NODE_ENV !== 'production') {
    response.error = err.message;
  }

  res.status(err.status || 500).json(response);
};


export const setupErrorHandling = (app) => {
  app.use((err, req, res, next) => {
    errorHandler(err, req, res, next);
  });

  process.on('uncaughtException', (err) => {
    mainLogger.error(`Uncaught Exception: ${err.message}`);
    errorHandler(err);
  });

  process.on('unhandledRejection', (reason, promise) => {
    mainLogger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
    errorHandler(reason);
  });
};