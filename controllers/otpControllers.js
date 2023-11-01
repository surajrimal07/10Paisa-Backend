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
    otpService.verifyOTP(req.body, (error, results) => {
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
