
/* eslint-disable no-undef */
import https from 'https';
import allCompanies from "./all_companies.js";
import { bdx, cdx, mdx, ndx, rdx } from "./prove_algorithms.js";
import TokenManager from "./token_manager.js";


process.emitWarning = (warning) => {
  if (warning.name !== 'UnsupportedWarning') {
    //do nothing //we dont care about this warning
  }
};
/*
  Algorithm to generate value for 'Authorization' header.
  Request with invalid value for the header will return with status 401
*/
const generateNewToken = (e) => {
  const n1 = cdx(e.salt1, e.salt2, e.salt3, e.salt4, e.salt5);
  const n2 = rdx(e.salt1, e.salt2, e.salt4, e.salt3, e.salt5);
  const n3 = bdx(e.salt1, e.salt2, e.salt4, e.salt3, e.salt5);
  const n4 = ndx(e.salt1, e.salt2, e.salt4, e.salt3, e.salt5);
  const n5 = mdx(e.salt1, e.salt2, e.salt4, e.salt3, e.salt5);

  const authorizationKey = e.accessToken.slice(0, n1) + e.accessToken.slice(n1 + 1, n2) + e.accessToken.slice(n2 + 1, n3) + e.accessToken.slice(n3 + 1, n4) + e.accessToken.slice(n4 + 1, n5) + e.accessToken.slice(n5 + 1);
  return authorizationKey;
}

// Needed for id payload (body)
const dummyData = [
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

// Return id from symbol
const idFromSymbol = (symbol) => {
  const id = allCompanies[symbol];
  return id;
}

export const getCompanyInfo = async (symbol) => {
  const id = idFromSymbol(symbol);
  if (!id) {
    console.log("Invalid Symbol");
    return;
  };

  const originalValue = process.env.NODE_TLS_REJECT_UNAUTHORIZED;

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const res = await fetch("https://nepalstock.com.np/api/authenticate/prove");
  const resJson = await res.json();
  const authorization = "Salter " + generateNewToken(resJson);
  const headers = {
    "Authorization": authorization,
    "Content-Type": "application/json",
    "Host": "nepalstock.com.np"
  };

  const res1 = await fetch("https://www.nepalstock.com/api/nots/nepse-data/market-open", {
    headers: headers
  });
  const marketStatus = await res1.json();

  const day = new Date().getDate();

  const dummyId = dummyData[marketStatus.id] + marketStatus.id + 2 * day;

  const body1 = JSON.stringify({ "id": dummyId });

  const raw = await fetch("https://nepalstock.com.np/api/nots/security/" + id, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Length": body1.length.toString(),
    },
    body: body1,
  });
  const content = await raw.json();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalValue;

  return content;
}

async function getHeaders() {
  const tokenManager = new TokenManager();

  await tokenManager.update();

  const accessToken = await tokenManager.getAccessToken();

  const authorization = "Salter " + accessToken;

  const httpsAgent = new https.Agent({
    maxSockets: 2,
    maxFreeSockets: 2,
    timeout: 100,
    keepAlive: true,
    keepAliveMsecs: 60000,
    maxCachedSessions: 100,
    httpProtocol: 'http/1.1',
  });

  const headers = {
    "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0",
    "Authorization": authorization,
    "Content-Type": "application/json",
    "Host": "nepalstock.com.np",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "close",
    "Referer": "",
    "Pragma": "no-cache",
    "Cache-Control": "no-cache",
    "TE": "Trailers"
  };

  return { headers, httpsAgent };
}


//functional
export async function is_NepseOpen() {
  const originalValue = process.env.NODE_TLS_REJECT_UNAUTHORIZED;

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const { headers, httpsAgent } = await getHeaders();

  const res1 = await fetch("https://www.nepalstock.com/api/nots/nepse-data/market-open", {
    headers: headers,
    agent: httpsAgent
  });
  const marketStatus = await res1.json();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalValue;

  return marketStatus;
}

async function preparePostRequest() {

  const { headers, httpsAgent } = await getHeaders();
  const res1 = await fetch("https://www.nepalstock.com/api/nots/nepse-data/market-open", {
    headers: headers
  });
  const marketStatus = await res1.json();

  const day = new Date().getDate();
  const dummyId = dummyData[marketStatus.id] + marketStatus.id + 2 * day;
  const body = JSON.stringify({ "id": dummyId });
  return { body, headers, httpsAgent }
}

