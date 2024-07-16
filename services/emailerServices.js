/* eslint-disable no-undef */
import nodemailer from 'nodemailer';

const sendEmail = (params, callback) => {
    const transporter = nodemailer.createTransport({
        host: process.env.BREVO_EMAIL_HOST,
        port: process.env.BREVO_EMAIL_PORT,
        secure: false,
        auth: {
            user: process.env.BREVO_EMAIL_USER,
            pass: process.env.BREVO_EMAIL_PASSWORD
        }
    });

    const mailOptions = {
        from: process.env.BREVO_EMAIL_FROM,
        html: params.body,
        to: params.email,
        subject: params.subject
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            return callback(error);
        } else {
            return callback(null, info.response);
        }
    });
};

export default { sendEmail };

