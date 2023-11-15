import Asset from '../models/assetModel.js';
import metalPriceExtractor from '../server/metalServer.js';


export const createAsset = async (req, res) => {
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


export const getAssetData = async (req, res) => {
    const symbol = req.body.symbol;

    console.log("Data requested for: "+symbol);
    try {

        if (symbol === 'allwithdata') {
            const assets = await Asset.find();
            const assetData = [];

            for (const asset of assets) {
                const dynamicInfo = await metalPriceExtractor(asset.name);
                const mergedData = {
                    ...asset.toObject(),
                    ...dynamicInfo,
                };
                assetData.push(mergedData);
            }

            return res.json(assetData);
        }
        //new exp

        if (symbol === 'all') {
            const symbols = await Asset.find().distinct('symbol');
            return res.json(symbols);
        }

      const asset = await Asset.findOne({ symbol });

      if (!asset) {
        console.log("Asset Not found");
        return res.status(401).json({ error: 'Asset Not found' });
      } else {
        console.log("Asset found");
        console.log(asset.name);

        const dynamicInfo = await metalPriceExtractor(asset.name);  //do it by solbol later

        console.log(dynamicInfo);

        const mergedData = {
            ...asset.toObject(),
            ...dynamicInfo,
        };
        const updatedAsset = await updateAssetData(asset.symbol, dynamicInfo);

        if (updatedAsset) {
            res.json(mergedData);
        } else {
            res.status(500).json({ error: 'Failed to update asset data' });
        }
      }
    } catch (error) {
      console.log("500 An error occurred ");
      return res.status(600).json({ error: 'An error occurred' });
    }
};




//const test = await metalPriceExtractor("goldhallmark")
