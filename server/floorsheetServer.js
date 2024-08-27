import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isNepseOpen } from "../controllers/refreshController.js";
import { fetchFromCache, saveToCache, saveTOStorage, fetchFromStorage } from "../controllers/savefetchCache.js";
import { apiLogger } from '../utils/logger/logger.js';
import { fetchFunction,fetchData } from "./fetchFunction.js";
import {fetchFloorsheetsInChunks} from '../server/nepse_server/singletonNepseServer.js';

export async function FindHighestContractQuantity(data) {
    const filteredData = data.filter(item => item.contractQuantity != null);

    const sortedData = filteredData.sort((a, b) => b.contractQuantity - a.contractQuantity);
    const top50HighestStocks = sortedData.slice(0, 50);

    return top50HighestStocks;
}

export async function FindHighestContractAmount(data) {
    const filteredData = data.filter(item => item.contractAmount != null);

    const sortedData = filteredData.sort((a, b) => b.contractAmount - a.contractAmount);
    const top50HighestStocks = sortedData.slice(0, 50);

    return top50HighestStocks;
}

export async function chunk_nepseFloorsheet(refresh = false) {
    try {
        apiLogger.info("Fetching floorsheet data in chunks");

        const [cachedPageNumber, cachedFetchDate] = await Promise.all([
            fetchFromCache("lastFloorsheetPageNumber"),
            fetchFromCache("lastChunkFloorsheetFetchedDate")
        ]);

        let pageNumber = cachedPageNumber || 0;
        const currentTimestamp = Date.now();

        if (cachedFetchDate !== null && new Date(cachedFetchDate).toDateString() !== new Date(currentTimestamp).toDateString()) {
            pageNumber = 0;
        }

        const { data, lastPageNumber } = await fetchFloorsheetsInChunks(pageNumber);

        if (!data || data.length === 0) {
            apiLogger.error("No floorsheet data received in chunk_nepseFloorsheet");
            return null;
        }

        await Promise.all([
            saveToCache("lastFloorsheetPageNumber", lastPageNumber),
            saveToCache("lastChunkFloorsheetData", data),
            saveToCache("lastChunkFloorsheetFetchedDate", currentTimestamp)
        ]);

        return data;

    } catch (error) {
        apiLogger.error(`Error fetching floorsheet data: ${error.message}`);
        return null;
    }
}


export async function GetFloorsheet(refresh = false) {
    const url = '/Floorsheet';
    const lastBusinessDay = await fetchFromCache("lastBusinessDate");

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const parentDir = path.resolve(__dirname, '..');

    try {
        const cachedfloorsheet = await fetchFromStorage("floorsheet");

        if (!refresh || !isNepseOpen) {
            if (cachedfloorsheet !== null && cachedfloorsheet !== undefined) {
                apiLogger.info('Fetching floorsheet data from cache');
                return cachedfloorsheet;
            }
        }

        let response = await fetchData('https://nepseapi.surajr.com.np/Floorsheet', 60000, true);

        if (!response) {
            response = await fetchFunction(url, 60000);
        }

        if (!response) {
            apiLogger.error('Error fetching data from server');
            return cachedfloorsheet;
        }

        await saveTOStorage("floorsheet", response);

        const fileName = path.join(parentDir, `public/floorsheet/${lastBusinessDay}.json`);

        if (!fs.existsSync(fileName)) {
            apiLogger.info(`Creating new file: ${fileName}`);
            fs.writeFileSync(fileName, JSON.stringify([response], null, 2));
        } else {
            const existingData = JSON.parse(fs.readFileSync(fileName, 'utf8'));
            existingData.push(response);
            fs.writeFileSync(fileName, JSON.stringify(existingData, null, 2));
        }

        return response;
    } catch (error) {
        apiLogger.error(`Error fetching data from server: ${error.message}`);
        return [];
    }
}