import axios from "axios";
import storage from 'node-persist';
import {
  FetchOldData,
  FetchSingularDataOfAsset,
  fetchIndexes,
  fetchSummary,
  getIndexIntraday,
  intradayIndexGraph,
  topLosersShare,
  topTradedShares,
  topTransactions,
  topTurnoversShare,
  topgainersShare,
} from "../server/assetServer.js";
import { notifyClients } from "../server/websocket.js";
import { nepseLogger } from '../utils/logger/logger.js';
import { fetchFromCache, saveToCache } from "./savefetchCache.js";

//initilizing storage here to prevent code racing
const defaultDirectory = '/tmp/.node-persist';

await storage.init({
  dir: defaultDirectory,
  forgiveParseErrors: true,
  writeQueue: true,
});

const refreshInterval = (await fetchFromCache("isMarketOpen"))
  ? 60 * 1000 // 1 minute
  : 5 * 60 * 1000; // 5 minutes


const NEPSE_API_URL1 = process.env.NEPSE_API_URL;
const NEPSE_API_URL2 = process.env.NEPSE_API_URL_BACKUP;
export let NEPSE_ACTIVE_API_URL = process.env.NEPSE_API_URL1;

export async function ActiveServer() {
  try {
    const url1Response = await axios.get(NEPSE_API_URL1);

    if (url1Response.status === 200) {
      NEPSE_ACTIVE_API_URL = NEPSE_API_URL1;
      nepseLogger.info(`Nepse API Server 1 is active. ${NEPSE_ACTIVE_API_URL}`);
    }
  } catch {
    try {
      const url2Response = await axios.get(NEPSE_API_URL2);
      if (url2Response.status === 200) {
        NEPSE_ACTIVE_API_URL = NEPSE_API_URL2;
        nepseLogger.info(`Nepse API Server 2 is active. ${NEPSE_ACTIVE_API_URL}`);
      }
    } catch {
      nepseLogger.error("Warning both servers are down.");
    }
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
          `Error fetching Nepse status from primary URL: ${errorBackup.message}`
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
    nepseLogger.info(`Error fetching Nepse status from ${apiUrl}:`, response.data);
    return false;
  }
}

async function wipeCachesAndRefreshData() {
  try {
    const fetchFunctions = [
      FetchSingularDataOfAsset,
      FetchOldData,
      topgainersShare,
      topLosersShare,
      topTurnoversShare,
      topTradedShares,
      topTransactions,
      fetchIndexes,
      intradayIndexGraph,
      fetchSummary,
    ];

    for (const fetchFunction of fetchFunctions) {
      await fetchFunction(true);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    let newIndexData = await getIndexIntraday(true);
    if (newIndexData) {
      notifyClients({ type: "index", data: newIndexData });
      await saveToCache("previousIndexData", newIndexData);
    }
    nepseLogger.info(`Refresh Successful at ${new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}`);
  } catch (error) {
    nepseLogger.error(`Error refreshing Nepse data: ${error.message}`);
  }
}

export default async function initializeRefreshMechanism() {
  try {
    nepseLogger.info("Initializing Nepse refresh mechanism.");
    setInterval(async () => {
      if (await isNepseOpen()) {
        await wipeCachesAndRefreshData();
      }
    }, refreshInterval);
  } catch (error) {
    nepseLogger.error(`Error initializing Nepse refresh mechanism ${error.message}`);
  }
}
