import {
  fetchFromCache,
  saveToCache
} from "../controllers/savefetchCache.js";
import { sessionLogger } from "../utils/logger/logger.js";

async function fetchUserGeoLocationData(ipAddress, ipandsession) {
  try {
    const cachedData = fetchFromCache(ipandsession);
    if (cachedData == !null && cachedData !== undefined) {
      return cachedData;
    }

    const response = await fetch(`https://api.ip2location.io/?key=3B2CB46C0C0491F35A3A7A08CEFF8B20&ip=${ipAddress}`);
    const userGeoData = await response.json();

    if (!userGeoData || !userGeoData.city_name) {
      sessionLogger.warn(`No data found for IP: ${ipAddress}`);
      return {
        country_code: 'Unknown',
        country_name: 'Unknown',
        region_name: 'Unknown',
        city_name: 'Unknown',
        latitude: 'Unknown',
        longitude: 'Unknown',
        zip_code: 'Unknown',
        time_zone: 'Unknown',
        as: 'Unknown',
      };
    }

    saveToCache(ipandsession, userGeoData);
    return userGeoData;
  } catch (error) {
    sessionLogger.error(`Error fetching geolocation data for IP: ${ipAddress} - ${error.message}`);
    return {
      country_code: 'Unknown',
      country_name: 'Unknown',
      region_name: 'Unknown',
      city_name: 'Unknown',
      latitude: 'Unknown',
      longitude: 'Unknown',
      zip_code: 'Unknown',
      time_zone: 'Unknown',
      as: 'Unknown',
    };
  }
}

export async function responseTimeMiddleware(req, res, next) {
  const start = Date.now();

  let userinfo = {
    country_code: 'Localhost',
    country_name: 'Localhost',
    region_name: 'Localhost',
    city_name: 'Localhost',
    latitude: 'Localhost',
    longitude: 'Localhost',
    zip_code: 'Localhost',
    time_zone: 'Localhost',
    as: 'Localhost',
  };

  if (req.ip !== '::1') { //::1 is localhost
    const ipandsession = req.ip + req.sessionID || 'no session';

    const userInfo = await fetchUserGeoLocationData(req.ip, ipandsession)

    userinfo = {
      city: userInfo.city_name,
      country: userInfo.country_name,
      region: userInfo.region_name,
      timezone: userInfo.time_zone,
      longitude: userInfo.longitude,
      latitude: userInfo.latitude,
      time_zone: userInfo.time_zone,
      isp: userInfo.as,
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