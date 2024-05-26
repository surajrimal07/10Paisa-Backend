import axios from 'axios';
import * as cheerio from 'cheerio';
import newsSources from '../middleware/newsUrl.js';
import { createheaders } from '../utils/headers.js';
import { newsLogger } from '../utils/logger/logger.js';

async function extractFeaturedImage(url, publisher) {
  const headers = createheaders(url);
  try {
    const response = await axios.get(url, { headers });
    const html = response.data;

    const $ = cheerio.load(html);

    let featuredImageUrl;

    if (publisher === newsSources[5].source) {
      featuredImageUrl = await extractImageSetopati($);
    } else if (publisher === newsSources[1].source) {
      featuredImageUrl = await extractImageOnlineKhabar($);
    } else if (publisher == newsSources[0].source) {
      featuredImageUrl = await extractImageOnlineKhabarEnglish($);
    } else if (publisher == newsSources[2].source) {
      featuredImageUrl = await ratoen($);
    } else if (publisher == newsSources[3].source) {
      featuredImageUrl = await ratoen($);
    } else if (publisher == newsSources[6].source) {
      featuredImageUrl = await ratoen($);
    } else if (publisher == newsSources[7].source) {
      featuredImageUrl = await ratoen($);
    } else if (publisher == newsSources[8].source) {
      featuredImageUrl = await ratoen($);
    } else if (publisher == newsSources[9].source) {
      featuredImageUrl = await ratoen($);
    } else if (publisher == newsSources[10].source) {
      featuredImageUrl = await arthasa($);
    } else if (publisher == newsSources[11].source) {
      featuredImageUrl = await karobardaily($);
    } else if (publisher == newsSources[12].source) {
      featuredImageUrl = await ratoen($);
    } else if (publisher == newsSources[13].source) {
      featuredImageUrl = await himal($);
    } else if (publisher == newsSources[14].source) {
      featuredImageUrl = await ratoen($);
    } else if (publisher == newsSources[15].source) {
      featuredImageUrl = await arthapathex($);
    } else if (publisher == newsSources[16].source) {
      featuredImageUrl = await ratoen($);
    } else if (publisher == newsSources[17].source) {
      featuredImageUrl = await ratoen($);
    } else if (publisher == newsSources[18].source) {
      featuredImageUrl = await clickmandu($);
    } else if (publisher == newsSources[4].source) {
      featuredImageUrl = await setoen($); //seto eng
    } else if (publisher == newsSources[19].source) {
      featuredImageUrl = await extractGlobalAawaj($); //Global Aawaj
    } else if (publisher == newsSources[20].source) { //Nepal Views
      featuredImageUrl = await extractNepalViews($);
    } else if (publisher == newsSources[21].source) { //Nepal Press
      featuredImageUrl = await extractNepalPress($);
    } else if (publisher == newsSources[22].source) { //Khabar Hub
      featuredImageUrl = await extractNepalPress($);
    } else if (publisher == newsSources[23].source) { //Nepali Patra
      featuredImageUrl = await extractNepalPress($);
    } else if (publisher == newsSources[24].source) { //Mero Auto
      featuredImageUrl = await extractNepalPress($);
    } else if (publisher == newsSources[25].source) { //Gorkha Patra
      featuredImageUrl = await extraceGorkhaPatra($);
    } else if (publisher == newsSources[26].source) { //Aanapurna Post
      featuredImageUrl = await extraceGorkhaPatra($); //metapropery og image
    } else if (publisher == newsSources[30].source) { //Sourya Online.
      featuredImageUrl = await extraceGorkhaPatra($); //metapropery og image
    } else if (publisher == newsSources[31].source) { //Ujyaalo Online
      featuredImageUrl = await extractUjayaloOnline($);
    } else if (publisher == newsSources[32].source) { //Rising Nepal Daily
      featuredImageUrl = await extraceGorkhaPatra($); //metapropery og image
    } else if (publisher == newsSources[35].source) { //BizKhabar
      featuredImageUrl = await extractBizKhabar($); //metapropery og image
    }

    if (featuredImageUrl && featuredImageUrl.length > 0) {
      return featuredImageUrl;
    } else {
      newsLogger.error(`Featured image extraction failed for ${publisher} at ${url} response received: ${featuredImageUrl}`);
      return null;
    }
  }
  catch (error) {
    newsLogger.error(`Error fetching article data from the specified ${url} : ${error}`);
    return null;
  }
}
// async function extractFeaturedImage(url, publisher) {
//   try {
//     const response = await axios.get(url, { headers });
//     const html = response.data;
//     const $ = cheerio.load(html);

