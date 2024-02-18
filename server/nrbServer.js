import axios from 'axios';
import cheerio from 'cheerio';

export async function extractNrbBankingData () {
    const url = 'https://www.nrb.org.np/';
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const information = {};

        $('table.table-compact tbody tr').each((index, element) => {
            const label = $(element).find('td span').first().text().trim();
            const firstData = $(element).find('.number.text-right').first().text().trim();


            if (label !== '') {
                information[label] = firstData;
            }
        });

        return information;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

export async function extractNrbForexData () {
    const url  = 'https://www.nrb.org.np/forex/';
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const exchangeRates = {};

        $('table.table-borderless tbody tr').each((index, element) => {
            const currency = $(element).find('td:nth-child(1)').text().trim();
            const unit = parseInt($(element).find('td:nth-child(2)').text().trim());
            const buy = parseFloat($(element).find('td:nth-child(3)').text().trim());
            const sell = parseFloat($(element).find('td:nth-child(4)').text().trim());

            exchangeRates[currency] = { unit, buy, sell };
        });

        return exchangeRates;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}


// // Example usage:
// extractNrbForexData()
//     .then(data => {
//         console.log(data);
//     })
//     .catch(error => {
//         console.error('Error:', error);
//     });
