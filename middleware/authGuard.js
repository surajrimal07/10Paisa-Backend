import jwt from 'jsonwebtoken';
import { respondWithError } from '../utils/response_utils.js';

export const authGuard = (req, res,next) => {
    const authHeader = req.headers.authorization;

    // if (!authHeader) {
    //     console.log("Warning Token Not Provided");
    //     return respondWithError(res,'BAD_REQUEST', "No token provided");

    // }
    const token = authHeader.split(' ')[1];
    if (!token) {
        console.log("Warning Invalid Token Provided");
        return respondWithError(res,'BAD_REQUEST', "No token provided");
    }
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


//for admins
export const authGuardAdmin = (req, res,next) => {
    const authHeader = req.headers.authorization;
    console.log("Passed Header is "+ req.headers.authorization)

    // if (!authHeader) {
    //     console.log("Warning Token Not Provided");
    //     return respondWithError(res,'BAD_REQUEST', "No token provided");

    // }
    const token = authHeader.split(' ')[1];
    if (!token) {
        console.log("Warning Invalid Token Provided");
        return respondWithError(res,'BAD_REQUEST', "No token provided");
    }
    try {
        console.log("Token is valid");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        //check if user is admin or not

        if(!req.user.isAdmin){
            console.log("Warning User Is Not Admin");
            return respondWithError(res,'UNAUTHORIZED', "You are not authorized to access this resource");
        }
        console.log("User Is Admin");
        next();
    }
    catch {
        return respondWithError(res,'UNAUTHORIZED', "Invalid token");
    }

}
