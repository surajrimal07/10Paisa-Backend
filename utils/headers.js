/* eslint-disable no-undef */

const cleanReferer = referer => referer ? referer.replace(/^(https?:\/\/)?(www\.)?/i, '').split('/')[0] ? `https://${referer.replace(/^(https?:\/\/)?(www\.)?/i, '').split('/')[0]}` : '' : '';

export const createheaders = (referer) => {
  const cleanedUrl = cleanReferer(referer);
  const headers = {
    'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0",
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "en-US,en;q=0.9,ne;q=0.8",
    //  "Accept-Encoding": "gzip, deflate, br, zstd", //this is causing issue in some sites
    "cache-control": "max-age=0",
    "priority": "u=0, i",
    "sec-ch-ua": "\"Chromium\";v=\"124\", \"Microsoft Edge\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "sec-gpc": "1",
    'DNT': "1",
    'Connection': "keep-alive",
    "upgrade-insecure-requests": "1"
  };

  if (referer) {
    headers['Referer'] = cleanedUrl;
  }

  return headers;
};
export const getGadgetByteHeader = () => {
  const headers = {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "max-age=0",
    "priority": "u=0, i",
    "sec-ch-ua": "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Microsoft Edge\";v=\"126\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "sec-gpc": "1",
    "upgrade-insecure-requests": "1"
  }

  return headers
};

export async function nepseHeaders() {

  const generateNewToken = (e) => {
    const n1 = cdx(e.salt1, e.salt2, e.salt3, e.salt4, e.salt5);
    const n2 = rdx(e.salt1, e.salt2, e.salt4, e.salt3, e.salt5);
    const n3 = bdx(e.salt1, e.salt2, e.salt4, e.salt3, e.salt5);
    const n4 = ndx(e.salt1, e.salt2, e.salt4, e.salt3, e.salt5);
    const n5 = mdx(e.salt1, e.salt2, e.salt4, e.salt3, e.salt5);

    const authorizationKey = e.accessToken.slice(0, n1) + e.accessToken.slice(n1 + 1, n2) + e.accessToken.slice(n2 + 1, n3) + e.accessToken.slice(n3 + 1, n4) + e.accessToken.slice(n4 + 1, n5) + e.accessToken.slice(n5 + 1);
    return authorizationKey;
  }

  const res = await fetch("https://nepalstock.com.np/api/authenticate/prove");
  const resJson = await res.json();

  const authorization = "Salter " + generateNewToken(resJson);

  const headers = {
    "Authorization": authorization,
    "Content-Type": "application/json",
    "Host": "nepalstock.com.np"
  };

  return headers;
}

export const dummyData = [
  147, 117, 239, 143, 157, 312, 161, 612, 512, 804,
  411, 527, 170, 511, 421, 667, 764, 621, 301, 106,
  133, 793, 411, 511, 312, 423, 344, 346, 653, 758,
  342, 222, 236, 811, 711, 611, 122, 447, 128, 199,
  183, 135, 489, 703, 800, 745, 152, 863, 134, 211,
  142, 564, 375, 793, 212, 153, 138, 153, 648, 611,
  151, 649, 318, 143, 117, 756, 119, 141, 717, 113,
  112, 146, 162, 660, 693, 261, 362, 354, 251, 641,
  157, 178, 631, 192, 734, 445, 192, 883, 187, 122,
  591, 731, 852, 384, 565, 596, 451, 772, 624, 691
];

export default { createheaders, nepseHeaders, dummyData };
