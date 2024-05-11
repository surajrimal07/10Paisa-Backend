
const cleanReferer = referer => referer ? referer.replace(/^(https?:\/\/)?(www\.)?/i, '').split('/')[0] ? `https://${referer.replace(/^(https?:\/\/)?(www\.)?/i, '').split('/')[0]}` : '' : '';

export const createheaders = (referer) => {
  const cleanedUrl = cleanReferer(referer);
  const headers = {
    'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "en-US,en;q=0.9,ne;q=0.8",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "cache-control": "max-age=0",
    "if-modified-since": "Sat, 11 May 2024 05:55:21 GMT",
    "if-none-match": "W/\"d938f0e78c2a7d51591cdcb712409f1d\"",
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

export default { createheaders };
