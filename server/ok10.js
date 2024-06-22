import { extract } from '@extractus/feed-extractor';
import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
//import Parser from 'rss-parser';
import newsSources from '../middleware/newsUrl.js';
import { createheaders } from '../utils/headers.js';
import extractFeaturedImage from './imageServer.js';

function generateUniqueKey(title, pubDate, link) {
    const hash = crypto.createHash('sha256');
    hash.update(title + pubDate + link);
    return hash.digest('hex');
}


async function scrapeShareSansar() {
    const url = 'https://www.sharesansar.com/category/latest';

    try {

        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const newsItems = $('.featured-news-list');

        newsItems.each(async (index, element) => {
            const link = $(element).find('a[href]').attr('href');
            const title = $(element).find('h4.featured-news-title').text().trim();
            const img_url = $(element).find('img').attr('src');
            const pubDate = $(element).find('span.text-org').text().trim();
            const unique_key = generateUniqueKey(title, pubDate, link);

            try {

                const bodyResponse = await axios.get(link);
                const body$ = cheerio.load(bodyResponse.data);
                const description = body$('#newsdetail-content').find('p').first().text().trim();

                const newsData = {
                    title,
                    img_url,
                    link,
                    pubDate,
                    description,
                    source: 'Share Sansar',
                    unique_key
                };

                console.log('newsData:', newsData);

            } catch (error) {
                //newsLogger.error(`Error Sharesansar body:  ${error.message}`);
                console.log('Error Sharesansar body: ', error.message);
            }
        });

    } catch (error) {
        // newsLogger.error(`Error fetching Sharesansar news: ${error.message}`);
        console.log('Error fetching Sharesansar news: ', error.message);
    }
}


async function scrapeMeroLagani() {
    const url = 'https://merolagani.com/NewsList.aspx';

    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        $('.media-news').each(async (index, element) => {
            const news = {};
            const mediaWrap = $(element).find('.media-wrap');
            const mediaBody = $(element).find('.media-body');

            news.link = `https://merolagani.com${mediaWrap.find('a').attr('href')}`;
            news.title = mediaBody.find('.media-title a').text();
            news.pubDate = mediaBody.find('.media-label').text().trim();
            news.source = 'Mero Lagani';
            news.unique_key = generateUniqueKey(news.title, news.pubDate, news.link);

            try {

                const response = await axios.get(news.link);
                const body$ = cheerio.load(response.data);
                news.description = body$('meta[property="og:description"]').attr('content');
                news.img_url = body$('meta[property="og:image"]').attr('content');

                print(news);

            } catch (error) {
                // newsLogger.error(`Error fetching Merolagani body: ${error.message}`);
                console.log('Error fetching Merolagani body: ', error.message);
            }
        });

    } catch (error) {
        // newsLogger.error(`Error fetching Merolagani news : ${error.message}`);
        console.log('Error fetching Merolagani news : ', error.message);
    }
}


async function scrapeEkantipur() {
    const url = 'https://ekantipur.com/news';

    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        $('article.normal').each(async (index, element) => {
            const title = $(element).find('h2 a').text().trim();
            const pubDate = $('#hdnRequestDate').attr('value').trim();
            const description = $(element).find('p').text().trim();
            const link = `https://ekantipur.com${$(element).find('h2 a').attr('href').trim()}`;
            const imageSrc = $(element).find('img').attr('data-src');
            const img_url = imageSrc ? decodeURIComponent(imageSrc.split('src=')[1]).replace(/&w=301&h=0$/, '') : '';
            const unique_key = generateUniqueKey(title, pubDate, link);



            const newsItem = {
                title,
                pubDate,
                description,
                link,
                img_url,
                source: 'Ekantipur',
                unique_key
            };

            console.log('newsItem:', newsItem);
        });

    } catch (error) {
        //newsLogger.error(`Error fetching Ekantipur news: ${error.message}`);
        console.log('Error fetching Ekantipur news: ', error.message);
        return [];
    }
}


