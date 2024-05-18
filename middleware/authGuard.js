import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { decryptData } from '../utils/encryption.js';
import { userLogger } from '../utils/logger/userlogger.js';
import { respondWithError } from '../utils/response_utils.js';

export const authGuard = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = await decryptData(authHeader.split(' ')[1]);

    if (!authHeader || !token) {
        userLogger.error("Invalid Token Provided");
        return respondWithError(res, 'BAD_REQUEST', "No token provided");
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.exp && decoded.exp < Date.now() / 1000) {
            userLogger.error("Token has expired");
            return respondWithError(res, 'UNAUTHORIZED', "Token has expired");
        }

        const user = await User.findOne({ email: decoded.email }, { LastPasswordChangeDate: 1 });
        if (Math.floor(user.LastPasswordChangeDate.getTime() / 1000) > decoded.iat || !user) {
            userLogger.error("Token is invalid/expired or user not found");
            return respondWithError(res, 'UNAUTHORIZED', "Token is invalid/expired or user not found");
        }

        req.user = { email: decoded.email };

        next();
    }
    catch {
        return respondWithError(res, 'UNAUTHORIZED', "Invalid token");
    }
}


//for admins
export const authGuardAdmin = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    const token = await decryptData(authHeader.split(' ')[1]);
    if (!authHeader || !token) {
        userLogger.error("Admin Token Provided");
        return respondWithError(res, 'BAD_REQUEST', "No token provided");
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.exp && decoded.exp < Date.now() / 1000) {
            userLogger.error("Token has expired");
            return respondWithError(res, 'UNAUTHORIZED', "Token has expired");
        }

        const user = await User.findOne({ email: decoded.email }, { isAdmin: 1, LastPasswordChangeDate: 1 });

        if (Math.floor(user.LastPasswordChangeDate.getTime() / 1000) > decoded.iat || !user || !user.isAdmin) {
            userLogger.error("Token is invalid/expired or user not found");
            return respondWithError(res, 'UNAUTHORIZED', "Token is invalid/expired or user not found/not an admin");
        }

        req.user = { email: decoded.email, isAdmin: user.isAdmin };

        next();
    }
    catch {
        return respondWithError(res, 'UNAUTHORIZED', "Invalid token");
    }

}
