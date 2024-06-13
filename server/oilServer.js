import axios from 'axios';
import * as cheerio from 'cheerio';
import { createheaders } from '../utils/headers.js';


export async function oilExtractor(url = 'https://www.ktm2day.com/petrol-diesel-lpg-gas-aviation-fuel-price-in-nepal/') {
    const headers = createheaders(url);
    try {
        const response = await axios.get(url, { headers });

        const $ = cheerio.load(response.data);

        const fuelPrices = [];

        $('tbody tr').each((i, row) => {
            const columns = $(row).find('td');
            if (columns.length === 3) {
                const fuelType = columns.eq(0).text().trim().replace(/\([^)]+\)/, '');
                const quantity = columns.eq(1).text().trim().replace(/^per /i, '');
                let price = columns.eq(2).text().trim();

                price = price.replace(/^"(.*)"$/, '$1');

                if (fuelType === 'Petrol' || fuelType === 'Diesel' || fuelType === 'Kerosene' || fuelType === 'LP Gas – 14.2 kg') {
                    fuelPrices.push({
                        name: fuelType,
                        symbol: fuelType,
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




//new
// import bs4
// import requests

// base = "https://noc.org.np"

// def data_for_product(product):
//     prod_url = base + f"/{product}"

//     data = requests.get(prod_url).text
//     soup = bs4.BeautifulSoup(data, 'html.parser')

//     all_places = soup.find_all("div", class_="pricedet")

//     def get_each_data(each):
//         place = each.find("h5").text
//         each_row = each.find_all("tr")[1:]

//         price_data = {}

//         for row in each_row:
//             temp_price = row.find_all("td")[0].text
//             temp_date = row.find_all("td")[1].text
//             price_data.update({temp_date:temp_price})

//         return {"place": place, "price_data": price_data}

//     prod_data = []

//     for each_place in all_places:
//         prod_data.append(get_each_data(each_place))

//     return prod_data

