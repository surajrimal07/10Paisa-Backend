import nodemailer from 'nodemailer';

const sendEmail = (params, callback) => {
    const transporter = nodemailer.createTransport({
        service: "Gmail",
        host: 'smtp.gmail.com',
        secure: true,
        port: 465,
        auth: {
            user: '10paisaservices@gmail.com',
            pass: 'scfc wrlr ijtf fmkl'
        }
    });

    const mailOptions = {
        from: '10paisaservices@gmail.com',
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