//     let featuredImageUrl;

//     switch (publisher) {
//       case newsSources[0].source:
//         featuredImageUrl = await extractImageOnlineKhabarEnglish($);
//         break;
//       case newsSources[1].source:
//         featuredImageUrl = await extractImageOnlineKhabar($);
//         break;
//       case newsSources[2].source:
//       case newsSources[3].source:
//       case newsSources[6].source:
//       case newsSources[7].source:
//       case newsSources[9].source:
//       case newsSources[12].source:
//       case newsSources[14].source:
//       case newsSources[16].source:
//       case newsSources[17].source:
//         featuredImageUrl = await ratoen($);
//         break;
//       case newsSources[10].source:
//         featuredImageUrl = await arthasa($);
//         break;
//       case newsSources[11].source:
//         featuredImageUrl = await karobardaily($);
//         break;
//       case newsSources[13].source:
//         featuredImageUrl = await himal($);
//         break;
//       case newsSources[18].source:
//         featuredImageUrl = await clickmandu($);
//         break;
//       case newsSources[4].source:
//         featuredImageUrl = await setoen($); //seto eng
//         break;
//       case newsSources[19].source:
//         featuredImageUrl = await extractGlobalAawaj($); //Global Aawaj
//         break;
//       case newsSources[20].source:
//         featuredImageUrl = await extractNepalViews($); //Nepal Views
//         break;
//       case newsSources[21].source:
//       case newsSources[22].source:
//       case newsSources[23].source:
//       case newsSources[24].source:
//         featuredImageUrl = await extractNepalPress($); //Nepal Press, Khabar Hub, Nepali Patra, Mero Auto
//         break;
//       case newsSources[25].source:
//         featuredImageUrl = await extraceGorkhaPatra(); //Gorkha Patra
//       default:
//         featuredImageUrl = null;
//     }

//     return featuredImageUrl;
//   } catch (error) {
//     newsLogger.error(`Error fetching article data from the specified ${url} : ${error}`);
//     return null;
//   }
// }

async function extractUjayaloOnline($) {
  const imageUrl = $('figure.uk-text-center img').attr('src');
  return imageUrl;
};

async function extractBizKhabar($) {
  const imageUrl = $('figure img').attr('src');
  return imageUrl;

}

async function arthapathex($) {
  const featuredImageElement = $('img[class="attachment-full size-full wp-post-image"]');
  return featuredImageElement.attr('src');
}

async function arthasa($) {
  const ogImageMeta = $('meta[property="og:image"]');
  const imageUrl = ogImageMeta.attr('content');
  const cleanedImageUrl = imageUrl.replace(/\?.*$/, '');
  return cleanedImageUrl;
}

async function extraceGorkhaPatra($) {
  const ogImageTag = $('meta[property="og:image"]');
  return ogImageTag.attr('content');
};

async function extractNepalPress($) {
  const ogImageTag = $('meta[property="og:image"]');
  return ogImageTag.attr('content');
};

async function extractGlobalAawaj($) {
  const ogImageTag = $('meta[property="og:image"]');
  return ogImageTag.attr('content');
};

async function extractNepalViews($) {
  const ogImageTag = $('meta[property="og:image"]');
  return ogImageTag.attr('content');
};

async function extractImageOnlineKhabar($) {
  const featuredImageElement = $('.ok-post-detail-featured-img .post-thumbnail img');
  return featuredImageElement.attr('src');
}

async function extractImageOnlineKhabarEnglish($) {
  const ogImageTag = $('meta[property="og:image"]');
  return ogImageTag.attr('content');
}

async function ratoen($) {
  const ogImageTag = $('meta[property="og:image"]');
  return ogImageTag.attr('content');
}


async function bizmandu($) {
  const ogImageTag = $('meta[property="og:image"]');
  return ogImageTag.attr('content');
}

async function extractImageSetopati($) {
  const featuredImageElement = $('.new-featured-image img');
  return featuredImageElement.attr('src');
}

