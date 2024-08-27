import { get_NepseFloorsheet, fetchFloorsheetsInChunks} from './singletonNepseServer.js';

async function nepseFloorsheet() {
    const floorsheet = await get_NepseFloorsheet();
    if (!floorsheet || floorsheet == undefined) {
        console.log("Error fetching floorsheet data");
    }

    return floorsheet;
}


async function nepseFloorsheet2() {
    try {
        const { data, lastPageNumber } = await fetchFloorsheetsInChunks(369);
        if (!data || data.length === 0) {
            console.log("No floorsheet data received.");
        } else {
            console.log(`Last page number in this batch: ${lastPageNumber}`);
            console.log(`Received ${data.length} entries.`);
        }
        return { data, lastPageNumber };
    } catch (error) {
        console.error("Error fetching floorsheet data:", error);
        return { data: [], lastContractId: null };
    }
}

await nepseFloorsheet();