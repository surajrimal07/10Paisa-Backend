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
    const ttl = 5 * 60 * 1000;
    const expires = Date.now() + ttl;
    const data = `${params.email}.${otp}.${expires}`;
    const hash = crypto.createHmac("sha256", key).update(data).digest("hex");
    const fullhash = `${hash}.${expires}`;
    // console.log(hash);
    // console.log(fullhash);

    const otpMessage = `Dear User,
        Thank you for choosing to join 10Paisa! Your One-Time Password (OTP) for registration is: ${otp}
        Please use this OTP to complete your registration process.
        If you did not initiate this registration or have any concerns, please contact our support team immediately.

        Best Regards,
        The 10Paisa Team`;


    const model = {
        email: params.email,
        subject: "Welcome to 10Paisa",
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

    if (!params.email || !params.otp || !params.hash) {
        return callback("Invalid OTP");
    }
    const [hashValue, expires] = params.hash.split('.');
    const now = Date.now();
    // console.log(params.email);
    // console.log(params.otp);
    // console.log(params.hash);
    // console.log(hashValue);


    if (now > parseInt(expires)) {
        //console.log("Otp Expired")
        return callback("OTP Expired");
    }

    const data = `${params.email}.${params.otp}.${expires}`;
   // console.log(params.email,params.hash,params.otp)
    const newCalculatedHash = crypto.createHmac("sha256", key).update(data).digest("hex");
    // console.log(newCalculatedHash);
    // console.log(hashValue);

    if (newCalculatedHash === hashValue) {
       // console.log("Otp Matched, Success")
        return callback(null, "Success");
    }
    return callback("Invalid OTP");
};

export const forgotpass = (emails, callback) => {
    const otp = otpGenerator.generate(4, {
        digits: true,
        upperCaseAlphabets: false,
        specialChars: false,
        lowerCaseAlphabets: false
    });

    const ttl = 5 * 60 * 1000;
    const expires = Date.now() + ttl;
    const data = `${emails}.${otp}.${expires}`; //
    const hash = crypto.createHmac("sha256", key).update(data).digest("hex");
    const fullhash = `${hash}.${expires}`;

    const otpMessage = `Dear User,

        We've received a request to reset your password. Your One-Time Password (OTP) for password reset is: ${otp}
        Please use this OTP to reset your password. For security reasons, please do not share this OTP with anyone.
        If you did not request this password reset or have any concerns, please disregard this email or contact our support team immediately.

        Best Regards,
        The 10Paisa Team`;


    const model = {
        email: emails,
        subject: "10Paisa Password Reset",
        body: otpMessage
    };

    // console.log("Otp generated from backend "+ otp +" hash is "+ fullhash)
    // console.log(otpMessage)

    emailServices.sendEmail(model, (error, result) => {
        if (error) {
            return callback(error);
        } else{
            console.log(callback);
            return callback(null, fullhash);
    }
    });
};