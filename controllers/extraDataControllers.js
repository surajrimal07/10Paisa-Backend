import storage from 'node-persist';
import { extractNrbBankingData, extractNrbBankingDataAll, extractNrbForexData } from '../server/nrbServer.js';
import { respondWithData, respondWithError } from '../utils/response_utils.js';
await storage.init();

const fetchFromCache = async (cacheKey) => {
    try {
      const cachedData = await storage.getItem(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      return null;
    } catch (error) {
      console.error('Error fetching data from cache:', error.message);
      throw new Error('Error fetching data from cache');
    }
  };

export const NrbBankingData = async (req, res) => {
    console.log('NRB Banking data requested');

    const { refresh } = req.query;

    try {
      if (refresh=="false") {
        const cachedData = await fetchFromCache('NrbBankingData');

        if (cachedData !== null) {

          console.log('Returning cached nrb banking data');
          return respondWithData(res, 'SUCCESS', 'Nrb Data fetched successfully', cachedData);
        }
      };

      const nrbData = await extractNrbBankingData();

      if (!nrbData) {
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'Failed to fetch nrb data');
      }

      await storage.setItem('NrbBankingData', nrbData);

        return respondWithData(res, 'SUCCESS', 'Nrb Data refreshed successfully', nrbData);

    } catch (error) {
      console.error(error);
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'Internal Server Error');
    }
  };

  //with more data
  export const NrbBankingDataAll = async (req, res) => {
    console.log('NRB Banking data requested');

    const { refresh } = req.query;

    try {
      // if (refresh=="false") {
      //   const cachedData = await fetchFromCache('NrbBankingData');

      //   if (cachedData !== null) {

      //     console.log('Returning cached nrb banking data');
      //     return respondWithData(res, 'SUCCESS', 'Nrb Data fetched successfully', cachedData);
      //   }
      // };

      const nrbData = await extractNrbBankingDataAll();

      if (!nrbData) {
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'Failed to fetch nrb data');
      }

      await storage.setItem('NrbBankingData', nrbData);

        return respondWithData(res, 'SUCCESS', 'Nrb Data refreshed successfully', nrbData);

    } catch (error) {
      console.error(error);
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'Internal Server Error');
    }
  };

  export const nrbForexData = async (req, res) => {
    console.log('NRB forex data requested');

    const { refresh } = req.query;

    try {
      if (refresh=="false") {
        const cachedData = await fetchFromCache('nrbForexData');

        if (cachedData !== null) {

          console.log('Returning cached nrb forex data');
            return respondWithData(res, 'SUCCESS', 'Nrb Forex Data fetched successfully', cachedData);
        }
      };

      const nrbData = await extractNrbForexData();

      if (!nrbData) {
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'Failed to fetch nrb forex data');

      }
      await storage.setItem('nrbForexData', nrbData);

      return respondWithData(res, 'SUCCESS', 'Nrb Forex Data refreshed successfully', nrbData);

    } catch (error) {
      console.error(error);
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'Internal Server Error');
    }
  };

  //

  export const combinedNrbData = async (req, res) => {
    console.log('Combined data requested');

    const { refresh } = req.query;

    try {
        if (refresh=="false") {

        const cachedData = await fetchFromCache('NrbCombinedData');
        console.log('Returning cached NRB combined data');
        return respondWithData(res, 'SUCCESS', 'Nrb Data fetched successfully', cachedData);
        }

        //const bankingData = await extractNrbBankingData();
        const bankingData = await extractNrbBankingDataAll();
        const forexData = await extractNrbForexData();

        if (!bankingData || !forexData) {
            return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'Failed to fetch NRB data');
        }
        const nrbData = { nrbBankingData: bankingData, nrbForexData: forexData };
        await storage.setItem('NrbCombinedData', nrbData);

        return respondWithData(res, 'SUCCESS', 'NRB Data refreshed successfully', nrbData);

    } catch (error) {
        console.error(error);
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'Internal Server Error');
    }
};