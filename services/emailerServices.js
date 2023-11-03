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
            //return callback(error);
            return callback(error);
        } else {
            console.log("line 24 of emailer service, email sent successfully");
            console.log(info.response);
            return callback(null, info.response);
            //return res.status(200).json({ error: 'Email sent' });
        }
    });
};

export default { sendEmail }; // Exporting the sendEmail function

