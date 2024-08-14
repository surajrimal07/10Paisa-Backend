import path from 'path';
import { sessionLogger } from "../utils/logger/logger.js";
import maxmind from 'maxmind';
import { mainLogger } from "../utils/logger/logger.js";

const __dirname = path.resolve();

const cityDbPath = path.join(__dirname, './middleware/GeoLite2-City.mmdb');
const asnDbPath = path.join(__dirname, './middleware/GeoLite2-ASN.mmdb');

let cityLookup;
let asnLookup;

try {
  cityLookup = await maxmind.open(cityDbPath);
  asnLookup = await maxmind.open(asnDbPath);
} catch (error) {
  mainLogger.error(`Error loading GeoLite2 databases: ${error.message}`);
}


async function fetchUserGeoLocationData(ipAddress) {
  try {
    const geoData = cityLookup.get(ipAddress);
    const asnData = asnLookup.get(ipAddress);

    const userGeoData = {
        country_code: geoData?.country?.iso_code || 'Unknown',
        country_name: geoData?.country?.names?.en || 'Unknown',
        region_name: geoData?.subdivisions?.[0]?.names?.en || 'Unknown',
        city_name: geoData?.city?.names?.en || 'Unknown',
        latitude: geoData?.location?.latitude || 'Unknown',
        longitude: geoData?.location?.longitude || 'Unknown',
        zip_code: geoData?.postal?.code || 'Unknown',
        time_zone: geoData?.location?.time_zone || 'Unknown',
        as: asnData?.autonomous_system_organization || 'Unknown',
    };

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
    as: 'Localhost',
  };

  if (req.ip !== '::1') { //::1 is localhost
    //const ipandsession = req.ip + req.sessionID || 'no session';

    const userInfo = await fetchUserGeoLocationData(req.ip);

    userinfo = {
      city: userInfo.city_name,
      country: userInfo.country_name,
      region: userInfo.region_name,
      longitude: userInfo.longitude,
      latitude: userInfo.latitude,
      isp: userInfo.as,
    }
  }

  res.once('finish', () => {
    const responseTime = Date.now() - start;

    const logData = {
      user: req.session?.userEmail || 'anonymous',
      sessionID: req.sessionID || 'no session',
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