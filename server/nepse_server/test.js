import {
  get_NepseFloorsheet,
  fetchFloorsheetsInChunkss,
} from "./singletonNepseServer.js";

async function nepseFloorsheets() {
  const floorsheet = await get_NepseFloorsheet();
  if (!floorsheet || floorsheet == undefined) {
    console.log("Error fetching floorsheet data");
  }

  return floorsheet;
}

async function nepseFloorsheetv() {
  try {
    const { data, lastPageNumber } = await fetchFloorsheetsInChunkss(0);
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

//await nepseFloorsheet();
