import { FindHighestContractAmount, FindHighestContractQuantity, GetFloorsheet } from "../server/floorsheetServer.js";
import { apiLogger } from "../utils/logger/logger.js";
import {respondWithError } from "../utils/response_utils.js";
import {fetchFromStorage } from "./savefetchCache.js";
//import { chunk_nepseFloorsheett} from '../server/floorsheetServer.js';

export const fetchFloorsheetData = async (req, res) => {
    const refreshParam = req.query.refresh || "";

    try {
        const data = await GetFloorsheet(refreshParam.toLowerCase() === "refresh");
        if (!data || data == undefined) {
            return respondWithError(
                res,
                "INTERNAL_SERVER_ERROR",
                "Internal Server Error"
            );
        }

        return res.status(200).json(data);

    } catch (error) {
        apiLogger.error(`Error fetching floorsheet data: ${error.message}`);
        return respondWithError(
            res,
            "INTERNAL_SERVER_ERROR",
            "Internal Server Error"
        );
    }
};

export const fetchTopContractQuantity = async (req, res) => {

    try {
        const data = await fetchFromStorage("floorsheet");
        if (!data || data == undefined) {
            return respondWithError(
                res,
                "INTERNAL_SERVER_ERROR",
                "Internal Server Error"
            );
        }

        const top50ContractQuantity = await FindHighestContractQuantity(data);
        return res.status(200).json(top50ContractQuantity);

    } catch (error) {
        apiLogger.error(`Error fetching top 50 contract quantity data: ${error.message}`);
        return respondWithError(
            res,
            "INTERNAL_SERVER_ERROR",
            "Internal Server Error"
        );
    }
};

export const fetchTopContractAmount = async (req, res) => {
    try {
        const data = await fetchFromStorage("floorsheet")

        if (!data) {
            return respondWithError(
                res,
                "INTERNAL_SERVER_ERROR",
                "Internal Server Error"
            );
        }

        const top50ContractAmount = await FindHighestContractAmount(data);
        return res.status(200).json(top50ContractAmount);

    } catch (error) {
        apiLogger.error(`Error fetching top 50 contract amount data: ${error.message}`);
        return respondWithError(
            res,
            "INTERNAL_SERVER_ERROR",
            "Internal Server Error"
        );
    }
};


// export async function chunk_nepseFloorsheet() {
//     try {
//         const [cachedPageNumber, cachedFetchDate] = await Promise.all([
//             fetchFromCache("lastFloorsheetPageNumber"),
//             fetchFromCache("lastChunkFloorsheetFetchedDate")
//         ]);

//         let pageNumber = cachedPageNumber || 1;
//         const currentTimestamp = Date.now();

//         if (cachedFetchDate !== null && new Date(cachedFetchDate).toDateString() !== new Date(currentTimestamp).toDateString()) {
//             pageNumber = 1;
//         }

//         const { data } = await chunk_nepseFloorsheett(pageNumber);

//         if (!data || data.length === 0) {
//             apiLogger.error("No floorsheet data received in chunk_nepseFloorsheet");
//             return null;
//         }

//         return data;

//     } catch (error) {
//         apiLogger.error(`Error fetching floorsheet data: ${error.message}`);
//         return null;
//     }
// }
