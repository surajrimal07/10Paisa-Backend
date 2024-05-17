import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { userLogger } from '../utils/logger/userlogger.js';
import { respondWithError } from '../utils/response_utils.js';


const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync(process.env.JWT_SECRET_ENCRYPTION, 'salt', 32);

export function encryptJWT(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
}

export function decryptJWT(encryptedText) {
    const [ivHex, encryptedDataHex] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedData = Buffer.from(encryptedDataHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
}

export const authGuard = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    const token = authHeader.split(' ')[1];
    if (!authHeader || !token) {
        userLogger.error("Invalid Token Provided");
        return respondWithError(res, 'BAD_REQUEST', "No token provided");
    }
    try {
        const decoded = jwt.verify(decryptJWT(token), process.env.JWT_SECRET);

        if (decoded.exp && decoded.exp < Date.now() / 1000) {
            userLogger.error("Token has expired");
            return respondWithError(res, 'UNAUTHORIZED', "Token has expired");
        }

        const user = await User.findOne({ email: decoded.email }, { LastPasswordChangeDate: 1 });
        // console.log(user.LastPasswordChangeDate > decoded.iat, user.LastPasswordChangeDate, decoded.iat);

        // if (!user) {
        //     userLogger.error("User not found");
        //     return respondWithError(res, 'UNAUTHORIZED', "Token is invalid/expired or user not found");
        // }

        // const lastPasswordChangeSeconds = Math.floor(user.LastPasswordChangeDate.getTime() / 1000);
        // const tokenIssuedAtSeconds = decoded.iat;

        // console.log(lastPasswordChangeSeconds > tokenIssuedAtSeconds, lastPasswordChangeSeconds, tokenIssuedAtSeconds);

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

    const token = authHeader.split(' ')[1];
    if (!authHeader || !token) {
        userLogger.error("Admin Token Provided");
        return respondWithError(res, 'BAD_REQUEST', "No token provided");
    }
    try {
        const decoded = jwt.verify(decryptJWT(token), process.env.JWT_SECRET);

        if (decoded.exp && decoded.exp < Date.now() / 1000) {
            userLogger.error("Token has expired");
            return respondWithError(res, 'UNAUTHORIZED', "Token has expired");
        }

        const user = await User.findOne({ email: decoded.email }, { isAdmin: 1, LastPasswordChangeDate: 1 });

        if (Math.floor(user.LastPasswordChangeDate.getTime() / 1000) > decoded.iat || !user || !user.isAdmin) {
            userLogger.error("Token is invalid/expired or user not found");
            return respondWithError(res, 'UNAUTHORIZED', "Token is invalid/expired or user not found");
        }


        req.user = { email: decoded.email, isAdmin: user.isAdmin };

        next();
    }
    catch {
        return respondWithError(res, 'UNAUTHORIZED', "Invalid token");
    }

}