const cleanDescription = (desc) => {
    if (!desc) return '';

    return desc
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .replace(/&[^\s]*;/g, '')
        .replace(/&#8220;/g, '')
        .replace(/&#8230;/g, '')
        .replace(/&nbsp;/g, '')
        .replace(/&#8216;/g, '')
        .replace(/&#8217;/g, '')
        .replace(/&#\d+;/g, '')
        .trim();
};

//let parser = new Parser();

//clickmandu desc broken
async function startFetchingRSS(url, source) {
    //const fallbackDate = new Date('2023-01-01T00:00:00.000Z');
    const fallbackDate = new Date();
    const headers = createheaders(url);


    try {
        //const response = await axios.get(url, { headers });

        //console.log('response:', response.data);

        const result = await extract(url, { normalization: true }, { headers });
        //const result = await parser.parseURL('https://www.reddit.com/.rss');

        //i was manually extracting data from rss
        //later i found a package to do this so modify my below old code to new format, i have given
        //new format result below.

        //output of result is
        // {
        //   title: 'https://thehimalayantimes.com',
        //   link: 'https://thehimalayantimes.com/',
        //   description: ' RSS Feed : Business  ',
        //   language: '',
        //   generator: '',
        //   published: '2024-06-10T13:53:00.000Z',
        //   entries: [
        //     {
        //       id: 'hl1lat-1717916162000',
        //       title: 'Gold plunges Rs 4,000 per tola; Silver follows suit',
        //       link: 'https://thehimalayantimes.com/business/gold-plunges-rs-4000-per-tola-silver-follows-suit',
        //       published: '2024-06-09T06:56:02.000Z',
        //       description: 'KATHMANDU, JUNE 9The gold price experienced a sharp plunge in the domestic market as it dropped by Rs 4,000 per tola on Sunday.This substantial drop follows the record-breaking pri...'
        //     },
        //     {
        //       id: 'j5l0qt-1717758514000',
        //       title: 'NEA&#039;s profit in nine months exceeds 11 billion',
        //       link: 'https://thehimalayantimes.com/business/neas-profit-in-nine-months-exceeds-11-billion',
        //       published: '2024-06-07T11:08:34.000Z',
        //       description: 'KATHMANDU, JUNE 7Nepal Electricity Authority (NEA) has reported a profit exceeding Rs 11 billion in the first nine months of the current fiscal year, 2080-81 BS (2024-25). During t...'
        //     },

        //remove below if 200 etc checks as we dont need it
        //add appropriate new code, do like this, for each
        //entry inside of entries, do the following

        //const response = await axios.get(url, { headers });
        if (result && result.entries) {
            for (const entry of result.entries) {
                const title = cleanDescription(entry.title);

                const link = entry.link.trim();
                const pDate = entry.published;

                let pubDate;

                if (pDate) {
                    const ndate = new Date(pDate);
                    if (isNaN(ndate)) {
                        pubDate = fallbackDate;
                    }

                    pubDate = ndate;

                } else {
                    pubDate = fallbackDate;
                }

                let img_url = '';
                const description = cleanDescription(entry.description);

                const unique_key = generateUniqueKey(title, pubDate, link);

                img_url = entry.image ? entry.image.url : '';

                if (!img_url) {
                    img_url = await extractFeaturedImage(link, source);
                };

                const new_item_data = {
                    title,
                    link,
                    description: description == '' ? 'No Description Found' : description,
                    img_url,
                    pubDate,
                    source,
                    unique_key
                };

                console.log('new_item_data:', new_item_data);
                // await newsModel.create(new_item_data);

            }
        }
        else {
            //newsLogger.error(`fetching news from url failed: ${response.status} ${url}`);
            console.log('fetching news from url failed: ', url);
        }
    } catch (error) {
        if (error.response && error.response.status === 403) {
            //newsLogger.error(`Error fetching news on : ${source} : Sarping is blocked by the server`);
            console.log('Error fetching news on : ', source, ' : Sarping is blocked by the server');
        }
        // newsLogger.error(`Error fetching news data: ${url} : ${error}`);
        console.log('Error fetching news data: ', url, ' : ', error);
    }
}

export async function initiateNewsFetch() {
    console.log('Initiating news fetch');

    const fetchAndDelay = async ({ url, source }) => {
        await startFetchingRSS('https://www.techpana.com/feed', 'TechPana');
        await new Promise((resolve) => setTimeout(resolve, 2 * 1000));
    };

    async function fetchAndScrape() {
        try {
            for (const newsSource of newsSources) {
                await fetchAndDelay(newsSource);
            }
            await new Promise((resolve) => setTimeout(resolve, 2 * 1000));
            await scrapeEkantipur();

            await new Promise((resolve) => setTimeout(resolve, 2 * 1000));
            await scrapeShareSansar();

            await new Promise((resolve) => setTimeout(resolve, 2 * 1000));
            await scrapeMeroLagani();

        } catch (error) {
            // newsLogger.error('Error in fetch and scrape:', error.message);
            console.log('Error in fetch and scrape:', error.message);
        }
        setTimeout(fetchAndScrape, 120 * 1000);
    }

    await fetchAndScrape();
}



initiateNewsFetch();