async function preparePostRequestIndex() {
  const tokenManager = new TokenManager();

  const normalPostRequest = await preparePostRequest();

  await tokenManager.update();

  const e = JSON.parse(normalPostRequest.body);

  const day = new Date().getDate();
  const postPayloadId = (
    e.id +
    (e.id % 10 < 5 ? tokenManager.salts[3] : 1) * day -
    (e.id % 10 < 5 ? tokenManager.salts[2] : tokenManager.salts[0])
  );
  return { body: JSON.stringify({ "id": postPayloadId }), headers: normalPostRequest.headers, httpsAgent: normalPostRequest.httpsAgent }

}


//functional
export async function get_NepseSummary() {
  const originalValue = process.env.NODE_TLS_REJECT_UNAUTHORIZED;

  // Ignore certificate validation
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const headers = await getHeaders();

  const res1 = await fetch("https://www.nepalstock.com/api/nots/market-summary/", {
    headers: headers,
    agent: httpsAgent
  });
  const nepseSummary = await res1.json();

  const formattedSummary = nepseSummary.reduce((acc, curr) => {
    acc[curr.detail] = curr.value;
    return acc;
  }, {});

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalValue;

  return formattedSummary;
}

//functional
export async function get_NepseIndex() {
  const originalValue = process.env.NODE_TLS_REJECT_UNAUTHORIZED;

  // Ignore certificate validation
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const headers = await getHeaders();

  const res1 = await fetch("https://www.nepalstock.com/api/nots/nepse-index", {
    headers: headers,
    agent: httpsAgent
  });
  const nepseSummary = await res1.json();

  // Reset certificate validation
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalValue;

  return nepseSummary;
}

//functional
export async function get_NepseTopGainer(category = "top-gainer") {
  const originalValue = process.env.NODE_TLS_REJECT_UNAUTHORIZED;

  let url = "https://www.nepalstock.com/api/nots/top-ten/";

  switch (category) {
    case "top-loser":
      url += "top-loser";
      break;
    case "top-trade":
      url += "trade";
      break;
    case "top-transaction":
      url += "transaction";
      break;
    case "top-turnover":
      url += "turnover";
      break;
    default:
      url += "top-gainer";
      break;
  }

  // Ignore certificate validation
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const headers = await getHeaders();

  const res1 = await fetch(url, {
    headers: headers,
    agent: httpsAgent
  });

  const nepseTopGainer = await res1.json();

  // Reset certificate validation
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalValue;

  return nepseTopGainer;
}


//functional
export async function get_NepsePriceVolume() {
  const originalValue = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const headers = await getHeaders();

  const res1 = await fetch("https://www.nepalstock.com/api/nots/securityDailyTradeStat/58", {
    headers: headers,
    agent: httpsAgent
  });
  const nepsePriceVolume = await res1.json();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalValue;

  return nepsePriceVolume;
}


//functional
export async function get_NepseSubIndices() {
  const originalValue = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const headers = await getHeaders();

  const res1 = await fetch("https://www.nepalstock.com/api/nots", {
    headers: headers,
    agent: httpsAgent
  });
  const nepseNepseSubIndices = await res1.json();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalValue;

  return nepseNepseSubIndices;
}

//functional
export async function get_NepseCompanyList() {
  const originalValue = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const { headers, httpsAgent } = await getHeaders();

  const res1 = await fetch("https://www.nepalstock.com/api/nots/company/list", {
    headers: headers,
    agent: httpsAgent
  });
  const nepseCompanyList = await res1.json();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalValue;

  return nepseCompanyList;
}

//copied till here


