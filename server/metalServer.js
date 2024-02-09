import axios from 'axios';
import cheerio from 'cheerio';
import storage from 'node-persist';
import { headers } from '../utils/headers.js';
await storage.init();

const fetchFromCache = async (cacheKey) => {
    try {
      const cachedData = await storage.getItem(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      return null;
    } catch (error) {
      console.error('Error fetching data from cache:', error.message);
      throw new Error('Error fetching data from cache');
    }
  };


export async function metalPriceExtractor(asset) {
  const url = "https://www.hamropatro.com/gold";

  try {
    // const cachedData = await fetchFromCache('metalPriceExtractor');
    // if (cachedData !== null) {
    //   return cachedData;
    // }

      const response = await axios.get(url, { headers });
      const html = response.data;
      const $ = cheerio.load(html);

      let assetPrice;

      if (asset === "Gold hallmark") {
          assetPrice = await extractgoldhallmark($);
      } else if (asset === "Gold tejabi") {
          assetPrice = await extractgoldtejabi($);
      } else if (asset === "Silver") {
          assetPrice = await extractsilver($);
      }

      if (assetPrice) {
        const mappedAsset = mapAsset(asset);
        const formattedLtp = parseFloat(assetPrice.replace(/,/g, '')).toString();
        //await storage.setItem('metalPriceExtractor', tableData);
        return { name: mappedAsset, category: 'Metals', sector: 'Precious Metals', ltp: formattedLtp, unit: 'Tola' };
    } else {
        console.log(`Price for ${asset} not found`);
    }

  } catch (error) {
      console.error('Error:', error.message);
      return null;
  }
}

// Mapping logic
function mapAsset(asset) {
  switch (asset) {
      case "Gold hallmark":
          return "Fine Gold";
      case "Gold tejabi":
          return "Tejabi Gold";
      case "Silver":
          return "Silver";
      default:
          return asset;
  }
}

async function extractgoldhallmark($) {
    const match = $('li:contains("Gold Hallmark - tola")').next().text().match(/Nrs\.\s*([\d,]+\.\d{2})/);

    if (match && match[1]) {
        return match[1];
    } else {
        return null;
    }
}

function extractgoldtejabi($) {

    const priceElement = $('li:contains("Gold Tajabi - tola")').next();

    if (priceElement.length > 0) {
        const match = priceElement.text().match(/Nrs\.\s*([\d,]+\.\d{2})/);

        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
}

function extractsilver($) {

    const priceElement = $('li:contains("Silver - tola")').next();

    if (priceElement.length > 0) {
        const match = priceElement.text().match(/Nrs\.\s*([\d,]+\.\d{2})/);

        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
}

//
export async function metalChartExtractor() {
    const url = "https://www.sharesansar.com/bullion";

    try {
      const response = await axios.get(url);
      const html = response.data;
      const $ = cheerio.load(html);

      const metalPrices = await extractMetalData($);

      if (metalPrices) {
        return metalPrices;
      } else {
        console.log('Price extraction failed');
        return null;
      }
    } catch (error) {
      console.error('Error:', error.message);
      return error;
    }
  }

  async function extractMetalData($) {
    const scriptContent = $('script:contains("var data =")').html();

    if (scriptContent) {
      const match = scriptContent.match(/var data = (\[.*?\]);/);

      if (match && match[1]) {
        const data = JSON.parse(match[1]);

        const last15DaysData = data.slice(-15).map(item => {
          const date = item.published_date;
          const assetPrices = {
            fineGold: parseFloat(item.finegold),
            tejabiGold: parseFloat(item.tejabigold),
            silver: parseFloat(item.silver),
          };

          return { date, assetPrices };
        });

        const prices = {};

        last15DaysData.forEach(item => {
          Object.keys(item.assetPrices).forEach(asset => {
            if (!prices[asset]) {
              prices[asset] = [];
            }
            prices[asset].push(item.assetPrices[asset]);
          });
        });

        const dates = last15DaysData.map(item => item.date);

        return { dates, prices };
      }
    }

    return null;
  }

  //

export default { metalPriceExtractor, metalChartExtractor };

const asset3 = "Silver";

const test = await metalPriceExtractor(asset3);



// export default metalPriceExtractor;

// const asset = "goldhallmark";
// metalPriceExtractor(asset);

// const asset1 = "goldtejabi";
// metalPriceExtractor(asset1);



// const metalPrices = await metalChartExtractor();
// console.log(metalPrices);
