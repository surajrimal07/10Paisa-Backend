import crypto from 'crypto';
import otpGenerator from 'otp-generator';
import emailServices from '../services/emailerServices.js';

const key = "test123";

export const sendOTP = (params, callback) => {
    const otp = otpGenerator.generate(4, {
        digits: true,
        upperCaseAlphabets: false,
        specialChars: false,
        lowerCaseAlphabets: false
    });

    console.log("Otp generated from backend "+ otp)
    const ttl = 5 * 60 * 1000; // 5 minutes expiry
    const expires = Date.now() + ttl;
    const data = `${params.email}.${otp}.${expires}`;
    const hash = crypto.createHmac("sha256", key).update(data).digest("hex");
    const fullhash = `${hash}.${expires}`;

    const otpMessage = `Dear user, ${otp} is the one time password for signup`;

    const model = {
        email: params.email,
        subject: "10Paisa Registration OTP",
        body: otpMessage
    };

    emailServices.sendEmail(model, (error, result) => {
        if (error) {
            return callback(error);
        }
        return callback(null, fullhash);
    });
};

export const verifyOTP = (params, callback) => {
    console.log("0")
    const [hashValue, expires] = params.hash.split('.');
    const now = Date.now();
    console.log("1")

    if (now > parseInt(expires)) {
        console.log("Otp Expired")
        return callback("OTP Expired");
    }

    const data = `${params.email}.${params.otp}.${expires}`;
    console.log(params.email,params.hash,params.otp)
    const newCalculatedHash = crypto.createHmac("sha256", key).update(data).digest("hex");

    if (newCalculatedHash === hashValue) {
        console.log("Otp Matched, Success")
        return callback(null, "Success");
    }

    console.log(params.email,params.hash,params.otp+ " Otp Error")
    return callback("Invalid OTP");
};



export const forgotpass = (emails, callback) => {
    const otp = otpGenerator.generate(4, {
        digits: true,
        upperCaseAlphabets: false,
        specialChars: false,
        lowerCaseAlphabets: false
    });

    const ttl = 5 * 60 * 1000; // 5 minutes expiry
    const expires = Date.now() + ttl;
    const data = `${emails}.${otp}.${expires}`; //
    const hash = crypto.createHmac("sha256", key).update(data).digest("hex");
    const fullhash = `${hash}.${expires}`;

    const otpMessage = `Dear user, ${otp} is the one time password your password reset.`;

    const model = {
        email: emails,
        subject: "10Paisa Password Reset",
        body: otpMessage
    };

    console.log("Otp generated from backend "+ otp +" hash is "+ fullhash)
    console.log(otpMessage)

    //
    emailServices.sendEmail(model, (error, result) => {
        if (error) {
            return callback(error);
        } else{
            console.log("line 94 of otpservices, email service bata success vayo, no error")
            return callback(null, fullhash); //null

    }
    });
};
//