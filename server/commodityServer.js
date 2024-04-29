import axios from 'axios';
import cheerio from 'cheerio';
import { fetchFromCache, saveToCache } from '../controllers/savefetchCache.js';

export async function commodityprices() {
    const url = 'https://ramropatro.com/vegetable';

    try {
        const cachedData = await fetchFromCache('commodityprices');
        if (cachedData !== null && cachedData !== undefined) {
          return cachedData;
        }

        const response = await axios.get(url);
        const html = response.data;

        const $ = cheerio.load(html);
        const table = $('#commodityDailyPrice');

        if (!table.length) {
            console.error('Table not found in the HTML content while fetching commodity prices.');
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
        await saveToCache('commodityprices', tableData);

        return tableData;
    } catch (error) {
        console.error('Error:', error.message || error);
        throw error;
    }
}

export default { commodityprices };