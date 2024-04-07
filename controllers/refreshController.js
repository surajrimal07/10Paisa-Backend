import storage from 'node-persist';
import { FetchOldData, FetchSingularDataOfAsset, extractIndex, extractIndexDateWise, fetchIndexes, topLosersShare, topTradedShares, topTransactions, topTurnoversShare, topgainersShare } from '../server/assetServer.js';
import { commodityprices } from '../server/commodityServer.js';
import { notifyClients } from '../server/websocket.js';

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
//every 1 minute

const marketClosingHour = 15;
const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
export let isMarketOpen = false;

async function getLastDataRefreshTime() {
  const lastDataRefreshTimeStr = await storage.getItem('lastDataRefreshTime');
  return lastDataRefreshTimeStr ? new Date(JSON.parse(lastDataRefreshTimeStr).timestamp) : null;
}

async function saveLastDataRefreshTime(timestamp) {
  await storage.setItem('lastDataRefreshTime', JSON.stringify({ timestamp }));
}

async function wipeCachesAndRefreshData() {
  try {
    const lastDataRefreshTime = await getLastDataRefreshTime();
    const now = new Date();
    const isMarketOpen = isMarketOpenNow();

    if (isMarketOpen || (now - lastDataRefreshTime > oneDayInMilliseconds && isWeekday())) {
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
        saveLastDataRefreshTime(now)
      ]);

      let IndexData = await extractIndex();
      if (IndexData) {
        notifyClients({ type: 'index', data: IndexData });
      }

      console.log(`Data wipe and refresh successful. Last Refreshed: ${now.toLocaleTimeString('en-US')}`);
    } else {
      console.log(`Skipping data refresh. Last Refreshed: ${lastDataRefreshTime?.toLocaleTimeString('en-US')}`);
    }
  } catch (error) {
    console.error('Error wiping caches or refreshing data:', error.message);
  }
}

function isWeekday() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  return dayOfWeek >= 0 && dayOfWeek <= 4;
}

function isMarketOpenNow() {
  const now = new Date();
  const currentHour = now.getHours();
  return isWeekday() && currentHour >= 11 && currentHour < marketClosingHour;
}

export default async function initializeRefreshMechanism() {
  try {
    console.log('Initializing refresh mechanism...');
    await wipeCachesAndRefreshData();

    setInterval(async () => {
      if (isMarketOpenNow()) {
        await wipeCachesAndRefreshData();
      }
    }, refreshInterval);
  } catch (error) {
    console.error('Error initializing refresh mechanism:', error.message);
  }
}