//empty response //post request
export async function get_ItemDailyIndexGraph(item = 'NEPSE') {
  const originalValue = process.env.NODE_TLS_REJECT_UNAUTHORIZED;

  console.log(`Getting daily index graph for ${item}`)

  let url = "https://www.nepalstock.com/api/nots/graph/index/";

  switch (item) {
    case "NEPSE":
      url += "58";
      break;
    case "SENSITIVE":
      url += "57";
      break;
    case "FLOAT":
      url += "62";
      break;
    case "SENSITIVEFLOAT":
      url += "63";
      break;
    case "BANK":
      url += "51";
      break;
    case "DEVB":
      url += "55";
      break;
    case "FIN":
      url += "60";
      break;
    case "HOTEL":
      url += "52";
      break;
    case "HYDRO":
      url += "54";
      break;
    case "INVEST":
      url += "67";
      break;
    case "LIFEINSU":
      url += "65";
      break;
    case "NONLIFEINSU":
      url += "59";
      break;
    case "MANU":
      url += "56";
      break;
    case "MICRO":
      url += "64";
      break;
    case "OTHER":
      url += "53";
      break;
    case "MUTUAL":
      url += "66";
      break;
    case "TRADING":
      url += "61";
      break;
    default:
      url += "58";
      break;
  }

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const { body, headers, httpsAgent } = await preparePostRequestIndex();

  console.log(body);

  const res1 = await fetch(url, {
    method: "POST",
    headers: headers,
    agent: httpsAgent,
    body: body
  });

  const response = res1.ok ? await res1.json() : {};
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalValue;

  return response;
}


//functional
export async function get_NepseSecurityList() {

  // {
  //   id: 137,
  //   symbol: 'EBL',
  //   securityName: 'Everest Bank Limited',
  //   name: '(EBL) Everest Bank Limited',
  //   activeStatus: 'A'
  // },

  const originalValue = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const { headers, httpsAgent } = await getHeaders();

  const res1 = await fetch("https://www.nepalstock.com/api/nots/security?nonDelisted=true", {
    headers: headers,
    agent: httpsAgent
  });
  const nepseSecurityList = await res1.json();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalValue;

  return nepseSecurityList;
}


//functional
export async function get_NepseCompanyPriceVolumeHistory(symbol, startDate, endDate) {

  endDate = endDate || new Date().toISOString().split('T')[0]
  startDate = startDate || new Date(new Date().setDate(new Date().getDate() - 365)).toISOString().slice(0, 10)

  symbol = symbol.toUpperCase();

  const id = idFromSymbol(symbol);
  if (!id) {
    console.log("Invalid Symbol");
    return;
  };

  // {
  //   businessDate: '2023-12-24',
  //   totalTrades: 238,
  //   totalTradedQuantity: 44028,
  //   totalTradedValue: 11289852,
  //   highPrice: 260,
  //   lowPrice: 253.1,
  //   closePrice: 253.5
  // },

  const originalValue = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const { headers, httpsAgent } = await getHeaders();

  const res1 = await fetch(`https://www.nepalstock.com/api/nots/market/history/security/${id}?&size=500&startDate=${startDate}&endDate=${endDate}`, {
    headers: headers,
    agent: httpsAgent
  });
  const nepseCompanyPriceVolumeHistory = await res1.json();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalValue;

  return nepseCompanyPriceVolumeHistory;
}

// need testing in live market
export async function get_NepseCompanySupplyDemand(symbol) {

  const originalValue = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const { headers, httpsAgent } = await getHeaders();

  const res1 = await fetch(`https://www.nepalstock.com/api/nots/api/nots/nepse-data/supplydemand`, {
    headers: headers,
    agent: httpsAgent
  });
  const nepseCompanyPriceVolumeHistory = await res1.json();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalValue;

  return nepseCompanyPriceVolumeHistory;
}

//functional
export async function get_NepseCompanyDetails(symbol = 'NABIL') {
  const originalValue = process.env.NODE_TLS_REJECT_UNAUTHORIZED;

  //returns company details full just like CompanyDetails of nepseApi from python

  const id = idFromSymbol(symbol);
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const { body, headers, httpsAgent } = await preparePostRequest();

  const res1 = await fetch("https://www.nepalstock.com/api/nots/security/" + id, {
    method: "POST",
    headers: headers,
    agent: httpsAgent,
    body: body
  });
  const response = res1.ok ? await res1.json() : {};
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalValue;

  return response;
}



export default { get_NepseCompanySupplyDemand, get_NepseCompanyPriceVolumeHistory, get_NepseSecurityList, getCompanyInfo, get_ItemDailyIndexGraph, get_NepseCompanyList, get_NepseSubIndices, is_NepseOpen, get_NepseSummary, get_NepseIndex, get_NepseTopGainer, get_NepsePriceVolume }
