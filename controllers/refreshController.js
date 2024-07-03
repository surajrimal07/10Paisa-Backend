import axios from "axios";
import storage from 'node-persist';
import { sendPeriodicPortfolioData } from '../controllers/portfolioControllers.js';
import {
  FetchSingularDataOfAsset,
  SupplyDemandData,
  getIndexIntraday,
  intradayIndexGraph,
  topLosersShare,
  topTradedShares,
  topTransactions,
  topTurnoversShare,
  topgainersShare,
} from "../server/assetServer.js";
import { GetFloorsheet } from "../server/floorsheetServer.js";
import { NotifyNepseIndexClients } from "../server/notificationServer.js";
import { notifyRoomClients, wss } from "../server/websocket.js";
import { formatTimeTo12Hour, formatTurnover } from "../utils/converter.js";
import { nepseLogger } from '../utils/logger/logger.js';
import { saveToCache } from "./savefetchCache.js";

//initilizing storage here to prevent code racing
const defaultDirectory = '/tmp/.node-persist';

await storage.init({
  dir: defaultDirectory,
  forgiveParseErrors: true,
  writeQueue: true,
});

// eslint-disable-next-line no-undef
const NEPSE_API_URL_INTERNAL = process.env.NEPSE_API_URL_INTERNAL;

// eslint-disable-next-line no-undef
const NEPSE_API_URL1 = process.env.NEPSE_API_URL;
// eslint-disable-next-line no-undef
const NEPSE_API_URL2 = process.env.NEPSE_API_URL_BACKUP;

// eslint-disable-next-line no-undef
const NEPSE_API_URL3 = process.env.NEPSE_API_URL_BACKUP2

// eslint-disable-next-line no-undef
const NEPSE_API_URL4 = process.env.NEPSE_API_URL_BACKUP3

export const serverUrls = [NEPSE_API_URL_INTERNAL, NEPSE_API_URL1, NEPSE_API_URL2, NEPSE_API_URL3, NEPSE_API_URL4];

export let NEPSE_ACTIVE_API_URL = NEPSE_API_URL_INTERNAL;
export let isNepseOpen = false;

export async function switchServer() {
  try {
    const currentIndex = serverUrls.indexOf(NEPSE_ACTIVE_API_URL);
    const nextIndex = (currentIndex + 1) % serverUrls.length;
    NEPSE_ACTIVE_API_URL = serverUrls[nextIndex];
    return true;
  } catch (error) {
    console.error(`Error switching server: ${error.message}`);
    return false;
  }
}

export async function checkIsNepseOpen() {
  await new Promise(resolve => setTimeout(resolve, 5000)); // wait for python unicorn server to start

  try {
    const response = await axios.get(NEPSE_ACTIVE_API_URL + "/IsNepseOpen");
    if (response.status === 200) {
      return await handlecheckIsNepseOpenResponse(response, NEPSE_ACTIVE_API_URL);
    }
  }
  catch (error) {
    nepseLogger.error(`Active URL down: ${error.message}`);
    for (const url of serverUrls) {
      try {
        const response = await axios.get(url + "/IsNepseOpen");
        if (response.status === 200) {
          NEPSE_ACTIVE_API_URL = url;
          return await handlecheckIsNepseOpenResponse(response, url);
        }
      } catch (error) {
        nepseLogger.error(`warning ${url} is down. ${error.message}`);
      }
    }
  }
  nepseLogger.error('All Nepse API servers are down.');
  return false;
}

async function handlecheckIsNepseOpenResponse(response, apiUrl) {
  if (response.data.isOpen === "CLOSE") {
    nepseLogger.info(`Nepse is closed (${apiUrl}).`);
    isNepseOpen = false;
    await saveToCache("isMarketOpen", false)
    NEPSE_ACTIVE_API_URL = apiUrl;
    return false;
  } else if (response.data.isOpen === "OPEN" || response.data.isOpen === "Pre Open") {
    nepseLogger.info(`Nepse is open (${apiUrl}).`);
    await saveToCache("isMarketOpen", true);
    isNepseOpen = true;
    NEPSE_ACTIVE_API_URL = apiUrl;
    return true;
  } else {
    return false;
  }
}

async function wipeCachesAndRefreshData() {
  try {
    const fetchFunctions = [
      intradayIndexGraph,
      topgainersShare,
      topLosersShare,
      topTurnoversShare,
      topTradedShares,
      topTransactions,
      FetchSingularDataOfAsset,
      SupplyDemandData,
      GetFloorsheet
    ];

    for (const fetchFunction of fetchFunctions) {
      await fetchFunction(true);
      await new Promise(resolve => setTimeout(resolve, 15000));
    }

    let newIndexData = await getIndexIntraday(true);
    if (newIndexData) {
      const asOf = `as of ${formatTimeTo12Hour(newIndexData.time)}`
      const title = `Nepse Index ${newIndexData.change} ${newIndexData.change > 0 ? "Up" : "Down"} ${asOf}`;
      const body = `Nepse Index: ${newIndexData.close} • Point change ${newIndexData.change} • Percentage Change ${newIndexData.percentageChange}% • High ${newIndexData.high} • Low ${newIndexData.low} • Turnover ${formatTurnover(newIndexData.turnover)} `;

      notifyRoomClients('news', { type: "index", data: newIndexData });
      await NotifyNepseIndexClients(title, body);
    }

    //send the updated portfolio to those who subscribed to live portfolio using websocket
    notifyUsersWithUpdatedData();

    nepseLogger.info(`Refresh Successful at ${new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}, Data as of ${formatTimeTo12Hour(newIndexData.time)}`);
  } catch (error) {
    nepseLogger.error(`Error refreshing Nepse data: ${error.message}`);
  }
}


//update the portfolios and send data
async function notifyUsersWithUpdatedData() {
  wss.clients.forEach(client => {
    if (client.email && client.enableLivePortfolio) {
      sendPeriodicPortfolioData(client, client.email);
    }
  });
}

//solved the the refresh and 1 minute gap issue when nepse is closed
//making sure we have last data
export default async function initializeRefreshMechanism() {
  try {
    await new Promise(resolve => setTimeout(resolve, 8000));
    nepseLogger.info("Initializing Nepse refresh mechanism.");
    let checkIsNepseOpenPrevious = await checkIsNepseOpen(); // Store the initial state
    let closeCounter = 0;
    //await wipeCachesAndRefreshData(); // Refresh data if Nepse is initially open

    setInterval(async () => {
      const checkIsNepseOpenNow = await checkIsNepseOpen(); // Check the current state
      if (checkIsNepseOpenNow !== checkIsNepseOpenPrevious) {
        if (!checkIsNepseOpenNow) {
          await wipeCachesAndRefreshData(); // Refresh data last time when Nepse closes
          //notify clients that market is closed
          closeCounter = 5;
          // notifyClients({ type: "marketStatus", data: false });
        }
        checkIsNepseOpenPrevious = checkIsNepseOpenNow; // Update previous state
      }

      if (checkIsNepseOpenNow || closeCounter >= 0) {
        await wipeCachesAndRefreshData(); // Refresh data if Nepse is currently open
        if (!checkIsNepseOpenNow) {
          closeCounter--; // Decrease the counter if Nepse is closed
        }
      }
    }, 70 * 1000);
  } catch (error) {
    nepseLogger.error(`Error initializing Nepse refresh mechanism ${error.message}`);
  }
}

//setup timer for 24 hour
