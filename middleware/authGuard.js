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
    //    console.log(req.headers.authorization)
    const authHeader = req.headers.authorization;

    const token = authHeader.split(' ')[1];
    if (!authHeader || !token) {
        userLogger.error("Invalid Token Provided");
        // console.log("Invalid Admin Token Provided")
        return respondWithError(res, 'BAD_REQUEST', "No token provided");
    }
    // if (!token) {
    //     userLogger.error("Invalid Token Provided");
    //     return respondWithError(res, 'BAD_REQUEST', "No token provided");
    // }
    try {
        //console.log(`token is ${token}`);
        // let decryptedToken;
        // try {
        //     decryptedToken = decryptJWT(token);
        // } catch {
        //     console.log("error in decrypting token");
        //     return respondWithError(res, 'UNAUTHORIZED', "Invalid token");
        // }

        //console.log(`decrypted token is ${decryptedToken}`);
        const decoded = jwt.verify(decryptJWT(token), process.env.JWT_SECRET);

        // Check token expiration
        if (decoded.exp && decoded.exp < Date.now() / 1000) {
            userLogger.error("Token has expired");
            return respondWithError(res, 'UNAUTHORIZED', "Token has expired");
        }
        // console.log(req.user = decoded);

        const user = await User.findOne({ email: decoded.email }, { LastPasswordChangeDate: 1 });

        if (!user || user.LastPasswordChangeDate > decoded.iat * 1000) {
            userLogger.error("User Not Found");
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

    // if (!authHeader) {
    //     userLogger.error("No Admin token provided");
    //     return respondWithError(res, 'BAD_REQUEST', "No token provided");

    // }
    const token = authHeader.split(' ')[1];
    if (!authHeader || !token) {
        userLogger.error("Admin Token Provided");
        // console.log("Invalid Admin Token Provided")
        return respondWithError(res, 'BAD_REQUEST', "No token provided");
    }
    try {
        const decoded = jwt.verify(decryptJWT(token), process.env.JWT_SECRET);

        // console.log(decoded)

        if (decoded.exp && decoded.exp < Date.now() / 1000) {
            userLogger.error("Token has expired");
            return respondWithError(res, 'UNAUTHORIZED', "Token has expired");
        }

        //invalid the token if it's created date is less than the last password change date
        //fetch users isAdmin status and last password change date, find user based on email
        //        const emailss = 'davidparkedme@gmail.com';
        const user = await User.findOne({ email: decoded.email }, { isAdmin: 1, LastPasswordChangeDate: 1 });
        //        console.log(user)

        if (!user || user.LastPasswordChangeDate > decoded.iat * 1000 || !user.isAdmin) {
            userLogger.error("User Not Found");
            return respondWithError(res, 'UNAUTHORIZED', "Token is expired or or user not found or user is not an admin");
        }

        req.user = { email: decoded.email, isAdmin: user.isAdmin };

        next();
    }
    catch {
        return respondWithError(res, 'UNAUTHORIZED', "Invalid token");
    }

}
