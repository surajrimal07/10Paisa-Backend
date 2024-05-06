import winston from "winston";

const consoleLogEnabled = process.env.CONSOLE_LOG_ENABLED === 'true';

const transports = [
    new winston.transports.MongoDB({ db: process.env.NEW_DB_URL, collection: 'apilogs', level: 'info', tryReconnect: true, storeHost: true }),
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

export const apiLogger = winston.createLogger({
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