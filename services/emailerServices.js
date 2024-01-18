import nodemailer from 'nodemailer';


// Name	Brain Rutherford
// Username	brain27@ethereal.email
// Password	z3QmD6Bc4SY43TDBF4


//scfc wrlr ijtf fmkl


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
        to: params.email,
        subject: params.subject,
        text: params.body,
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            return callback(error);
        } else {
            console.log("line 24 of emailer service, email sent successfully");
            console.log(info.response);
            return callback(null, info.response);
        }
    });
};

export default { sendEmail };

