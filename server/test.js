import newsSources from '../middleware/newsUrl.js';
import extractFeaturedImage from './imageServer.js';

//console.log(newsSources[0].source);

// let link = "https://english.onlinekhabar.com/global-economy-revival.html"
// let src = "Online Khabar English"

// let bb = extractFeaturedImage(link,src)

// console.log(bb);

async function getImage() {
    let link = "https://english.onlinekhabar.com/global-economy-revival.html";
    let src = "Online Khabar English";

    try {
        const imageUrlPromise = await extractFeaturedImage(link, src);

        // Wait for the Promise to resolve and get the actual value
        const imageUrl = imageUrlPromise;

       console.log(imageUrl);

    } catch (error) {
      console.error("Error extracting featured image:", error);
    }
  }

let link = "https://english.onlinekhabar.com/global-economy-revival.html";
let src = "Online Khabar English";
//let src = newsSources[5].source

  async function fetch_image(link, sources) {
    for (const source of sources) {

        
      try {
        const img_src = await extractFeaturedImage(link, source);
        console.log(link,source)
        console.log('Image Source:', img_src);
        return img_src;
      } catch (error) {
        console.error('Featured image extraction failed for the specified publisher.');
      }
    }
  }

  fetch_image(link,src);



  //getImage();