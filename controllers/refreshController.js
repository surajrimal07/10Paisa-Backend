import axios from 'axios';
import storage from 'node-persist';
import { FetchOldData, FetchSingularDataOfAsset, extractIndex, extractIndexDateWise, fetchIndexes, topLosersShare, topTradedShares, topTransactions, topTurnoversShare, topgainersShare } from '../server/assetServer.js';
import { commodityprices } from '../server/commodityServer.js';
import { notifyClients } from '../server/websocket.js';
import { setIsMarketOpen,getIsMarketOpen } from '../state/StateManager.js';

const CACHE_KEYS = [
  'commodityprices',
  'extractIndex',
  'extractIndexDateWise',
  'topTransactions',
  'topTradedShares',
  'topTurnoversShare',
  'topLosersShare',
  'topgainersShare',
  'FetchOldData',
  'FetchSingularDataOfAssets',
  'tableData',
  'fetchMetalPrices',
  'allindices_sourcedata',
  'FetchOldDatas'
];

const refreshInterval = 60 * 1000; // 1 minute //makes no sense lowering this as sharesansar updates data
export let previousIndexData = null; //use this for now only, switch it global state later

export async function isNepseOpen() {
  try {
    const response = await axios.get('https://nepseapi.zorsha.com.np/IsNepseOpen');
    if (response.data.isOpen === 'CLOSE') {
      setIsMarketOpen(false);
      return false;
    } else {
      setIsMarketOpen(true);
    }
  } catch (error) {
    console.error('Error fetching Nepse status:', error);
    return false;
  }
}

async function wipeCachesAndRefreshData() {
  try {
    const now = new Date();
    console.log('Wiping cache and refreshing data.');
    await Promise.all(CACHE_KEYS.map(key => storage.removeItem(key)));

    await Promise.all([
      extractIndexDateWise(),
      FetchSingularDataOfAsset(),
      FetchOldData(),
      topgainersShare(),
      topLosersShare(),
      topTurnoversShare(),
      topTradedShares(),
      topTransactions(),
      commodityprices(),
      fetchIndexes(),
    ]);

    let newIndexData = await extractIndex();
    if (newIndexData && newIndexData !== previousIndexData) {
      notifyClients({ type: 'index', data: newIndexData });
      previousIndexData = newIndexData;
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
