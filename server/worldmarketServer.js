// import axios from 'axios';
// import cheerio from 'cheerio';

// export async function extractCryptoDataFromURL() {
//     const url = 'https://en.stockq.org/';
//     try {
//         const response = await axios.get(url);
//         const $ = cheerio.load(response.data);

//         const cryptoData = [];


//         $('table.marketdatatable').each((index, table) => {
//             if ($(table).find('tr').eq(0).text().includes('Cryptocurrency')) {
//                 $(table).find('tr').each((rowIndex, row) => {
//                     if (rowIndex !== 0) {
//                         const tds = $(row).find('td');
//                         const symbol = $(tds[1]).text().trim();
//                         const currency = $(tds[0]).text().trim();
//                         const rate = parseFloat($(tds[2]).text().trim());
//                         const change = parseFloat($(tds[3]).text().trim());

//                         cryptoData.push({ symbol, currency, rate, change });
//                     }
//                 });
//             }
//         });
//         if (cryptoData.length > 0 && cryptoData[0].symbol === 'Symbol') {
//             cryptoData.shift();
//         }

//         return cryptoData;
//     } catch (error) {
//         console.error('Error extracting crypto data:', error);
//         return null;
//     }
// }

// export async function extractForexCurrencyDataFromURL() {
//     const url = 'https://en.stockq.org/';
//     try {
//         const response = await axios.get(url);
//         const $ = cheerio.load(response.data);

//         const forexData = [];

//         $('table.marketdatatable').each((index, table) => {
//             if ($(table).find('tr').eq(0).text().includes('Currency Exchange Rates')) {
//                 $(table).find('tr').each((rowIndex, row) => {
//                     if (rowIndex !== 0) {
//                         const tds = $(row).find('td');
//                         const currency = $(tds[0]).text().trim();
//                         const rate = parseFloat($(tds[1]).text().trim());
//                         const change = parseFloat($(tds[2]).text().trim());

//                         forexData.push({ currency, rate, change });
//                     }
//                 });
//             }
//         });

//         if (forexData.length > 0 && forexData[0].currency === 'Currency') {
//             forexData.shift();
//         }

//         return forexData;
//     } catch (error) {
//         console.error('Error extracting forex data:', error);
//         return null;
//     }
// }


// export async function extractAsianMarketIndicesDataFromURL() {
//     const url = 'https://en.stockq.org/';
//     try {
//         const response = await axios.get(url);
//         const $ = cheerio.load(response.data);

//         const asianindicesData = [];

//         $('table.marketdatatable').each((index, table) => {
//             if ($(table).find('tr').eq(0).text().includes('Asian Market Indices')) {
//                 $(table).find('tr').each((rowIndex, row) => {
//                     if (rowIndex !== 0) {
//                         const tds = $(row).find('td');
//                         const index = $(tds[0]).text().trim();
//                         const quote = parseFloat($(tds[1]).text().trim());
//                         const change = parseFloat($(tds[2]).text().trim());

//                         asianindicesData.push({ index, quote, change });
//                     }
//                 });
//             }
//         });

//         if (asianindicesData.length > 0 && asianindicesData[0].index === 'Index') {
//             asianindicesData.shift();
//         }

//         return asianindicesData;
//     } catch (error) {
//         console.error('Error extracting Asian market indices data:', error);
//         return null;
//     }
// }

// export async function extractEuropeanMarketIndicesDataFromURL() {
//     const url = 'https://en.stockq.org/';
//     try {
//         const response = await axios.get(url);
//         const $ = cheerio.load(response.data);

//         const europeindicesData = [];

//         $('table.marketdatatable').each((index, table) => {
//             if ($(table).find('tr').eq(0).text().includes('European Market Indices')) {
//                 $(table).find('tr').each((rowIndex, row) => {
//                     if (rowIndex !== 0) {
//                         const tds = $(row).find('td');
//                         const index = $(tds[0]).text().trim();
//                         const quote = parseFloat($(tds[1]).text().trim());
//                         const change = parseFloat($(tds[2]).text().trim());

//                         europeindicesData.push({ index, quote, change });
//                     }
//                 });
//             }
//         });

//         if (europeindicesData.length > 0 && europeindicesData[0].index === 'Index') {
//             europeindicesData.shift();
//         }

//         return europeindicesData;
//     } catch (error) {
//         console.error('Error extracting European market indices data:', error);
//         return null;
//     }
// }


// export async function extractAmericanMarketIndicesDataFromURL() {
//     const url = 'https://en.stockq.org/';
//     try {
//         const response = await axios.get(url);
//         const $ = cheerio.load(response.data);

//         const americanindicesData = [];

//         $('table.marketdatatable').each((index, table) => {
//             if ($(table).find('tr').eq(0).text().includes('American Market Indices')) {
//                 $(table).find('tr').each((rowIndex, row) => {
//                     if (rowIndex !== 0) {
//                         const tds = $(row).find('td');
//                         const index = $(tds[0]).text().trim();
//                         const quote = parseFloat($(tds[1]).text().trim());
//                         const change = parseFloat($(tds[2]).text().trim());

//                         americanindicesData.push({ index, quote, change });
//                     }
//                 });
//             }
//         });

//         if (americanindicesData.length > 0 && americanindicesData[0].index === 'Index') {
//             americanindicesData.shift();
//         }

//         return americanindicesData;
//     } catch (error) {
//         console.error('Error extracting American market indices data:', error);
//         return null;
//     }
// }
import axios from 'axios';
import cheerio from 'cheerio';

export async function extractWorldMarketData() {
    const url = 'https://en.stockq.org/';
    try {
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

        return marketData;
    } catch (error) {
        console.error('Error extracting market data:', error);
        return null;
    }
}

// extractMarketDataFromURL()
//     .then(data => console.log(data))
//     .catch(error => console.error(error));
