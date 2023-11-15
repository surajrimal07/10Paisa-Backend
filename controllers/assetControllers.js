import Asset from '../models/assetModel.js';
import metalPriceExtractor from '../server/metalServer.js'

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

export const updateAssetData = async (req, res) => {
    const symbol = req.body.symbol;

    

}




export const getAssetData = async (req, res) => {
    const symbol = req.body.symbol;

    console.log("Data requested for: "+symbol);
    try {
      const asset = await Asset.findOne({ symbol });

      if (!asset) {
        console.log("Asset Not found");
        return res.status(401).json({ error: 'Asset Not found' });
      } else {
        console.log("Asset found");
      }
      res.json(asset);
    } catch (error) {
      console.log("500 An error occurred ");
      return res.status(500).json({ error: 'An error occurred' });
    }
};



//const test = await metalPriceExtractor("goldhallmark")
