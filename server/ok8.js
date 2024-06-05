import * as cheerio from 'cheerio';
import { JSDOM } from 'jsdom';

const nepseIndexes = [
    "Banking SubIndex",
    "Development Bank Ind.",
    "Finance Index",
    "Float Index",
    "Hotels And Tourism",
    "HydroPower Index",
    "Investment",
    "Life Insurance",
    "Manufacturing And Pr.",
    "Microfinance Index",
    "Mutual Fund",
    "NEPSE Index",
    "Non Life Insurance",
    "Others Index",
    "Sensitive Float Inde.",
    "Sensitive Index",
    "Trading Index",
];

async function fetchLiveTradingData() {
    try {
        const response = await fetch("https://www.sharesansar.com/live-trading", {
            headers: {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "accept-language": "en-US,en;q=0.9",
                "cache-control": "max-age=0",
                "priority": "u=0, i",
                "sec-ch-ua": "\"Microsoft Edge\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "none",
                "sec-fetch-user": "?1",
                "upgrade-insecure-requests": "1",
                "cookie": "_ga=GA1.1.226892968.1702885063; _ga_FPXFBP3MT9=GS1.1.1702885062.1.1.1702886988.60.0.0; XSRF-TOKEN=eyJpdiI6Ik9lOFV0ZW9UZkRlNkVUWFRQcjZkcXc9PSIsInZhbHVlIjoiNkk4QkVyQk5wNWN5ODhraC83dnYyekJPZmx0bzM0UU1UV2E3Wm9lSjB3cEJOVFNSQzkxVjdZMDlKT1pCL0xWSFp5YU05WXZZcFFIQmwraEVTRDE5c3k0RGpaSE4renFRdzZJOXdESGp3RVIrOUNQMGFRNjBBU3Q5cWU2T1d5eWIiLCJtYWMiOiI5YjlkMGVkMzE1ZDFiZDBlNDFmZjMxZmQ0MjIyYjczODIzYmRmNjM3MTlkZTg4ODI2ZTNlNWFkNTRmMWYwNGE3In0%3D; sharesansar_session=eyJpdiI6InVKSzVlQzB5V1FIZldvdzZBR1lqZEE9PSIsInZhbHVlIjoiRForNWt2L2YvLy9oODdVMjRlR3h6WXBrdEhSaUhjZVRiNHZuK000Y1RHTTkzWGpnMVlKdFJ1M0dDcWZNMWxiOXNTRUpvV2hobHE2QmRLUGFwcUY5UVNrRkpHd1cwLzNiODdSczFBTW03WEF1UFdXWitSeGtoWmJFR3VnYXVlWnQiLCJtYWMiOiI1MTk0YTY1ZTgwOGQ3ZDFiY2RiY2EyMTZiNjBhNzQ2OTMyZjQzZDAwYzJlNTM3MTM3OGZmMzYxYmM3OTZiOWViIn0%3D"
            },
            referrerPolicy: "strict-origin-when-cross-origin",
            method: "GET"
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const $ = cheerio.load(await response.text());

        const stockDataWithoutName = [];
        const stockIndexData = {};

        $('#headFixed tbody tr').each((index, element) => {
            const columns = $(element).find('td');

            stockDataWithoutName.push({
                symbol: $(columns[1]).find('a').text().trim(),
                ltp: parseFloat($(columns[2]).text().trim().replace(/,/g, "")),
                pointchange: parseFloat($(columns[3]).text().trim()),
                percentchange: parseFloat($(columns[4]).text().trim()),
                open: parseFloat($(columns[5]).text().trim().replace(/,/g, "")),
                high: parseFloat($(columns[6]).text().trim().replace(/,/g, "")),
                low: parseFloat($(columns[7]).text().trim().replace(/,/g, "")),
                volume: parseFloat($(columns[8]).text().trim().replace(/,/g, "")),
                previousclose: parseFloat($(columns[9]).text().trim().replace(/,/g, ""))
            });
        });

        nepseIndexes.forEach((field) => {
            const $element = $(`h4:contains('${field}')`).closest(".mu-list");
            if ($element.length) {
                stockIndexData[field] = {
                    volume: parseInt($element.find(".mu-price").text().replace(/,/g, ""), 10) || 0,
                    index: parseFloat($element.find(".mu-value").text().replace(/,/g, "")) || 0,
                    percent: parseFloat($element.find(".mu-percent").text().replace(/%/g, "")) || 0
                };
            }
        });

        const isNepseOpen = $(".btn.btn-danger").text().trim() !== "Market Closed";
        const lastUpdated = $("#dDate").text().trim();

        return { stockDataWithoutName, stockIndexData, isNepseOpen, lastUpdated };
    } catch (error) {
        console.error(error);
        return null;
    }
}

async function fetchLiveTradingDataAPI() {
    try {
        const response = await fetch("http://localhost:8000/TradeTurnoverTransactionSubindices");

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}

console.log(await fetchLiveTradingDataAPI());

export async function FetchOldData(refresh) {

    try {

        const response = await fetch("https://www.sharesansar.com/today-share-price", {
            headers: {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "accept-language": "en-US,en;q=0.9",
                "cache-control": "max-age=0",
                "priority": "u=0, i",
                "sec-ch-ua": "\"Microsoft Edge\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "none",
                "sec-fetch-user": "?1",
                "upgrade-insecure-requests": "1",
                "cookie": "_ga=GA1.1.226892968.1702885063; _ga_FPXFBP3MT9=GS1.1.1702885062.1.1.1702886988.60.0.0; XSRF-TOKEN=eyJpdiI6IkZ1eTJmNUlscnN6Ymw4dHFsblRZZkE9PSIsInZhbHVlIjoiUGVnamRzQzRNeDJmWS9FSTZTL0JNTkF5NDdDTFFHZHdGd2xnTDVYNkk4bHZ3UDVXQWdib2gzM0FFNXFzSU9SWTNSdVpHU2pIbnI1dUIrTFFLREQwRHYvbXpRMFcvdndaYUpBMmdZWStHZzVJYkRMRnE0bXVuZnRjRmNIeEdXcnYiLCJtYWMiOiIwMzY3OGIxNjZiYzAyNGQwYWNhNWY3ZGIwZGY2OGQ3ZTA3MTUxMTE4NjhmNTgzZjNlOTYyZTA4OTY1ZTE3OWYwIn0%3D; sharesansar_session=eyJpdiI6InBmN0xVWDEwS1Q1SUFOQWM0UFNLQUE9PSIsInZhbHVlIjoidFpPaGFMb2hxVmNJVW40S2hqTm4yL1VUQ21xT3Rja2Y0WUE0eXp6VXozZUhhOVdGME0xNENTMExmVUNwaWo1TXN3WEVVeDZsam12NDFSWkFFanNueGJ2cjA2dVpNUnhZZVdhMnNOOTdSc1YrSlFOcU1CV2dvdVcwQ0hpNWxNeXIiLCJtYWMiOiJkYmNmZWVmNmE2OTVmNzUyMTBiMThmNjZhMzY3MDdjYjI0ZDkxNTc4M2ZhZGMzMTE1MTI4N2QzY2JiMmFlNjYyIn0%3D"
            },
            referrerPolicy: "strict-origin-when-cross-origin",
            method: "GET"
        });

        if (!response.ok) {
            console.log("No data found");
            return null;
        }

        const dom = new JSDOM(await response.text());
        const document = dom.window.document;

        // const scriptElements = document.querySelectorAll("script");
        // let cmpjsonArray = [];

        // scriptElements.forEach((scriptElement) => {
        //     if (scriptElement.textContent.includes("var cmpjson")) {
        //         const scriptContent = scriptElement.textContent;
        //         const jsonMatch = scriptContent.match(/var cmpjson = (\[.*\]);/);

        //         if (jsonMatch && jsonMatch[1]) {
        //             const jsonContent = jsonMatch[1];
        //             cmpjsonArray = JSON.parse(jsonContent);
        //         }
        //     }
        // });

        // //save the map of company symbol to name to json file
        // await fs.writeFile('SymbolNameMap.json', JSON.stringify(cmpjsonArray, null, 2));





        // const symbolToNameMap = cmpjsonArray.reduce((map, item) => {
        //     map[item.symbol] = item.companyname;
        //     return map;
        // }, {});

        const stockDataWithoutName = [];

        const rows = document.querySelectorAll("#headFixed tbody tr");

        rows.forEach((row) => {
            const columns = row.querySelectorAll("td");

            const stockInfo = {
                symbol: columns[1].querySelector("a").textContent.trim(),
                vwap: parseInt(columns[7].textContent.trim().replace(/,/g, "")),
                Turnover: parseInt(columns[10].textContent.replace(/,/g, "")), //controvercial
                day120: parseInt(columns[17].textContent.replace(/,/g, "")),
                day180: parseInt(columns[18].textContent.replace(/,/g, "")),
                week52high: parseInt(columns[19].textContent.replace(/,/g, "")),
                week52low: parseInt(columns[20].textContent.replace(/,/g, "")),
            };

            stockDataWithoutName.push(stockInfo);
        });

        //const enrichedData = await AddCategoryAndSector(stockDataWithoutName);
        //await saveToCache("FetchOldDatas", enrichedData);

        return stockDataWithoutName;
    } catch (error) {
        console.log(error);
    }
}





// const ok = await fetch("https://backendtradingview.systemxlite.com/tv/tv/search?limit=30&query=&type=stock&exchange=", {
//     headers: {
//         "accept": "*/*",
//         "accept-language": "en-US,en;q=0.9",
//         "if-none-match": "W/\"10228-3XI7M35y2MG4W4Pn96SmT9IgP10\"",
//         "sec-ch-ua": "\"Microsoft Edge\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
//         "sec-ch-ua-mobile": "?0",
//         "sec-ch-ua-platform": "\"Windows\"",
//         "sec-fetch-dest": "empty",
//         "sec-fetch-mode": "cors",
//         "sec-fetch-site": "same-site",
//         "sec-gpc": "1",
//         "Referer": "https://tradingview.systemxlite.com/",
//         "Referrer-Policy": "strict-origin-when-cross-origin"
//     },
//     method: "GET"
// });

// console.log(ok.body.data);



const testData = await fetch("https://merolagani.com/signalr/send?transport=serverSentEvents&connectionToken=B7s0Xa3j-knLoY9oNLXl4cDnVbNCd0CmhDNF2LjMIiAsePPthT9WYGn8BVy1JGi59MyN9NJsNcy8WaCNUHxfy4WL5CwFXgCnu6eJpOL8cmGe2pADq4Uo1TuTkeSLeSpjCeH1bmuWoesWDBf8K3wS731YY4yPlD23W3gcWZ3HT8v768YomJGVYWW-ZHZ89MqP0", {
    "headers": {
        "accept": "application/json, text/javascript, */*; q=0.01",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "priority": "u=1, i",
        "sec-ch-ua": "\"Microsoft Edge\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "sec-gpc": "1",
        "x-requested-with": "XMLHttpRequest",
        "cookie": "ASP.NET_SessionId=j2yk5ek4vwmxyx4nrsi2l3vr",
        "Referer": "https://merolagani.com/LatestMarket.aspx",
        "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": "data=%7B%22H%22%3A%22stocktickerhub%22%2C%22M%22%3A%22GetAllStocks%22%2C%22A%22%3A%5B%5D%2C%22I%22%3A0%7D",
    "method": "POST"
});


import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const parentDir = path.resolve(__dirname, '..');
const filePath = path.join(parentDir, 'public', 'index_data', 'SymbolNameMap.json');


export async function UpdateNameSymbolMapJSON() {
    try {
        let symbolNameMap = await fetch("https://www.nepsealpha.com/trading/1/search?limit=500&query=", {
            "headers": {
                "accept": "application/json, text/plain, */*",
                "sec-ch-ua": "\"Microsoft Edge\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
                "sec-ch-ua-arch": "\"x86\"",
                "sec-ch-ua-bitness": "\"64\"",
                "sec-ch-ua-full-version": "\"125.0.2535.79\"",
                "sec-ch-ua-full-version-list": "\"Microsoft Edge\";v=\"125.0.2535.79\", \"Chromium\";v=\"125.0.6422.112\", \"Not.A/Brand\";v=\"24.0.0.0\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-model": "\"\"",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-ch-ua-platform-version": "\"15.0.0\"",
                "x-requested-with": "XMLHttpRequest",
                "Referer": "https://www.nepsealpha.com/trading/chart",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "method": "GET"
        });

        if (!symbolNameMap.ok) {
            return;
        }

        symbolNameMap = await symbolNameMap.json();

        fs.writeFileSync(filePath, JSON.stringify(symbolNameMap, null, 2));
    }
    catch (error) {
        console.log(error);
    }
}

await UpdateNameSymbolMapJSON()