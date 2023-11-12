import axios from 'axios';
import crypto from 'crypto';
import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import xml2js from 'xml2js';
import newsSources from '../middleware/newsUrl.js';
import newsModel from '../models/newsModel.js';
import extractFeaturedImage from '../server/imageServer.js';

export async function startNewsServer(app) {
    const processedTitles = new Set();
    const fallbackDate = new Date('2023-01-01T00:00:00.000Z');

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

    let wss;

    function createWebSocketServer() {
      const server = createServer(app);

      wss =  new WebSocketServer({ server });

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


      if (wss.readyState === WebSocketServer.OPEN) {   //webSocket.OPEN
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

        wss.clients.forEach(function each(client) {
          if (client.readyState === WebSocket.OPEN) {

            const messageString = JSON.stringify(message);
            client.send(messageString);
          } else {
            console.log("Client state is not OPEN. Error occurred.");
          }
        });
      }


    async function fetch_data(url,sources) {
        try {
          const response = await axios.get(url);
          let newItemsCount = 0;

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

                //const img_src = item_elem.link && item_elem.link[0].trim();
                const img_src = await extractFeaturedImage(link, sources);

                const cleanedDescription = cleanDescription(description); // Clean description

                if (await isDuplicateArticle(title, pubDate)) {
                  continue;
                }

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
                    //console.log(`found new item from ${source}. Total count: ${newsCountBySource[source]}`);

                    const messageData = {
                      title: new_item_data.title,
                      description: new_item_data.description,
                      image: new_item_data.img_url,
                      url: new_item_data.link
                    };

                    notifyClients(wss, messageData);
                    newItemsCount++;

                  } catch (error) {
                    console.error('Error adding item:', error);
                  }

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
            await fetch_data(url,source);

          }
          const pauseDuration = 30 * 1000;
          console.log(`Fetch cycle completed.\nFound ${newItemsCount} new items.`);
          console.log("Pausing cycle");
          //console.log(`Pausing fetch for ${pauseDuration / 1000} seconds`);
          setTimeout(() => fetchAndRecurse(wss), pauseDuration);

        }

        fetchAndRecurse();

      }

    initiateFetchCycle();
}
