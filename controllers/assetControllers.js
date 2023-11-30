import Asset from '../models/assetModel.js';
import HistoricPrice from '../models/historicModel.js';
import { fetchSecurityData, fetchSingleSecurityData, fetchTopGainers, fetchturnvolume, fetchvolume } from '../server/assetServer.js';
import { metalChartExtractor, metalPriceExtractor } from '../server/metalServer.js';

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
        console.log(assetData);
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

const metalNames = ["Gold hallmark", "Gold tejabi", "Silver"];

//names only
export const getAllAssetNames = async (req, res) => {
    console.log("Asset Names Only Requested");
    try {
        const symbols = await Asset.find({ ltp: { $exists: true, $nin: [null, 0] } }).distinct('symbol');
        return res.json(symbols);
    } catch (error) {
        console.error('Error:', error.message);
        return res.status(500).json({ error: 'An error occurred.' });
    }
}


//response single asset details
export const getSingleAssetDetails = async (req, res) => {
    console.log("Single Asset Data Requested");
    const symbol = req.body.symbol;

    try {

        const dynamicInfo = await fetchSingleSecurityData(symbol);

        const asset = await Asset.findOne({ symbol });

        if (!asset) {
            console.error(`Asset with symbol ${symbol} not found.`);
            return res.status(404).json({ error: `Asset with symbol ${symbol} not found.` });
        }
        try {
            const dynamicInfoForAsset = dynamicInfo.find(info => info.symbol === symbol);

            await Asset.updateOne(
                { _id: asset._id },
                {
                    $set: {
                        ltp: dynamicInfoForAsset?.ltp || "",
                        totaltradedquantity: dynamicInfoForAsset?.totaltradedquantity || "",
                        percentchange: dynamicInfoForAsset?.percentchange || "",
                        previousclose: dynamicInfoForAsset?.previousclose || "",
                    },
                },
                { upsert: false }
            );

            const updatedAsset = {
                ...asset.toObject(),
                ...dynamicInfoForAsset,
            };

            return res.status(200).json(updatedAsset);
        } catch (error) {
            console.error('Error processing asset:', error.message);
            return res.status(500).json({ error: 'An error occurred while processing the asset.' });
        }
    } catch (error) {
        console.error('Error:', error.message);
        return res.status(500).json({ error: 'An error occurred.' });
    }
}

//response all with data
export const getMultiAssetDetails = async (req, res) => {
    //const symbol = req.body.symbol;
    console.log("All Asset Data Requested");

    try {
        const assets = await Asset.find();
        const symbols = assets.map(asset => asset.symbol);
        const dynamicInfo = await fetchSecurityData(58, symbols);

        const assetData = await Promise.all(assets.map(async (asset) => {
            try {
                const assetSymbol = asset.symbol;
                const dynamicInfoForAsset = dynamicInfo.find(info => info.symbol === assetSymbol);

                await Asset.updateOne(
                    { _id: asset._id },
                    {
                        $set: {
                            ltp: dynamicInfoForAsset?.ltp || "",
                            totaltradedquantity: dynamicInfoForAsset?.totaltradedquantity || "",
                            percentchange: dynamicInfoForAsset?.percentchange || "",
                            previousclose: dynamicInfoForAsset?.previousclose || "",
                        },
                    },
                    { upsert: false }
                );

                return {
                    ...asset.toObject(),
                    ...dynamicInfoForAsset,
                };
            } catch (error) {
                console.error('Error processing asset:', error.message);
            }
        }));

        const filteredAssetData = assetData.filter(asset => asset.ltp !== null);
        return res.json(filteredAssetData);
    } catch (error) {
        console.error('Error fetching symbols:', error.message);
        return res.status(500).json({ error: 'An error occurred while fetching symbols' });
    }
}

//top gainers
export const getTopGainers = async (req, res) => {
    console.log("Trending Data Requested");
    try {
        const dynamicInfo = await fetchTopGainers();

        return res.json(dynamicInfo);
    } catch (error) {
        console.error('Error fetching data:', error.message);
        return res.status(500).json({ error: 'Error fetching data' });
    }
};

//top turnover
export const getTopTurnover = async (req, res) => {
  console.log("Turnover Data Requested");
  try {
      const dynamicInfo = await fetchturnvolume();

      return res.json(dynamicInfo);
  } catch (error) {
      console.error('Error fetching data:', error.message);
      return res.status(500).json({ error: 'Error fetching data' });
  }
};

//top volume
export const getTopVolume = async (req, res) => {
  console.log("Top Volume Data Requested");
  try {
      const dynamicInfo = await fetchvolume();

      return res.json(dynamicInfo);
  } catch (error) {
      console.error('Error fetching data:', error.message);
      return res.status(500).json({ error: 'Error fetching data' });
  }
};


//get metal

const assetToCategoryMap = {
    'Gold hallmark': 'Fine Gold',
    'Gold tejabi': 'Tejabi Gold',
    'Silver': 'Silver',
  };

export const fetchMetalPrices = async (req, res) => {
    try {
      const assets = Object.keys(assetToCategoryMap);
      const metalPrices = [];

      for (const asset of assets) {
        const metalData = await metalPriceExtractor(asset);

        if (metalData) {
          metalPrices.push(metalData);
        } else {
          console.log(`Price for ${asset} not found`);
        }
      }

      res.json({ metalPrices });  // Send the formatted metal prices as JSON response
    } catch (error) {
      console.error('Error fetching or logging metal prices:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });  // Send an error response
    }
  }

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





export default { getAllAssetNames,createAsset,getSingleAssetDetails, getMultiAssetDetails, metalHistController, fetchMetalPrices};
