// import Asset from '../models/assetModel.js';
// import Commodity from '../models/commodityModel.js';
// import { commodityprices } from '../server/commodityServer.js';
// import { oilExtractor } from '../server/oilServer.js';

// export const CommodityData = async (req, res) => {
//     try {
//         const commodityTableData = await commodityprices();

//         if (!commodityTableData) {
//             return res.status(500).json({ error: 'Failed to fetch commodity data.' });
//         }

//         const commodityData = commodityTableData
//             .filter((rowData) => rowData[0].trim() !== '')
//             .map((rowData) => new Asset({
//                 name: rowData[0],
//                 category: "Vegetables",
//                 unit: rowData[1],
//                 ltp: parseFloat(rowData[4])
//             }));

//         const oilData = await oilExtractor();

//         if (!oilData) {
//             return res.status(500).json({ error: 'Failed to fetch oil data.' });
//         }

//         const oilAssetData = oilData.map((oilItem) => new Asset(oilItem));

//         const mergedData = [...commodityData, ...oilAssetData];

//         await Commodity.deleteMany({});
//         await Commodity.insertMany(mergedData, { ordered: true });

//         res.status(200).json(mergedData);
//     } catch (error) {
//         console.error('Error:', error.message || error);
//         res.status(500).json({ error: 'Internal server error.' });
//     }
// };


// export default CommodityData;