import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
//import { isNepseOpen } from "../controllers/refreshController.js";
import { fetchFromCache, saveToCache } from "../controllers/savefetchCache.js";
import { fetchFunction } from "./fetchFunction.js";

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


export async function GetFloorsheet(refresh = false) {
    const url = '/Floorsheet';
    const lastBusinessDay = await fetchFromCache("lastBusinessDate");

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const parentDir = path.resolve(__dirname, '..');

    try {
        if (!refresh) { //|| !isNepseOpen()
            const cachedfloorsheet = await fetchFromCache("floorsheet");

            if (cachedfloorsheet !== null && cachedfloorsheet !== undefined) {
                return cachedfloorsheet;
            }
        }

        const response = await fetchFunction(url, 50000);

        if (!response) {
            console.error('Error fetching data from server');
            return null;
        }

        await saveToCache("floorsheet", response);

        const fileName = path.join(parentDir, `public/floorsheet/${lastBusinessDay}.json`);

        console.log(`Writing floorsheet data to file: ${fileName}`);

        if (!fs.existsSync(fileName)) {
            console.log(`Creating new file: ${fileName}`);
            fs.writeFileSync(fileName, JSON.stringify([response], null, 2));
        } else {
            const existingData = JSON.parse(fs.readFileSync(fileName, 'utf8'));
            existingData.push(response);
            fs.writeFileSync(fileName, JSON.stringify(existingData, null, 2));
        }

        return response;
    } catch (error) {
        console.error(`Error fetching data from server: ${error.message}`);
        return null;
    }
}