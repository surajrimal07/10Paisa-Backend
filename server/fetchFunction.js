import { NEPSE_ACTIVE_API_URL, serverUrls, switchServer } from "../controllers/refreshController.js";
import { assetLogger } from "../utils/logger/logger.js";

export async function fetchData(url, timeout, customurl = false) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let completeUrl;
    if (customurl) {
         completeUrl = url;
    } else {
         completeUrl = NEPSE_ACTIVE_API_URL + `${url}`;
    }
    
    try {
        const response = await fetch(completeUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            assetLogger.error(`HTTP error! status: ${response.status}`);
            return null;
        }

        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            assetLogger.error(`Request aborted due to timeout after ${timeout} ms`);
        } else {
            assetLogger.error(`Fetch error: ${error.message}`);
        }

        return null;
    }
}


export async function fetchFunction(url, timeout = 80000) {
    let response;
    let data;

    for (let i = 0; i < serverUrls.length; i++) {
        try {
            response = await fetchData(url, timeout);
            if (!response) {
                assetLogger.error(`Fetch failed for URL: ${NEPSE_ACTIVE_API_URL} ${url}`);
                await switchServer();
                continue;
            }

            data = await response.json();
            if (Array.isArray(data) && data.length === 0) {
                assetLogger.warn(`Received empty data for URL: ${NEPSE_ACTIVE_API_URL} ${url}`);
                await switchServer();
                continue;
            }

            return data;

        } catch (error) {
            assetLogger.error(`Error at fetchFunction: ${error.message}`);
            await switchServer();
        }
    }

    return null;
}
