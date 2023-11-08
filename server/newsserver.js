import axios from 'axios';
import dotenv from 'dotenv';
import { JSDOM } from 'jsdom';
import mongoose from 'mongoose';
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

    // Create a Mongoose schema for the news items
    const newsItemSchema = new mongoose.Schema({
      title: String,
      link: String,
      description: String,
      img_url: String,
    });

    // Create a Mongoose model based on the schema
    const NewsItem = connection.model('NewsItem', newsItemSchema);

    // URLs (your URL configurations go here)
    const tele_url = "https://telegraphnepal.com/feed/";
    const online_url = "https://english.onlinekhabar.com/feed/";
    const onlinenp_url = "https://www.onlinekhabar.com/feed";
    const ratoen_url = "https://english.ratopati.com/rss/";
    const setoen_url = "https://en.setopati.com/feed";
    const radhanien_url = "https://rajdhanidaily.com/feed/";
    const nagariknp_url = "https://nagariknews.nagariknetwork.com/feed";
    const osnnp_url = "https://www.osnepal.com/feed";
    const arthik_url = "https://abhiyandaily.com/abhiyanrss";
    const arthasarokar_url = "https://arthasarokar.com/feed";
    const karobardaily_url = "https://www.karobardaily.com/feed";
    const khabarhub_url = "https://english.khabarhub.com/feed";

    // Function to compare two objects
    function isEqual(obj1, obj2) {
      return JSON.stringify(obj1) === JSON.stringify(obj2);
    }

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
              const link = item_elem.link && item_elem.link[0];
              const description = item_elem.description && item_elem.description[0];

              const img_tags = item_elem['content:encoded']
                ? new JSDOM(item_elem['content:encoded'][0]).window.document.querySelectorAll('img')
                : [];

              const img_src = img_tags.length > 0 ? img_tags[0].src : null;

              const new_item_data = {
                title,
                link,
                description,
                img_url: img_src,
              };

              const existing_item = await NewsItem.findOne({ title, link, description, img_url: img_src });

              if (existing_item === null) {
                console.log(`found new item: ${title}`);
                await NewsItem.create(new_item_data);
                console.log(`added new item ${title}`);
              } else {
                // Check for duplicates using isEqual function
                if (isEqual(new_item_data, existing_item)) {
                  console.log(`duplicate element from ${title}`);
                } else {
                  console.log(`found new item: ${title}`);
                  await NewsItem.create(new_item_data);
                  console.log(`added new item ${title}`);
                }
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
          title: item.title,
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
    setTimeout(async () => {
        await fetch_data(tele_url);
        await fetch_data(online_url);
        await fetch_data(onlinenp_url);
        await fetch_data(ratoen_url);
        await fetch_data(setoen_url);
        await fetch_data(radhanien_url);
        await fetch_data(nagariknp_url);
        await fetch_data(osnnp_url);
        await fetch_data(arthik_url);
        await fetch_data(arthasarokar_url);
        await fetch_data(karobardaily_url);
        await fetch_data(khabarhub_url);
      }, 5000);

    setInterval(async () => {
      await fetch_data(tele_url);
      await fetch_data(online_url);
      await fetch_data(onlinenp_url);
      await fetch_data(ratoen_url);
      await fetch_data(setoen_url);
      await fetch_data(radhanien_url);
      await fetch_data(nagariknp_url);
      await fetch_data(osnnp_url);
      await fetch_data(arthik_url);
      await fetch_data(arthasarokar_url);
      await fetch_data(karobardaily_url);
      await fetch_data(khabarhub_url);
    }, 1 * 60 * 1000); // Run every 5 minutes

  } catch (error) {
    console.error('Error establishing the connection:', error);
  }
}
