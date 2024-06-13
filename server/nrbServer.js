import axios from 'axios';
import * as cheerio from 'cheerio';
import { fetchFromCache, saveToCache } from '../controllers/savefetchCache.js';

export async function extractNrbForexData () {
    const url  = 'https://www.nrb.org.np/forex/';
    try {
        const cachedData = await fetchFromCache('nrbforexdata');
        if (cachedData) {
            return cachedData;
        }
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const exchangeRates = {};

        $('table.table-borderless tbody tr').each((index, element) => {
            const currency = $(element).find('td:nth-child(1)').text().trim();
            const unit = parseInt($(element).find('td:nth-child(2)').text().trim());
            const buy = parseFloat($(element).find('td:nth-child(3)').text().trim());
            const sell = parseFloat($(element).find('td:nth-child(4)').text().trim());

            exchangeRates[currency] = { unit, buy, sell };
        });

        await saveToCache('nrbforexdata', exchangeRates);
        return exchangeRates;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

export async function extractNrbBankingDataAll() {
    const url = 'https://www.nrb.org.np/';

    try {
        const cachedData = await fetchFromCache('nrbbankingforexdata');
        if (cachedData) {
            return cachedData;
        }

        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const data = {};
        const dates = [];

        $('table.table-compact tbody tr.subtitle th.text-right').each((index, element) => {
            dates.push($(element).text().trim());
        });

        $('table.table-compact tbody tr').not('.subtitle').each((index, element) => {
            const label = $(element).find('td span').first().text().trim();

            const dataValues = $(element).find('.number.text-right').map((i, el) => $(el).text().trim()).get();

            if (label !== '' && dataValues.length > 0) {
                const labelData = {};
                dates.forEach((date, i) => {
                    labelData[date] = dataValues[i];
                });
                data[label] = labelData;
            }
        });

        const shortTermRatesHeader = $('.card-bt-header-title--info').first().text().trim();
        const shortTermRatesDate = $('.card-bt-header-subtitle').first().text().trim();
        const shortTermRatesValues = $('.card-bt-body .text-secondary.font-size-l').map((index, element) => $(element).text().trim()).get();
        const shortTermRatesTenors = $('.card-bt-body .font-size-xs.text-muted').map((index, element) => $(element).text().trim()).get();

        const shortTermInterestRates = {
            "header": shortTermRatesHeader,
            "date": shortTermRatesDate,
            "values": {},
        };
        shortTermRatesTenors.forEach((tenor, i) => {
            shortTermInterestRates["values"][tenor] = shortTermRatesValues[i];
        });

        data["Short Term Interest Rates"] = shortTermInterestRates;

        await saveToCache('nrbbankingforexdata', data);
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}