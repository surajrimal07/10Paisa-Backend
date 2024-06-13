import {
  fetchFromCache,
  saveToCache
} from "../controllers/savefetchCache.js";
import { sessionLogger } from "../utils/logger/logger.js";

async function fetchUserGeoLocationData(ipAddress, ipandsession) {
  const cachedData = fetchFromCache(ipandsession);

  if (cachedData) {
    return cachedData;
  }
  const userGeoData = await fetch(`https://api.ip2location.io/?key=3B2CB46C0C0491F35A3A7A08CEFF8B20&ip=${ipAddress}`)
    .then(response => response.json())

  if (!userGeoData) {
    const userinfo = {
      city: 'Unknown',
      country: 'Unknown',
      timezone: 'Unknown',
      isp: 'Unknown',
      region: 'Unknown'
    };

    return userinfo;
  }

  saveToCache(ipandsession, userGeoData);
  return userGeoData;
}

export async function responseTimeMiddleware(req, res, next) {
  const start = Date.now();

  let userinfo = {
    city: 'Localhost',
    country: 'Localhost',
    timezone: 'Localhost',
    isp: 'Localhost',
    region: 'Localhost'
  };

  if (req.ip !== '::1') { //::1 is localhost
    const ipandsession = req.ip + req.sessionID || 'no session';

    const userInfo = await fetchUserGeoLocationData(req.ip, ipandsession)

    console.log(userInfo);

    userinfo = {
      city: userInfo.city_name,
      country: userInfo.country_name,
      timezone: userInfo.time_zone,
      isp: userInfo.organization_name,
      region: userInfo.as
    }
  }

  res.once('finish', () => {
    const responseTime = Date.now() - start;

    const logData = {
      user: req.session?.userEmail || 'anonymous',
      sessionID: req.sessionID || 'no session', //spams the logs //tenpaisa.session
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime} ms`,
      clientIP: req.ip,
      clientAddress: userinfo,
      // eslint-disable-next-line no-undef
      environment: process.env.NODE_ENV || 'development',
    };

    sessionLogger.info(JSON.stringify(logData));
  });

  next();
}