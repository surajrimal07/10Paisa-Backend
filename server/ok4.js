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

async function scrapeShareSansar() {
  const url = 'https://www.sharesansar.com/category/latest';
  const scrapedData = [];

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const newsItems = $('.featured-news-list');
    const promises = [];

    newsItems.each((index, element) => {
      const newsURL = $(element).find('a[href]').attr('href');
      const title = $(element).find('h4.featured-news-title').text().trim();
      const imgURL = $(element).find('img').attr('src');
      const datePublished = $(element).find('span.text-org').text().trim();
      const uniqueKey = generateUniqueKey(title, datePublished);


      promises.push((callback) => {
        isDuplicateArticle(uniqueKey).then(async (isDuplicate) => {
          if (!isDuplicate) {
            const bodyResponse = await axios.get(newsURL);
            const body$ = cheerio.load(bodyResponse.data);
            const bodyContent = body$('#newsdetail-content').find('p').first().text().trim();

            const newsData = {
              title,
              img_url: imgURL,
              link: newsURL,
              pubDate: datePublished,
              description: bodyContent,
              sources: 'Share Sansar',
              unique_key: uniqueKey,
            };

            scrapedData.push(newsData);
          }
          callback();
        }).catch((error) => {
          console.error('Error checking duplicate:', error.message);
          callback();
        });
      });
    });

    await new Promise((resolve, reject) => {
      parallel(promises, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    return scrapedData;
  } catch (error) {
    console.error('Error fetching data:', error.message);
    return scrapedData;
  }
}

async function scarpeMeroLagani() {
  const url = 'https://merolagani.com/NewsList.aspx';
  const newsList = [];

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    $('.media-news').each((index, element) => {
      const news = {};
      const mediaWrap = $(element).find('.media-wrap');
      const mediaBody = $(element).find('.media-body');

      news.link = `https://merolagani.com${mediaWrap.find('a').attr('href')}`;
      news.title = mediaBody.find('.media-title a').text();
      news.pubDate = mediaBody.find('.media-label').text().trim();
      news.sources = 'Mero Lagani';
      news.unique_key = generateUniqueKey(news.title, news.pubDate),

        newsList.push(news);
    });

    await new Promise((resolve, reject) => {
      parallel(
        newsList.map((news) => {
          return (callback) => {
            if (isDuplicateArticle(news.title, news.pubDate)) {
              console.log('Duplicate article:', news.title);
              callback();
            } else {
              axios.get(news.link).then((response) => {
                const body$ = cheerio.load(response.data);
                news.description = body$('meta[property="og:description"]').attr('content');
                news.img_url = body$('meta[property="og:image"]').attr('content');
                callback();
              }).catch((error) => {
                console.error('Error fetching body:', error.message);
                callback();
              });
            }
          };
        }),
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });

    return newsList;
  } catch (error) {
    console.error('Error fetching data:', error.message);
    return scrapedData;
  }
}

export async function startNewsServer(app) {
  console.log('Starting news server')
  const processedTitles = new Set();
  const fallbackDate = new Date('2023-01-01T00:00:00.000Z');

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

  async function fetch_data(url, sources) {
    try {
      const response = await axios.get(url, { headers });
      let new_item_data = [];

      if (response.status === 200 && response.data) {
        const xml_data = response.data;
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(xml_data);

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

            const uniqueKey = generateUniqueKey(title, pubDate);

            if (await isDuplicateArticle(uniqueKey)) {
              continue;
            }

            const img_src = await extractFeaturedImage(link, sources);

            new_item_data.push({
              title,
              link,
              description: cleanedDescription,
              img_url: img_src,
              pubDate,
              sources,
              unique_key: uniqueKey,
            });

            processedTitles.add(title);
          }
        }
      }

      else {
        newsLogger.error(`Error fetching news data: ${response.status} ${url}`);
      }

      try {
        const [shareSansarData, meroLaganiData] = await Promise.all([scrapeShareSansar(), scarpeMeroLagani()]);

        new_item_data.push(...shareSansarData.filter(item => !processedTitles.has(item.title)));
        new_item_data.push(...meroLaganiData.filter(item => !processedTitles.has(item.title)));

        const uniqueNewItems = [];

        for (const item of new_item_data) {
          if (!await isDuplicateArticle(item.unique_key)) {
            uniqueNewItems.push(item);
          }
        }

       // await newsModel.create(uniqueNewItems);

        for (const data of uniqueNewItems) {
          const messageData = {
            type: 'news',
            title: data.title,
            description: data.description,
            image: data.img_url,
            url: data.link,
          };
          notifyClients(messageData);
        }
      } catch (error) {
        newsLogger.error(`Error saving news data to database: ${error}`);
      }
    } catch (error) {
      newsLogger.error(`Error fetching news data: ${url} : ${error}`);
    }
  }


  app.get('/news', async (req, res) => {
    newsLogger.info('News data requested');
    try {
      const page = parseInt(req.query._page) || 1;
      const limit = parseInt(req.query.limit) || 100;

      const options = {
        page: page,
        limit: limit,
        sort: { _id: -1 },
      };

      const result = await newsModel.paginate({}, options);
      res.json(result.docs);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  async function initiateFetchCycle() {
    const fetch_data_promises = newsSources.map(({ url, source }) => {
      return async () => {
        await fetch_data(url, source);
      };
    });

    async function fetchAndRecurse() {
      await new Promise((resolve, reject) => {
        parallel(fetch_data_promises, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      const pauseDuration = 30 * 1000;
      setTimeout(fetchAndRecurse, pauseDuration);
    }

    fetchAndRecurse();
  }

  initiateFetchCycle();
}