import axios from 'axios';
import crypto from 'crypto';
import { createServer } from 'http';
import { WebSocket } from 'ws';
//import { WebSocketServer } from 'ws';

import xml2js from 'xml2js';
import newsSources from '../middleware/newsUrl.js';
import newsModel from '../models/newsModel.js';
//import extractFeaturedImage from '../server/imageServer.js';

export async function startNewsServer(app) {
    const processedTitles = new Set();

    const newsCountBySource = {};
    const fallbackDate = new Date('2023-01-01T00:00:00.000Z'); // Use a specific date

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

      // function extractSource(link) {
      //   try {
      //     const url = new URL(link);
      //     const domainParts = url.hostname.split('.');
      //     const knownTLDs = ['com', 'org', 'net', 'gov', 'edu','.com.np','.np'];

      //     let source;

      //     if (knownTLDs.includes(domainParts[domainParts.length - 1])) {
      //       source = domainParts.length > 1 ? domainParts[domainParts.length - 2] : domainParts[0];
      //     } else {
      //       source = domainParts[domainParts.length - 1];
      //     }

      //     return source;
      //   } catch (error) {
      //     console.error('Error extracting source:', error);
      //     return '';
      //   }
      // }

    let wss; // Declare the WebSocket server

    function createWebSocketServer() {
      const server = createServer(app);

      //wss = new WebSocketServer({ server }); //
      wss = new WebSocket.Server({ server });

      wss.on('connection', function connection(ws) {
        console.log('Client connected to WebSocket server');
      });

      wss.on('message', function incoming(message) {
        console.log('received: %s', message);
      });

      wss.on('close', function close() {
        console.log('WebSocket Server closed');
      });

      wss.on('error', function error(err) {
        console.error('WebSocket Server Error:', err);
      });

//if (wss.readyState === WebSocketServer.OPEN) {

      if (wss.readyState === webSocket.OPEN) {   //webSocket.OPEN
        console.log('WebSocket connection is open.');
      }

      server.listen(8081, () => {
        console.log('WebSocket server is running on port 8081');
      });

      return wss;
    }

    createWebSocketServer();

    function notifyClients(wss, message) {
        if (!wss) {
          console.log("WSS ERROR: Web Socket Server is not available!");
          return;
        }

        wss.clients.forEach(function each(client) {   // === WebSockets.OPEN) {
          if (client.readyState === WebSocket.OPEN) { //=== WebSockets.OPEN) {
            const messageString = JSON.stringify(message);
            client.send(messageString);
          } else {
            console.log("Client state is not OPEN. Error occurred.");
          }
        });
      }


      // async function fetch_image(link, sources) {
      //   for (const source of sources) {
      //     try {
      //       const img_src = await extractFeaturedImage(link, source);
      //       console.log(link,source)
      //       console.log('Image Source:', img_src);
      //       return img_src;
      //     } catch (error) {
      //       console.error('Featured image extraction failed for the specified publisher.');
      //     }
      //   }
      // }

    async function fetch_data(url,sources) {
        try {
          //console.log(`Running Fetch Cycle`);
          const response = await axios.get(url);

          if (response.status === 200) {
            const xml_data = response.data;
            const parser = new xml2js.Parser();
            const result = await parser.parseStringPromise(xml_data);

            if (result.rss && result.rss.channel && result.rss.channel[0] && result.rss.channel[0].item) {
              for (const item_elem of result.rss.channel[0].item) {
                const title = item_elem.title && item_elem.title[0];

                const link = item_elem.link && item_elem.link[0].trim();
                const description = item_elem.description && item_elem.description[0];
                const pubDateN = item_elem.pubDate && new Date(item_elem.pubDate[0]);
                const pubDate = pubDateN || fallbackDate;  //check if pub date is null or not

                const img_src = item_elem.link && item_elem.link[0].trim();
                //const img_src = await extractFeaturedImage(link, sources);

                const cleanedDescription = cleanDescription(description); // Clean description

                if (await isDuplicateArticle(title, pubDate)) {
                  continue;
                }

                const uniqueKey = generateUniqueKey(title, pubDate);

                newsCountBySource[sources] = (newsCountBySource[sources] || 0) + 1;

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

                  if (!newsCountBySource[sources]) {
                    newsCountBySource[sources] = 1;
                    console.log(`found new item from ${sources}. Total count: ${newsCountBySource[sources]}`);
                  } else {
                    newsCountBySource[sources]++;
                    console.log(`found new item from ${sources}. Total count: ${newsCountBySource[sources]}`);
                  }

                  try {
                    await newsModel.create(new_item_data);
                    //console.log(`found new item from ${source}. Total count: ${newsCountBySource[source]}`);

                    const messageData = {
                      title: new_item_data.title,
                      description: new_item_data.description,
                      image: new_item_data.img_url,
                      url: new_item_data.link
                    };

                    notifyClients(wss, messageData);

                  } catch (error) {
                    console.error('Error adding item:', error);
                  }

                  newsCountBySource[sources]++;
                 // exp
              }
            } else {
              console.error('Required XML structure not found for', url);
            }
          }
        } catch (error) {
          console.error('Error fetching or parsing data:', error);
        }
      }

      app.get('/news', async (req, res) => {
        try {
          const items = await newsModel.find().exec();
          const item_list = items.map((item) => ({
            title: item.title,
            link: item.link,
            description: item.description,
            img_url: item.img_url,
            source: item.source
          }));
          const reversedItemList = item_list.reverse();
          res.json(reversedItemList);
        } catch (error) {
          console.error('Error retrieving items:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      });

    async function initiateFetchCycle() {

    async function fetchAndRecurse(wss) {
      console.log(`Running Fetch Cycle`);
          for (const { url, source } of newsSources) {
            console.log("line 255 debug source is"+ source);
            await fetch_data(url,source);

          }
          const pauseDuration = 30 * 1000;
          console.log(`Pausing fetch for ${pauseDuration / 1000} seconds`);
          setTimeout(() => fetchAndRecurse(wss), pauseDuration);

        }

        fetchAndRecurse();

      }

    initiateFetchCycle();
}
