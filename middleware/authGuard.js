import jwt from 'jsonwebtoken';
import { respondWithError } from '../utils/response_utils.js';

export const authGuard = (req, res,next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return respondWithError(res,'BAD_REQUEST', "No token provided");

    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        return respondWithError(res,'BAD_REQUEST', "No token provided");
    }
    //validate the token
    try {
        console.log("Token is valid");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch {
        return respondWithError(res,'UNAUTHORIZED', "Invalid token");
    }

}
