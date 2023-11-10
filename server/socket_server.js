import axios from 'axios';
import { createServer } from 'http';
import { JSDOM } from 'jsdom';
import mongoose from 'mongoose';
import { WebSocketServer } from 'ws';
import xml2js from 'xml2js';
import { secondDB } from '../database/db.js';

let wss;

export async function startNewsServer(app) {
  try {
    const db = await secondDB();

    if (!db) {
      console.error('Failed to establish the database connection');
      return;
    }

    const connection = db;

    const newsItemSchema = new mongoose.Schema({
      title: String,
      link: String,
      description: String,
      img_url: String,
      pubDate: Date,
      source: String,
    }, { collection: 'news_collection' });

    const NewsItem = connection.model('NewsItem', newsItemSchema);
    const processedTitles = new Set();

    function extractSource(link) {
      try {
        const url = new URL(link);
        const domainParts = url.hostname.split('.');
        const source = domainParts.length > 1 ? domainParts[1] : domainParts[0];
        return source;
      } catch (error) {
        console.error('Error extracting source:', error);
        return '';
      }
    }

    // Function to clean the description
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

    let httpServer;
    let wss;


    httpServer.listen(8080, () => {
      console.log('WebSocket server is running on port 8081');
      });

    function createWebSocketServer() {
      const server = createServer(app);
      wss = new WebSocketServer({ server });

      wss.on('connection', function connection(ws) {
        console.log('Client connected to WebSocket server');
      });

      server.listen(8080, () => {
        console.log('HTTP server is running on port 8080');
      });

      return wss;


    }

    async function fetch_data(url) {
      try {
        console.log(`running fetch on ${url}`);
        const response = await axios.get(url);

        if (response.status === 200) {
          const xml_data = response.data;
          const parser = new xml2js.Parser();
          const result = await parser.parseStringPromise(xml_data);

          if (result.rss && result.rss.channel && result.rss.channel[0] && result.rss.channel[0].item) {
            for (const item_elem of result.rss.channel[0].item) {
              const title = item_elem.title && item_elem.title[0];

              if (processedTitles.has(title)) {
                console.log(`Skipping duplicate item: ${title}`);
                continue;
              }

              const link = item_elem.link && item_elem.link[0].trim();
              const description = item_elem.description && item_elem.description[0];
              const pubDate = item_elem.pubDate && new Date(item_elem.pubDate[0]);

              const source = extractSource(link);

              const img_tags = item_elem['content:encoded']
              ? new JSDOM(item_elem['content:encoded'][0]).window.document.querySelectorAll('img')
              : [];

              const img_src = img_tags.length > 0 ? img_tags[0].src : null;

              const cleanedDescription = cleanDescription(description); // Clean description

              const new_item_data = {
                source, // Include the extracted source in the news item
                title,
                link,
                description: cleanedDescription,
                img_url: img_src,
                pubDate // Save the current time
              };

              const existing_item = await NewsItem.findOne({ title, link, description, img_url: img_src });

              if (existing_item === null) {
                console.log(`found new item: ${title}`);
                processedTitles.add(title); // Mark the title as processed
                await NewsItem.create(new_item_data);
                //console.log(`added new item ${title}`);
                notifyClients(wss, 'New news detected!');
              } else {
                console.log(`duplicate element from ${title}`);
              }
            }
          } else {
            console.error('Required XML structure not found for', url);
          }
        }
      } catch (error) {
        console.error('Error fetching or parsing data:', error);
      }
      // Fetch data function logic
    }

    function notifyClients(wss,message) {
      if (wss){
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocketServer.OPEN) {
          client.send(message);
        }
      });
    }
    }

    // async function fetch_data(url, wss) {
    //   try {
    //     console.log(`running fetch on ${url}`);
    //     const response = await axios.get(url);

    //     if (response.status === 200) {
    //       const xml_data = response.data;
    //       const parser = new xml2js.Parser();
    //       const result = await parser.parseStringPromise(xml_data);

    //       if (result.rss && result.rss.channel && result.rss.channel[0] && result.rss.channel[0].item) {
    //         for (const item_elem of result.rss.channel[0].item) {
    //           const title = item_elem.title && item_elem.title[0];

    //           if (processedTitles.has(title)) {
    //             console.log(`Skipping duplicate item: ${title}`);
    //             continue;
    //           }

    //           const link = item_elem.link && item_elem.link[0].trim();
    //           const description = item_elem.description && item_elem.description[0];
    //           const pubDate = item_elem.pubDate && new Date(item_elem.pubDate[0]);

    //           const source = extractSource(link);

    //           const img_tags = item_elem['content:encoded']
    //           ? new JSDOM(item_elem['content:encoded'][0]).window.document.querySelectorAll('img')
    //           : [];

    //           const img_src = img_tags.length > 0 ? img_tags[0].src : null;

    //           const cleanedDescription = cleanDescription(description); // Clean description

    //           const new_item_data = {
    //             source, // Include the extracted source in the news item
    //             title,
    //             link,
    //             description: cleanedDescription,
    //             img_url: img_src,
    //             pubDate // Save the current time
    //           };

    //           const existing_item = await NewsItem.findOne({ title, link, description, img_url: img_src });

    //           if (existing_item === null) {
    //             console.log(`found new item: ${title}`);
    //             processedTitles.add(title); // Mark the title as processed
    //             await NewsItem.create(new_item_data);
    //             console.log(`added new item ${title}`);
    //             notifyClients(wss, 'New news detected!');
    //           } else {
    //             console.log(`duplicate element from ${title}`);
    //           }
    //         }
    //       } else {
    //         console.error('Required XML structure not found for', url);
    //       }
    //     }
    //   } catch (error) {
    //     console.error('Error fetching or parsing data:', error);
    //   }
    // }

    // // Function to create and handle WebSocket server
    // function createWebSocketServer() {
    //   const WebSocket = require('ws');
    //   const wss = new WebSocket.Server({ port: 8081 });

    //   wss.on('connection', function connection(ws) {
    //     console.log('Client connected to WebSocket server');
    // });

    // return wss;
    // }

    // // Function to send notification to connected WebSocket clients
    // function notifyClients(wss, message) {
    //   wss.clients.forEach(function each(client) {
    //     if (client.readyState === WebSocket.OPEN) {
    //       client.send(message);
    //     }
    //   });
    // }

    // httpServer.listen(8081, () => {
    //   console.log('WebSocket server is running on port 8081');
    // });

    // Route to get items
    app.get('/news', async (req, res) => {
      try {
        const items = await NewsItem.find().exec();
        const item_list = items.map((item) => ({
          source: item.source,
          title: item.title,
          pubDate: item.pubDate,
          link: item.link,
          description: item.description,
          img_url: item.img_url,
        }));
        const reversedItemList = item_list.reverse();
        res.json(reversedItemList);
      } catch (error) {
        console.error('Error retrieving items:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    // Fetch data initially and periodically
    async function initiateFetchCycle() { //wss
      const urls = [
        "https://telegraphnepal.com/feed/",
        "https://english.onlinekhabar.com/feed/",
        "https://www.onlinekhabar.com/feed",
        "https://english.ratopati.com/rss/",
        "https://www.ratopati.com/feed",
        "https://en.setopati.com/feed",
        "https://www.setopati.com/feed",
        "https://rajdhanidaily.com/feed/",
        "https://nagariknews.nagariknetwork.com/feed",
        "https://www.osnepal.com/feed",
        "https://abhiyandaily.com/abhiyanrss",
        "https://arthasarokar.com/feed",
        "https://www.karobardaily.com/feed",
        "https://english.khabarhub.com/feed",
        "https://abhiyandaily.com/abhiyanrss",
        "https://www.himalkhabar.com/feed",
        "https://bizmandu.com/feed",
        "https://www.arthapath.com/feed",
        "https://www.capitalnepal.com/feed",
        "https://ukeraa.com/rss/",
        "https://clickmandu.com/feed"

      ];

      async function fetchAndRecurse(wss) {
        for (const url of urls) {
          await fetch_data(url);
        }

        setTimeout(fetchAndRecurse, 5 * 60 * 1000); // 5 minutes
      }

      fetchAndRecurse();
    }

    initiateFetchCycle();

  } catch (error) {
    console.error('Error establishing the connection:', error);
  }
}
