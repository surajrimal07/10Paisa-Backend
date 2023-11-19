// import axios from 'axios';
// import Asset from '../models/assetModel.js';

// export async function  getAssetList() {
//     try {
//         const response = await axios.get('http://localhost:9000/company/list');

//         const companies = response.data.map(company => ({
//         symbol: company.symbol,
//         name: company.companyName,
//         category: company.instrumentType,
//         sector: company.sectorName,
//             }));

//         const existingSymbols = await Asset.distinct('symbol', { symbol: { $in: companies.map(c => c.symbol) } }, { maxTimeMS: 30000 });

//         const newCompanies = companies.filter(company => !existingSymbols.includes(company.symbol));

//         if (newCompanies.length > 0) {
//         const result = await Asset.insertMany(newCompanies);
//         console.log(`${result.length} new documents inserted`);
//         } else {
//         console.log('No new documents to insert');
//         }

//   } catch (error) {
//     console.error('Error:', error.message);
//   }
// }

// getAssetList();

// assetController.js
// assetController.js
// assetController.js


// import axios from 'axios';
// import Asset from '../models/assetModel.js';

// export async function getAssetList() {
//   try {
//     const response = await axios.get('http://localhost:9000/company/list');

//     const companies = response.data.map(company => ({
//       symbol: company.symbol,
//       name: company.companyName,
//       category: company.instrumentType,
//       sector: company.sectorName,
//       // ... other fields
//     }));

//     console.log('Companies:', companies);

//     // Fetch all documents from the database
//     //const allAssets = await Asset.find().lean();

//     const allAssets = await Asset.find();

//     console.log('All Assets:', allAssets);

//     const existingSymbolSet = new Set(allAssets.map(item => item.symbol));

//     const newCompanies = companies.filter(company => !existingSymbolSet.has(company.symbol));

//     if (newCompanies.length > 0) {
//       const result = await Asset.insertMany(newCompanies);
//       console.log(`${result.length} new documents inserted`);
//     } else {
//       console.log('No new documents to insert');
//     }
//   } catch (error) {
//     console.error('Error:', error.message);
//   }
// }

// getAssetList();

//import Asset from '../models/assetModel.js';

// async function insertAssetsInChunks(assets) {
//   const batchSize = 10;
//   console.log(assets);

//   for (let i = 0; i < assets.length; i += batchSize) {
//     const chunk = assets.slice(i, i + batchSize);

//     try {
//       const result = await Asset.insertMany(chunk);
//       console.log(`${result.length} new documents inserted`);
//     } catch (error) {
//       console.error('Error during insertion:', error.message);
//     }
//   }
// }

// export async function getAssetList() {
//   console.log("Started");
//   try {
//     const response = await axios.get('http://localhost:9000/company/list');

//     const companies = response.data.map(company => ({
//       symbol: company.symbol,
//       name: company.companyName,
//       category: company.instrumentType,
//       sector: company.sectorName,
//     }));

//     console.log('Companies:', companies);

//     await insertAssetsInChunks(companies);
//   } catch (error) {
//     console.error('Error:', error.message);
//   }
// }

//getAssetList();
// import axios from 'axios';
// import Asset from '../models/assetModel.js';

// async function insertAssetsInChunks(assets) {
//   const batchSize = 10;
//   console.log(assets);

//   for (let i = 0; i < assets.length; i += batchSize) {
//     const chunk = assets.slice(i, i + batchSize);

//     try {
//       const documents = chunk.map(asset => ({
//         symbol: asset.symbol,
//         name: asset.name,
//         category: asset.category,
//         sector: asset.sector,
//         // Add other fields as needed
//       }));

//       console.log("Documents to insert:", documents);

//       const result = await Asset.insertMany(documents);

//       if (result && result.length > 0) {
//         console.log(`${result.length} new documents inserted`);
//       } else {
//         console.log('No new documents inserted');
//       }
//     } catch (error) {
//       console.error('Error during insertion:', error.message);
//     }
//   }
// }

// export async function getAssetList() {
//   console.log("Started");
//   try {
//     const response = await axios.get('http://localhost:9000/company/list');

