import crypto from 'crypto';
import otpGenerator from 'otp-generator';
import emailServices from '../services/emailerServices.js';
import context from '../utils/globalVariables.js';

const key = "test123";

export const sendOTP = (params, callback) => {
  const otp = otpGenerator.generate(4, {
    digits: true,
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false
  });

  const ttl = 5 * 60 * 1000;
  const expires = Date.now() + ttl;
  const data = `${params.email}.${otp}.${expires}`;
  const hash = crypto.createHmac("sha256", key).update(data).digest("hex");
  const fullhash = `${hash}.${expires}`;
  const currentDate = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
  const expiresIn = new Date(Date.now() + ttl).toLocaleTimeString();
  const dynamicReasonBody = "to complete the procedure of registration process"
  const otpMessage = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="X-UA-Compatible" content="ie=edge" />
        <title>Static Template</title>

        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
    </head>
    <body
      style="
        margin: 0;
        font-family: 'Poppins', sans-serif;
        background: #ffffff;
        font-size: 14px;
      "
    >
    <div
      style="
        max-width: 700px;
        margin: 0 auto;
        padding: 45px 30px 60px;
        background: #f4f7ff;
        background-image: url(https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661497957196_595865/email-template-background-banner);
        background-repeat: no-repeat;
        background-size: 800px 452px;
        background-position: top center;
        font-size: 14px;
        color: #434343;
      "
    >
      <header>
        <table style="width: 100%;">
          <tbody>
            <tr style="height: 0;">
              <td>
                <img
                  alt=""
                  src= "https://res.cloudinary.com/dio3qwd9q/image/upload//fl_attachment:logo_kxzvpx//v1718382948/logo_kxzvpx.png"
                  height="70px"
                />
              </td>
              <td style="text-align: right;">
                <span
                  style="font-size: 16px; line-height: 30px; color: #ffffff;"
                  >Date: ${currentDate}</span
                >
              </td>
            </tr>
          </tbody>
        </table>
      </header>

      <main>
        <div
          style="
            margin: 0;
            margin-top: 20px;
            padding: 40px 30px 25px;
            background: #ffffff;
            border-radius: 30px;
            text-align: center;
          "
        >
          <div style="width: 100%; max-width: 489px; margin: 0 auto;">
            <h1
              style="
                margin: 0;
                font-size: 24px;
                font-weight: 500;
                color: #1f1f1f;
              "
            >
            Email Verification
            </h1>
            <p
              style="
                margin: 0;
                margin-top: 17px;
                font-size: 16px;
                font-weight: 500;
              "
            >
              Hey ${context.email},
            </p>
            <p
              style="
                margin: 0;
                margin-top: 17px;
                font-weight: 500;
                letter-spacing: 0.56px;
              "
            >
              Thank you for choosing 10Paisa Portfolio management service. Use the following OTP
              ${dynamicReasonBody}. OTP is
              <span style='font-weight: 600; color: #1f1f1f;'>${otp}</span> and is
              valid for <span style='font-weight: 600; color: #1f1f1f;'>5 minutes</span>
              till <span style='font-weight: 600; color: #1f1f1f;'>${expiresIn}</span>.
              Do not share this code with others, including 10Paisa employees.
            </p>
            <p
              style="
                margin: 0;
                margin-top: 20px; /* Adjust this margin-top value */
                font-size: 40px;
                font-weight: 600;
                letter-spacing: 25px;
                color: #ba3d4f;
              "
            >
            ${otp}
            </p>
          </div>
        </div>

        <p
          style="
            max-width: 400px;
            margin: 0 auto;
            margin-top: 40px; /* Adjust this margin-top value */
            text-align: center;
            font-weight: 500;
            color: #8c8c8c;
          "
        >
          Need help? Ask at
          <a
            href="mailto:10paisaservices@gmail.com"
            style="color: #499fb6; text-decoration: none;"
            >10Paisa Mail</a
          >
          or visit our
          <a
            href="https://tenpaisa.tech/"
            target="_blank"
            style="color: #499fb6; text-decoration: none;"
            >Help Center</a
          >
        </p>
      </main>

      <footer
        style="
          width: 100%;
          max-width: 490px;
          margin: 10px auto 0;
          text-align: center;
          border-top: 1px solid #e6ebf1;
        "
      >
        <p
          style="
            margin: 0;
            margin-top: 5px;
            font-size: 16px;
            font-weight: 600;
            color: #434343;
          "
        >
          10Paisa Investment Pvt Ltd.
        </p>
        <p style="margin: 0; margin-top: 2px; color: #434343;">
          Ranibari Marg, Samakushi, Kathmandu, Nepal.
        </p>
        <div style="margin: 0; margin-top: 16px;">
          <a href="" target="_blank" style="display: inline-block;">
            <img
              width="36px"
              alt="Facebook"
              src="https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661502815169_682499/email-template-icon-facebook"
            />
          </a>
          <a
            href=""
            target="_blank"
            style="display: inline-block; margin-left: 8px;"
          >
            <img
              width="36px"
              alt="Instagram"
              src="https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661504218208_684135/email-template-icon-instagram"
          /></a>
          <a
            href=""
            target="_blank"
            style="display: inline-block; margin-left: 8px;"
          >
            <img
              width="36px"
              alt="Twitter"
              src="https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661503043040_372004/email-template-icon-twitter"
            />
          </a>
          <a
            href=""
            target="_blank"
            style="display: inline-block; margin-left: 8px;"
          >
            <img
              width="36px"
              alt="Youtube"
              src="https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661503195931_210869/email-template-icon-youtube"
          /></a>
        </div>
        <p style="margin: 0; margin-top: 16px; color: #434343;">
        Copyright © 2024 Company. All rights reserved.
      </p>
      <p style="margin: 0; margin-top: 16px; color: #434343;">
  <span style="display:none">${currentDate}</span>
</p>
      </footer>
    </div>
    </body>
    </html>
    `;

  const model = {
    email: params.email,
    subject: "Welcome to 10Paisa",
    body: otpMessage
  };

  emailServices.sendEmail(model, (error) => {
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

  if (now > parseInt(expires)) {
    return callback("OTP Expired");
  }

  const data = `${params.email}.${params.otp}.${expires}`;
  const newCalculatedHash = crypto.createHmac("sha256", key).update(data).digest("hex");
  if (newCalculatedHash === hashValue) {
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

  const otpMessage = `Dear ${context.email},

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

  emailServices.sendEmail(model, (error) => {
    if (error) {
      return callback(error);
    } else {
      return callback(null, fullhash);
    }
  });
};