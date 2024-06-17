import User from '../models/userModel.js';
import * as otpService from '../services/otpServices.js';
import context from '../utils/globalVariables.js';
import { respondWithError } from '../utils/response_utils.js';

// eslint-disable-next-line no-unused-vars
export const sendOTP = async (req, res, next) => {

    const email = req.body.email;

    if (email == null || email == undefined || email == "") {

        return respondWithError(res, 'BAD_REQUEST', "Email is required");
    }

    context.email = email;

    const user = await User.findOne({ email: email });

    if (!user) {
        otpService.sendOTP(req.body, (error, results) => {
            if (error) {
                return respondWithError(res, 'BAD_REQUEST', error.toString());
            }
            return res.status(200).send({
                success: true,
                message: 'OTP sent successfully',
                hash: results,
            });
        });
    }
    else {
        return respondWithError(res, 'BAD_REQUEST', "Email already exists");
    }
}

// eslint-disable-next-line no-unused-vars
export const verifyOTP = (req, res, next) => {

    if (!req.body.email || !req.body.otp || !req.body.hash) {
        return respondWithError(res, 'BAD_REQUEST', "Invalid OTP");
    }

    otpService.verifyOTP(req.body, (error, results) => {
        if (error) {
            // return res.status(400).send({
            //     message: "Invalid OTP",
            //     data: error,
            // });
            return respondWithError(res, 'BAD_REQUEST', "Invalid OTP");
        }
        return res.status(200).send({
            message: "Success",
            data: results,
        });
    });
};

export const forgetPassword = (eml) => {
    return new Promise((resolve, reject) => {
        const email = eml;

        context.email = email;
        otpService.forgotpass(email, (error, results) => {
            if (error) {
                console.log("Error occurred in forgetPassword function");
                reject(error);
            } else {
                console.log("OTP sent successfully: " + results);
                resolve(results);
            }
        });
    });
};

