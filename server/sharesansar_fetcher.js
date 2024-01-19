import axios from 'axios';
import { JSDOM } from 'jsdom';
import { headers } from '../utils/headers.js';

async function fetchAndCategorizeStockData() {
    const hardcodedUrl = 'https://www.sharesansar.com/today-share-price';

    try {
        const response = await axios.get(hardcodedUrl, { headers });

        if (!response.data) {
            throw new Error(`Failed to fetch data. Status: ${response.status}`);
        }

        const dom = new JSDOM(response.data);
        const document = dom.window.document;

        const scriptElements = document.querySelectorAll('script');
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

        const stockDataWithoutName = [];

        const rows = document.querySelectorAll('#headFixed tbody tr');

        rows.forEach((row) => {
            const columns = row.querySelectorAll('td');

            const stockInfo = {
                symbol: columns[1].querySelector('a').textContent.trim(),
                open: parseInt(columns[3].textContent.trim()),
                high: parseInt(columns[4].textContent.trim()),
                low: parseInt(columns[5].textContent.trim()),
                ltp: parseInt(columns[6].textContent.trim()),
                vwap: parseInt(columns[7].textContent.trim()),
                volume: parseInt(columns[8].textContent.trim()),
                previousclose: parseInt(columns[9].textContent.trim()),
                Turnover: parseInt(columns[10].textContent.trim()),
                percentchange: parseInt(columns[14].textContent.trim()),
                day120: parseInt(columns[17].textContent.trim()),
                day180: parseInt(columns[18].textContent.trim()),
                week52high: parseInt(columns[19].textContent.trim()),
                week52low: parseInt(columns[20].textContent.trim()),
                name: symbolToNameMap[columns[1].querySelector('a').textContent.trim()] || '',
            };

            // Categorize by sector based on name
            if (stockInfo.name.toLowerCase().includes('bank')) {
                stockInfo.sector = 'bank';
            } else if (stockInfo.name.toLowerCase().includes('finance')) {
                stockInfo.sector = 'finance';
            } else if (stockInfo.name.toLowerCase().includes('hydro')) {
                stockInfo.sector = 'hydropower';
            } else if (stockInfo.name.toLowerCase().includes('bikas') || stockInfo.name.toLowerCase().includes('development')){ //|| stockInfo.name.toLowerCase().includes('development')) {
                stockInfo.sector = 'Development Banks';
            } else if (stockInfo.name.toLowerCase().includes('microfinance') || stockInfo.name.toLowerCase().includes('laghubitta')) {
                stockInfo.sector = 'microfinance';
            } else if (stockInfo.name.toLowerCase().includes('life insurance')) {
                stockInfo.sector = 'Life Insurance';
            } else if (stockInfo.name.toLowerCase().includes('Insurance')) {
                stockInfo.sector = 'Insurance';
            } else if (stockInfo.name.toLowerCase().includes('investment')) {
                stockInfo.sector = 'investment';
            } else {
                stockInfo.sector = 'unknown';
            }

            stockDataWithoutName.push(stockInfo);
        });

        return stockDataWithoutName;

    } catch (error) {
        console.error(error);
        throw error;
    }
}

fetchAndCategorizeStockData().then(data => console.log(data)).catch(error => console.error(error));
