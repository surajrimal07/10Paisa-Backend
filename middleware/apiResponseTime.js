import { apiLogger } from "../utils/logger/apilogger.js";

export function responseTimeMiddleware(req, res, next) {
  const start = Date.now();
  //console.log(req.session.cookie);

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

    apiLogger.info(JSON.stringify(logData));
  });

  next();
}