// import axios from 'axios';
// import crypto from 'crypto';
// import xml2js from 'xml2js';
// import newsSources from '../middleware/newsUrl.js';
// import newsModel from '../models/newsModel.js';
// import { headers } from '../utils/headers.js';
// import extractFeaturedImage from './imageServer.js';
// import { notifyClients } from './websocket.js';

// export async function startNewsServer(app) {
//   const processedTitles = new Set();
//   const fallbackDate = new Date('2023-01-01T00:00:00.000Z');
//   let newItemsCount = 0;

//   function generateUniqueKey(title, pubDate) {
//     const hash = crypto.createHash('sha256');
//     hash.update(title + pubDate);
//     return hash.digest('hex');
//   }

//   async function isDuplicateArticle(title, pubDate) {
//     const uniqueKey = generateUniqueKey(title, pubDate);

//     const existing_item = await newsModel.findOne({
//       unique_key: uniqueKey,
//     });

//     return existing_item !== null;
//   }

//   const cleanDescription = (desc) => {
//     return desc
//       .replace(/<[^>]+>/g, '')
//       .replace(/\n\s+/g, '')
//       .replace(/&#8220/g, '')
//       .replace(/\[&#8230;\]/g, '')
//       .replace(/_{76}\s*&#8220;/g, '')
//       .replace(/&nbsp;/g, '')
//       .replace(/&#8216;/g, '')
//       .replace(/&#8217;/g, '')
//       .replace(/&#\d+;/g, '')
//       .trim();
//   };

//   async function fetch_data(url, sources) {
//     try {
//       const response = await axios.get(url, { headers });

//       if (response.status === 200) {
//         const xml_data = response.data;
//         const parser = new xml2js.Parser();
//         const result = await parser.parseStringPromise(xml_data);

//         if (
//           result.rss &&
//           result.rss.channel &&
//           result.rss.channel[0] &&
//           result.rss.channel[0].item
//         ) {
//           for (const item_elem of result.rss.channel[0].item) {
//             const title = item_elem.title && item_elem.title[0];

//             const link = item_elem.link && item_elem.link[0].trim();
//             const description =
//               item_elem.description && item_elem.description[0];
//             const pubDateN = item_elem.pubDate && new Date(item_elem.pubDate[0]);
//             const pubDate = pubDateN || fallbackDate;

//             const cleanedDescription = cleanDescription(description);

//             if (await isDuplicateArticle(title, pubDate)) {
//               continue;
//             }
//             const img_src = await extractFeaturedImage(link, sources);
//             const uniqueKey = generateUniqueKey(title, pubDate);

//             const new_item_data = {
//               title,
//               link,
//               description: cleanedDescription,
//               img_url: img_src,
//               pubDate,
//               sources,
//               unique_key: uniqueKey,
//             };

//             processedTitles.add(title);

//             try {
//               await newsModel.create(new_item_data);
//               const messageData = {
//                 type: 'news',
//                 title: new_item_data.title,
//                 description: new_item_data.description,
//                 image: new_item_data.img_url,
//                 url: new_item_data.link,
//               };

//               notifyClients(messageData);
//               newItemsCount++;
//             } catch (error) {
//               //console.error('Error adding item:', error);
//             }
//           }
//         } else {
//          // console.error('Required XML structure not found for', url);
//         }
//       }
//     } catch (error) {
//       //console.error('Error fetching or parsing data:', error);
//     }
//   }

//   app.get('/news', async (req, res) => {
//     console.log('News data requested');
//     try {
//       const page = parseInt(req.query._page) || 1;
//       const limit = parseInt(req.query.limit) || 100;
//      // console.log('page and limit requested is ', page, limit);

//       const options = {
//         page: page,
//         limit: limit,
//         sort: { _id: -1 },
//       };

//       const result = await newsModel.paginate({}, options);
//       res.json(result.docs);
//     } catch (error) {
//      // console.error('Error retrieving items:', error);
//       res.status(500).json({ error: 'Internal Server Error' });
//     }
//   });

//   async function initiateFetchCycle() {
//     async function fetchAndRecurse() {
//       for (const { url, source } of newsSources) {
//         await fetch_data(url, source);
//       }
//       const pauseDuration = 30 * 1000;
//       // console.log(`cycle completed.\nFound ${newItemsCount} new items.`);
//       // console.log('Pausing cycle');
//       setTimeout(() => fetchAndRecurse(), pauseDuration);
//     }

//     fetchAndRecurse();
//   }

//   initiateFetchCycle();
// }

// import axios from 'axios';
// import crypto from 'crypto';
// import xml2js from 'xml2js';
// import newsSources from '../middleware/newsUrl.js';
// import newsModel from '../models/newsModel.js';
// import { headers } from '../utils/headers.js';
// import extractFeaturedImage from './imageServer.js';
// import { notifyClients } from './websocket.js';

// export async function startNewsServer(app) {
//   const processedTitles = new Set();
//   const fallbackDate = new Date('2023-01-01T00:00:00.000Z');
//   let newItemsCount = 0;

//   function generateUniqueKey(title, pubDate) {
//     const hash = crypto.createHash('sha256');
//     hash.update(title + pubDate);
//     return hash.digest('hex');
//   }

