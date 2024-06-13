import axios from 'axios';
import * as cheerio from 'cheerio';
import { fetchFromCache, saveToCache } from '../controllers/savefetchCache.js';


const axiosInstance = axios.create();

const WORLD_MARKET_CACHE_KEY = 'worldmarket';
const URL = 'https://en.stockq.org/';
const CRYPTO_URL = 'https://en.stockq.org/market/cryptocurrency.php';

export async function extractWorldMarketData() {

    try {
        const cachedData = await fetchFromCache(WORLD_MARKET_CACHE_KEY);
        if (cachedData) {
            return cachedData;
        }
        const [response, responseCrypto] = await Promise.all([
            axiosInstance.get(URL),
            axiosInstance.get(CRYPTO_URL)
        ]);

        const $ = cheerio.load(response.data);
        const $crypto = cheerio.load(responseCrypto.data);

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

                    if (title.includes('Currency Exchange Rates')) {
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

        $crypto('tr.row1, tr.row2').each((index, element) => {
            const crypto = {};
            crypto.symbol = $crypto(element).find('td:nth-child(4)').text().trim();
            crypto.currency = $crypto(element).find('td:nth-child(3)').text().trim();
            crypto.rate = $crypto(element).find('td:nth-child(5)').text().trim();
            crypto.change = $crypto(element).find('td:nth-child(6)').text().trim();
            crypto.marketCap = $crypto(element).find('td:nth-child(8)').attr('title');
            crypto.volume24h = $crypto(element).find('td:nth-child(9)').attr('title');

            marketData.cryptocurrency.push(crypto);
        });

        await saveToCache(WORLD_MARKET_CACHE_KEY, marketData);

        return marketData;
    } catch (error) {
        console.error('Error extracting market data:', error);
        return null;
    }
}
