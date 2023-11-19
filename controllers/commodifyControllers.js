import Commodity from '../models/commodityModel.js';
import { commodityprices } from '../server/commodityServer.js';

export const CommodityData = async (req, res) => {
    try {
        const tableData = await commodityprices();

        if (tableData) {
            const commodityData = tableData.map((rowData) => ({
                name: rowData[0],
                category: "Vegetables",
                unit: rowData[1],
                ltp: parseFloat(rowData[4])
            }));

            await Commodity.deleteMany({}); // Clear existing data before saving new data
            await Commodity.insertMany(commodityData, { ordered: false });

            res.status(200).json(commodityData);
        } else {
            res.status(500).json({ error: 'Failed to fetch commodity data.' });
        }
    } catch (error) {
        console.error('Error:', error.message || error);
        res.status(500).json({ error: 'Internal server error.' });
    }

    try {

        const oilData = await oilExtractor();

        if (oilData) {

            console.log('Oil Data:', oilData);
        } else {
            console.log('Error extracting oil data.');
        }
    } catch (oilError) {
        console.error('Error extracting oil data:', oilError.message || oilError);
    }
};

// import { commodityprices } from '../server/commodityServer.js'; // Assuming this is the correct path

// export const CommodityData = async (req, res) => {
//     try {
//         const tableData = await commodityprices();

//         const commodityData = tableData.map((rowData) => ({
//                 name: rowData[0],
//                 category: "Vegetables",
//                 unit: rowData[1],
//                 ltp: parseFloat(rowData[4])
//         }));

//         // console.log(commodityData);
//         // // Fetch data from oilExtractor function

//         // const oilData = await oilExtractor();
//         // const oilDataArray = Object.values(oilData);
//         // const oildataa = oilDataArray.map((rowData) => ({
//         //     name: rowData[0],
//         //     category: "Oil and gas",
//         //     percentchange: parseFloat(rowData[2]),
//         //     //ltp: parseFloat(rowData[4]),
//         // }));

//         // // Merge the data
//         // const mergedData = {
//         //     commodity: commodityData,
//         //     oil: oildataa,
//         // };


//         await commodity.insertMany(commodityData);

//         res.status(200).json(mergedData);
//     } catch (error) {
//         console.error('Error:', error.message || error);
//         res.status(500).json({
//             error: error.message || error,
//         });
//     }
// };

export default CommodityData;