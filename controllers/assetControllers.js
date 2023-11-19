import Asset from '../models/assetModel.js';
import { fetchSecurityData, fetchSingleSecurityData } from '../server/nepseServer.js';

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

// best one but dosen't update ltp of metals
// const metalNames = ["Gold hallmark", "Gold tejabi", "Silver"];

// export const getAssetData = async (req, res) => {
//     const symbol = req.body.symbol.toUpperCase();;

//     console.log("Data requested for: " + symbol);

    // try {
    //     if (symbol === 'allwithdata') {
    //         try {
    //             const assets = await Asset.find();
    //             const symbols = assets.map(asset => asset.symbol);
    //             const dynamicInfo = await fetchSecurityData(58, symbols);

    //             const assetData = await Promise.all(assets.map(async (asset) => {
    //                 try {
    //                     const assetSymbol = asset.symbol;
    //                     const dynamicInfoForAsset = dynamicInfo.find(info => info.symbol === assetSymbol);

    //                     // Update fields for non-metal assets only
    //                     if (!shouldCallMetalExtractor(asset.name)) {
    //                         await Asset.updateOne(
    //                             { _id: asset._id },
    //                             {
    //                                 $set: {
    //                                     ltp: dynamicInfoForAsset?.ltp || "",
    //                                     totaltradedquantity: dynamicInfoForAsset?.totaltradedquantity || "",
    //                                     percentchange: dynamicInfoForAsset?.percentchange || "",
    //                                     previousclose: dynamicInfoForAsset?.previousclose || "",
    //                                 },
    //                             },
    //                             { upsert: false }
    //                         );
    //                     }

    //                     if (shouldCallMetalExtractor(asset.name)) {
    //                         const metalData = await metalPriceExtractor(asset.name);

    //                         return {
    //                             ...asset.toObject(),
    //                             ...dynamicInfoForAsset,
    //                             ...metalData,
    //                         };
    //                     } else {
    //                         return {
    //                             ...asset.toObject(),
    //                             ...dynamicInfoForAsset,
    //                         };
    //                     }
    //                 } catch (error) {
    //                     console.error('Error processing asset:', error.message);
    //                 }
    //             }));

    //             const filteredAssetData = assetData.filter(asset => asset.ltp !== null); //remove delisted companies
    //             return res.json(filteredAssetData);
    //             //return res.json(assetData.filter(Boolean)); // Remove potential undefined values
    //         } catch (error) {
    //             console.error('Error fetching symbols:', error.message);
    //             return res.status(500).json({ error: 'An error occurred while fetching symbols' });
    //         }
    //     }

//         if (symbol === 'ALL') {
//             const symbols = await Asset.find().distinct('symbol');
//             return res.json(symbols);
//         }


//         //single asset for asset view
//         //bug dosen't show golds
//         const asset = await Asset.findOne({ symbol : symbol});

//         if (!asset) {
//             console.log("Asset Not found");
//             return res.status(401).json({ error: 'Asset Not found' });
//         } else {
//             console.log("Asset found");
//             console.log(asset.name);

//             try {

//                 if (symbol == metalNames) {
//                     const dynamicInfo = shouldCallMetalExtractor(asset.name) ? await metalPriceExtractor(asset.name) : await fetchSecurityData(58);

//                     const mergedData = {
//                         ...asset.toObject(),
//                         ...dynamicInfo,
//                     };
//                     const updatedAsset = await updateAssetData(asset.symbol, dynamicInfo);

//                     if (updatedAsset) {
//                         res.status(200).json(asset);
//                     } else {
//                         res.status(500).json({ error: 'Failed to update asset data' });
//                     }

//                 } else {
//                     const updatedAsset = await updateAssetData(asset.symbol, dynamicInfo);

//                 }
//                 const dynamicInfo = shouldCallMetalExtractor(asset.name) ? await metalPriceExtractor(asset.name) : await fetchSecurityData(58);

//                 const mergedData = {
//                     ...asset.toObject(),
//                     ...dynamicInfo,
//                 };
//                 const updatedAsset = await updateAssetData(asset.symbol, dynamicInfo);

//                 if (updatedAsset) {
//                     res.status(200).json(asset);
//                 } else {
//                     res.status(500).json({ error: 'Failed to update asset data' });
//                 }
//             } catch (error) {
//                 console.error('Error processing asset:', error.message);
//                 res.status(500).json({ error: 'An error occurred while processing the asset' });
//             }
//         }
//     } catch (error) {
//         console.error('Unexpected error:', error.message);
//         return res.status(500).json({ error: 'An unexpected error occurred' });
//     }
// };

// function shouldCallMetalExtractor(assetName) {
//     return metalNames.includes(assetName);
// }

const metalNames = ["Gold hallmark", "Gold tejabi", "Silver"];

//names only
export const getAllAssetNames = async (req, res) => {
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
    const symbol = req.body.symbol;

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


export default { getAllAssetNames,createAsset,getSingleAssetDetails, getMultiAssetDetails };