async function karobardaily($) {
  const featuredImageElement = $('.single-content-section img');
  return featuredImageElement.attr('src');
}

async function himal($) {
  const featuredImageElement = $('.content-main-block img');
  return featuredImageElement.attr('src');
}

async function clickmandu($) {
  const ogImageTag = $('meta[property="og:image"]');
  return ogImageTag.attr('content');
}

async function setoen($) {
  const featuredImageElement = $('.featured-images img');
  return featuredImageElement.attr('src');
}


export default extractFeaturedImage;




// const articleUrl = 'https://www.setopati.com/nepali-brand/316241';
// const setopati = newsSources[5].source
// extractFeaturedImage(articleUrl,setopati);

// const article2 = 'https://www.onlinekhabar.com/2023/11/1394337';
// const onlinekhabar = newsSources[0].source
// extractFeaturedImage(article2,onlinekhabar);

// const article3 = 'https://english.onlinekhabar.com/nepal-governance-politics-stability.html';
// const onlinekhabareng = newsSources[2].source
// extractFeaturedImage(article3,onlinekhabareng);

//english ratopati
// const ratoart = 'https://english.ratopati.com/story/31305';
// const ratopub = newsSources[2].source
// extractFeaturedImage(ratoart,ratopub);

// const ratonp = 'https://www.ratopati.com/story/395990/sorry-condition-of-airport-in-nepal-';
// const ratonppub =newsSources[3].source
// extractFeaturedImage(ratonp,ratonppub);

// const rajdhaniart = 'https://rajdhanidaily.com/id/88208/';
// const rajdhanisrc =newsSources[6].source
// extractFeaturedImage(rajdhaniart,rajdhanisrc);

// const nagarikart = 'https://nagariknews.nagariknetwork.com/politics/1352951-1700442974.html';
// const nagariksrc =newsSources[7].source
// extractFeaturedImage(nagarikart,nagariksrc);

// const osnepalart = 'https://www.osnepal.com/466455';
// const osnepalsrc =newsSources[8].source
// extractFeaturedImage(osnepalart,osnepalsrc);

// const aviyanart = 'https://abhiyandaily.com/newscategory-detail/433010';
// const aviyansrc =newsSources[9].source
// extractFeaturedImage(aviyanart,aviyansrc);

// const arthasarokar = 'https://arthasarokar.com/2023/11/laghubitta-46.html';
// const arthasarosrc = newsSources[10].source
// extractFeaturedImage(arthasarokar,arthasarosrc);

// const karobarart = 'https://www.karobardaily.com/news/239196';
// const karobarsrc = newsSources[11].source
// extractFeaturedImage(karobarart,karobarsrc);

// const khabaren = 'https://english.khabarhub.com/2023/20/326826/';
// const khabarensrc = newsSources[12].source
// extractFeaturedImage(khabaren, khabarensrc);

// const himalart = 'https://www.himalkhabar.com/news/138843';
// const himalsrc = "himalkhabar"
// extractFeaturedImage(himalart,himalsrc);

// const biz = 'https://bizmandu.com/content/20231112123120.html';
// const bizsrc = "bizmandu"
// extractFeaturedImage(biz,bizsrc);

// const arthapathart = 'https://www.arthapath.com/banner-first/2023/11/12/130663/';
// const arthpathsrc = "arthapath"
// extractFeaturedImage(arthapathart,arthpathsrc);

// const capitalart = 'https://www.capitalnepal.com/detail/43438';
// const capitalsrc = "capital"
// extractFeaturedImage(capitalart,capitalsrc);

// const ukera = 'https://www.ukeraa.com/news/detail/141193/';
// const ukersrc = "ukeraa"
// extractFeaturedImage(ukera,ukersrc);

// const cliart = 'https://clickmandu.com/2023/11/276421.html';
// const clisrc = "click"
// extractFeaturedImage(cliart,clisrc);

// const cliart = 'https://en.setopati.com/social/162058';
// const clisrc = "setoeng"
// extractFeaturedImage(cliart,clisrc);


// const cliart = 'https://www.arthapath.com/banner-first/2024/05/09/143419/';
// const clisrc = "Arthapath"
// extractFeaturedImage(cliart, clisrc).then((data) => {
//   console.log(data);
// }).catch((error) => {
//   console.error('Error in scraping:', error.message);
// });
