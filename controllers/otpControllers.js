import * as otpService from '../services/otpServices.js';

export const sendOTP = (req, res, next) => {
    otpService.sendOTP(req.body, (error, results) => {
        if (error) {
            return res.status(400).send({
                message: "error",
                data: error,
            });
        }
        return res.status(200).send({
            message: "Success",
            data: results,
        });
    });
};

export const verifyOTP = (req, res, next) => {
    console.log("here")
    otpService.verifyOTP(req.body, (error, results) => {
        if (error) {
            console.log("here")
            return res.status(400).send({
                message: "error",
                data: error,
            });
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
        console.log("Inside forgetPassword function");
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

