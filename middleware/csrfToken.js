
import crypto from 'crypto';
import { userLogger } from '../utils/logger/userlogger.js';
import { respondWithError } from '../utils/response_utils.js';

const XSRF_TOKEN_VALIDITY_MS = 900000; // 15 minutes

export function generateXsrfToken() {
    let token = crypto.randomBytes(20).toString('hex');
    const createdAt = Date.now();
    token = { token, createdAt };
    return token;
}

export function validateXsrfToken(req, res, next) {
    console.log(req.headers);
    const token = req.headers['xsrf-token'] || req.body._csrf || req.query._csrf;
    const expectedToken = req.session.csrfToken;
    console.log(expectedToken);
    console.log(req.session);

    if (!expectedToken || !expectedToken.token || !token) {
        userLogger.error(`User ${req.session.userEmail} sent request without XSRF token`);
        return respondWithError(res, 'FORBIDDEN', 'Missing XSRF token');
    }

    if (token !== expectedToken.token) {
        userLogger.error(`User ${req.session.userEmail} sent invalid XSRF token: ${token} (expected: ${expectedToken.token})`);
        return respondWithError(res, 'FORBIDDEN', 'Invalid XSRF token');
    }

    const now = Date.now();
    if (now - expectedToken.createdAt > XSRF_TOKEN_VALIDITY_MS) {
        userLogger.error(`User ${req.session.userEmail} sent expired XSRF token: ${token}`);
        return respondWithError(res, 'FORBIDDEN', 'Expired XSRF token');
    }

    next();
}

export default { generateXsrfToken, validateXsrfToken }