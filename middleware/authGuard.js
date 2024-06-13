import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { decryptData } from '../utils/encryption.js';
import { userLogger } from '../utils/logger/userlogger.js';
import { respondWithError } from '../utils/response_utils.js';

export const authGuard = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const authHeaderInSession = req.session.jwtToken;

    if (!authHeader && !authHeaderInSession) {
        userLogger.error("Token not provided");
        res.status(416).json({ error: 'Token not provided' });
    }

    //check if jwt token matches the one in session
    if (authHeader !== authHeaderInSession) {
        userLogger.error(`Token mismatch, ${authHeader} and ${authHeaderInSession}`);
        return respondWithError(res, 'UNAUTHORIZED', "Token mismatch, please login again or pass correct token");
    }


    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token || token === 'undefined' || token === 'null') {
        userLogger.error("Token not provided or improperly formatted");
        //return respondWithError(res, 'TOKEN_MISSING', "Token not provided or improperly formatted");
        return res.redirect('/login');
    }

    try {
        const decryptedToken = await decryptData(token);

        // eslint-disable-next-line no-undef
        const decoded = jwt.verify(decryptedToken, process.env.JWT_SECRET);

        if (decoded.exp && decoded.exp < Date.now() / 1000) {
            userLogger.error("User Token has expired");
            return respondWithError(res, 'TOKEN_EXPIRED', "Token has expired");
        }

        const user = await User.findOne({ email: decoded.email }, { LastPasswordChangeDate: 1 });
        if (Math.floor(user.LastPasswordChangeDate.getTime() / 1000) > decoded.iat || !user) {
            userLogger.error("Token is invalid/expired or user not found");
            return respondWithError(res, 'UNAUTHORIZED', "Token is invalid/expired or user not found");
        }

        req.user = { email: decoded.email };

        next();
    }
    catch (error) {
        userLogger.error(`Token error: ${error}`);
        return respondWithError(res, 'UNAUTHORIZED', "Invalid token");
    }
}


//for admins
export const authGuardAdmin = async (req, res, next) => {
    //const authHeader = req.headers.authorization;
    //using JWT token from session which we added during login.
    //this eleminates the need to send token in every request
    //also secures token because it no longer need to reside in client localsotrage //flawed logic
    const authHeader = req.headers.authorization;
    const authHeaderInSession = req.session.jwtToken;

    if (!authHeader && !authHeaderInSession) {
        return respondWithError(res, 'UNAUTHORIZED', "Admin Token not provided");
    }

    //check if jwt token matches the one in session
    if (authHeader !== authHeaderInSession) {
        userLogger.error(`Token mismatch, ${authHeader} and ${authHeaderInSession}`);
        return respondWithError(res, 'TOKEN_MISSING', "Token mismatch, please login again or pass correct token");
    }


    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token || token === 'undefined' || token === 'null') {
        userLogger.error("Admin Token not provided or improperly formatted");
        return res.redirect('/login');
    }

    try {
        const decryptedToken = await decryptData(token);
        // eslint-disable-next-line no-undef
        const decoded = jwt.verify(decryptedToken, process.env.JWT_SECRET);

        if (decoded.exp && decoded.exp < Date.now() / 1000) {
            userLogger.error("Token has expired");
            return respondWithError(res, 'UNAUTHORIZED', "Token has expired");
        }

        const user = await User.findOne({ email: decoded.email }, { isAdmin: 1, LastPasswordChangeDate: 1 });

        if (Math.floor(user.LastPasswordChangeDate.getTime() / 1000) > decoded.iat || !user || !user.isAdmin) {
            userLogger.error("Token is invalid/expired or user not found");
            return respondWithError(res, 'TOKEN_EXPIRED', "Token is invalid/expired or user not found");
        }

        req.user = { email: decoded.email, isAdmin: user.isAdmin };

        next();
    }
    catch (error) {
        userLogger.error(`Token error: ${error}`);
        return respondWithError(res, 'UNAUTHORIZED', "Invalid token");
    }

}


//to do blackist the tokens when user logs out or changes password or deletes account
//distroy the session on logout, password change, account delete, token expiry