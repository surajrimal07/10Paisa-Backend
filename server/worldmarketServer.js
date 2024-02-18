import axios from 'axios';
import cheerio from 'cheerio';

async function extractCryptoDataFromURL() {
    const url = 'https://en.stockq.org/';
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const cryptoData = [];

        $('table.marketdatatable tr').each((index, element) => {
            if (index !== 0) {
                const tds = $(element).find('td');
                const symbol = $(tds[1]).text().trim();
                const currency = $(tds[0]).text().trim();
                const rate = parseFloat($(tds[2]).text().trim());
                const change = parseFloat($(tds[3]).text().trim());

                cryptoData.push({ symbol, currency, rate, change });
            }
        });

        return cryptoData;
    } catch (error) {
        console.error('Error extracting crypto data:', error);
        return null;
    }
}


extractCryptoDataFromURL()
    .then(data => console.log(data))
    .catch(error => console.error(error));
