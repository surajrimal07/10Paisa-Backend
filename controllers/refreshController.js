import axios from 'axios';
import { FetchOldData,intradayIndexGraph, FetchSingularDataOfAsset, fetchIndexes, getIndexIntraday, topLosersShare, topTradedShares, topTransactions, topTurnoversShare, topgainersShare } from '../server/assetServer.js';
import { notifyClients } from '../server/websocket.js';
import { setIsMarketOpen, setPreviousIndexData } from '../state/StateManager.js';
//import { deleteFromCache } from './savefetchCache.js';

// const CACHE_KEYS = [
//   'FetchSingularDataOfAssets',
//   'FetchOldData',
//   'topgainersShare',
//   'topLosersShare',
//   'topTurnoversShare',
//   'topTradedShares',
//   'topTransactions',
//   'intradayIndexData',
//   'allindices_sourcedata',
//   'Nepsesummary'
// ];

export let NEPSE_ACTIVE_API_URL = process.env.NEPSE_API_URL;
// //const refreshInterval =  getIsMarketOpen ?60 * 1000 : 5 * 60 * 1000;
const refreshInterval =  60 * 1000;
const Url1 = process.env.NEPSE_API_URL
const url2 = process.env.NEPSE_API_URL_BACKUP

// export async function isNepseOpen() {
//   console.log('Checking if Nepse is open...');
//   try {
//     const response = await axios.get(Url1+'/IsNepseOpen');
//     if (response.data.isOpen === 'CLOSE') {
//       console.log('Nepse is closed (Primary URL).');
//       setIsMarketOpen(false);
//       NEPSE_ACTIVE_API_URL = Url1;
//       return false;
//     } else if (response.data.isOpen === 'OPEN') {
//       console.log('Nepse is open (Primary URL).');
//       setIsMarketOpen(true);
//       NEPSE_ACTIVE_API_URL = Url1;
//       return true;
//     } else {
//       console.log('Error fetching Nepse status from API1:', response.data);
//       return false;
//     }
//   } catch (error) {
//     try {
//       const responseBackup = await axios.get(url2 + '/IsNepseOpen');
//       if (responseBackup.data.isOpen === 'CLOSE') {
//         console.log('Nepse is closed (Backup URL).');
//         setIsMarketOpen(false);
//         NEPSE_ACTIVE_API_URL = url2;
//         return false;
//       } else if (responseBackup.data.isOpen === 'OPEN') {
//         console.log('Nepse is open (Backup URL).');
//         setIsMarketOpen(true);
//         NEPSE_ACTIVE_API_URL = url2;
//         return true;
//       } else {
//         console.log('Error fetching Nepse status from backup URL:', responseBackup.data);
//         return false;
//       }
//     } catch (errorBackup) {
//       console.log('Error fetching Nepse status from backup URL:', errorBackup.message);
//       return false;
//     }
//   }
// }

export async function isNepseOpen() {
  console.log('Checking if Nepse is open...');
  try {
    const primaryResponse = await axios.get(Url1 + '/IsNepseOpen');
    return await handleApiResponse(primaryResponse, Url1);
  } catch (error) {
    console.error('Error fetching Nepse status from primary URL:', error.message);
    try {
      const backupResponse = await axios.get(url2 + '/IsNepseOpen');
      return await handleApiResponse(backupResponse, url2);
    } catch (errorBackup) {
      console.error('Error fetching Nepse status from backup URL:', errorBackup.message);
      return false;
    }
  }
}

async function handleApiResponse(response, apiUrl) {
  if (response.data.isOpen === 'CLOSE') {
    console.log(`Nepse is closed (${apiUrl}).`);
    await setIsMarketOpen(false);
    NEPSE_ACTIVE_API_URL = apiUrl;
    return false;
  } else if (response.data.isOpen === 'OPEN') {
    console.log(`Nepse is open (${apiUrl}).`);
    await setIsMarketOpen(true);
    NEPSE_ACTIVE_API_URL = apiUrl;
    return true;
  } else if (response.data.isOpen == 'Pre Open CLOSE') {
    console.log(`Nepse is Pre Open CLOSE (${apiUrl}).`);
    NEPSE_ACTIVE_API_URL = apiUrl;
    return true; //we are setting true for pre open too
  }
  else {
    console.log(`Error fetching Nepse status from ${apiUrl}:`, response.data);
    return false;
  }
}

async function wipeCachesAndRefreshData() {
  try {
    console.log('Refreshing caches');
    await Promise.all([
      FetchSingularDataOfAsset(),
      FetchOldData(true),
      topgainersShare(true), //switch to get from nepseapi.zorsha.com.np
      topLosersShare(true), // switch to get from nepseapi.zorsha.com.np
      topTurnoversShare(true), // switch to get from nepseapi.zorsha.com.np
      topTradedShares(true), //  TopTenTradeScrips = top volume
      topTransactions(true), //  switch to get from nepseapi.zorsha.com.np
      fetchIndexes(true),
      intradayIndexGraph(true)
    ]);

    let newIndexData = await getIndexIntraday(true);
    //if (newIndexData && newIndexData !== getPreviousIndexData) {
    if (newIndexData) {
      notifyClients({ type: 'index', data: newIndexData });
      setPreviousIndexData(newIndexData);
    }
    console.log(`Data wipe and refresh successful.`);

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
