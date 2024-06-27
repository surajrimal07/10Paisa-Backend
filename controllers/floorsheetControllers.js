import { GetFloorsheet } from "../server/floorsheetServer.js";
import { apiLogger } from "../utils/logger/logger.js";
import { respondWithError } from "../utils/response_utils.js";

export const fetchFloorsheetData = async (req, res) => {
    const refreshParam = req.query.refresh || "";

    try {

        const data = await GetFloorsheet(refreshParam.toLowerCase() === "refresh");
        if (!data) {
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