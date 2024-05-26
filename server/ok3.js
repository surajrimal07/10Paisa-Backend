//sharesansar parser
const news = fetch("https://www.sharesansar.com/category/latest", {
    "headers": {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-US,en;q=0.9,ne;q=0.8",
        "cache-control": "max-age=0",
        "priority": "u=0, i",
        "sec-ch-ua": "\"Chromium\";v=\"124\", \"Microsoft Edge\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "cookie": "_ga=GA1.1.226892968.1702885063; _ga_FPXFBP3MT9=GS1.1.1702885062.1.1.1702886988.60.0.0; XSRF-TOKEN=eyJpdiI6Ikd2NGE4LzZ1dkU1dEZwbWduM1U3QUE9PSIsInZhbHVlIjoicXN2Z1hJVG9kZ1BGZUVHNXpjSm9wS21EUWJHNFpYSkEwTUl3V09mcHZ2dm82VmJqcEFkU3lMa1k4ZVcvdVdub2RPQkNLdVlidk9oeU53OGNGZlVZYnBDOXNnV25uaitoTGZzQXBGWkFpWUZPZnVTSjRDMkN6Z0doRVJYOUNNWkoiLCJtYWMiOiJiMjNjNWY0ODJlNjUxYjQ5MWI3ZTJiMTc3NDRlMWRiNWUxOGIwMjUwNDVkOGRlNGVjMDg2NWQ1Y2EzOTgyNDkyIn0%3D; sharesansar_session=eyJpdiI6IlJEOFJXbUdUSHhadlF0V01mWTB6SUE9PSIsInZhbHVlIjoieUpSTW81RFh6NHlDWmVvR2FkS3lXRFZDa2JieU9WZldmRXp2NTNVWnJ2c2FaTVBqYUFlNVNjWmptUkRaMitkV1U0RjVrRWEyYWJ1QjBxN0xJV1A2b0NiNVdqN0UwbUgxL3kwdWpOYk9wc1lyY1d3MHB1WktGZFNMbW1SZUIySnMiLCJtYWMiOiI1ZmExZGIwZjQ1NGU4OWM4OWJmMzEyZDkxYWQ0NjAwZjgxY2M0MGYwZjU0N2NhZDM2YTQ4M2ZmYzQxOGE3MzNiIn0%3D",
        "Referer": "https://www.sharesansar.com/news-page",
        "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": null,
    "method": "GET"
});

import axios from 'axios';
import cheerio from 'cheerio';
import xml2js from 'xml2js';

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

            promises.push(
                axios.get(newsURL).then((bodyResponse) => {
                    const body$ = cheerio.load(bodyResponse.data);
                    const bodyContent = body$('#newsdetail-content').find('p').first().text().trim();

                    const newsData = {
                        title,
                        imgURL,
                        newsURL,
                        datePublished,
                        bodyContent,
                    };

                    scrapedData.push(newsData);
                }).catch((error) => {
                    console.error('Error fetching body:', error.message);
                })
            );
        });

        await Promise.all(promises);

        return scrapedData;
    } catch (error) {
        console.error('Error fetching data:', error.message);
        return scrapedData;
    }
}

// scrapeShareSansar().then(data => {
//     console.log(data);
// }).catch(error => {
//     console.error('Error in scraping:', error.message);
// });


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

            newsList.push(news);
        });

        await Promise.all(newsList.map(async (news) => {
            try {
                const response = await axios.get(news.link);
                const body$ = cheerio.load(response.data);
                news.description = body$('meta[property="og:description"]').attr('content');
                news.img_url = body$('meta[property="og:image"]').attr('content');
            } catch (error) {
                console.error('Error fetching body:', error.message);
            }
        }));

        return newsList;
    } catch (error) {
        console.error('Error fetching data:', error.message);
        return scrapedData;
    }

}

async function scarpeGorkhaPatra() {
    const url = 'https://gorkhapatraonline.com/rss';
    const newsList = [];

    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        console.log(response.data);

        const newsItems = $('item').map((index, element) => {
            const title = $(element).find('title').text().trim();
            const link = $(element).find('link').text().trim();
            const description = $(element).find('description').text().trim();
            const imageUrl = $(element).find('media\\:thumbnail').attr('url').trim();
            const pubDate = $(element).find('pubDate').text().trim();

            return { title, link, description, imageUrl, pubDate };
        }).get();

        return newsItems;

    } catch (error) {
        console.error('Error fetching data:', error.message);
        return scrapedData;
    }
}

async function scrapeEkantipur() {
    const url = 'https://ekantipur.com/news';
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const newsList = [];

    $('article.normal').each((index, element) => {
        const title = $(element).find('h2 a').text().trim();
        const publishDate = $('#hdnRequestDate').attr('value').trim();
        const description = $(element).find('p').text().trim();
        const newsLink = `https://ekantipur.com${$(element).find('h2 a').attr('href').trim()}`;
        const imageSrc = $(element).find('img').attr('data-src');
        const imageLink = imageSrc ? decodeURIComponent(imageSrc.split('src=')[1]).replace(/&w=301&h=0$/, '') : '';

        const newsItem = {
            title,
            publishDate,
            description,
            newsLink,
            imageLink
        };

        newsList.push(newsItem);
    });

    return newsList;
}

//console.log(await scrapeEkantipur());

// scarpeMeroLagani().then(data => {
//     console.log(data);
// }).catch(error => {
//     console.error('Error in scraping:', error.message);
// });


// scrapeData();

// scrapeBody('https://www.sharesansar.com/newsdetail/bids-received-in-auction-of-arun-valley-hydropower-ordinary-shares-opened-what-is-the-cut-off-rate-2024-05-09')


// async function arthapathex(url) {
//     const response = await axios.get(url);
//     const html = response.data;

//     const $ = cheerio.load(html);

//     const featuredImageElement = $('img[class="attachment-full size-full wp-post-image"]');

//     if (featuredImageElement.length > 0) {
//         const imageUrl = featuredImageElement.attr('src');

//         return imageUrl;
//     } else {
//         console.log('Featured image extraction failed for arthapath');
//     }

//     console.log('Featured image extraction failed for arthapath');
//     return null;
// }
// console.log(await arthapathex('https://www.arthapath.com/banner-first/2024/05/09/143419/'));



async function scrapeHimalayan() {

    const url = 'https://www.bizkhabar.com/feed';
    const response = await axios.get(url);
    if (response.status == 200) {
        const result = await new xml2js.Parser().parseStringPromise(response.data);

        if (result.rss.channel[0].item) {
            const newsList = result.rss.channel[0].item.map((item) => {
                return {
                    title: item.title[0],
                    link: item.link[0],
                    description: item.description[0],
                    pubDate: item.pubDate[0],
                    //img_url: item['media:content'][0].$.url.trim()
                }
            });
            return newsList;
        }

    }

};

scrapeHimalayan().then(data => {
    console.log(data);
})

