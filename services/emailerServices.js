import nodemailer from 'nodemailer';

const sendEmail = (params, callback) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: 'ewald59@ethereal.email',
            pass: 'KACakxDsphSMCp1FpW'
        }
    });

    const mailOptions = {
        from: 'supersonicmega6@gmail.com',
        to: params.email,
        subject: params.subject,
        text: params.body,
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            return callback(error);
        } else {
            return callback(null, info.response);
        }
    });
};

export default { sendEmail }; // Exporting the sendEmail function

