import axios from 'axios';
import fs from 'fs/promises';
import { JSDOM } from 'jsdom';

async function fetchAndExtractStockData() {
    const liveTradingUrl = 'https://www.sharesansar.com/live-trading';
    const todaySharePriceUrl = 'https://www.sharesansar.com/today-share-price';

    try {
        const responseLiveTrading = await axios.get(liveTradingUrl);

        if (!responseLiveTrading.data) {
            throw new Error(`Failed to fetch live trading data. Status: ${responseLiveTrading.status}`);
        }

        const domLiveTrading = new JSDOM(responseLiveTrading.data);
        const documentLiveTrading = domLiveTrading.window.document;

        const stockDataWithoutName = [];

        const rowsLiveTrading = documentLiveTrading.querySelectorAll('#headFixed tbody tr');

        rowsLiveTrading.forEach((row) => {
            const columns = row.querySelectorAll('td');

            const stockInfo = {
                SNO: parseInt(columns[0].textContent.trim()),
                Symbol: columns[1].querySelector('a').textContent.trim(),
                LTP: parseFloat(columns[2].textContent.trim()),
                PointChange: parseFloat(columns[3].textContent.trim()),
                Change: parseFloat(columns[4].textContent.trim()),
                Open: parseFloat(columns[5].textContent.trim()),
                High: parseFloat(columns[6].textContent.trim()),
                Low: parseFloat(columns[7].textContent.trim()),
                Volume: parseFloat(columns[8].textContent.trim()),
                PClose: parseFloat(columns[9].textContent.trim()),
            };

            stockDataWithoutName.push(stockInfo);
        });

        // Fetch symbol-to-name mapping
        const responseTodaySharePrice = await axios.get(todaySharePriceUrl);

        if (!responseTodaySharePrice.data) {
            throw new Error(`Failed to fetch today's share price data. Status: ${responseTodaySharePrice.status}`);
        }

        const domTodaySharePrice = new JSDOM(responseTodaySharePrice.data);
        const documentTodaySharePrice = domTodaySharePrice.window.document;

        const scriptElements = documentTodaySharePrice.querySelectorAll('script');
        let cmpjsonArray = [];

        scriptElements.forEach((scriptElement) => {
            if (scriptElement.textContent.includes('var cmpjson')) {
                const scriptContent = scriptElement.textContent;
                const jsonMatch = scriptContent.match(/var cmpjson = (\[.*\]);/);

                if (jsonMatch && jsonMatch[1]) {
                    const jsonContent = jsonMatch[1];
                    cmpjsonArray = JSON.parse(jsonContent);
                }
            }
        });

        const symbolToNameMap = cmpjsonArray.reduce((map, item) => {
            map[item.symbol] = item.companyname;
            return map;
        }, {});

        const stockDataWithName = stockDataWithoutName.map((stockInfo) => ({
            ...stockInfo,
            Name: symbolToNameMap[stockInfo.Symbol] || '',
            AssetType: '',
        }));

        stockDataWithName.forEach((stock) => {
            if (stock.Name.toLowerCase().includes('debenture')) {
                stock.AssetType = 'Debenture';
            } else if (stock.LTP < 20) {
                stock.AssetType = 'Mutual Fund';
            } else {
                stock.AssetType = 'Stock';
            }
        });

        return stockDataWithName;

    } catch (error) {
        console.error(error);
        throw error;
    }
}

//fetchAndExtractStockData().then(data => console.log(data)).catch(error => console.error(error));


async function categorizeDebentures(stockData) {
    try {

        //const stockData = await fetchAndExtractStockData();
        const debentureStocks = stockData.filter(stock => stock.Name.toLowerCase().includes('debenture'));

        console.log('Debenture Stocks:', debentureStocks);

        return debentureStocks;
    } catch (error) {
        console.error(error);
        throw error;
    }
}


fetchAndExtractStockData().then(stockData => categorizeDebentures(stockData)).catch(error => console.error(error));


// async function categorizeMutualFunds(stockData) {
//     try {
//         const mutualFundStocks = stockData.filter(stock =>stock.LTP < 20);

//         console.log('Mutual Fund Stocks:', mutualFundStocks);

//         return mutualFundStocks;
//     } catch (error) {
//         console.error(error);
//         throw error;
//     }
// }

//fetchAndExtractStockData().then(stockData => categorizeMutualFunds(stockData)).catch(error => console.error(error));


// async function saveDataToJson(data, fileName) {
//     try {
//         const jsonData = JSON.stringify(data, null, 2);

//         await fs.writeFile(fileName, jsonData);

//         console.log(`Data saved to ${fileName}`);
//     } catch (error) {
//         console.error('Error saving data to JSON:', error);
//     }
// }


// fetchAndExtractStockData()
//     .then(data => {
//         saveDataToJson(data, 'stockData.json');
//         console.log(data);

//         categorizeDebentures(data);

//         categorizeMutualFunds(data);
//     })
//     .catch(error => console.error(error));


// fetchAndExtractStockData()