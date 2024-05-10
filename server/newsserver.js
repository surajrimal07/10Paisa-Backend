import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import xml2js from 'xml2js';
import newsSources from '../middleware/newsUrl.js';
import newsModel from '../models/newsModel.js';
import { headers } from '../utils/headers.js';
import { newsLogger } from '../utils/logger/logger.js';
import extractFeaturedImage from './imageServer.js';
import { notifyClients } from './websocket.js';

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
  notifyClients(
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


export const getNews = async (req, res) => {
  newsLogger.info('News data requested');
  try {
    const page = parseInt(req.query._page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const source = req.query.source || 'all';

    const options = {
      page: page,
      limit: limit,
      sort: { _id: -1 }
    };

    const result = await newsModel.paginate({}, options);
    res.json(result.docs);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

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
  return desc
    .replace(/<[^>]+>/g, '')
    .replace(/\n\s+/g, '')
    .replace(/&#8220/g, '')
    .replace(/\[&#8230;\]/g, '')
    .replace(/_{76}\s*&#8220;/g, '')
    .replace(/&nbsp;/g, '')
    .replace(/&#8216;/g, '')
    .replace(/&#8217;/g, '')
    .replace(/&#\d+;/g, '')
    .trim();
};


async function startFetchingRSS(url, source) {
  const fallbackDate = new Date('2023-01-01T00:00:00.000Z');

  try {
    const response = await axios.get(url, { headers });
    if (response.status === 200 && response.data) {
      const result = await new xml2js.Parser().parseStringPromise(response.data);
      if (
        result.rss &&
        result.rss.channel &&
        result.rss.channel[0] &&
        result.rss.channel[0].item
      ) {
        for (const item_elem of result.rss.channel[0].item) {
          const title = item_elem.title && item_elem.title[0];

          const link = item_elem.link && item_elem.link[0].trim();
          const description =
            item_elem.description && item_elem.description[0];
          const pubDateN = item_elem.pubDate && new Date(item_elem.pubDate[0]);
          const pubDate = pubDateN || fallbackDate;
          const cleanedDescription = cleanDescription(description);
          const unique_key = generateUniqueKey(title, pubDate);

          if (await isDuplicateArticle(unique_key)) {
            continue;
          }

          const img_url = await extractFeaturedImage(link, source);

          const new_item_data = {
            title,
            link,
            description: cleanedDescription,
            img_url,
            pubDate,
            source,
            unique_key
          };

          await newsModel.create(new_item_data);
          NotifyClients(new_item_data);
        }
      }
    }
    else {
      newsLogger.error(`fetching news from url failed: ${response.status} ${url}`);
    }
  } catch (error) {
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


