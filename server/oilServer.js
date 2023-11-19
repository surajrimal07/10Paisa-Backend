import axios from 'axios';
import cheerio from 'cheerio';

export async function oilExtractor(url = 'https://noc.org.np/retailprice') {
    try {
        const response = await axios.get(url);
        const html = response.data;

        const $ = cheerio.load(html);
        const table = $('table.table');

        if (!table.length) {
            console.error('Table not found in the HTML content.');
            return null;
        }

        const headers = [];
        const rowData = {};

        // Extract headers
        table.find('thead th').each((i, header) => {
            const headerText = $(header).text().trim();
            if (headerText !== 'Effective Time' && headerText !== 'ATF (DP)' && headerText !== 'ATF (DF)') {
                headers.push(headerText.toLowerCase());
            }
        });

        // Extract first data row
        const firstRow = table.find('tbody tr').first();
        firstRow.find('td').each((i, cell) => {
            const cellText = $(cell).text().trim();
            if (headers[i]) {
                rowData[headers[i]] = cellText;
            }
        });

        // Remove unnecessary date and time information
        const dateTimeInfo = `${rowData['effective date']} ${rowData['effective time']}`;
        delete rowData['effective date'];
        delete rowData['effective time'];

        // Create an array of label-value pairs
        const resultArray = headers.map((header) => `${header}: ${rowData[header]}`);

        return resultArray.join('\t');
    } catch (error) {
        console.error('Error fetching or parsing the HTML content:', error.message);
        return null;
    }
}

// Example usage
oilExtractor().then((result) => {
    if (result) {
        console.log(result);
    } else {
        console.log('Error extracting data from the table.');
    }
}).catch((error) => {
    console.error('Error:', error.message);
});
