import axios from 'axios';
import cheerio from 'cheerio';
import { fetchFromCache, saveToCache } from '../controllers/savefetchCache.js';


export async function extractWorldMarketData() {
    const url = 'https://en.stockq.org/';
    try {

        const cachedData = await fetchFromCache('worldmarket');
        if (cachedData) {
            return cachedData;
        }

        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const marketData = {
            cryptocurrency: [],
            currencyExchangeRates: [],
            asianMarketIndices: [],
            europeanMarketIndices: [],
            americanMarketIndices: []
        };

        $('table.marketdatatable').each((index, table) => {
            const title = $(table).find('tr').eq(0).text().trim();

            $(table).find('tr').each((rowIndex, row) => {
                if (rowIndex !== 0) {
                    const tds = $(row).find('td');
                    const rowData = {};

                    if (title.includes('Cryptocurrency')) {
                        rowData.symbol = $(tds[1]).text().trim();
                        rowData.currency = $(tds[0]).text().trim();
                        rowData.rate = parseFloat($(tds[2]).text().trim());
                        rowData.change = parseFloat($(tds[3]).text().trim());

                        marketData.cryptocurrency.push(rowData);
                    } else if (title.includes('Currency Exchange Rates')) {
                        rowData.currency = $(tds[0]).text().trim();
                        rowData.rate = parseFloat($(tds[1]).text().trim());
                        rowData.change = parseFloat($(tds[2]).text().trim());
                        rowData.changepercentage = parseFloat($(tds[3]).text().trim().replace('%'));

                        marketData.currencyExchangeRates.push(rowData);
                    } else if (title.includes('Asian Market Indices')) {
                        rowData.index = $(tds[0]).text().trim();
                        rowData.quote = parseFloat($(tds[1]).text().trim());
                        rowData.change = parseFloat($(tds[2]).text().trim());
                        rowData.changepercentage = parseFloat($(tds[3]).text().trim().replace('%'));
                        marketData.asianMarketIndices.push(rowData);
                    } else if (title.includes('European Market Indices')) {
                        rowData.index = $(tds[0]).text().trim();
                        rowData.quote = parseFloat($(tds[1]).text().trim());
                        rowData.change = parseFloat($(tds[2]).text().trim());
                        rowData.changepercentage = parseFloat($(tds[4]).text().trim());
                        rowData.changepercentage = parseFloat($(tds[3]).text().trim().replace('%'));
                        marketData.europeanMarketIndices.push(rowData);
                    } else if (title.includes('American Market Indices')) {
                        rowData.index = $(tds[0]).text().trim();
                        rowData.quote = parseFloat($(tds[1]).text().trim());
                        rowData.change = parseFloat($(tds[2]).text().trim());
                        rowData.changepercentage = parseFloat($(tds[3]).text().trim().replace('%'));
                        marketData.americanMarketIndices.push(rowData);
                    }
                }
            });

            if (marketData.cryptocurrency.length > 0 && marketData.cryptocurrency[0].symbol === 'Symbol') {
                marketData.cryptocurrency.shift();
            }
            if (marketData.currencyExchangeRates.length > 0 && marketData.currencyExchangeRates[0].currency === 'Currency') {
                marketData.currencyExchangeRates.shift();
            }
            if (marketData.asianMarketIndices.length > 0 && marketData.asianMarketIndices[0].index === 'Index') {
                marketData.asianMarketIndices.shift();
            }
            if (marketData.europeanMarketIndices.length > 0 && marketData.europeanMarketIndices[0].index === 'Index') {
                marketData.europeanMarketIndices.shift();
            }
            if (marketData.americanMarketIndices.length > 0 && marketData.americanMarketIndices[0].index === 'Index') {
                marketData.americanMarketIndices.shift();
            }
        });

        await saveToCache('worldmarket', marketData);

        return marketData;
    } catch (error) {
        console.error('Error extracting market data:', error);
        return null;
    }
}

// extractMarketDataFromURL()
//     .then(data => console.log(data))
//     .catch(error => console.error(error));
