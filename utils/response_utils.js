import { ApiStatus } from '../utils/serveCode_utils.js';

export const respondWithError = (res, statusCode, message) => {
    return res.status(ApiStatus[statusCode]).json({ success: false, message });
  };

export const respondWithData = (res, statusCode, message, data) => {
    return res.status(ApiStatus[statusCode]).json({ success: true, message, data });
  };

export const respondWithDataDirect = (res, statusCode, data) => {
    return res.status(ApiStatus[statusCode]).json({data});
  };

export const respondWithSuccess = (res, statusCode, message) => {
    return res.status(ApiStatus[statusCode]).json({ success: true, message });
  };
