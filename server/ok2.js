// import axios from 'axios';
// import cheerio from 'cheerio';

// export async function extractIndex() {
//   try {
//     const targetUrl = 'https://www.sharesansar.com/live-trading';
//     const targetUrl2 = 'https://nepseapi.zorsha.com.np/DailyNepseIndexGraph';
//     const targetUrl3 = 'https://nepseapi.zorsha.com.np/IsNepseOpen';


//     //targeturl
//     const response = await axios.get(targetUrl);
//     const html = response.data;
//     const $ = cheerio.load(html);

//     //targeturl2
//     const response2 = await axios.get(targetUrl2);
//     const jsonData = response2.data;

//     //targeturl3
//     const response3 = await axios.get(targetUrl3);
//     const jsonData2 = response3.data;

//     //target1
//     const nepseIndexContainer = $('h4:contains("NEPSE Index")').closest('.mu-list');
//     const turnover = parseFloat(nepseIndexContainer.find('.mu-price').text().replace(/,/g, ''));
//     const close = parseFloat(nepseIndexContainer.find('.mu-value').text().replace(/,/g, ''));
//     const percentageChange = parseFloat(nepseIndexContainer.find('.mu-percent').text().replace(/,/g, ''));

//     //target2
//     const valuesArray = jsonData.map(item => item[1]);
//     const open = valuesArray[0];
//     const high = Math.max(...valuesArray);
//     const low = Math.min(...valuesArray);
//     const change = (valuesArray[valuesArray.length - 1] - open).toFixed(2);

//     //target3
//     const isOpen = jsonData2.isOpen;

//     const nepseIndexData = {
//       open,
//       high,
//       low,
//       close,
//       change,
//       percentageChange,
//       turnover,
//       isOpen
//     };

//     return nepseIndexData;
//   } catch (error) {
//     console.error('Error fetching or parsing the HTML:', error.message);
//   }
// }

// //run above code
// extractIndex().then(console.log).catch(console.error);