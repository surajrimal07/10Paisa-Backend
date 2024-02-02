import { DateTime } from 'luxon';
import storage from 'node-persist';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import saveDataToJson from '../controllers/jsonControllers.js';
import Asset from '../models/assetModel.js';
import Commodity from '../models/commodityModel.js';
import HistoricPrice from '../models/historicModel.js';
import { FetchOldData, FetchSingularDataOfAsset, extractIndex, extractIndexDateWise, fetchTopGainers, fetchturnvolume, fetchvolume, topLosersShare, topTradedShares, topTransactions, topTurnoversShare, topgainersShare } from '../server/assetServer.js';
import { commodityprices } from '../server/commodityServer.js';
import { metalChartExtractor, metalPriceExtractor } from '../server/metalServer.js';
import { oilExtractor } from '../server/oilServer.js';
import { respondWithData, respondWithError } from '../utils/response_utils.js';
await storage.init();


//common functions
const fetchFromDatabase = async (collection) => {
  try {
    const dataFromDatabase = await collection.find();
    return dataFromDatabase;
  } catch (error) {
    console.error(`Error fetching data from the database for collection ${collection}:`, error.message);
    throw new Error(`Error fetching data from the database for collection ${collection}`);
  }
};

const fetchFromCache = async (cacheKey) => {
  try {
    const cachedData = await storage.getItem(cacheKey);
    if (cachedData) { //&& cachedData.length > 0
      //console.log('Returning cached data');
      return cachedData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching data from cache:', error.message);
    throw new Error('Error fetching data from cache');
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const dataversion_cache = 'dataVersionCounter_c';
const counter = 'counter_cached';
const cachedDataVersion = await fetchFromCache(dataversion_cache);
const cache_counter = await storage.getItem(counter);
const dataVersion = cache_counter !== null ? cache_counter : 0;

//
export const createAsset = async (req, res) => {
    console.log("Create Data Requested");
    const symbol = req.body.symbol;
    const name = req.body.name;
    const category = req.body.category;
    const sector = req.body.sector;

    const newAsset = new Asset({
        symbol,
        name,
        category,
        sector,
      });

      try {
        const savedAsset = await newAsset.save();
        const assetData = {
          _id: savedAsset._id,
          symbol: savedAsset.symbol,
          name: savedAsset.name,
          category: savedAsset.category,
          category: savedAsset.category,

        };
        res.status(200).json(assetData);
        console.log("Asset saved successfully");
      } catch (err) {
        console.error(err);
        res.status(500).json(err);
      }
};

export const updateAssetData = async (symbol, newData) => {
    console.log("Update Data Requested");

    try {
        const updatedAsset = await Asset.findOneAndUpdate(
            { symbol },
            { $set: newData },
            { new: true }
        );

        if (updatedAsset) {
            console.log("Asset updated successfully", updatedAsset);
            return updatedAsset;
        } else {
            console.log("Asset not found for update");
            return null;
        }

    } catch (error) {
        console.error("Error updating asset data:", error);
        return null;

    }
}

// //
// const CACHE_KEY_ALL_ASSET_NAMES = 'allAssetNames';

// export const getAllAssetNames = async (req, res) => {
//   console.log("Asset Names Only Requested");

//   try {
//     const cachedData = await fetchFromCache(CACHE_KEY_ALL_ASSET_NAMES);

//     if (cachedData !== null) {
//       console.log('Returning cached asset names data');
//       return res.status(200).json(cachedData);
//     }

//     const symbols = await Asset.find({ ltp: { $exists: true, $nin: [null, 0] } }).distinct('symbol');

//     await storage.setItem(CACHE_KEY_ALL_ASSET_NAMES, symbols);

//     return res.json(symbols);
//   } catch (error) {
//     console.error('Error:', error.message);
//     try {
//       const fallbackCacheData = await fetchFromCache(allAssetNames_fallback);

//       if (fallbackCacheData !== null) {
//         console.log('Returning data from fallback cache');
//         return res.json(fallbackCacheData);
//       }
//     } catch (fallbackError) {
//       console.error('Fallback cache failed:', fallbackError.message);
//     }
//     return res.status(500).json({ error: 'An error occurred.' });
//   }
// };



// //
// const getCacheKeyForSymbol = symbol => `${symbol}_cache`;

// // Function to update cache for a specific symbol
// const updateCacheForSymbol = async (symbol, data) => {
//   const cacheKey = getCacheKeyForSymbol(symbol);
//   const cachedData = await fetchFromCache(cacheKey) || {};
//   cachedData[symbol] = data;
//   await storage.setItem(cacheKey, cachedData);
// };

// // Function to fetch and update cache for all asset symbols
// const updateCacheForAllAssets = async () => {
//   const assets = await Asset.find();
//   const symbols = assets.map(asset => asset.symbol);

//   for (const symbol of symbols) {
//     const dynamicInfo = await fetchSingleSecurityData(symbol);
//     const asset = await Asset.findOne({ symbol });

//     if (asset) {
//       await Asset.updateOne(
//         { _id: asset._id },
//         {
//           $set: {
//             ltp: dynamicInfo?.ltp || "",
//             totaltradedquantity: dynamicInfo?.totaltradedquantity || "",
//             percentchange: dynamicInfo?.percentchange || "",
//             previousclose: dynamicInfo?.previousclose || "",
//           },
//         },
//         { upsert: false }
//       );

//       const updatedAsset = {
//         ...asset.toObject(),
//         ...dynamicInfo,
//       };

//       await updateCacheForSymbol(symbol, updatedAsset);
//     }
//   }
// };

// //
// const CACHE_KEY_SINGLE_ASSET = 'singleasst';
// export const getSingleAssetDetails = async (req, res) => {
//     console.log("Single Asset Data Requested");
//     const symbol = req.body.symbol;

//     try {
//         const cachedData = await storage.getItem(CACHE_KEY_SINGLE_ASSET);
//         if (cachedData && cachedData[symbol]) {
//             console.log(`Returning cached single asset data for symbol ${symbol}`);
//             return res.status(200).json(cachedData[symbol]);
//         }

//         const dynamicInfo = await fetchSingleSecurityData(symbol);

//         const asset = await Asset.findOne({ symbol });

//         if (!asset) {
//             console.error(`Asset with symbol ${symbol} not found.`);
//             return res.status(404).json({ error: `Asset with symbol ${symbol} not found.` });
//         }

//         try {
//             const dynamicInfoForAsset = dynamicInfo.find(info => info.symbol === symbol);

//             await Asset.updateOne(
//                 { _id: asset._id },
//                 {
//                     $set: {
//                         ltp: dynamicInfoForAsset?.ltp || "",
//                         totaltradedquantity: dynamicInfoForAsset?.totaltradedquantity || "",
//                         percentchange: dynamicInfoForAsset?.percentchange || "",
//                         previousclose: dynamicInfoForAsset?.previousclose || "",
//                     },
//                 },
//                 { upsert: false }
//             );

//             const updatedAsset = {
//                 ...asset.toObject(),
//                 ...dynamicInfoForAsset,
//             };

//             const cachedSingleAssetDetails = await storage.getItem(CACHE_KEY_SINGLE_ASSET) || {};
//             cachedSingleAssetDetails[symbol] = updatedAsset;
//             await storage.setItem(CACHE_KEY_SINGLE_ASSET, cachedSingleAssetDetails);

//             return res.status(200).json(updatedAsset);
//         } catch (error) {
//             console.error('Error processing asset:', error.message);
//             return res.status(500).json({ error: 'An error occurred while processing the asset.' });
//         }
//     } catch (error) {
//         console.error('Error:', error.message);
//         return res.status(500).json({ error: 'An error occurred.' });
//     }
// };

// //

// //end of single asset caching
// // current setup
// //send cache data always
// //if no cache then call nepse api
// //if nepse api is unavailable then send data from database
// //if database is not available then send data from fallback cache

// const CACHE_KEY = 'assetDetails';

// export const getMultiAssetDetails = async (req, res) => {
//   console.log("All Asset Data Requested");

//   try {
//       const cachedData = await fetchFromCache(CACHE_KEY);

//       if (cachedData !== null) {
//         return res.status(200).json({
//           data: cachedData,
//           isFallback: false,
//           isCached: true,
//           dataversion: cachedDataVersion
//         });
//       }

//       const assets = await Asset.find();
//       const symbols = assets.map(asset => asset.symbol);

//       const dynamicInfo = await fetchSecurityData(58, symbols);

//       const assetData = await Promise.all(assets.map(async (asset) => {
//           try {
//               const assetSymbol = asset.symbol;
//               const dynamicInfoForAsset = dynamicInfo.find(info => info.symbol === assetSymbol);

//               await Asset.updateOne(
//                   { _id: asset._id },
//                   {
//                       $set: {
//                           ltp: dynamicInfoForAsset?.ltp || "",
//                           totaltradedquantity: dynamicInfoForAsset?.totaltradedquantity || "",
//                           percentchange: dynamicInfoForAsset?.percentchange || "",
//                           previousclose: dynamicInfoForAsset?.previousclose || "",
//                       },
//                   },
//                   { upsert: false }
//               );

//               return {
//                   ...asset.toObject(),
//                   ...dynamicInfoForAsset,
//               };
//           } catch (error) {
//               console.error('Error processing asset:', error.message);
//           }
//       }));

//       const filteredAssetData = assetData.filter(asset => asset.ltp !== null);

//       await storage.setItem(CACHE_KEY, filteredAssetData);
//       await storage.setItem(assetDetails_fallback, filteredAssetData);

//       return res.status(200).json({
//         data: filteredAssetData,
//         isFallback: false,
//         isCached: false,
//         dataversion: cachedDataVersion
//       });
//   } catch (error) {
//       console.error('Live data unavailable, Using fallback', error.message);

//       console.error('Trying to send data from database');

//     try {
//       const assetsFromDatabase = await fetchFromDatabase(Asset);
//       console.error('Data sent from database:');
//       const filteredAssets = assetsFromDatabase.filter(asset => asset.ltp !== null);
//       return res.status(200).json(filteredAssets);

//     } catch (dbError) {
//       console.error('Error fetching data from the database:', dbError.message);

//       const All_Asset_fallback_key = 'assetDetails_fallback';
//       try{
//         console.log('Using fallback key');
//         const cachedData = await fetchFromCache(All_Asset_fallback_key);
//         if (cachedData !== null) {
//           return res.status(200).json({
//             data: cachedData,
//             isFallback: true,
//             isCached: true,
//             dataversion: cachedDataVersion
//           });
//       }}
//       catch {
//         console.log('everything failed: Fallback failed');
//         return res.status(500).json({ error: 'An error occurred while fetching data' });
//       }

//       return res.status(500).json({ error: 'An error occurred while fetching data' });
//     }
//   }
// };

//
const CACHE_KEY_TOP_GAINERS = 'topGainers';

export const getTopGainers = async (req, res) => {
  console.log("Trending Data Requested");

  try {
    const cachedData = await fetchFromCache(CACHE_KEY_TOP_GAINERS);

    if (cachedData !== null) {
      console.log('Returning cached top gainers data');
      return res.status(200).json({
        data: cachedData,
        isFallback: false,
        isCached: true,
        dataversion: cachedDataVersion,
      });
    }

    const dynamicInfo = await fetchTopGainers();

    await storage.setItem(CACHE_KEY_TOP_GAINERS, dynamicInfo);

    return res.status(200).json({
      data: dynamicInfo,
      isFallback: false,
      isCached: false,
      dataversion: cachedDataVersion,
    });

  } catch (error) {
    console.error('Error fetching data:', error.message);

    try {
      const fallbackCacheData = await fetchFromCache(CACHE_KEY_TOP_GAINER_FALLBACK);

      if (fallbackCacheData !== null) {
        console.log('Returning data from fallback cache');
        return res.status(200).json({
          data: fallbackCacheData,
          isFallback: true,
          isCached: true,
          dataversion: cachedDataVersion,
        });
      }
    } catch (fallbackError) {
      console.error('Fallback cache failed:', fallbackError.message);
    }
    return res.status(500).json({ error: 'Error fetching data' });
  }
};


//
const CACHE_KEY_TOP_TURNOVER = 'topTurnover';

export const getTopTurnover = async (req, res) => {
  console.log("Turnover Data Requested");

  try {
    const cachedData = await fetchFromCache(CACHE_KEY_TOP_TURNOVER);

    if (cachedData !== null) {
      console.log('Returning cached top turnover data');
      return res.status(200).json({
        data: cachedData,
        isFallback: false,
        isCached: true,
        dataversion: cachedDataVersion,
      });
    }

    const dynamicInfo = await fetchturnvolume();

    await storage.setItem(CACHE_KEY_TOP_TURNOVER, dynamicInfo);
    return res.status(200).json({
      data: dynamicInfo,
      isFallback: false,
      isCached: false,
      dataversion: cachedDataVersion,
    });

  } catch (error) {
    console.error('Error fetching data:', error.message);

    try {
      const fallbackCacheData = await fetchFromCache(topTurnover_fallback);

      if (fallbackCacheData !== null) {
        console.log('Returning data from fallback cache');
        await storage.setItem(CACHE_KEY_TOP_TURNOVER, dynamicInfo);
        return res.status(200).json({
          data: fallbackCacheData,
          isFallback: true,
          isCached: true,
          dataversion: cachedDataVersion,
        });
      }
    } catch (fallbackError) {
      console.error('Fallback cache failed:', fallbackError.message);
    }
    return res.status(500).json({ error: 'Error fetching data' });
  }
};

//
const CACHE_KEY_TOP_VOLUME = 'topVolume';

export const getTopVolume = async (req, res) => {
  console.log("Top Volume Data Requested");

  try {
    const cachedData = await fetchFromCache(CACHE_KEY_TOP_VOLUME);

    if (cachedData !== null) {
      console.log('Returning cached top volume data');
      return res.status(200).json({
        data: cachedData,
        isFallback: false,
        isCached: true,
        dataversion: cachedDataVersion,
      });
    }

    const dynamicInfo = await fetchvolume();

    await storage.setItem(CACHE_KEY_TOP_VOLUME, dynamicInfo);

    return res.status(200).json({
      data: dynamicInfo,
      isFallback: false,
      isCached: false,
      dataversion: cachedDataVersion,
    });
  } catch (error) {
    console.error('Error fetching data:', error.message);

    try {
      const fallbackCacheData = await fetchFromCache(topVolume_fallback); //error here, create variable for fallback

      if (fallbackCacheData !== null) {
        console.log('Returning data from fallback cache');
        return res.status(200).json({
          data: fallbackCacheData,
          isFallback: true,
          isCached: true,
          dataversion: cachedDataVersion,
        });
      }
    } catch (fallbackError) {
      console.error('Fallback cache failed:', fallbackError.message);
    }

    return res.status(500).json({ error: 'Error fetching data' });
  }
};


// // single stopmic data from sharesansar
  const Asset_cached_key = 'atomic_asset_data';
  const Asset_fallback_key= 'shares_asset_fallback';

export const AssetMergedData = async (req, res) => {
  console.log('Sharesansar Asset Data Requested');
  const cachedData = await fetchFromCache(Asset_cached_key)

  try {
    if (cachedData !== null) {
      console.log('Returning cached data');
      return res.status(200).json({
        data: cachedData,
        isFallback: false,
        isCached: true,
        dataversion: cachedDataVersion,
      });
    }

    const [todayData, liveData] = await Promise.all([FetchSingularDataOfAsset(), FetchOldData()]);

    const liveDataMap = new Map(liveData.map((item) => [item.symbol, item]));

    const mergedData = todayData.map((item) => ({
      ...item,
      ...(liveDataMap.get(item.symbol) || {}),
    }));

    let dataVersionCounter = dataVersion + 1;
    console.log('Incremented data version:', dataVersionCounter);

    const currentDate = new Date().toISOString().split('T')[0];
    const Assetfolder = 'AssetArchive';
    const assetDataFolderPath = path.join(__dirname, '..', 'AssetData', Assetfolder);
    const fileName = `${currentDate}_Stock.json`;

    saveDataToJson(
      {
        data: mergedData,
        isFallback: false,
        isCached: false,
        dataversion: { versionCode: dataVersionCounter, timestamp: DateTime.now().toISO() },
      },
      fileName,
      assetDataFolderPath
    );

    // Update existing documents based on symbol
    // await Promise.all(
    //   mergedData.map(async (item) => {
    //     await Asset.updateOne({ symbol: item.symbol }, { $set: item }, { upsert: true });
    //   })
    // );

    try {
      await Promise.all(
        mergedData.map(async (item) => {
          await Asset.updateOne({ symbol: item.symbol }, { $set: item }, { upsert: true });
        })
      );
    } catch (error) {
      console.error('DB Update Error:', error);
    }

    // Update cache and counter
    await Promise.all([
      storage.setItem(dataversion_cache, { versionCode: dataVersionCounter, timestamp: DateTime.now().toISO() }),
      storage.setItem(counter, dataVersionCounter),
      storage.setItem(Asset_cached_key, mergedData),
      storage.setItem(Asset_fallback_key, mergedData)
    ]);

    await Promise.all(
      mergedData.map(async (item) => {
        try {
          await Asset.updateOne(
            { symbol: item.symbol },
            {
              $set: {
                ...item,
                isFallback: false,
                isCached: false,
                dataversion: { versionCode: dataVersionCounter, timestamp: DateTime.now().toISO() },
              },
            },
            { upsert: true }
          );
        } catch (error) {
          console.error('DB Update Error:', error);
        }
      })
    );

    return res.status(200).json({
      data: mergedData,
      isFallback: false,
      isCached: false,
      dataversion: { versionCode: dataVersionCounter, timestamp: DateTime.now().toISO() },
    });
  } catch (error) {
    try {
      console.log(error);
      console.log('Using fallback key');
      const cachedData = await fetchFromCache(Asset_fallback_key);
      if (cachedData !== null) {
        console.log('fallback data sent');
        return res.status(200).json({
          data: cachedData,
          isFallback: true,
          isCached: true,
          dataversion: cachedDataVersion,
        });
      } else {
        // Attempt to retrieve data from MongoDB
        const dataFromMongoDB = await Asset.find({});
        if (dataFromMongoDB) {

          storage.setItem(Asset_fallback_key, dataFromMongoDB) //adding data back to fallback

          return res.status(200).json({
            data: dataFromMongoDB,
            isFallback: true,
            isCached: true,
            dataversion: cachedDataVersion,
          });
        }
      }
    } catch {
      console.log('everything failed: Fallback failed');
      return res.status(500).json({ error: 'An error occurred while fetching data' });
    }
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

//
//single asset from sharesanasar
export const SingeAssetMergedData = async (req, res) => {
  console.log('Sharesansar Single Asset Data Requested');

  const symbol = req.body.symbol;

  if (!symbol) {
    console.error('No symbol provided in the request');
    return respondWithError(res, 'BAD_REQUEST', 'No symbol provided in the request');
  }
  const cachedData = await fetchFromCache(Asset_cached_key);

  const symboll = symbol.toUpperCase();
  try {
    if (cachedData !== null) {
      console.log('Returning cached data for symbol:', symboll);

      const filteredData = cachedData.filter(item => item.symbol === symboll);

      return res.status(200).json({
        data: filteredData,
        isFallback: false,
        isCached: true,
        dataversion: cachedDataVersion,
      });
    }

    const [todayData, liveData] = await Promise.all([FetchSingularDataOfAsset(), FetchOldData()]);

  // Merge data
  const liveDataMap = new Map(liveData.map((item) => [item.symbol, item]));
  const mergedData = todayData.map((item) => ({
    ...item,
    ...(liveDataMap.get(item.symbol) || {}),
  }));

  // Filter data for the requested symbol
  const filteredMergedData = mergedData.filter(item => item.symbol === symbol);

    return res.status(200).json({
      data: filteredMergedData,
      isFallback: false,
      isCached: false,
      dataversion: { versionCode: dataVersion, timestamp: DateTime.now().toISO() },
    });
  } catch (error) {
    try {
      console.log(error);
      console.log('Using fallback key for symbol:', symbol);

      const cachedData = await fetchFromCache(Asset_fallback_key);

      if (cachedData !== null) {
        console.log('Fallback data sent for symbol:', symbol);

        // Filter data for the requested symbol
        const filteredData = cachedData.filter(item => item.symbol === symbol);

        return res.status(200).json({
          data: filteredData,
          isFallback: true,
          isCached: true,
          dataversion: cachedDataVersion,
        });
      } else {
        // Attempt to retrieve data from MongoDB for the requested symbol
        const dataFromMongoDB = await Asset.find({ symbol });

        if (dataFromMongoDB) {
          storage.setItem(Asset_fallback_key, dataFromMongoDB); // Adding data back to fallback

          // Filter data for the requested symbol
          const filteredData = dataFromMongoDB.filter(item => item.symbol === symbol);

          return res.status(200).json({
            data: filteredData,
            isFallback: true,
            isCached: true,
            dataversion: cachedDataVersion,
          });
        }
      }
    } catch {
      console.log(`Everything failed for symbol: ${symbol}. Fallback failed`);
      return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'Internal Server Error');
    }
    console.error(error);
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'Internal Server Error');
  }
};


//filtering based on sector
export const AssetMergedDataBySector = async (req, res) => {
  console.log('Sharesansar Asset Data Requested by Sector');

  console.log('Request sector:', req.body.sector);

  const sector = req.body.sector;
  const assettype = req.body.category;

  if (!sector && !assettype) {
    return res.status(400).json({ error: 'No sector or asset type provided in the request' });
  }

  try {
    const cachedData = await fetchFromCache(Asset_cached_key);

    if (cachedData !== null) {
      console.log('Returning cached data by sector');

      let filteredCachedData;

      if (sector) {
        filteredCachedData = cachedData.filter(item => item.sector === sector);
      } else if (assettype === 'Assets') {

        filteredCachedData = cachedData.filter(item => item.category === 'Assets');
      } else if (assettype === 'Mutual Fund') {
        filteredCachedData = cachedData.filter(item => item.category === 'Mutual Fund');
      } else if (assettype === 'Debenture') {
        filteredCachedData = cachedData.filter(item => item.category === 'Debenture');
      } else {
        return res.status(400).json({ error: 'Invalid asset type provided in the request' });
      }

      if (filteredCachedData.length === 0) {
        return res.status(404).json({ error: 'No data found based on the provided criteria' });
      }

      return res.status(200).json({
        data: filteredCachedData,
        isFallback: false,
        isCached: true,
        dataversion: cachedDataVersion,
      });
    }

    const [todayData, liveData] = await Promise.all([FetchSingularDataOfAsset(), FetchOldData()]);

  const liveDataMap = new Map(liveData.map((item) => [item.symbol, item]));
  const mergedData = todayData.map((item) => ({
    ...item,
    ...(liveDataMap.get(item.symbol) || {}),
  }));

  let filteredData;

  if (sector) {
    filteredData = mergedData.filter(item => item.sector === sector);
  } else if (assettype === 'Assets') {
    filteredData = mergedData.filter(item => item.category === 'Assets');
  } else if (assettype === 'Mutual Fund') {
    filteredData = mergedData.filter(item => item.category === 'Mutual Fund');
  } else if (assettype === 'Debenture') {
    filteredData = cachedData.filter(item => item.category === 'Debenture');
  }else {
    return res.status(400).json({ error: 'Invalid asset type provided in the request' });
  }

  if (filteredData.length === 0) {
    return res.status(404).json({ error: 'No data found based on the provided criteria' });
  }
  return res.status(200).json({
    data: filteredData,
    isFallback: false,
    isCached: false,
    dataversion: { versionCode: dataVersion, timestamp: DateTime.now().toISO() },
  });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

//get metal
const assetToCategoryMap = {
  'Gold hallmark': 'Fine Gold',
  'Gold tejabi': 'Tejabi Gold',
  'Silver': 'Silver',
};

const CACHE_KEY_METAL_PRICES = 'metal_cached';
const CACHE_KEY_METAL_FALLBACK = 'metal_fallback';

export const fetchMetalPrices = async (req, res) => {
  console.log('Metal data requested');
  try {
    const cachedData = await fetchFromCache(CACHE_KEY_METAL_PRICES);

    if (cachedData !== null) {
      console.log('Returning cached metal prices data');
      return res.status(200).json(
        cachedData
      );
    }

    const assets = Object.keys(assetToCategoryMap);
    const metalPrices = [];

    for (const asset of assets) {
      const metalData = await metalPriceExtractor(asset);

      if (metalData) {
        const metalAsset = new Asset({
          symbol: metalData.name,
          name: metalData.name,
          category: metalData.category,
          sector: metalData.sector,
          ltp: parseFloat(metalData.ltp),
          unit: metalData.unit,
        });

        metalPrices.push(metalAsset);
      } else {
        console.log(`Price for ${asset} not found`);
      }
    }

    await storage.setItem(CACHE_KEY_METAL_PRICES, { metalPrices });
    await storage.setItem(CACHE_KEY_METAL_FALLBACK, { metalPrices });

    await Promise.all(
      metalPrices.map(async (item) => {
        try {
          await Commodity.updateOne(
            { name : item.name},
            {
              $set: {
                category: item.category,
                unit: item.unit,
                ltp: item.ltp,
                isFallback: false,
                isCached: false,
                dataversion: { versionCode: dataVersion, timestamp: DateTime.now().toISO() },
              },
            },
            { upsert: true }
          );
        } catch (error) {
          console.error('DB Update Error:', error);
        }
      })
        );

    console.log('Returning live Metal prices');
    return res.status(200).json({metalPrices
      // data: metalPrices,
      // isFallback: false,
      // isCached: false,
      // dataversion: dataVersion,
    });
  } catch (error) {
    console.error('Error fetching or logging metal prices:', error.message);

    try {
      const fallbackCacheData = await fetchFromCache(CACHE_KEY_METAL_FALLBACK);

      if (fallbackCacheData !== null) {
        console.log('Returning data from fallback cache');

        return res.status(200).json({
          data: fallbackCacheData,
          isFallback: true,
          isCached: true,
          dataversion: cachedDataVersion,
        });
      }
    } catch (fallbackError) {
      console.error('Fallback cache failed:', fallbackError.message);
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

//metal history
export async function metalHistController(req, res) {
  try {
    const metalPrices = await metalChartExtractor();

    if (metalPrices) {
      const { dates, prices } = metalPrices;

      await saveToDatabase(req.body.assetName, dates, prices);

      const responseData = {
        dates: dates,
        prices: prices[req.body.assetName],
      };

      return res.status(200).json(responseData);
    } else {
      console.log('Price extraction failed');
      return res.status(500).json({ success: false, message: 'Price extraction failed' });
    }
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function saveToDatabase(assetName, dates, prices) {
  const dataToSave = dates.map((date, index) => ({
    date: new Date(date),
    price: {
      fineGold: prices.fineGold[index],
      tejabiGold: prices.tejabiGold[index],
      silver: prices.silver[index],
    },
  }));

  await HistoricPrice.findOneAndUpdate(
    { symbol: assetName },
    { $push: { historicalData: { $each: dataToSave } } },
    { upsert: true, new: true, useFindAndModify: false }
  );

  const savedDocument = await HistoricPrice.findOne(
    { symbol: assetName },
    { _id: 0, historicalData: { $slice: -15 } }
  );

  if (savedDocument && savedDocument.historicalData) {
    const responseData = {
      dates: savedDocument.historicalData.map(entry => entry.date.toISOString().split('T')[0]),
      prices: savedDocument.historicalData.map(entry => entry.price),
    };

    return responseData;
  } else {
    return { dates: [] };
  }
}

//commodity
const CACHE_KEY_COMMODITY_PRICES = 'commodity_cached';
const CACHE_KEY_COMMODITY_FALLBACK = 'commo_cached_fallback';

export const CommodityData = async (req, res) => {
  try {

    const cachedData = await fetchFromCache(CACHE_KEY_COMMODITY_PRICES);

      if (cachedData !== null) {
        console.log('Returning cached commodity prices data');
        return res.status(200).json({
          data: cachedData,
          isFallback: false,
          isCached: true,
          dataversion: cachedDataVersion,
        });
      }
      const commodityTableData = await commodityprices();

      if (!commodityTableData) {
          return res.status(500).json({ error: 'Failed to fetch commodity data.' });
      }

      const commodityData = commodityTableData
          .filter((rowData) => rowData[0].trim() !== '')
          .map((rowData) => new Asset({
              symbol: rowData[0],
              name: rowData[0],
              category: "Vegetables",
              unit: rowData[1],
              ltp: parseFloat(rowData[4])
          }));

      //const oilData = await oilExtractor();

      // if (!oilData) {
      //     return res.status(500).json({ error: 'Failed to fetch oil data.' });
      // }

      // const oilAssetData = oilData.map((oilItem) => new Asset(oilItem));
      let oilData;
      try {
        oilData = await oilExtractor();
      } catch (oilError) {
        console.error('Failed to fetch oil data:', oilError.message);
        oilData = null;
      }

      let oilAssetData = [];
      if (oilData) {
        oilAssetData = oilData.map((oilItem) => new Asset(oilItem));
      }





      const mergedData = [...commodityData, ...oilAssetData];

      // Update cache
      await Promise.all([
          storage.setItem(CACHE_KEY_COMMODITY_PRICES, mergedData),
          storage.setItem(CACHE_KEY_COMMODITY_FALLBACK, mergedData)
      ]);

      await Promise.all(
        mergedData.map(async (item) => {
          try {
            const query = { name: item.name };
            const update = {
              $set: {
                ltp: item.ltp,
              },
            };

            const options = { upsert: true, new: true };
            await Commodity.findOneAndUpdate(query, update, options);
          } catch (error) {
            console.error('DB Update Error:', error);
          }
        })
      )

      return res.status(200).json({
          data: mergedData,
          isFallback: false,
          isCached: false,
          dataversion: { versionCode: dataVersion, timestamp: DateTime.now().toISO() },
      });
  } catch (error) {
      try {
          console.log(error);
          console.log('Using fallback key');
          const cachedData = await fetchFromCache(CACHE_KEY_COMMODITY_FALLBACK);
          if (cachedData !== null) {
              console.log('fallback data sent');
              return res.status(200).json({
                  data: cachedData,
                  isFallback: true,
                  isCached: true,
                  dataversion: cachedDataVersion,
              });
          } else {
              const dataFromMongoDB = await Commodity.find({});

              if (dataFromMongoDB) {
                  storage.setItem(CACHE_KEY_COMMODITY_FALLBACK, dataFromMongoDB);

                  return res.status(200).json({
                      data: dataFromMongoDB,
                      isFallback: true,
                      isCached: true,
                      dataversion: cachedDataVersion,
                  });
              }
          }
      } catch (fallbackError) {
          console.log('Fallback failed:', fallbackError);
          return res.status(500).json({ error: 'An error occurred while fetching data' });
      }
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
};

//top gainers //share sansar
const CACHE_KEY_TOP_GAINER = 'topGainersCached';
const CACHE_KEY_TOP_GAINER_FALLBACK = 'topGainers_fallback';

export const TopGainersData = async (req, res) => {
  console.log('Top gainers data requested');

  try {
    const cachedData = await fetchFromCache(CACHE_KEY_TOP_GAINER);

    if (cachedData !== null) {
      console.log('Returning cached top gainers data');
      return res.status(200).json({
        data: cachedData,
        isFallback: false,
        isCached: true,
        dataversion: cachedDataVersion,
      });
    }

    const topGainersData = await topgainersShare();

    if (!topGainersData) {
      return res.status(500).json({ error: 'Failed to fetch top gainers data.' });
    }

    await storage.setItem(CACHE_KEY_TOP_GAINER, topGainersData);
    await storage.setItem(CACHE_KEY_TOP_GAINER_FALLBACK, topGainersData);


    return res.status(200).json({
      data: topGainersData,
      isFallback: false,
      isCached: false,
      dataversion: cachedDataVersion,
    });
  } catch (error) {

    const cachedData = await fetchFromCache(CACHE_KEY_TOP_GAINER_FALLBACK);

    if (cachedData !== null) {
      console.log('Returning top gainers fallback data');
      return res.status(200).json({
        data: cachedData,
        isFallback: true,
        isCached: true,
        dataversion: cachedDataVersion,
      });
    }

    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

//toploosers
const CACHE_KEY_TOP_LOOSERS = 'topLoosersCached';
const CACHE_KEY_TOP_LOOSERS_FALLBACK = 'topLoosers_fallback';

export const TopLoosersData = async (req, res) => {
  console.log('Top loosers data requested');

  try {
    const cachedData = await fetchFromCache(CACHE_KEY_TOP_LOOSERS);

    if (cachedData !== null) {
      console.log('Returning cached top loosers data');
      return res.status(200).json({
        data: cachedData,
        isFallback: false,
        isCached: true,
        dataversion: cachedDataVersion,
      });
    }

    const topGainersData = await topLosersShare();

    if (!topGainersData) {
      return res.status(500).json({ error: 'Failed to fetch top loosers data.' });
    }

    await storage.setItem(CACHE_KEY_TOP_LOOSERS, topGainersData);
    await storage.setItem(CACHE_KEY_TOP_LOOSERS_FALLBACK, topGainersData);


    return res.status(200).json({
      data: topGainersData,
      isFallback: false,
      isCached: false,
      dataversion: cachedDataVersion,
    });
  } catch (error) {

    const cachedData = await fetchFromCache(CACHE_KEY_TOP_LOOSERS_FALLBACK);

    if (cachedData !== null) {
      console.log('Returning top loosers fallback data');
      return res.status(200).json({
        data: cachedData,
        isFallback: true,
        isCached: true,
        dataversion: cachedDataVersion,
      });
    }

    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

//top turnover
const CACHE_KEY_TOP_TURNOVERS = 'topturnoverCached';
const CACHE_KEY_TOP_TURNOVERS_FALLBACK = 'topturnover_fallback';

export const TopTurnoverData = async (req, res) => {
  console.log('Top turnover data requested');

  try {
    const cachedData = await fetchFromCache(CACHE_KEY_TOP_TURNOVERS);

    if (cachedData !== null) {
      console.log('Returning cached top turnover data');
      return res.status(200).json({
        data: cachedData,
        isFallback: false,
        isCached: true,
        dataversion: cachedDataVersion,
      });
    }

    const topGainersData = await topTurnoversShare();

    if (!topGainersData) {
      return res.status(500).json({ error: 'Failed to fetch top turnover data.' });
    }

    await storage.setItem(CACHE_KEY_TOP_TURNOVERS, topGainersData);
    await storage.setItem(CACHE_KEY_TOP_TURNOVERS_FALLBACK, topGainersData);


    return res.status(200).json({
      data: topGainersData,
      isFallback: false,
      isCached: false,
      dataversion: cachedDataVersion,
    });
  } catch (error) {

    const cachedData = await fetchFromCache(CACHE_KEY_TOP_TURNOVERS_FALLBACK);

    if (cachedData !== null) {
      console.log('Returning top turnover fallback data');
      return res.status(200).json({
        data: cachedData,
        isFallback: true,
        isCached: true,
        dataversion: cachedDataVersion,
      });
    }

    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

//top volume
const CACHE_KEY_TOP_VOLUMES = 'topvolumecached';
const CACHE_KEY_TOP_VOLUMES_FALLBACK = 'topvolume_fallback';

export const TopVolumeData = async (req, res) => {
  console.log('Top volume data requested');

  try {
    const cachedData = await fetchFromCache(CACHE_KEY_TOP_VOLUMES);

    if (cachedData !== null) {
      console.log('Returning cached top volume data');
      return res.status(200).json({
        data: cachedData,
        isFallback: false,
        isCached: true,
        dataversion: cachedDataVersion,
      });
    }

    const topGainersData = await topTradedShares();

    if (!topGainersData) {
      return res.status(500).json({ error: 'Failed to fetch top volume data.' });
    }

    await storage.setItem(CACHE_KEY_TOP_VOLUMES, topGainersData);
    await storage.setItem(CACHE_KEY_TOP_VOLUMES_FALLBACK, topGainersData);


    return res.status(200).json({
      data: topGainersData,
      isFallback: false,
      isCached: false,
      dataversion: cachedDataVersion,
    });
  } catch (error) {

    const cachedData = await fetchFromCache(CACHE_KEY_TOP_VOLUMES_FALLBACK);

    if (cachedData !== null) {
      console.log('Returning top volume fallback data');
      return res.status(200).json({
        data: cachedData,
        isFallback: true,
        isCached: true,
        dataversion: cachedDataVersion,
      });
    }

    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const CACHE_KEY_TOP_TRANS = 'toptranscached';
const CACHE_KEY_TOP_TRANS_FALLBACK = 'toptrans_fallback';

export const TopTransData = async (req, res) => {
  console.log('Top Transaction data requested');

  try {
    const cachedData = await fetchFromCache(CACHE_KEY_TOP_TRANS);

    if (cachedData !== null) {
      console.log('Returning cached top transaction data');
      return res.status(200).json({
        data: cachedData,
        isFallback: false,
        isCached: true,
        dataversion: cachedDataVersion,
      });
    }

    const topGainersData = await topTransactions();

    if (!topGainersData) {
      return res.status(500).json({ error: 'Failed to fetch top transaction data.' });
    }

    await storage.setItem(CACHE_KEY_TOP_TRANS, topGainersData);
    await storage.setItem(CACHE_KEY_TOP_TRANS_FALLBACK, topGainersData);


    return res.status(200).json({
      data: topGainersData,
      isFallback: false,
      isCached: false,
      dataversion: cachedDataVersion,
    });
  } catch (error) {

    const cachedData = await fetchFromCache(CACHE_KEY_TOP_VOLUMES_FALLBACK);

    if (cachedData !== null) {
      console.log('Returning top transaction fallback data');
      return res.status(200).json({
        data: cachedData,
        isFallback: true,
        isCached: true,
        dataversion: cachedDataVersion,
      });
    }

    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const DashBoardData = async (req, res) => {

  console.log('Dashboard data requested');
  try {
    const cachedData = await fetchFromCache('dashboardDataCached');

    if (cachedData !== null) {
      console.log('Returning cached dashboard data');
      return res.status(200).json({
        data: cachedData,
        isFallback: false,
        isCached: true,
        dataversion: cachedDataVersion,
      });
    }

    const topGainersData = await topgainersShare();
    const topLoosersData = await topLosersShare();
    const topTurnoverData = await topTurnoversShare();
    const topVolumeData = await topTradedShares();
    const topTransData = await topTransactions();

    const dashboardData = {
      topGainers: {
        data: topGainersData
      },
      topLoosers: {
        data: topLoosersData
      },
      topTurnover: {
        data: topTurnoverData
      },
      topVolume: {
        data: topVolumeData
      },
      topTrans: {
        data: topTransData
      },
    };

    await storage.setItem('dashboardDataCached', dashboardData);

    return res.status(200).json({
      data: dashboardData,
      isFallback: false,
      isCached: false,
      dataversion: cachedDataVersion,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};



export const IndexData = async (req, res) => {
  console.log("Index Data Requested");

  try {
    const cachedData = await fetchFromCache('indexDataCached');

    if (cachedData !== null) {
      console.log('Returning cached index data');
      return respondWithData(res,'SUCCESS','Data Fetched Successfully',cachedData);
    }
    const indexData = await extractIndex();

    //indexData has
    //turnover,index,percentage
    // re,ove turnover from here and always add this data at the first.
    //we have date missing here, instead add current date in following format 2024/01/31
    //we have pointChange missing too, calculate it from last day index value - today index value

    if (!indexData) {

      return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'Failed to fetch index data.');
    }

   await storage.setItem('indexDataCached', indexData);

    return respondWithData(res,'SUCCESS','Data Fetched Successfully',indexData);
  } catch (error) {
    console.error(error);
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'Internal Server Error');
  }
}

//merged index
export const CombinedIndexData = async (req, res) => {
  console.log("Combined Index Data Requested");
  try {

    const cachedData = await fetchFromCache('molti');

    if (cachedData !== null) {
      console.log('Returning cached combined index data');
      return respondWithData(res,'SUCCESS','Data Fetched Successfully',cachedData);
    }

    const indexData = await extractIndex();
    const indexDataByDate = await extractIndexDateWise();

    if (!indexData || !indexDataByDate) {
      return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'Failed to fetch index data.');
    }

    //if same index then skip second one
    //Check if date is same //this is done to avoid duplicate data after 3PM
    if (indexData.date === indexDataByDate[0].date) {
      await storage.setItem('molti', indexDataByDate);
      return respondWithData(res, 'SUCCESS', 'Data Fetched Successfully', indexDataByDate);
    }

    const pointChange = calculatePointChange(indexDataByDate,indexData);
    indexData.pointChange = pointChange.pointChange;

    const combinedData = [
      {
        date: indexData.date,
        index: indexData.index,
        percentageChange: indexData.percentageChange,
        pointChange: indexData.pointChange,
      },
      ...indexDataByDate.slice(0, 9),
    ];

    await storage.setItem('molti', combinedData);

    return respondWithData(res, 'SUCCESS', 'Data Fetched Successfully', combinedData);
  } catch (error) {
    console.error(error);
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'Internal Server Error');
  }
};

function calculatePointChange(indexDataByDate, indexData) {
  const olderIndexValue = indexDataByDate[0].index;
  const todayIndexValue = indexData.index;
  const pointChange = parseFloat((todayIndexValue - olderIndexValue).toFixed(2));

  return {
    pointChange
  };
}


export default {createAsset,CombinedIndexData, fetchMetalPrices,TopVolumeData,TopTransData,TopTurnoverData,topLosersShare, AssetMergedData, SingeAssetMergedData, AssetMergedDataBySector, CommodityData, TopGainersData, DashBoardData};
