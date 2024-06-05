
import crypto from 'crypto';
import { userLogger } from '../utils/logger/userlogger.js';
import { respondWithError } from '../utils/response_utils.js';

export function generateXsrfToken() {
    const token = crypto.randomBytes(20).toString('hex');
    return token;
}

export function validateXsrfToken(req, res, next) {
    const token = req.headers['xsrf-token'] || req.body._csrf || req.query._csrf;
    const expectedToken = req.session.csrfToken;
    if (token !== expectedToken) {
        userLogger.error(`User ${req.session.userEmail} sent invalid XSRF token: ${token} (expected: ${expectedToken})`);
        return respondWithError(res, 'FORBIDDEN', 'Invalid XSRF token');
    }
    next();
}

export default { generateXsrfToken, validateXsrfToken }