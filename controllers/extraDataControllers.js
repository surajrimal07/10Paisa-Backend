import { extractNrbBankingDataAll, extractNrbForexData } from '../server/nrbServer.js';
import { respondWithData, respondWithError, respondWithSuccess } from '../utils/response_utils.js';
import { deleteFromCache } from './savefetchCache.js';
  //with more data //diposit and shortterm interest rate
  export const NrbBankingDataAll = async (req, res) => {
    console.log('NRB Banking data requested');

    try {
      const refreshParam = req.query.refresh || '';
      if (refreshParam.toLowerCase() === "refresh") {
        console.log('Refreshing nrb banking data');
        await deleteFromCache('nrbbankingdata');
      };

      const nrbData = await extractNrbBankingDataAll();
      if (!nrbData) {
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'Failed to fetch nrb data');
      }

        return respondWithData(res, 'SUCCESS', 'Nrb Data refreshed successfully', nrbData);

    } catch (error) {
      console.error(error);
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'Internal Server Error');
    }
  };


  export const nrbForexData = async (req, res) => {
    console.log('NRB forex data requested');

    try {
      const refreshParam = req.query.refresh || '';
      if (refreshParam.toLowerCase() === "refresh") {
        console.log('Refreshing nrb forex data');
        await deleteFromCache('nrbforexdata');
      };

      const nrbData = await extractNrbForexData();
      if (!nrbData) {
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'Failed to fetch nrb forex data');

      }
      return respondWithData(res, 'SUCCESS', 'Nrb Forex Data refreshed successfully', nrbData);

    } catch (error) {
      console.error(error);
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'Internal Server Error');
    }
  };

  //all forex and banking in same
  export const combinedNrbData = async (req, res) => {
    console.log('Combined data requested');

    try {
      const refreshParam = req.query.refresh || '';
      if (refreshParam.toLowerCase() === "refresh") {
        console.log('Refreshing nrb forex data');
        await deleteFromCache('nrbbankingforexdata');
      };

        const bankingData = await extractNrbBankingDataAll();
        const forexData = await extractNrbForexData();

        if (!bankingData || !forexData) {
            return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'Failed to fetch NRB data');
        }
        const nrbData = { nrbBankingData: bankingData, nrbForexData: forexData };

        return respondWithData(res, 'SUCCESS', 'NRB Data refreshed successfully', nrbData);

    } catch (error) {
        console.error(error);
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'Internal Server Error');
    }
};

export const refreshNRBData = async (req, res) => {
  console.log('Refreshing nrb data through API');
  await deleteFromCache('nrbforexdata');
  await deleteFromCache('nrbbankingforexdata');
  const bankingdata = await extractNrbForexData();
  const forexdata = await extractNrbBankingDataAll();

  if (!bankingdata || !forexdata) {
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'Failed to fetch nrb data.');
  };

  return respondWithSuccess(res,'SUCCESS', 'Data refreshed Successfully');
  }