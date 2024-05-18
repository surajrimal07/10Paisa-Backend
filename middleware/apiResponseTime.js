import { sessionLogger } from "../utils/logger/logger.js";

export function responseTimeMiddleware(req, res, next) {
  const start = Date.now();

  res.once('finish', () => {
    const responseTime = Date.now() - start;

    const logData = {
      user: req.session.userEmail || 'anonymous',
      //  sessionID: req.cookies['connect.sid'] || 'no session', spams the logs
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime} ms`,
      clientIP: req.ip,
      environment: process.env.NODE_ENV || 'development',
    };

    sessionLogger.info(JSON.stringify(logData));
  });

  next();
}