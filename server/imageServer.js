import axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs';
import newsSources from '../middleware/newsUrl.js';

let errorDetails = [];

async function extractFeaturedImage(url, publisher) {
    try {
      const response = await axios.get(url);
      const html = response.data;

      const $ = cheerio.load(html);

      let featuredImageUrl;

      if (publisher === newsSources[5].source) {
        featuredImageUrl = await extractImageSetopati($);
      } else if (publisher === newsSources[1].source) {
        featuredImageUrl = await extractImageOnlineKhabar($);
      } else if (publisher == newsSources[0].source) {
        featuredImageUrl = await extractImageOnlineKhabarEnglish($);
      } else if  (publisher ==newsSources[2].source) {
        featuredImageUrl = await ratoen($);
      }else if  (publisher ==newsSources[3].source) {
        featuredImageUrl = await ratoen($);
      }else if  (publisher ==newsSources[6].source) {
        featuredImageUrl = await ratoen($);
      }else if  (publisher ==newsSources[7].source) {
        featuredImageUrl = await ratoen($);
      }else if  (publisher ==newsSources[8].source) {
        featuredImageUrl = ratoen($);
      }else if  (publisher ==newsSources[9].source) {
        featuredImageUrl = await ratoen($);
      }else if  (publisher ==newsSources[10].source) {
        featuredImageUrl = await arthasa($);
      }else if  (publisher ==newsSources[11].source) {
        featuredImageUrl = await karobardaily($);
      }else if  (publisher ==newsSources[12].source) {
        featuredImageUrl = await ratoen($);
      }else if  (publisher ==newsSources[13].source) {
        featuredImageUrl = await himal($);
      }else if  (publisher ==newsSources[14].source) {
        featuredImageUrl = await ratoen($);
      }else if  (publisher ==newsSources[15].source) {
        featuredImageUrl = await arthapathex($);
      }else if  (publisher ==newsSources[16].source) {
        featuredImageUrl = await ratoen($);
      }else if  (publisher ==newsSources[17].source) {
        featuredImageUrl = await ratoen($);
      }else if  (publisher ==newsSources[18].source) {
        featuredImageUrl = await clickmandu($);
      }else if  (publisher ==newsSources[4].source) {
        featuredImageUrl = await setoen($); //seto eng
      }

      if (featuredImageUrl) {
        console.log(featuredImageUrl);

        return featuredImageUrl;
      } else {
        console.log('Featured image failed '+ publisher);
        console.log(url)

        const errorInfo = {
          error: 'image extraction failed',
          publisher,
          url,
        };

        try {
          fs.writeFileSync('errorDetails.json', JSON.stringify(errorInfo, null, 2));
        } catch (error) {
          console.error('Error writing json:', error);
        }
        return null;
      }
    } catch (error) {

      console.error('Error:', error.message);
      return error;
    }
  }

async function extractImageSetopati($) {
    const featuredImageElement = $('.new-featured-image img');
    return featuredImageElement.attr('src');
  }

  async function extractImageOnlineKhabar($) {
    const featuredImageElement = $('.ok-post-detail-featured-img .post-thumbnail img');
    return featuredImageElement.attr('src');
  }


async function extractImageOnlineKhabarEnglish($) {
    const ogImageTag = $('meta[property="og:image"]');

    if (ogImageTag.length > 0) {
      return ogImageTag.attr('content');
    } else {
      console.log('og:image meta tag not found on the page.');
      return null;
    }
  }

async function ratoen($) {
    const ogImageTag = $('meta[property="og:image"]');

    if (ogImageTag.length > 0) {
      return ogImageTag.attr('content');
    } else {
      console.log('og:image meta tag not found on the page for Publisher 4.');
      return null;
    }
}

async function arthasa($) {
    const ogImageMeta = $('meta[property="og:image"]');

    if (ogImageMeta.length > 0) {
      const imageUrl = ogImageMeta.attr('content');

      const cleanedImageUrl = imageUrl.replace(/\?.*$/, '');

      return cleanedImageUrl;
    } else {
      console.log('og:image meta tag not found for Publisher with additional code.');
    }

    console.log('Featured image extraction failed for the specified publisher.');
    return null;
  }


async function karobardaily($) {
const featuredImageElement = $('.single-content-section img');

if (featuredImageElement.length > 0) {
    const imageUrl = featuredImageElement.attr('src');

    return imageUrl;
} else {
    console.log('Image element not found for karobardaily');
}

console.log('Featured image extraction failed for karobardaily');
return null;
}

async function himal($) {
    const featuredImageElement = $('.content-main-block img');

    if (featuredImageElement.length > 0) {
      const imageUrl = featuredImageElement.attr('src');

      return imageUrl;
    } else {
      console.log('Image element not found for the new publisher.');
    }

    console.log('Featured image extraction failed for the specified publisher.');
    return null;
  }

async function arthapathex($) {
const featuredImageElement = $('img[class="attachment-full size-full wp-post-image"]');

if (featuredImageElement.length > 0) {
    const imageUrl = featuredImageElement.attr('src');

    return imageUrl;
} else {
    console.log('Image element not found for the new publisher.');
}

console.log('Featured image extraction failed for the specified publisher.');
return null;
}

async function clickmandu($) {

    const featuredImageElement = $('figure.wp-block-image img');

    if (featuredImageElement.length >= 3) {
      const imageUrl = featuredImageElement.eq(2).attr('src');
      const cleanedImageUrl = imageUrl.replace(/\?.*$/, '');
      //console.log('Featured Image URL:', imageUrl);

      return cleanedImageUrl;
    } else {
      console.log('Image element not found for the new publisher.');
    }

    console.log('Featured image extraction failed for the specified publisher.');
    return null;
    }

async function setoen($) {
    const featuredImageElement = $('.featured-images img');

    if (featuredImageElement.length > 0) {
      const imageUrl = featuredImageElement.attr('src');
      //console.log('Featured Image URL:', imageUrl);

        return imageUrl;
    } else {
        console.log('Featured image element not found for the new publisher.');
    }

    console.log('Featured image extraction failed for the specified publisher.');
    return null;
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

const khabaren = 'https://english.khabarhub.com/2023/20/326826/';
const khabarensrc = newsSources[12].source
extractFeaturedImage(khabaren,khabarensrc);

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

