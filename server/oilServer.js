import axios from 'axios';
import cheerio from 'cheerio';
import Asset from '../models/assetModel.js';


export async function oilExtractor(url = 'https://www.ktm2day.com/petrol-diesel-lpg-gas-aviation-fuel-price-in-nepal/') {
    try {
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);

        const fuelPrices = [];

        $('tbody tr').each((i, row) => {
            const columns = $(row).find('td');
            if (columns.length === 3) {
                const fuelType = columns.eq(0).text().trim().replace(/\([^)]+\)/, '');
                const quantity = columns.eq(1).text().trim().replace(/^per /i, '');
                let price = columns.eq(2).text().trim();

                price = price.replace(/^"(.*)"$/, '$1');

                if (fuelType === 'Petrol' || fuelType === 'Diesel' || fuelType === 'Kerosene') {
                    // fuelPrices.push({
                    //     name: fuelType,
                    //     category: 'Oil & Gas',
                    //     unit: quantity,
                    //     ltp: parseFloat(price) || null,
                    // });
                    return Asset({
                        name: fuelType,
                        category: 'Oil & Gas',
                        unit: quantity,
                        ltp: parseFloat(price) || null,
                    });
                }
            }
        });

        return fuelPrices;
    } catch (error) {
        console.error('Error fetching or parsing the HTML content:', error.message);
        return null;
    }
}

//oilExtractor()