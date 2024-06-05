import axios from "axios";
import storage from 'node-persist';
import { sendPeriodicPortfolioData } from '../controllers/portfolioControllers.js';
import {
  FetchSingularDataOfAsset,
  getIndexIntraday,
  intradayIndexGraph,
  topLosersShare,
  topTradedShares,
  topTransactions,
  topTurnoversShare,
  topgainersShare,
} from "../server/assetServer.js";
import { notifyRoomClients, wss } from "../server/websocket.js";
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
const NEPSE_API_URL1 = process.env.NEPSE_API_URL;
// eslint-disable-next-line no-undef
const NEPSE_API_URL2 = process.env.NEPSE_API_URL_BACKUP;
// eslint-disable-next-line no-undef
export let NEPSE_ACTIVE_API_URL = process.env.NEPSE_API_URL1;

//bugged , this dosen't check if the server is active or not
export async function switchServer() {
  try {
    NEPSE_ACTIVE_API_URL = NEPSE_ACTIVE_API_URL === NEPSE_API_URL1 ? NEPSE_API_URL2 : NEPSE_API_URL1;
    return true;
  } catch (error) {
    console.error(`Error switching server: ${error.message}`);
    return false;
  }
}

export async function ActiveServer() {
  await new Promise(resolve => setTimeout(resolve, 5000)); //wait for python unicorn server to start
  try {
    const url1Response = await axios.get(NEPSE_API_URL1);
    if (url1Response.status === 200) {
      NEPSE_ACTIVE_API_URL = NEPSE_API_URL1;
      nepseLogger.info(`Nepse API Server 1 is active. ${NEPSE_ACTIVE_API_URL}`);
    }
  } catch (error) {
    try {
      const url2Response = await axios.get(NEPSE_API_URL2);
      if (url2Response.status === 200) {
        NEPSE_ACTIVE_API_URL = NEPSE_API_URL2;
        nepseLogger.info(`Nepse API Server 2 is active. ${NEPSE_ACTIVE_API_URL}`);
      }
    } catch (error2) {
      nepseLogger.error(`warning both servers are down. ${error2.message}`);
    }
    nepseLogger.error(`warning server 1 is down. ${error.message}`);
  }
}

export async function isNepseOpen() {
  try {
    const initialResponse = await axios.get(NEPSE_ACTIVE_API_URL + "/IsNepseOpen");
    return await handleisNepseOpenResponse(initialResponse, NEPSE_ACTIVE_API_URL);
  } catch (error) {
    nepseLogger.error(
      `Error fetching Nepse status from Active URL: ${error.message}`
    );
    try {
      const primaryResponse = await axios.get(NEPSE_API_URL1 + "/IsNepseOpen");
      return await handleisNepseOpenResponse(primaryResponse, NEPSE_API_URL1);
    } catch (error) {
      nepseLogger.error(
        `Error fetching Nepse status from primary URL: ${error.message}`
      );
      try {
        const backupResponse = await axios.get(NEPSE_API_URL2 + "/IsNepseOpen");
        return await handleisNepseOpenResponse(backupResponse, NEPSE_API_URL2);
      } catch (errorBackup) {
        nepseLogger.error(
          `Error fetching Nepse status from backuo URL: ${errorBackup.message}`
        );
        return false;
      }
    }
  }
}

async function handleisNepseOpenResponse(response, apiUrl) {
  if (response.data.isOpen === "CLOSE") {
    nepseLogger.info(`Nepse is closed (${apiUrl}).`);
    await saveToCache("isMarketOpen", false);
    NEPSE_ACTIVE_API_URL = apiUrl;
    return false;
  } else if (response.data.isOpen === "OPEN" || response.data.isOpen === "Pre Open") {
    nepseLogger.info(`Nepse is open (${apiUrl}).`);
    await saveToCache("isMarketOpen", true);
    NEPSE_ACTIVE_API_URL = apiUrl;
    return true;
  } else {
    nepseLogger.info(`Error fetching Nepse status from ${apiUrl}`);
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
      FetchSingularDataOfAsset
    ];

    for (const fetchFunction of fetchFunctions) {
      await fetchFunction(true);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    let newIndexData = await getIndexIntraday(true);
    if (newIndexData) {
      notifyRoomClients('news', { type: "index", data: newIndexData });
    }

    //send the updated portfolio to those who subscribed to live portfolio using websocket
    notifyUsersWithUpdatedData();

    nepseLogger.info(`Refresh Successful at ${new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}`);
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
    let isNepseOpenPrevious = await isNepseOpen(); // Store the initial state
    let closeCounter = 0;
    await wipeCachesAndRefreshData(); // Refresh data if Nepse is initially open

    setInterval(async () => {
      const isNepseOpenNow = await isNepseOpen(); // Check the current state
      if (isNepseOpenNow !== isNepseOpenPrevious) {
        if (!isNepseOpenNow) {
          await wipeCachesAndRefreshData(); // Refresh data last time when Nepse closes
          //notify clients that market is closed
          closeCounter = 5;
          // notifyClients({ type: "marketStatus", data: false });
        }
        isNepseOpenPrevious = isNepseOpenNow; // Update previous state
      }

      if (isNepseOpenNow || closeCounter > 0) {
        await wipeCachesAndRefreshData(); // Refresh data if Nepse is currently open
        if (!isNepseOpenNow) {
          closeCounter--; // Decrease the counter if Nepse is closed
        }
      }
    }, 60 * 1000);
  } catch (error) {
    nepseLogger.error(`Error initializing Nepse refresh mechanism ${error.message}`);
  }
}