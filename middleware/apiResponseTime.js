import os from 'os';
import { apiLogger } from "../utils/logger/apilogger.js";

export function responseTimeMiddleware(req, res, next) {
  const start = Date.now();

  res.once('finish', () => {
    const responseTime = Date.now() - start;

    const logData = {
      user: req.session.userId || 'anonymous',
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime} ms`,
      clientIP: req.ip,
      serverHostname: os.hostname(),
      environment: process.env.NODE_ENV || 'development',
    };

    apiLogger.info(JSON.stringify(logData));
  });

  next();
}