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

export const forgetPassword = (eml, res, next) => {
    const email = eml;

    console.log("here inside forget password otp controllers 36")

    //console.log("line 38, email passed is "+ req)

    otpService.forgotpass(email, (error, results) => {
        console.log("We got this email from use controller "+email)

        if (error) {
            console.log("error occured, 44, otp controllers")
            return res.status(400).send({
                message: "error occured with otp service",
                data: error
            });
        } else {
            console.log("otp sent successfully");
            return res.status(200).send({
            message: "Success, otp sent",
            data: results
        });
    }
    });
};

