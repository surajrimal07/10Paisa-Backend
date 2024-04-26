import axios from 'axios';
import cheerio from 'cheerio';
import { fetchFromCache, saveToCache } from '../controllers/savefetchCache.js';

export async function metalPriceExtractor() {
  const url = 'https://www.sharesansar.com/bullion';

  try {
    const cachedData = await fetchFromCache('metalprices');
    if (cachedData) {
        return cachedData;
    }
      const response = await axios.get(url);
      const html = response.data;
      const $ = cheerio.load(html);

      const bullionData = [];

      $('td').each((index, element) => {
          const symbol = $(element).find('h3 u').text().trim();
          const name = $(element).find('h3 u').text().trim();
          const category = 'Metals';
          const sector = 'Precious Metals';
          const unit = 'Tola';
          const ltp = parseInt($(element).find('h4 p').text().trim().replace(/[^0-9]/g, ''), 10);
          const change = parseInt($(element).find('font').text().trim().replace(/\(([^)]+)\)/, '$1'), 10);

          bullionData.push({
              name,
              ltp,
              change,
              category,
              sector,
              symbol,
              unit
          });
      });

      await saveToCache('metalprices', bullionData);

      return bullionData;
  } catch (error) {
      console.error('Error fetching or parsing data:', error.message);
      return null;
  }
}