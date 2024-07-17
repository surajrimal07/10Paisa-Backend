import { extract } from '@extractus/feed-extractor';
import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { isServerPrimary } from '../index.js';
import newsSources from '../middleware/newsUrl.js';
import newsModel from '../models/newsModel.js';
import { createheaders } from '../utils/headers.js';
import { newsLogger } from '../utils/logger/logger.js';
import extractFeaturedImage from './imageServer.js';
import { NotifyNewsClients } from './notificationServer.js';
import { notifyRoomClients } from './websocket.js';

import { startSession } from 'mongoose';

// eslint-disable-next-line no-undef
const isNotificationEnabled = process.env.IS_NEWS_NOTIFICATION_ENABLED === 'true';

async function insertNewsWithTransaction(newsData) {
  const session = await startSession();
  session.startTransaction();
  try {
    const existingItem = await newsModel.findOne({ unique_key: newsData.unique_key }).session(session);
    if (existingItem) {
      await session.abortTransaction();
      session.endSession();
      return false;
    }

    await newsModel.create([newsData], { session });
    await session.commitTransaction();
    session.endSession();
    await NotifyClients(newsData);
    return true;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    if (error.code === 11000 || error.code === 'E11000') {
      return false;
    }
    throw error;
  }
}

function generateUniqueKey(title, link) {
  const data = title + link
  const hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest('hex');
}

async function isDuplicateArticle(uniqueKey) {
  const existing_item = await newsModel.findOne({
    unique_key: uniqueKey,
  });

  return existing_item !== null;
}

async function NotifyClients(data) {
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

  if (isNotificationEnabled) {
    await NotifyNewsClients(data.title, data);
  }
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
      const unique_key = generateUniqueKey(title, link);

      if (await isDuplicateArticle(unique_key)) {
        return;
      }

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

        await insertNewsWithTransaction(newsData);

      } catch (error) {
        if (error.code === 11000 || error.code === 'E11000') {
          ///
        }
        //newsLogger.error(`Error Sharesansar body:  ${error.message}`);
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
      news.unique_key = generateUniqueKey(news.title, news.link);

      if (await isDuplicateArticle(news.unique_key)) {
        return;
      }

      try {
        const response = await axios.get(news.link);
        const body$ = cheerio.load(response.data);
        news.description = body$('meta[property="og:description"]').attr('content');
        news.img_url = body$('meta[property="og:image"]').attr('content');

        await insertNewsWithTransaction(news);
      } catch (error) {
        if (error.code === 11000 || error.code === 'E11000') {
          //
        }
        // newsLogger.error(`Error fetching Merolagani body: ${error.message}`);
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
      const unique_key = generateUniqueKey(title, link);

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
      await insertNewsWithTransaction(newsItem);
    });

  } catch (error) {
    if (error.code === 11000 || error.code === 'E11000') {
      //
    }
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

async function startFetchingRSS(url, source) {
  const fallbackDate = new Date();
  const headers = createheaders(url);

  try {
    const result = await extract(url, { normalization: true }, { headers });

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

        const unique_key = generateUniqueKey(title, link);

        if (await isDuplicateArticle(unique_key)) {
          return
        }

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

        // try {
        //   await newsModel.create(new_item_data);
        // } catch (error) {
        //   if (error.code === 11000 || error.code === 'E11000') {
        //     //fuck this shit
        //   }
        // }

        await insertNewsWithTransaction(new_item_data);

      }
    }
    else {
      newsLogger.error(`fetching news from url failed: ${url}`);
    }
  } catch (error) {
    if (error.response && error.response.status === 403) {
      newsLogger.error(`Error fetching news on : ${source} : Sarping is blocked by the server`);
    }
  }
}

export async function initiateNewsFetch() {
  if (isServerPrimary) {
    newsLogger.info('Initiating news fetch function');

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
      setTimeout(fetchAndScrape, 100 * 1000);
    }

    await fetchAndScrape();
  } else {
    newsLogger.info('Secondary server, skipping news fetch');
  }
}

