import axios from 'axios';
import storage from 'node-persist';
import { FetchOldData, FetchSingularDataOfAsset, fetchIndexes, getIndexIntraday, topLosersShare, topTradedShares, topTransactions, topTurnoversShare, topgainersShare } from '../server/assetServer.js';
import { notifyClients } from '../server/websocket.js';
import { getPreviousIndexData, setIsMarketOpen, setPreviousIndexData } from '../state/StateManager.js';

//'metalprices', -- to be refreshed using chron job
//'CommodityData' -- to be refreshed using chron job

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

const refreshInterval = 60 * 1000; // 1 minute //makes no sense lowering this as sharesansar updates data

export async function isNepseOpen() {
  console.log('Checking if Nepse is open...');
    const response = await axios.get('http://localhost:5000/IsNepseOpen');
    if (response.data.isOpen === 'CLOSE') {
      console.log('Nepse is closed.');
      setIsMarketOpen(false);
      return false;
    } else if (response.data.isOpen === 'OPEN'){
      console.log('Nepse is open.');
      setIsMarketOpen(true);
      return true;
    } else {
      console.log('Error fetching Nepse status:', response.data);
      return false;
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
