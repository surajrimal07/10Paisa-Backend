import axios from 'axios';
import storage from 'node-persist';
import { FetchOldData, FetchSingularDataOfAsset, fetchIndexes, getIndexIntraday, topLosersShare, topTradedShares, topTransactions, topTurnoversShare, topgainersShare } from '../server/assetServer.js';
import { notifyClients } from '../server/websocket.js';
import { getPreviousIndexData, setIsMarketOpen, setPreviousIndexData } from '../state/StateManager.js';

const CACHE_KEYS = [
  'FetchSingularDataOfAssets',
  'FetchOldData',
  'topgainersShare',
  'topLosersShare',
  'topTurnoversShare',
  'topTradedShares',
  'topTransactions',
  'indexData',
];

export let NEPSE_ACTIVE_API_URL = process.env.NEPSE_API_URL;

const refreshInterval = 60 * 1000;

export async function isNepseOpen() {
  console.log('Checking if Nepse is open...');
  try {
    const response = await axios.get(process.env.NEPSE_API_URL + '/IsNepseOpen');
    if (response.data.isOpen === 'CLOSE') {
      console.log('Nepse is closed (Primary URL).');
      setIsMarketOpen(false);
      NEPSE_ACTIVE_API_URL = process.env.NEPSE_API_URL;
      return false;
    } else if (response.data.isOpen === 'OPEN') {
      console.log('Nepse is open (Primary URL).');
      setIsMarketOpen(true);
      NEPSE_ACTIVE_API_URL = process.env.NEPSE_API_URL;
      return true;
    } else {
      console.log('Error fetching Nepse status from API1:', response.data);
      return false;
    }
  } catch (error) {
    try {
      const responseBackup = await axios.get(process.env.NEPSE_API_URL_BACKUP + '/IsNepseOpen');
      if (responseBackup.data.isOpen === 'CLOSE') {
        console.log('Nepse is closed (Backup URL).');
        setIsMarketOpen(false);
        NEPSE_ACTIVE_API_URL = process.env.NEPSE_API_URL_BACKUP;
        return false;
      } else if (responseBackup.data.isOpen === 'OPEN') {
        console.log('Nepse is open (Backup URL).');
        setIsMarketOpen(true);
        NEPSE_ACTIVE_API_URL = process.env.NEPSE_API_URL_BACKUP;
        return true;
      } else {
        console.log('Error fetching Nepse status from backup URL:', responseBackup.data);
        return false;
      }
    } catch (errorBackup) {
      console.log('Error fetching Nepse status from backup URL:', errorBackup.message);
      return false;
    }
  }
}

async function wipeCachesAndRefreshData() {
  try {
    const now = new Date();
    console.log('Wiping cache and refreshing data.');
    await Promise.all(CACHE_KEYS.map(key => storage.removeItem(key)));

    await Promise.all([
      FetchSingularDataOfAsset(),
      FetchOldData(),
      topgainersShare(), //switch to get from nepseapi.zorsha.com.np
      topLosersShare(), // switch to get from nepseapi.zorsha.com.np
      topTurnoversShare(), // switch to get from nepseapi.zorsha.com.np
      topTradedShares(), //  TopTenTradeScrips = top volume
      topTransactions(), //  switch to get from nepseapi.zorsha.com.np
      fetchIndexes(),
    ]);

    let newIndexData = await getIndexIntraday();
    if (newIndexData && newIndexData !== getPreviousIndexData) {
      notifyClients({ type: 'index', data: newIndexData });
      setPreviousIndexData(newIndexData);
    }
    console.log(`Data wipe and refresh successful. Last Refreshed: ${now.toLocaleTimeString('en-US')}`);

  } catch (error) {
    console.error('Error wiping caches or refreshing data:', error.message);
  }
}

export default async function initializeRefreshMechanism() {
  try {
    console.log('Initializing refresh mechanism...');
    setInterval(async () => {
      if (await isNepseOpen()) {
        await wipeCachesAndRefreshData();
      }
    }, refreshInterval);
  } catch (error) {
    console.error('Error initializing refresh mechanism:', error.message);
  }
}
