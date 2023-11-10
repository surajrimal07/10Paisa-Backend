import axios from 'axios';
import dotenv from 'dotenv';
import { JSDOM } from 'jsdom';
import mongoose from 'mongoose';
import wss from 'ws';
import xml2js from 'xml2js';
import { secondDB } from '../database/db.js';

dotenv.config();

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
      pubDate: Date, // Field to store the pubDate extracted from RSS
      source : String
    }, { collection: 'news_collection' }); // Assign the collection name

    // Create a Mongoose model based on the schema
    const NewsItem = connection.model('NewsItem', newsItemSchema);

    // Set to keep track of processed titles and prevent duplicates in the same fetch cycle
    const processedTitles = new Set();

    // Function to compare two objects
    function isEqual(obj1, obj2) {
      return JSON.stringify(obj1) === JSON.stringify(obj2);
    }

    // Function to extract the source from the link
    function extractSource(link) {
      try {
        const url = new URL(link);
        const domainParts = url.hostname.split('.');
        const source = domainParts.length > 1 ? domainParts[1] : domainParts[0];
        return source;
      } catch (error) {
        console.error('Error extracting source:', error);
        return ''; // return empty string in case of error
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



    // const htmlToText = (html) => {
    //   const element = document.createElement('div');
    //   element.innerHTML = html;
    //   return element.textContent || element.innerText || '';
    // };

    // const cleanHTML = (description) => {
    //   return htmlToText(description.replace(/<[^>]+>/g, ''));
    // };

    // Fetch data function
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
                continue; // Skip already processed items in the same fetch cycle
              }

              const link = item_elem.link && item_elem.link[0].trim();
              const description = item_elem.description && item_elem.description[0];
              const pubDate = item_elem.pubDate && new Date(item_elem.pubDate[0]); // Extract pubDate from RSS

              const img_tags = item_elem['content:encoded']
                ? new JSDOM(item_elem['content:encoded'][0]).window.document.querySelectorAll('img')
                : [];

              const img_src = img_tags.length > 0 ? img_tags[0].src : null;

              const source = extractSource(link);
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
                console.log(`added new item ${title}`);
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
    }

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

    //Fetch data initially and periodically
    async function initiateFetchCycle() {
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

      // for (const url of urls) {
      //   await fetch_data(url);
      // }

      // setInterval(async () => {
      //   for (const url of urls) {
      //     await fetch_data(url);
      //   }
      // }, 1 * 60 * 1000); // Run every 5 minutes


 //new

    // async function fetchAndLog(url) {
    //   await fetch_data(url);
    // }

    // function startCountdown(minutes) {
    //   return new Promise(resolve => {
    //     const interval = setInterval(() => {
    //       console.log(`${minutes} minutes to refresh`);
    //       minutes -= 1;
    //       if (minutes <= 0) {
    //         clearInterval(interval);
    //         resolve();
    //       }
    //     }, 60 * 1000); // Log every minute
    //   });
    // }

    // async function initiateFetchAndCountdown() {
    //   for (const url of urls) {
    //     await fetchAndLog(url);
    //   }

    //   await startCountdown(4);

    //   setInterval(async () => {
    //     for (const url of urls) {
    //       await fetchAndLog(url);
    //     }
    //     await startCountdown(4);
    //   }, 5 * 60 * 1000); // Start the fetch cycle every 5 minutes
    // }


    //new
    async function fetchAndRecurse() {
      for (const url of urls) {
        await fetch_data(url);
      }

      setTimeout(fetchAndRecurse, 5 * 60 * 1000); // 5 minutes
    }

    // Start the process
    fetchAndRecurse();
  }

  // Start the process
  initiateFetchCycle();

  } catch (error) {
    console.error('Error establishing the connection:', error);
  }
}
