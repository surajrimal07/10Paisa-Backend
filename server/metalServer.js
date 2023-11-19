import axios from 'axios';
import cheerio from 'cheerio';

let errorDetails = [];

async function metalPriceExtractor(asset) {

const url = "https://www.hamropatro.com/gold";

try {
        const response = await axios.get(url);
        const html = response.data;

        const $ = cheerio.load(html);

        let assetprice;

        if (asset === "Gold hallmark") {
            assetprice = await extractgoldhallmark($);
        } else if (asset === "Gold tejabi") {
            assetprice = await extractgoldtejabi($);
        } else if (asset === "Silver") {
            assetprice = await extractsilver($);
        }

        if (assetprice) {

            //console.log(assetprice);
            return { ltp: assetprice };
        } else {
            console.log('Price extraction failed');
        }

    } catch (error) {
        console.error('Error:', error.message);
        return error;
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


export default metalPriceExtractor;

// const asset = "goldhallmark";
// metalPriceExtractor(asset);

// const asset1 = "goldtejabi";
// metalPriceExtractor(asset1);

const asset3 = "gold hallmark";
const test = await metalPriceExtractor(asset3);
console.log(test);



