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
//seperate the api list later on
const Gainer_URL = 'http://localhost:9000/top-ten/top-gainer?all=true';
const Looser_URL = 'http://localhost:9000/top-ten/top-loser?all=true';
const Turnover_URL = 'http://localhost:9000/top-ten/turnover?all=true';
const Volume_URL = 'http://localhost:9000/top-ten/trade?all=true';

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

export async function fetchSingleSecurityData( requestedSymbol) {
  try {
    const response = await axios.get(`${API_URL}/58`);
    const filteredData = response.data.filter(security => security.symbol === requestedSymbol);
    //console.log(filteredData);

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
    console.error(`Error fetching security data :`, error.message);
    throw error;
  }
}

export async function fetchTopGainers() {

  try {
    const gainers = await axios.get(Gainer_URL);
    const loosers = await axios.get(Looser_URL);
    const gain = gainers.data;
    const lose = loosers.data;

    const mappedGainers = gain.map(item => ({
      symbol: item.symbol,
      ltp: item.ltp || 0,
      pointChange: item.pointChange || 0,
      percentageChange: parseFloat(item.percentageChange) || 0,
      securityId: item.securityId || 0,
    }));

    const mappedLosers = lose.map(item => ({
      symbol: item.symbol,
      ltp: item.ltp || 0,
      pointChange: item.pointChange || 0,
      percentageChange: parseFloat(item.percentageChange) || 0,
      securityId: item.securityId || 0,
    }));

    const mergedData = [...mappedGainers, ...mappedLosers];
    mergedData.sort((a, b) => b.percentageChange - a.percentageChange);

    //console.log(mergedData);
    return mergedData;
  } catch (error) {
    console.error(`Error fetching data:`, error.message);
    throw error;
  }
}


//turnover volume experimental

export async function fetchturnvolume() {
  try {
    const turn = await axios.get(Turnover_URL);
    const turnover = turn.data;
    const top10Turnover = turnover.slice(0, 10);

    const mappedTurnover = top10Turnover.map(item => {
      const symbol = item.symbol || '';
      const turnoverValue = item.turnover || 0;
      const ltp = item.closingPrice || 0;
      const name = item.securityName || '';
      const securityId = item.securityId || 0;

      return {
        symbol,
        turnover: turnoverValue,
        ltp,
        name,
        securityId,
      };
    });

    return mappedTurnover;
  } catch (error) {
    console.error(`Error fetching data:`, error.message);
    throw error;
  }
}

//fetch volume
export async function fetchvolume() {
  try {
    const vol = await axios.get(Volume_URL);
    const volume = vol.data;
    const top10Volume = volume.slice(0, 10);

    const mappedVolume = top10Volume.map(item => {
      const symbol = item.symbol || '';
      const shareTraded = item.shareTraded || 0;
      const ltp = item.closingPrice || 0;
      const name = item.securityName || '';
      const securityId = item.securityId || 0;

      return {
        symbol,
        turnover: shareTraded,
        ltp,
        name,
        securityId,
      };
    });
    return mappedVolume;
  } catch (error) {
    console.error(`Error fetching data:`, error.message);
    throw error;
  }
}

export default {fetchSecurityData,fetchDataAndMapToAssetModel,fetchSingleSecurityData,fetchTopGainers, fetchturnvolume, fetchvolume};