//fetch news API
// fetch news API
export async function fetchNews(page = 1, limit = 100, source = null, keyword = null) {
  let query = {};
  let options = {
    page: page,
    limit: limit,
    sort: { _id: -1 }
  };

  if (keyword === 'trending') {
    query = { views: { $gt: 0 } };
    options.sort = { views: -1 };

    try {
      const result = await newsModel.paginate(query, options);
      return result.docs;
    } catch (error) {
      newsLogger.error('Error fetching trending news:', error);
      return [];
    }
  }

  // Existing functionality for other cases
  if (source && keyword) {
    query = {
      source: source,
      $or: [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ]
    };
  } else if (source) {
    query = { source: source };
  } else if (keyword) {
    const categoryMatch = await newsModel.findOne({ category: { $regex: keyword, $options: 'i' } });

    if (categoryMatch) {
      query = { category: { $regex: keyword, $options: 'i' } };
    } else {
      query = {
        $or: [
          { title: { $regex: keyword, $options: 'i' } },
          { description: { $regex: keyword, $options: 'i' } }
        ]
      };
    }
  }

  try {
    const result = await newsModel.paginate(query, options);
    return result.docs;
  } catch (error) {
    newsLogger.error('Error fetching news:', error);
    return [];
  }
}

// export async function fetchNews(page = 1, limit = 100, source = null, keyword = null) {
//   let query = {};

//   if (keyword === 'trending') {
//     query = { views: { $gt: 0 } };

//     const options = {
//       page: page,
//       limit: limit,
//       sort: { views: -1 }
//     };

//     try {
//       const result = await newsModel.paginate(query, options);
//       return result.docs;
//     }
//     catch (error) {
//       newsLogger.error('Error fetching news:', error);
//     }
//   }

//   if (source && keyword) {
//     query = {
//       source: source,
//       $or: [
//         { title: { $regex: keyword, $options: 'i' } },
//         { description: { $regex: keyword, $options: 'i' } },
//       ]
//     };
//   } else if (source) {
//     query = { source: source };
//   } else if (keyword) {
//     const categoryMatch = await newsModel.findOne({ category: { $regex: keyword, $options: 'i' } });

//     if (categoryMatch) {
//       query = { category: { $regex: keyword, $options: 'i' } };
//     } else {
//       query = {
//         $or: [
//           { title: { $regex: keyword, $options: 'i' } },
//           { description: { $regex: keyword, $options: 'i' } },
//         ]
//       };
//     }
//   }

//   const options = {
//     page: page,
//     limit: limit,
//     sort: { _id: -1 }
//   };

//   try {
//     const result = await newsModel.paginate(query, options);
//     return result.docs;
//   } catch (error) {
//     newsLogger.error('Error fetching news:', error);
//   }
// }

//api code
export const getNews = async (req, res) => {
  newsLogger.info('News data requested');

  try {
    const page = parseInt(req.query._page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const source = req.query.source;
    const keyword = req.query.keyword;

    const newsData = await fetchNews(page, limit, source, keyword);

    //filter out the duplicate news
    const uniqueNewsData = newsData.filter((newsItem, index, self) =>
      index === self.findIndex((t) => (
        t.title === newsItem.title && t.source === newsItem.source
      ))
    );

    if (uniqueNewsData.length === 0) {
      return res.status(404).json({ message: 'No news found with selected keyword and source.' });
    }

    res.json(uniqueNewsData);
  } catch (error) {
    newsLogger.error('Error fetching news:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateNewsViewCount = async (req, res) => {
  newsLogger.info('News view count update requested');
  const newsId = req.query.id;
  const viewCount = parseInt(req.query.viewCount) || 1;

  try {
    const news = await newsModel.findOneAndUpdate(
      { unique_key: newsId },
      { $inc: { views: viewCount } },
      { new: true }
    );

    if (!news) {
      newsLogger.warn(`News with id ${newsId} not found`);
      return res.status(404).json({ error: 'News not found' });
    }

    newsLogger.info(`Updated view count for news id ${newsId}`);
    res.status(200).json({ message: 'View count updated successfully' });
  } catch (error) {
    newsLogger.error('Error updating views count of news:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
