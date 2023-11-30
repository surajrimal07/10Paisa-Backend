import axios from 'axios';
import cheerio from 'cheerio';

export async function commodityprices() {
    const url = 'https://ramropatro.com/vegetable';

    try {
        const response = await axios.get(url);
        const html = response.data;

        const $ = cheerio.load(html);
        const table = $('#commodityDailyPrice');

        if (!table.length) {
            console.error('Table not found in the HTML content.');
            return null;
        }

        const tableData = [];

        table.find('tbody tr').each((i, row) => {
            const rowData = {};

            $(row)
                .find('td')
                .each((j, cell) => {
                    const cellText = $(cell).text().trim();
                    rowData[j] = cellText;
                });

            tableData.push(rowData);
        });

        //console.log('Processed Data:', tableData);
        return tableData;
    } catch (error) {
        console.error('Error:', error.message || error);
        throw error;
    }
}

// export async function singlecommodityprices() {
//     const symbol = req.body.symbol;

//     try {

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

//             return res.status(200).json(updatedAsset);
//         } catch (error) {
//             console.error('Error processing asset:', error.message);
//             return res.status(500).json({ error: 'An error occurred while processing the asset.' });
//         }
//     } catch (error) {
//         console.error('Error:', error.message);
//         return res.status(500).json({ error: 'An error occurred.' });
//     }
// }

export default { commodityprices };