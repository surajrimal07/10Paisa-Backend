import axios from 'axios';
import * as cheerio from 'cheerio';

// Function to fetch and extract crypto information
async function fetchCryptoInfo() {
  try {
    // Fetch HTML content from the provided URL
    const response = await axios.get('https://en.stockq.org/market/cryptocurrency.php');
    const html = response.data;

    // Load HTML content into Cheerio
    const $ = cheerio.load(html);

    // Extract cryptocurrency information
    const cryptoInfo = [];
    $('tr.row1, tr.row2').each((index, element) => {
      const crypto = {};
      crypto.symbol = $(element).find('td:nth-child(4)').text().trim();
      crypto.currency = $(element).find('td:nth-child(3)').text().trim();
      crypto.rate = $(element).find('td:nth-child(5)').text().trim();
      crypto.change = $(element).find('td:nth-child(6)').text().trim();
      crypto.marketCap = $(element).find('td:nth-child(8)').attr('title');
      crypto.volume24h = $(element).find('td:nth-child(9)').attr('title');
      cryptoInfo.push(crypto);
    });

    // Print extracted cryptocurrency information
    console.log(cryptoInfo);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Call the function to fetch crypto information
fetchCryptoInfo();
