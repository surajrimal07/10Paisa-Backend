import { NEPSE_ACTIVE_API_URL, serverUrls, switchServer } from "../controllers/refreshController.js";
import { assetLogger } from "../utils/logger/logger.js";

async function fetchData(url, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const completeUrl = NEPSE_ACTIVE_API_URL + `${url}`;

    const data = await fetch(completeUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!data.ok || !data) {
        return null;
    }
    return data;
}

export async function fetchFunction(url, timeout = 15000) {
    let response;
    let data;

    for (let i = 0; i < serverUrls.length; i++) {
        try {
            response = await fetchData(url, timeout);
            if (!response) {
                assetLogger.error(`HTTP error! status: ${response ? response.status : 'unknown'}`);
                switchServer();
                continue;
            }

            data = await response.json();
            if (Array.isArray(data) && data.length === 0) {
                assetLogger.warn(`Received empty data for URL: ${NEPSE_ACTIVE_API_URL} ${url}`);
                switchServer();
                continue;
            }

            return data;

        } catch (error) {
            assetLogger.error(`Error at fetchFunction: ${error.message}`);
            switchServer();
        }
    }

    return null;
}
