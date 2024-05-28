/* eslint-disable no-unused-vars */

/* eslint-disable no-undef */
import https from 'https';
import allCompanies from "./all_companies.js";
import TokenManager from "./token_manager.js";


process.emitWarning = (warning) => {
    if (warning.name !== 'UnsupportedWarning') {
        //
    }
};
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

const tokenManagerInstance = new TokenManager();
let accessToken = null;
let refreshToken = null;
let salts = [];

async function initializeTokenManager() {
    await tokenManagerInstance.update();
    accessToken = tokenManagerInstance.accessToken;
    refreshToken = tokenManagerInstance.refreshToken;
    salts = tokenManagerInstance.salts;
    console.log("Nepse Token Manager Initialized");
}

let isTokenManagerInitialized = false;

//setting up https agent
const httpsAgent = new https.Agent({
    maxSockets: 2,
    maxFreeSockets: 2,
    timeout: 100,
    keepAlive: true,
    keepAliveMsecs: 60000,
    maxCachedSessions: 100,
    httpProtocol: 'http/1.1',
});

async function getHeaders() {
    if (!isTokenManagerInitialized) {
        await initializeTokenManager();
        isTokenManagerInitialized = true;
        console.log("Token Manager Initialized");

    }
    const headers = {
        "Authorization": "Salter " + accessToken,
        "Content-Type": "application/json",
        "Host": "www.nepalstock.com",
        "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "close",
        "Referer": "www.nepalstock.com",
        "Pragma": "no-cache",
        "Cache-Control": "no-cache",
        "TE": "Trailers"
    };

    return headers;
}

//asking headers only once
const fetchHeaders = await getHeaders();

//tested and working
const singleFetch = async (url, reqType) => {
    const baseURL = "https://www.nepalstock.com";
    const originalValue = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    if (reqType) {
        const body = reqType === "APOST" ? (await preparePostRequestIndex()).body : await preparePostRequest();

        //const normalPostRequest = await preparePostRequest();
        //const { body } = await preparePostRequestIndex();
        const res = await fetch(baseURL + url, {
            method: "POST",
            headers: fetchHeaders,
            agent: httpsAgent,
            body: body,
            timeout: 5000
        });

        if (!res.ok || res.status !== 200) {
            console.log("Error in fetching data", res.status, res.statusText, res.url, res.headers.raw());
            return {};
        }
        return res.json();
    }

    const res = await fetch(baseURL + url, {
        headers: fetchHeaders,
        agent: httpsAgent,
        timeout: 5000
    });

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalValue;
    //error handling
    if (!res.ok || res.status !== 200) {
        return {};
    }
    return res.json();
}


export async function is_NepseOpen() {
    return await singleFetch("/api/nots/nepse-data/market-open");
}

// async function generateDummyID() {
//     // // const { headers, httpsAgent } = await getHeaders();
//     // const response = await singleFetch("/api/nots/nepse-data/market-open");
//     // // , {
//     // //     headers: headers,
//     // //     agent: httpsAgent
//     // // });
//     return await singleFetch("/api/nots/nepse-data/market-open");
// }

//works for majority but not all post requests //
export async function preparePostRequest() {
    const dummyRawData = await singleFetch("/api/nots/nepse-data/market-open");
    const day = new Date().getDate();

    const dummyId = dummyData[dummyRawData.id] + dummyRawData.id + 2 * day;
    const body = JSON.stringify({ "id": dummyId });
    return body;
}


//for some post requests like of index graph
export async function preparePostRequestIndex() {
    const normalPostRequest = await preparePostRequest();
    const e = JSON.parse(normalPostRequest); //doubtful //if error then check here

    const day = new Date().getDate();
    const postPayloadId = (
        e.id +
        (e.id % 10 < 5 ? tokenManagerInstance.salts[3] : 1) * day -
        (e.id % 10 < 5 ? tokenManagerInstance.salts[2] : tokenManagerInstance.salts[0])
    );
    return { body: JSON.stringify({ "id": postPayloadId }) };
}

//other top level functions
//functional
export async function get_NepseSummary() {
    const nepseSummary = await singleFetch("/api/nots/market-summary/");
    const formattedSummary = nepseSummary.reduce((acc, curr) => {
        acc[curr.detail] = curr.value;
        return acc;
    }, {});
    return formattedSummary;
}

//functional
export async function get_NepseIndex() {
    return await singleFetch("/api/nots/nepse-index");
}

//functional
export async function get_NepseTopGainer(category = "top-gainer") {

    let url = "/api/nots/top-ten/";

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
    return await singleFetch(url);
}


//functional
export async function get_NepsePriceVolume() {
    return await singleFetch("/api/nots/securityDailyTradeStat/58");
}


//functional
export async function get_NepseSubIndices() {
    return await singleFetch("/api/nots");
}

//functional
export async function get_NepseCompanyList() {
    return await singleFetch("/api/nots/company/list");
}

//POST requests
export async function get_ItemDailyIndexGraph(item = 'NEPSE') {

    let url = "/api/nots/graph/index/";

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
    return await singleFetch(url, "APOST");
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

    return await singleFetch("/api/nots/security");
}

//functional
export async function get_NepseCompanyPriceVolumeHistory(symbol, startDate, endDate) {

    endDate = endDate || new Date().toISOString().split('T')[0]
    startDate = startDate || new Date(new Date().setDate(new Date().getDate() - 365)).toISOString().slice(0, 10)

    symbol = symbol.toUpperCase();
    const id = allCompanies[symbol];

    return await singleFetch(`/api/nots/market/history/security/${id}?&size=500&startDate=${startDate}&endDate=${endDate}`);
}

// need testing in live market
export async function get_NepseCompanySupplyDemand(symbol) {
    return await singleFetch(`https://www.nepalstock.com/api/nots/api/nots/nepse-data/supplydemand/${symbol}`);
}

export async function get_NepseCompanyDetails(symbol = 'NABIL') {
    //const originalValue = process.env.NODE_TLS_REJECT_UNAUTHORIZED;

    //returns company details full just like CompanyDetails of nepseApi from python

    const id = allCompanies[symbol];
    // process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    // const { body, headers, httpsAgent } = await preparePostRequest();

    // const res1 = await fetch("https://www.nepalstock.com/api/nots/security/" + id, {
    //   method: "POST",
    //   headers: headers,
    //   agent: httpsAgent,
    //   body: body
    // });
    // const response = res1.ok ? await res1.json() : {};
    // process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalValue;

    return await singleFetch("/api/nots/security/" + id, "NPOST");
}



export default { get_NepseCompanyDetails, get_NepseCompanyPriceVolumeHistory, get_NepseSecurityList, get_ItemDailyIndexGraph, get_NepseSummary, get_NepseIndex, get_NepseTopGainer, get_NepsePriceVolume, get_NepseSubIndices, get_NepseCompanyList, is_NepseOpen };