//   async function isDuplicateArticle(title, pubDate) {
//     const uniqueKey = generateUniqueKey(title, pubDate);

//     const existing_item = await newsModel.findOne({
//       unique_key: uniqueKey,
//     });

//     return existing_item !== null;
//   }

//   const cleanDescription = (desc) => {
//     return desc
//       .replace(/<[^>]+>/g, '')
//       .replace(/\n\s+/g, '')
//       .replace(/&#8220/g, '')
//       .replace(/\[&#8230;\]/g, '')
//       .replace(/_{76}\s*&#8220;/g, '')
//       .replace(/&nbsp;/g, '')
//       .replace(/&#8216;/g, '')
//       .replace(/&#8217;/g, '')
//       .replace(/&#\d+;/g, '')
//       .trim();
//   };

//   async function fetch_data(url, sources) {
//     try {
//       const { data: xml_data } = await axios.get(url, { headers });

//       const parser = new xml2js.Parser();
//       const { rss } = await parser.parseStringPromise(xml_data);

//       if (rss && rss.channel && rss.channel[0] && rss.channel[0].item) {
//         const items = rss.channel[0].item;

//         for (const item_elem of items) {
//           const { title, link, description, pubDate: [pubDate] = [fallbackDate] } = item_elem;
//           const cleanedDescription = cleanDescription(description);

//           if (await isDuplicateArticle(title, pubDate)) {
//             continue;
//           }

//           const img_src = await extractFeaturedImage(link, sources);
//           const uniqueKey = generateUniqueKey(title, pubDate);

//           const new_item_data = {
//             title,
//             link,
//             description: cleanedDescription,
//             img_url: img_src,
//             pubDate,
//             sources,
//             unique_key: uniqueKey,
//           };

//           processedTitles.add(title);

//           await Promise.all([
//             newsModel.create(new_item_data),
//             notifyClients({
//               type: 'news',
//               title: new_item_data.title,
//               description: new_item_data.description,
//               image: new_item_data.img_url,
//               url: new_item_data.link,
//             }),
//           ]);
//           newItemsCount++;
//         }
//       } else {
//         // Handle XML structure not found
//       }
//     } catch (error) {
//       // Handle fetch or parsing errors
//     }
//   }

//   app.get('/news', async (req, res) => {
//     console.log('News data requested');
//     try {
//       const page = parseInt(req.query._page) || 1;
//       const limit = parseInt(req.query.limit) || 100;

//       const options = {
//         page: page,
//         limit: limit,
//         sort: { _id: -1 },
//       };

//       const result = await newsModel.paginate({}, options);
//       res.json(result.docs);
//     } catch (error) {
//       res.status(500).json({ error: 'Internal Server Error' });
//     }
//   });

//   async function initiateFetchCycle() {
//     async function fetchAndRecurse() {
//       for (const { url, source } of newsSources) {
//         await fetch_data(url, source);
//       }
//       const pauseDuration = 30 * 1000;
//       setTimeout(() => fetchAndRecurse(), pauseDuration);
//     }

//     fetchAndRecurse();
//   }

//   initiateFetchCycle();
// }


import axios from 'axios';
import crypto from 'crypto';
import xml2js from 'xml2js';
import newsSources from '../middleware/newsUrl.js';
import newsModel from '../models/newsModel.js';
import { headers } from '../utils/headers.js';
import extractFeaturedImage from './imageServer.js';
import { notifyClients } from './websocket.js';

export async function startNewsServer(app) {
  const processedTitles = new Set();
  const fallbackDate = new Date('2023-01-01T00:00:00.000Z');
  let newItemsCount = 0;

  function generateUniqueKey(title, pubDate) {
    const hash = crypto.createHash('sha256');
    hash.update(title + pubDate);
    return hash.digest('hex');
  }

  async function isDuplicateArticle(title, pubDate) {
    const uniqueKey = generateUniqueKey(title, pubDate);

    const existing_item = await newsModel.findOne({
      unique_key: uniqueKey,
    });

    return existing_item !== null;
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

  async function fetch_data(url, sources) {
    try {
      const response = await axios.get(url, { headers });

      if (response.status === 200) {
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

            if (await isDuplicateArticle(title, pubDate)) {
              continue;
            }
            const img_src = await extractFeaturedImage(link, sources);
            const uniqueKey = generateUniqueKey(title, pubDate);

            const new_item_data = {
              title,
              link,
              description: cleanedDescription,
              img_url: img_src,
              pubDate,
              sources,
              unique_key: uniqueKey,
            };

            processedTitles.add(title);

            try {
              await newsModel.create(new_item_data);
              const messageData = {
                type: 'news',
                title: new_item_data.title,
                description: new_item_data.description,
                image: new_item_data.img_url,
                url: new_item_data.link,
              };

              notifyClients(messageData);
              newItemsCount++;
            } catch (error) {
            }
          }
        } else {
        }
      }
    } catch (error) {
    }
  }

  app.get('/news', async (req, res) => {
    console.log('News data requested');
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
    async function fetchAndRecurse() {
      for (const { url, source } of newsSources) {
        await fetch_data(url, source);
      }
      const pauseDuration = 30 * 1000;
      setTimeout(() => fetchAndRecurse(), pauseDuration);
    }

    fetchAndRecurse();
  }

  initiateFetchCycle();
}