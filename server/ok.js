const puppeteer = require('puppeteer');

async function scrapeNEPSEIndex() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('URL_OF_YOUR_PAGE');

  // Wait for the element to be rendered
  await page.waitForSelector('.dIndex');

  // Extract the text of the element
  const nepseIndexText = await page.$eval('.dIndex', element => element.innerText);

  console.log('NEPSE Index:', nepseIndexText);

  await browser.close();
}

scrapeNEPSEIndex();
