import { extract } from '@extractus/feed-extractor';
import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import newsSources from '../middleware/newsUrl.js';
import newsModel from '../models/newsModel.js';
import { createheaders } from '../utils/headers.js';
import { newsLogger } from '../utils/logger/logger.js';
import extractFeaturedImage from './imageServer.js';
import { notifyRoomClients } from './websocket.js';

function generateUniqueKey(title, pubDate) {
    const hash = crypto.createHash('sha256');
    hash.update(title + pubDate);
    return hash.digest('hex');
}

async function isDuplicateArticle(uniqueKey) {
    const existing_item = await newsModel.findOne({
        unique_key: uniqueKey,
    });

    return existing_item !== null;
}

function NotifyClients(data) {
    notifyRoomClients('news',
        {
            type: 'news',
            title: data.title,
            description: data.description,
            image: data.img_url,
            url: data.link,
            source: data.source,
            pubDate: data.pubDate,
            unique_key: data.unique_key
        }
    );

};

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
            const unique_key = generateUniqueKey(title, pubDate);

            try {
                if (!await isDuplicateArticle(unique_key)) {
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

                    await newsModel.create(newsData);
                    NotifyClients(newsData);
                }
            } catch (error) {
                newsLogger.error(`Error Sharesansar body:  ${error.message}`);
            }
        });

    } catch (error) {
        newsLogger.error(`Error fetching Sharesansar news: ${error.message}`);
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
            news.unique_key = generateUniqueKey(news.title, news.pubDate);

            try {
                if (!await isDuplicateArticle(news.unique_key)) {
                    const response = await axios.get(news.link);
                    const body$ = cheerio.load(response.data);
                    news.description = body$('meta[property="og:description"]').attr('content');
                    news.img_url = body$('meta[property="og:image"]').attr('content');

                    await newsModel.create(news);
                    NotifyClients(news);
                }
            } catch (error) {
                newsLogger.error(`Error fetching Merolagani body: ${error.message}`);
            }
        });

    } catch (error) {
        newsLogger.error(`Error fetching Merolagani news : ${error.message}`);
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
            const unique_key = generateUniqueKey(title, pubDate);

            if (await isDuplicateArticle(unique_key)) {
                return;
            }

            const newsItem = {
                title,
                pubDate,
                description,
                link,
                img_url,
                source: 'Ekantipur',
                unique_key
            };

            await newsModel.create(newsItem);
            NotifyClients(newsItem);
        });

    } catch (error) {
        newsLogger.error(`Error fetching Ekantipur news: ${error.message}`);
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

//clickmandu desc broken
async function startFetchingRSS(url, source) {
    const fallbackDate = new Date('2023-01-01T00:00:00.000Z');
    const headers = createheaders(url);

    try {
        const result = await extract(url, { normalization: true }, { headers });

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

        const response = await axios.get(url, { headers });
        if (result && result.entries) {
            for (const entry of result.entries) {

                //below code changes slightly like in following manner entry.title etc
                const title = cleanDescription(entry.title);

                const link = entry.link.trim();

                const pubDateN = new Date(entry.published);
                const pubDate = pubDateN || fallbackDate;

                //do not change below code it's not necessary

                let img_url = '';
                let description = '';

                const unique_key = generateUniqueKey(title, pubDate);

                if (await isDuplicateArticle(unique_key)) {
                    continue;
                }

                // if (source === 'Nepal News') {
                //   const contentEncoded = item_elem['content:encoded'] && item_elem['content:encoded'][0];
                //   description = cleanDescription(contentEncoded);

                //   const regex = /<img[^>]+src="([^">]+)/g;
                //   const match = regex.exec(contentEncoded);
                //   if (match && match[1]) {
                //     img_url = match[1];
                //   }
                // } else
                // if (source === 'News Of Nepal') {
                //   description = cleanDescription(item_elem.description && item_elem.description[0]);

                //   const imageUrlRegex = /<img[^>]*src="([^"]*)"[^>]*>/;
                //   const contentEncoded = item_elem['content:encoded'] && item_elem['content:encoded'][0];
                //   const imageUrlMatch = contentEncoded.match(imageUrlRegex);
                //   img_url = imageUrlMatch ? imageUrlMatch[1] : '';

                // } else
                if (source === 'Himalayan Times') {
                    console.log(item_elem);
                    img_url = item_elem['media:thumbnail'][0].$.url;
                    description = cleanDescription(item_elem.description[0]);
                } else {
                    img_url = item_elem['media:content'] && item_elem['media:content'][0] && item_elem['media:content'][0].$ && item_elem['media:content'][0].$.url && item_elem['media:content'][0].$.url.trim();
                    description = cleanDescription(item_elem.description && item_elem.description[0]);
                }

                if (!img_url) {
                    img_url = await extractFeaturedImage(link, source);
                };

                const new_item_data = {
                    title,
                    link,
                    description,
                    img_url,
                    pubDate,
                    source,
                    unique_key
                };

                await newsModel.create(new_item_data);
                NotifyClients(new_item_data);
            }
        }
        else {
            newsLogger.error(`fetching news from url failed: ${response.status} ${url}`);
        }
    } catch (error) {
        if (error.response && error.response.status === 403) {
            newsLogger.error(`Error fetching news on : ${source} : Sarping is blocked by the server`);
        }
        newsLogger.error(`Error fetching news data: ${url} : ${error}`);
    }
}

export async function initiateNewsFetch() {
    newsLogger.info('Initiating news fetch');

    const fetchAndDelay = async ({ url, source }) => {
        await startFetchingRSS(url, source);
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
            newsLogger.error('Error in fetch and scrape:', error.message);
        }
        setTimeout(fetchAndScrape, 120 * 1000);
    }

    await fetchAndScrape();
}

//news code
//fetch news
export async function fetchNews(page = 1, limit = 100, source = null, keyword = null) {
    let query = {};

    if (source && keyword) {
        query = {
            source: source,
            $or: [
                { title: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } },
            ]
        };
    } else if (source) {
        query = { source: source };
    } else if (keyword) {
        query = {
            $or: [
                { title: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } },
            ]
        };
    }

    const options = {
        page: page,
        limit: limit,
        sort: { _id: -1 }
    };

    try {
        const result = await newsModel.paginate(query, options);
        return result.docs;
    } catch (error) {
        newsLogger.error('Error fetching news:', error);
    }
}

//api code
export const getNews = async (req, res) => {
    newsLogger.info('News data requested');

    try {
        const page = parseInt(req.query._page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const source = req.query.source;
        const keyword = req.query.keyword;

        const newsData = await fetchNews(page, limit, source, keyword);

        if (newsData.length === 0) {
            return res.status(404).json({ message: 'No news found with selected keyword and source.' });
        }

        res.json(newsData);
    } catch (error) {
        newsLogger.error('Error fetching news:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};