//     const companies = response.data.map(company => ({
//       symbol: company.symbol,
//       name: company.companyName,
//       category: company.instrumentType,
//       sector: company.sectorName,
//     }));

//     console.log('Companies:', companies);

//     await insertAssetsInChunks(companies);
//   } catch (error) {
//     console.error('Error:', error.message);
//   }
// }

// getAssetList();


//hardcoded method to data entry due to buffer issue, get the json and upload from atlas
//to entry data or use individua; from api
import axios from 'axios';
import fs from 'fs/promises';

export async function fetchDataAndMapToAssetModel() {
  try {
    const response = await axios.get('http://localhost:9000/company/list');

    const assetData = response.data.map(company => ({
      symbol: company.symbol,
      name: company.companyName,
      category: company.instrumentType,
      sector: company.sectorName,
    }));

    const jsonData = JSON.stringify(assetData, null, 2);

    await fs.writeFile('mappedAssetData.json', jsonData);

    return jsonData;
  } catch (error) {
    console.error('Error fetching data:', error.message);
    throw error;
  }
}

// fetchDataAndMapToAssetModel()
//   .then(data => {
//     console.log('Mapped Asset Data:', data);
//   })
//   .catch(error => {
//     console.error('Error:', error.message);
//   });



// export async function fetchSecurityData(indexId) {

// const API_URL = 'http://localhost:9000/securityDailyTradeStat';

// try {
//     const response = await axios.get(`${API_URL}/${indexId}`);
//     return response.data.map(security => ({
//       securityName: security.securityName,
//       symbol: security.symbol,
//       totalTradeQuantity: security.totalTradeQuantity,
//       lastTradedPrice: security.lastTradedPrice,
//       percentageChange: security.percentageChange,
//       lastUpdatedDateTime: security.lastUpdatedDateTime,
//       previousClose: security.previousClose,
//     }));
//   } catch (error) {
//     console.error(`Error fetching security data for indexId ${indexId}:`, error.message);
//     throw error;
//   }
// }

// const indexId = 58;
// try {
//   const securityData = await fetchSecurityData(indexId);
//   console.log(securityData);
// } catch (error) {
// }

const API_URL = 'http://localhost:9000/securityDailyTradeStat';

export async function fetchSecurityData(indexId) {
  try {
    const response = await axios.get(`${API_URL}/${indexId}`);
    const mappedData = response.data
      .filter(security => security.symbol && security.securityName && security.symbol && security.indexId)
      .map(security => ({
        symbol: security.symbol,
        name: security.securityName,
        ltp: security.lastTradedPrice.toString(),
        totaltradedquantity: security.totalTradeQuantity.toString(),
        percentchange: security.percentageChange.toString(),
        previousclose: security.previousClose.toString(),
      }));
    return mappedData;
  } catch (error) {
    console.error(`Error fetching security data for indexId ${indexId}:`, error.message);
    throw error;
  }
}

// const indexId = 58;
// try {
//   const securityData = await fetchSecurityData(indexId);
//   console.log(securityData);
// } catch (error) {
// }

//export default {fetchSecurityData,fetchDataAndMapToAssetModel,};


//feth single security details
// fetchSingleSecurityData.js

export async function fetchSingleSecurityData( requestedSymbol) {
  try {
    const response = await axios.get(`${API_URL}/58`);
    const filteredData = response.data.filter(security => security.symbol === requestedSymbol);
    console.log(filteredData);

    if (filteredData.length === 0) {
      console.error(`Security with symbol ${requestedSymbol} not found`);
      return [];
    }

    const mappedData = filteredData.map(security => ({
      symbol: security.symbol,
      name: security.securityName,
      ltp: security.lastTradedPrice.toString(),
      totaltradedquantity: security.totalTradeQuantity.toString(),
      percentchange: security.percentageChange.toString(),
      previousclose: security.previousClose.toString(),
    }));

    return mappedData;
  } catch (error) {
    console.error(` 298 Error fetching security data :`, error.message);
    throw error;
  }
}




export default {fetchSecurityData,fetchDataAndMapToAssetModel,fetchSingleSecurityData};